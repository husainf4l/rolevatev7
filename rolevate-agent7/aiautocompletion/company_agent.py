from langgraph.graph import StateGraph, END
from .state import CompanyDescriptionState
from .nodes.fetch_data import fetch_company_data
from .nodes.analyze_company import analyze_company_info


def create_company_description_agent():
    """
    Create the company description generation agent using LangGraph
    """
    
    # Create the workflow
    workflow = StateGraph(CompanyDescriptionState)
    
    # Add nodes
    workflow.add_node("fetch_data", fetch_company_data)
    workflow.add_node("analyze_company", analyze_company_info)
    
    # Define the workflow flow
    workflow.set_entry_point("fetch_data")
    workflow.add_edge("fetch_data", "analyze_company")
    workflow.add_edge("analyze_company", END)
    
    # Compile the workflow
    return workflow.compile()


# Create the agent instance
company_description_agent = create_company_description_agent()