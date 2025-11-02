# graph.py
from dotenv import load_dotenv
import os
from typing import TypedDict, Annotated, Sequence, Optional
from operator import add as add_messages
from datetime import datetime

from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, ToolMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

from session_manager import session_manager, SessionMetadata

load_dotenv(".env.local")

# -------------------- Interview State Definition --------------------
class InterviewState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    session_id: str
    current_question: int
    interview_status: str
    participant_name: Optional[str]
    start_time: datetime
    last_updated: datetime
    questions_asked: list[str]
    responses_received: list[str]

# -------------------- Enhanced Interview workflow with PostgreSQL sessions --------------------
async def create_workflow():
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    
    # Get AsyncPostgresSaver for session persistence
    checkpointer = await session_manager.get_checkpointer()

    # No tools needed for basic conversation flow
    tools = []
    # llm = llm.bind_tools(tools)  # No tools to bind

    def decide_next_action(state: InterviewState) -> str:
        """Decide what to do next: just continue conversation"""
        # No tools to execute, just continue the conversation
        return "end"

    def call_llm(state: InterviewState) -> InterviewState:
        """Main LLM call that handles the interview conversation."""
        
        # Get current session info
        current_question = state.get("current_question", 0)
        session_id = state.get("session_id", "unknown")
        participant_name = state.get("participant_name", "")
        
        # Define interview questions
        interview_questions = [
            f"Hello{f', {participant_name}' if participant_name else ''}! Thank you for joining us today. Let's start with the basics - could you tell me about yourself? Please share your background, what you're passionate about, and what brings you here today.",
            "That's great to hear! Now, I'd love to learn about your technical background. Could you tell me about your experience with technology? What technologies, programming languages, or technical projects have you worked with?",
            "Excellent! Now, I'd like to hear about a time when you faced a significant challenge, either technical or professional. Could you walk me through the situation, what obstacles you encountered, and how you overcame them? What did you learn from that experience?",
            "Thank you for sharing that with me. That concludes our interview questions. Do you have any questions for me about the role or the interview process?"
        ]
        
        # Build system prompt with session context
        system_prompt = (
            f"You are a professional interviewer conducting a job interview. "
            f"Session ID: {session_id}\n"
            f"Current question number: {current_question + 1}/{len(interview_questions)}\n"
            f"Participant: {participant_name or 'Unknown'}\n\n"
            f"INTERVIEW FLOW:\n"
        )
        
        for i, q in enumerate(interview_questions):
            status = "✓ COMPLETED" if i < current_question else "→ CURRENT" if i == current_question else "○ PENDING"
            system_prompt += f"{i+1}. {status}: {q}\n"
        
        system_prompt += (
            f"\nIMPORTANT ROUTING RULES:\n"
            f"- You are currently on question {current_question + 1}\n"
            f"- Listen to the candidate's answers and acknowledge them naturally before asking the next question\n"
            f"- Be conversational, professional, and helpful\n"
            f"- Track the conversation progress and move through questions systematically\n"
            f"- If the candidate asks about company specifics, let them know you'll connect them with someone who can provide detailed information"
        )
        
        msgs = [SystemMessage(content=system_prompt)] + list(state["messages"])
        message = llm.invoke(msgs)
        
        # Update session state
        new_state = {
            "messages": [message],
            "last_updated": datetime.now(),
            "current_question": current_question,
            "session_id": session_id
        }
        
        # Log session progress
        print(f"Session {session_id}: Generated response for question {current_question + 1}")
        
        return new_state

    # No tool executor needed since we removed all tools
    # def tool_executor(state: InterviewState) -> InterviewState:
    #     """No tools to execute anymore"""
    #     return {"messages": []}


    # Build the interview graph
    graph = StateGraph(InterviewState)
    
    # Add nodes
    graph.add_node("llm", call_llm)
    
    # Set up the flow
    graph.set_entry_point("llm")
    
    # Simple flow: LLM -> END (no tools needed)
    graph.add_conditional_edges(
        "llm", 
        decide_next_action, 
        {
            "end": END
        }
    )

    # Compile graph with async PostgreSQL checkpointer for session persistence
    compiled_graph = graph.compile(checkpointer=checkpointer)
    print("✅ Graph compiled with AsyncPostgresSaver checkpointer")
    return compiled_graph

def create_initial_session_state(session_metadata: SessionMetadata) -> InterviewState:
    """Create initial state for a new interview session"""
    return {
        "messages": [],
        "session_id": session_metadata.session_id,
        "current_question": 0,
        "interview_status": "active",
        "participant_name": session_metadata.participant_name,
        "start_time": session_metadata.start_time,
        "last_updated": datetime.now(),
        "questions_asked": [],
        "responses_received": []
    }
