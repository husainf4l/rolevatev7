# agent.py
import asyncio
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
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

load_dotenv(".env.local")

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
    
    print(f"Starting interview session: {session_id}")
    
    # 2) Build/compile the LangGraph app with PostgreSQL persistence
    interview_workflow = await create_workflow()
    
    # 3) Create initial session state
    initial_state = create_initial_session_state(session_metadata)
    
    # 4) Wrap it as an LLM for LiveKit via the LangChain plugin
    #    (LLMAdapter knows how to drive LangGraph workflows as an LLM stream)
    lg_llm = langchain.LLMAdapter(
        graph=interview_workflow,
        # Pass session configuration for checkpointing
        config={
            "configurable": {
                "thread_id": session_id  # Use session_id as thread_id for checkpointing
            }
        }
    )

    # 5) Configure the rest of the realtime pipeline
    session = AgentSession(
        stt=soniox.STT(
            params=soniox.STTOptions(language_hints=["ar", "en"])
        ),  # Soniox STT configured for Arabic and English
        llm=lg_llm,  # <-- use the adapter here with session management
        tts=elevenlabs.TTS(voice_id="kERwN6X2cY8g1XbfzJsX"),
        vad=silero.VAD.load(),
        turn_detection=ArabicTurnDetector(),  # Custom Arabic turn detector
    )

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
    
    # The graph will automatically begin with the first question and save state to PostgreSQL

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
