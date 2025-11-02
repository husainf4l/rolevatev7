# session_manager.py
import os
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass
from dotenv import load_dotenv

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
import psycopg

load_dotenv(".env.local")

@dataclass
class SessionMetadata:
    """Metadata for interview sessions"""
    session_id: str
    user_id: Optional[str] = None
    start_time: datetime = None
    current_question: int = 0
    interview_status: str = "active"  # active, completed, paused, terminated
    participant_name: Optional[str] = None
    room_id: Optional[str] = None
    
    def __post_init__(self):
        if self.start_time is None:
            self.start_time = datetime.now()

class InterviewSessionManager:
    """Manages interview sessions with PostgreSQL persistence"""
    
    def __init__(self):
        self.postgres_config = {
            "host": os.getenv("POSTGRES_HOST", "localhost"),
            "port": int(os.getenv("POSTGRES_PORT", 5432)),
            "dbname": os.getenv("POSTGRES_DB", "livekit_sessions"), 
            "user": os.getenv("POSTGRES_USER", "postgres"),
            "password": os.getenv("POSTGRES_PASSWORD", ""),
        }
        self._checkpointer = None
        self._checkpointer_context = None
    
    def get_postgres_url(self) -> str:
        """Generate PostgreSQL connection URL"""
        return f"postgresql://{self.postgres_config['user']}:{self.postgres_config['password']}@{self.postgres_config['host']}:{self.postgres_config['port']}/{self.postgres_config['dbname']}"
    
    async def get_checkpointer(self):
        """Get or create async PostgreSQL checkpointer using LangGraph's AsyncPostgresSaver"""
        if self._checkpointer is None:
            conn_string = self.get_postgres_url()
            
            try:
                print("📡 Testing PostgreSQL connection...")
                # Test connection first
                with psycopg.connect(conn_string) as conn:
                    conn.execute("SELECT 1")
                print("✅ Connection successful")
                
                print("🔧 Initializing LangGraph AsyncPostgresSaver...")
                
                # Create the async checkpointer context manager and enter it
                # This keeps the connection alive for the lifetime of the session manager
                checkpointer_context = AsyncPostgresSaver.from_conn_string(conn_string)
                self._checkpointer = await checkpointer_context.__aenter__()
                
                # Setup tables using LangGraph's built-in async method
                await self._checkpointer.setup()
                
                # Store context for cleanup later
                self._checkpointer_context = checkpointer_context
                
                print("✅ AsyncPostgresSaver initialized with persistent connection")
                
            except Exception as e:
                print(f"⚠️  AsyncPostgresSaver setup failed: {e}")
                print("⚠️  Falling back to memory-based checkpointing")
                
                # Fallback to memory checkpointer
                from langgraph.checkpoint.memory import MemorySaver
                self._checkpointer = MemorySaver()
                self._checkpointer_context = None
                
                print("✅ Memory checkpointer initialized as fallback")
                
        return self._checkpointer
    
    def create_session_id(self, room_id: Optional[str] = None) -> str:
        """Create a unique session ID"""
        base_id = str(uuid.uuid4())
        if room_id:
            return f"interview-{room_id}-{base_id}"
        return f"interview-{base_id}"
    
    def create_session_metadata(self, 
                              session_id: str,
                              user_id: Optional[str] = None,
                              participant_name: Optional[str] = None,
                              room_id: Optional[str] = None) -> SessionMetadata:
        """Create session metadata"""
        return SessionMetadata(
            session_id=session_id,
            user_id=user_id,
            participant_name=participant_name,
            room_id=room_id,
            start_time=datetime.now(),
            current_question=0,
            interview_status="active"
        )
    
    async def get_or_create_session(self, 
                                  room_id: str,
                                  user_id: Optional[str] = None,
                                  participant_name: Optional[str] = None) -> tuple[str, SessionMetadata]:
        """Get existing session or create new one"""
        # For now, always create new session
        # Later you could implement logic to resume existing sessions
        session_id = self.create_session_id(room_id)
        metadata = self.create_session_metadata(
            session_id=session_id,
            user_id=user_id, 
            participant_name=participant_name,
            room_id=room_id
        )
        
        print(f"Created new interview session: {session_id}")
        return session_id, metadata
    
    async def update_session_status(self, 
                                  session_id: str, 
                                  status: str,
                                  question_number: Optional[int] = None):
        """Update session status and progress"""
        # This would update session metadata in the database
        # For now, just log it
        print(f"Session {session_id} status updated to: {status}")
        if question_number is not None:
            print(f"Session {session_id} current question: {question_number}")
    
    async def close_session(self):
        """Clean up session resources"""
        if self._checkpointer and self._checkpointer_context:
            try:
                await self._checkpointer_context.__aexit__(None, None, None)
                print("✅ AsyncPostgresSaver connection closed")
            except Exception as e:
                print(f"⚠️  Error closing checkpointer: {e}")
            finally:
                self._checkpointer = None
                self._checkpointer_context = None

# Global session manager instance
session_manager = InterviewSessionManager()