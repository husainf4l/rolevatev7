# graph.py
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from session_manager import session_manager

# Import from organized modules
from state.assistant_state import AssistantState
from nodes.assistant_node import call_llm, decide_next_action
from utils.session_utils import create_initial_session_state

load_dotenv(".env.local")

# -------------------- Assistant Workflow with PostgreSQL sessions --------------------
async def create_workflow():
    # Get AsyncPostgresSaver for session persistence
    checkpointer = await session_manager.get_checkpointer()

    # Build the assistant graph
    graph = StateGraph(AssistantState)
    
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
