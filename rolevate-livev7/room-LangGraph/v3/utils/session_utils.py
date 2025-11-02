# utils/session_utils.py
from datetime import datetime
from langchain_core.messages import HumanMessage
from session_manager import SessionMetadata
from state.assistant_state import AssistantState

def create_initial_session_state(session_metadata: SessionMetadata) -> AssistantState:
    """Create initial state for a new assistant session with proactive opening"""
    # Extract language preference from application details
    language = "english"  # default
    if (session_metadata.application_details and 
        session_metadata.application_details.get('job')):
        language = session_metadata.application_details['job'].get('interviewLanguage', 'english').lower()
    
    # Create initial proactive message to start the conversation
    initial_message = HumanMessage(
        content="Start conversation"
    )
    
    # Also surface CV analysis top-level for convenience
    cv_score = None
    cv_analysis_results = None
    if session_metadata.application_details:
        cv_score = session_metadata.application_details.get('cvScore') or session_metadata.application_details.get('cv_score') or session_metadata.application_details.get('cvAnalysisScore')
        cv_analysis_results = session_metadata.application_details.get('cvAnalysisResults') or session_metadata.application_details.get('cv_analysis_results')

    return {
        "messages": [initial_message],  # Start with a trigger message for proactive behavior
        "session_id": session_metadata.session_id,
        "current_question": 0,
        "interview_status": "active",
        "participant_name": session_metadata.participant_name,
        "start_time": session_metadata.start_time,
        "last_updated": datetime.now(),
        "questions_asked": [],
        "responses_received": [],
        "application_details": session_metadata.application_details,
        "interview_language": language,
        "cv_score": cv_score,
        "cv_analysis_results": cv_analysis_results
    }