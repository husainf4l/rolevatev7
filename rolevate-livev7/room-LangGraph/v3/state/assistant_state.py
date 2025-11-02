# state/assistant_state.py
from typing import TypedDict, Annotated, Sequence, Optional
from operator import add as add_messages
from datetime import datetime
from langchain_core.messages import BaseMessage

class AssistantState(TypedDict):
    """State for the AI assistant conversation"""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    session_id: str
    current_question: int
    interview_status: str  # Keep for compatibility but could rename to conversation_status
    participant_name: Optional[str]
    start_time: datetime
    last_updated: datetime
    questions_asked: list[str]  # Keep for compatibility but could rename to conversation_history
    responses_received: list[str]
    application_details: Optional[dict]  # Store any context data
    interview_language: Optional[str]  # Store preferred language