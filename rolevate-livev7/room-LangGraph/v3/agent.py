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

from graph import create_workflow  # <-- our compiled LangGraph app
from utils.session_utils import create_initial_session_state
from session_manager import session_manager
from recording_manager import RecordingManager

load_dotenv(".env.local")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AssistantAgent(Agent):
    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        super().__init__(instructions=(
            f"You are Ashraf, a sharp, elite corporate executive. "
            f"Session ID: {session_id}. "
            f"The LangGraph workflow will drive the conversation flow with PostgreSQL session persistence. "
            f"Be direct, challenging, and ruthlessly focused on uncovering the truth."
        ))

async def entrypoint(ctx: agents.JobContext):
    # 1) Create or get interview session
    room_id = ctx.room.name if hasattr(ctx.room, 'name') else str(ctx.room.sid)
    
    # Extract application ID from room name (format: interview-{uuid}-{number})
    application_id = None
    if room_id.startswith("interview-"):
        # Extract UUID from room name: interview-{uuid}-{room_number}
        parts = room_id[10:].split("-")  # Remove "interview-" prefix
        if len(parts) >= 5:  # UUID has 5 parts (8-4-4-4-12)
            uuid_parts = parts[:5]
            application_id = "-".join(uuid_parts)
            logger.info(f"🎯 Extracted application ID: {application_id} from room: {room_id}")
    
    session_id, session_metadata = await session_manager.get_or_create_session(
        room_id=room_id,
        user_id=None,  # Could extract from room metadata
        participant_name=None,  # Will be filled from application details
        application_id=application_id  # Pass application ID to fetch details
    )
    
    # 2) Setup recording - Generate predictable video URL for GraphQL integration
    recording_manager = RecordingManager(ctx)
    
    # Generate video URL based on S3 structure (whether LiveKit recording works or not)
    bucket_name = os.getenv("AWS_BUCKET_NAME", "4wk-garage-media")
    region = os.getenv("AWS_REGION", "me-central-1")
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Use the same format as existing recordings in your S3 bucket
    video_url_to_save = f"https://{bucket_name}.s3.{region}.amazonaws.com/interviews/{session_id}/{timestamp}/recording.mp4"
    
    # Attempt LiveKit recording (optional - will work if API is available)
    try:
        recording_url = await asyncio.wait_for(
            recording_manager.start_recording(ctx.room.name, session_id), timeout=10.0
        )
        if recording_url:
            video_url_to_save = recording_url  # Use actual LiveKit URL if available
            logger.info(f"✅ LiveKit recording started: {recording_url}")
        else:
            logger.info(f"📋 LiveKit recording not available, using generated URL: {video_url_to_save}")
    except Exception as e:
        logger.info(f"📋 LiveKit recording unavailable ({e}), using generated URL: {video_url_to_save}")

    # Create interview record and use its ID as the thread_id for LangGraph
    interview_id = None
    if video_url_to_save:
        print(f"🎬 Generated S3 video URL: {video_url_to_save}")
        logger.info(f"🎬 Generated S3 video URL: {video_url_to_save}")
        interview_id = await recording_manager.save_video_to_backend(
            ctx.room.name, ctx.job.id, video_url_to_save
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
    
    # 4.5) Initialize the graph state in the checkpointer
    config_for_init = {
        "configurable": {
            "thread_id": thread_id
        }
    }
    
    try:
        # Initialize the graph state with our session metadata - the proactive trigger will be handled by agent_starts_first
        await interview_workflow.aupdate_state(config_for_init, initial_state)
        logger.info(f"✅ Graph state initialized with proactive trigger message for session: {thread_id}")
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
        tts=elevenlabs.TTS(voice_id="gFqEbrURNHZpUOmMsx2f"),
        vad=silero.VAD.load(),
        turn_detection=ArabicTurnDetector(),  # Custom Arabic turn detector
    )

    # Setup transcript capturing before starting the session using LiveKit Agents events
    sequence_counter = 0
    
    def handle_conversation_item(event: ConversationItemAddedEvent):
        """Handle conversation item added event (synchronous wrapper)"""
        async def async_handler():
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
                    logger.info(f"Transcript saved {speaker} ({sequence_counter}): {content[:50]}...")
                else:
                    logger.warning(f"Failed to save {speaker} transcript: {content[:50]}...")
                    
            except Exception as e:
                logger.error(f"Error saving conversation transcript: {e}")
        
        asyncio.create_task(async_handler())
    
    def handle_user_transcription(event: UserInputTranscribedEvent):
        """Handle user input transcription event"""
        if event.is_final and event.transcript.strip():
            logger.info(f"User speech finalized: {event.transcript[:50]}... (lang: {event.language})")
    
    # Register the event handlers
    session.on("conversation_item_added", handle_conversation_item)
    session.on("user_input_transcribed", handle_user_transcription)

    await session.start(
        room=ctx.room,
        agent=AssistantAgent(session_id),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Make Ashraf start the conversation proactively with a simple greeting
    user_name = session_metadata.participant_name or "there"
    # If user name has multiple names, use only the first name
    if user_name != "there" and " " in user_name:
        user_name = user_name.split()[0]
    
    # Check if we should use Arabic based on application details
    language = "english"
    if session_metadata.application_details and session_metadata.application_details.get('job'):
        language = session_metadata.application_details['job'].get('interviewLanguage', 'english').lower()
    
    if language == "arabic":
        proactive_instruction = f"قل مرحباً بسيطاً: 'مرحباً {user_name}'"
    else:
        proactive_instruction = f"Say a simple hello: 'Hello {user_name}'"
    
    await session.generate_reply(
        instructions=proactive_instruction
    )

    # Start the assistant conversation with session persistence
    print(f"Assistant session {session_id} started with PostgreSQL persistence")
    print(f"Room: {room_id}")
    print(f"User: {session_metadata.participant_name or 'Unknown'}")
    print(f"📝 Transcript capture enabled for session: {interview_id}")
    
    # Setup cleanup callback
    async def cleanup():
        """Clean up resources when session ends"""
        nonlocal interview_id  # Access the outer scope variable
        try:
            # Mark interview as completed when user exits/session ends
            if interview_id:
                completed = await recording_manager.complete_interview(interview_id)
                if not completed:
                    logger.warning(f"⚠️ Failed to mark interview {interview_id} as completed")
            
            # Save video URL again as backup with timeout (only if initial save failed)
            if video_url_to_save and not interview_id:  # Only if initial save failed
                try:
                    backup_interview_id = await asyncio.wait_for(
                        recording_manager.save_video_to_backend(
                            ctx.room.name, ctx.job.id, video_url_to_save
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
