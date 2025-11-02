# agent.py
import asyncio
import logging
import os
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, ConversationItemAddedEvent, UserInputTranscribedEvent
from livekit.plugins import (
    langchain,   # <-- this is key
    elevenlabs,
    soniox,     # for STT (Arabic & English support)
    noise_cancellation,
    silero
)
from arabic_turn_detector import ArabicTurnDetector

from graph import create_workflow, create_initial_session_state  # <-- our compiled LangGraph app
from session_manager import session_manager
from recording_manager import RecordingManager

load_dotenv(".env.local")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InterviewAgent(Agent):
    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        super().__init__(instructions=(
            f"You are a professional interviewer conducting a job interview. "
            f"Session ID: {session_id}. "
            f"The LangGraph workflow will drive the conversation flow with PostgreSQL session persistence. "
            f"Simply speak the questions and responses as they come from the graph. "
            f"Be conversational, professional, and helpful throughout the interview process."
        ))

async def entrypoint(ctx: agents.JobContext):
    # 1) Create or get interview session
    room_id = ctx.room.name if hasattr(ctx.room, 'name') else str(ctx.room.sid)
    session_id, session_metadata = await session_manager.get_or_create_session(
        room_id=room_id,
        user_id=None,  # Could extract from room metadata
        participant_name=None  # Could extract from participant info
    )
    
    # 2) Setup recording with LiveKit native egress
    recording_manager = RecordingManager(ctx)
    recording_url = None
    
    try:
        recording_url = await asyncio.wait_for(
            recording_manager.start_recording(), timeout=15.0
        )
        logger.info(f"✅ Recording started: {recording_url}")
    except asyncio.TimeoutError:
        logger.error("❌ Recording start timed out")
        # Continue without recording - decide based on requirements
    except Exception as e:
        logger.error(f"❌ Failed to start recording: {e}")
        # Continue without recording - could be made fatal if required

    # Save video URL to backend using Agent12 logic
    video_url_to_save = recording_url
    if not recording_url or "amazonaws.com" in str(recording_url):
        bucket_name = os.getenv("AWS_BUCKET_NAME", "4wk-garage-media")
        region = os.getenv("AWS_REGION", "me-central-1")
        video_url_to_save = f"https://{bucket_name}.s3.{region}.amazonaws.com/recordings/{ctx.room.name}_{ctx.job.id}.mp4"

    # Create interview record and use its ID as the thread_id for LangGraph
    interview_id = None
    if video_url_to_save:
        print(f"🎬 Generated S3 video URL: {video_url_to_save}")
        logger.info(f"🎬 Generated S3 video URL: {video_url_to_save}")
        interview_id = await recording_manager.save_video_to_backend(
            ctx.room.name, ctx.job.id
        )
        if interview_id:
            logger.info(f"Video URL saved to backend, interview ID: {interview_id}")
            logger.info(f"🔗 Using interview ID as LangGraph thread_id: {interview_id}")
        else:
            logger.warning("Failed to save video URL to backend")

    # Use interview ID as thread_id for perfect GraphQL ↔ LangGraph linkage
    # This creates a direct connection between:
    # - GraphQL interview record (with video URL, transcript, etc.)
    # - LangGraph conversation history (stored in PostgreSQL checkpoints)
    thread_id = interview_id if interview_id else session_id
    
    print(f"Starting interview session: {session_id}")
    print(f"🧵 LangGraph thread_id: {thread_id} {'(interview ID)' if interview_id else '(fallback)'}")

    # 3) Build/compile the LangGraph app with PostgreSQL persistence
    interview_workflow = await create_workflow()

    # 4) Create initial session state with the correct thread_id/interview_id
    # Update session_metadata to use interview_id instead of old session_id
    session_metadata.session_id = thread_id  # Use interview_id as the session_id
    initial_state = create_initial_session_state(session_metadata)
    
    # 4.5) Initialize the graph state in the checkpointer by making a dummy call
    # This ensures the session_id and other metadata are persisted before the LLMAdapter uses it
    config_for_init = {
        "configurable": {
            "thread_id": thread_id
        }
    }
    
    try:
        # Initialize the graph state with our session metadata
        await interview_workflow.aupdate_state(config_for_init, initial_state)
        logger.info(f"✅ Graph state initialized with session_id: {thread_id}")
    except Exception as e:
        logger.warning(f"⚠️ Failed to initialize graph state: {e}")

    # 5) Wrap it as an LLM for LiveKit via the LangChain plugin
    #    (LLMAdapter knows how to drive LangGraph workflows as an LLM stream)
    lg_llm = langchain.LLMAdapter(
        graph=interview_workflow,
        # Pass session configuration for checkpointing
        config={
            "configurable": {
                "thread_id": thread_id  # Use interview_id as thread_id for perfect linkage
            }
        }
    )    # 6) Configure the rest of the realtime pipeline
    session = AgentSession(
        stt=soniox.STT(
            params=soniox.STTOptions(language_hints=["ar", "en"])
        ),  # Soniox STT configured for Arabic and English
        llm=lg_llm,  # <-- use the adapter here with session management
        tts=elevenlabs.TTS(voice_id="kERwN6X2cY8g1XbfzJsX"),
        vad=silero.VAD.load(),
        turn_detection=ArabicTurnDetector(),  # Custom Arabic turn detector
    )

    # Setup transcript capturing before starting the session using LiveKit Agents events
    sequence_counter = 0
    
    @session.on("conversation_item_added")
    def on_conversation_item_added(event: ConversationItemAddedEvent):
        """Capture both user and agent conversation items and save to GraphQL"""
        nonlocal sequence_counter, interview_id
        
        if not interview_id or not event.item.text_content or event.item.text_content.strip() == "":
            return
            
        try:
            sequence_counter += 1
            content = event.item.text_content.strip()
            
            # Determine speaker type based on role
            speaker = "AI" if event.item.role == "assistant" else "CANDIDATE"
            
            transcript_id = await recording_manager.save_transcript_entry(
                interview_id, content, speaker, sequence_counter
            )
            
            if transcript_id:
                logger.info(f"� {speaker} transcript saved ({sequence_counter}): {content[:50]}...")
            else:
                logger.warning(f"⚠️ Failed to save {speaker} transcript: {content[:50]}...")
                
        except Exception as e:
            logger.error(f"❌ Error saving conversation transcript: {e}")
    
    @session.on("user_input_transcribed")
    def on_user_input_transcribed(event: UserInputTranscribedEvent):
        """Log user input transcription progress"""
        if event.is_final and event.transcript.strip():
            logger.info(f"🎤 User speech finalized: {event.transcript[:50]}... (lang: {event.language})")

    await session.start(
        room=ctx.room,
        agent=InterviewAgent(session_id),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Start the interview workflow with session persistence
    print(f"Interview session {session_id} started with PostgreSQL persistence")
    print(f"Room: {room_id}")
    print(f"Participant: {session_metadata.participant_name or 'Unknown'}")
    print(f"📝 Transcript capture enabled for interview: {interview_id}")
    
    # Setup cleanup callback
    async def cleanup():
        """Clean up resources when session ends"""
        try:
            # Save video URL again as backup with timeout (only if initial save failed)
            nonlocal interview_id  # Access the outer scope variable
            if video_url_to_save and not interview_id:  # Only if initial save failed
                try:
                    backup_interview_id = await asyncio.wait_for(
                        recording_manager.save_video_to_backend(
                            ctx.room.name, ctx.job.id
                        ),
                        timeout=10.0,
                    )
                    if backup_interview_id:
                        interview_id = backup_interview_id  # Update outer scope variable
                        logger.info(f"✅ Video URL backup save completed, interview ID: {interview_id}")
                    else:
                        logger.warning("⚠️ Video URL backup save failed")
                except asyncio.TimeoutError:
                    logger.warning("⚠️ Video URL backup save timed out")
                except Exception as e:
                    logger.error(
                        f"❌ Error saving video URL backup: {e}", exc_info=True
                    )
            
            await recording_manager.cleanup()
            logger.info("✅ Recording manager cleaned up")
        except Exception as e:
            logger.error(f"❌ Error cleaning up recording manager: {e}")
    
    # Add cleanup to room disconnect callback if available
    try:
        ctx.add_shutdown_callback(cleanup)
        logger.info("✅ Cleanup callback registered")
    except AttributeError:
        # Fallback if shutdown callback not available
        logger.info("⚠️ Shutdown callback not available, cleanup will be manual")
    
    # The graph will automatically begin with the first question and save state to PostgreSQL

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
