# nodes/assistant_node.py
from datetime import datetime
import logging
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
import state
from state.assistant_state import AssistantState

def call_llm(state: AssistantState) -> AssistantState:
    """Main LLM call that handles the conversation."""
    
    # Get current session info
    session_id = state.get("session_id", "unknown")
    participant_name = state.get("participant_name", "")
    
    # Extract AI interview prompt from job details
    application_details = state.get("application_details")
    system_prompt = "You are a helpful AI assistant."  # fallback default
    
    if application_details and application_details.get('job'):
        job_details = application_details['job']
        
        # Get language and company info
        interview_language = job_details.get('interviewLanguage', 'english').lower()
        company_name = job_details.get('company', {}).get('name', 'the company')

        # Surface CV analysis from the application root (if present) so the LLM can use it
        cv_score = application_details.get('cvScore') or application_details.get('cv_score') or application_details.get('cvAnalysisScore')
        cv_analysis_results = application_details.get('cvAnalysisResults') or application_details.get('cv_analysis_results')
        cv_summary_parts = []
        
        if cv_score is not None:
            cv_summary_parts.append(f"CV Match Score: {cv_score}/100")
        
        if cv_analysis_results and isinstance(cv_analysis_results, dict):
            # Format structured CV analysis for the LLM
            if cv_analysis_results.get('experience_summary'):
                cv_summary_parts.append(f"Experience Summary: {cv_analysis_results['experience_summary']}")
            
            if cv_analysis_results.get('skills_matched'):
                skills_matched = cv_analysis_results['skills_matched']
                if isinstance(skills_matched, list):
                    cv_summary_parts.append(f"Matching Skills: {', '.join(skills_matched[:8])}")  # Limit to first 8
            
            if cv_analysis_results.get('skills_missing'):
                skills_missing = cv_analysis_results['skills_missing']
                if isinstance(skills_missing, list):
                    cv_summary_parts.append(f"Missing Skills: {', '.join(skills_missing[:6])}")  # Limit to first 6
            
            if cv_analysis_results.get('strengths'):
                strengths = cv_analysis_results['strengths']
                if isinstance(strengths, list):
                    cv_summary_parts.append(f"Key Strengths: {'; '.join(strengths[:4])}")  # Limit to first 4
            
            if cv_analysis_results.get('concerns'):
                concerns = cv_analysis_results['concerns']
                if isinstance(concerns, list):
                    cv_summary_parts.append(f"Areas of Concern: {'; '.join(concerns[:4])}")  # Limit to first 4
            
            if cv_analysis_results.get('recommendation'):
                cv_summary_parts.append(f"Overall Recommendation: {cv_analysis_results['recommendation'].title()}")
        elif cv_analysis_results:
            # Fallback for non-dict format
            cv_summary_parts.append(f"CV Analysis: {str(cv_analysis_results)[:600]}")

        cv_summary = "\n".join(cv_summary_parts)

        # Use interview prompt if available
        interview_prompt = job_details.get('interviewPrompt')
        if interview_prompt and interview_prompt.strip():
            # Replace {company_name} placeholder and add language instruction
            system_prompt = interview_prompt.replace('{company_name}', company_name)

            # Add language instruction based on interviewLanguage
            if interview_language == 'arabic':
                system_prompt += "\n\nIMPORTANT: You must conduct this interview entirely in Arabic. Speak, ask questions, and respond only in Arabic."
            else:
                system_prompt += "\n\nIMPORTANT: You must conduct this interview entirely in English."
        else:
            # Fallback to generic interview prompt with company name
            if interview_language == 'arabic':
                system_prompt = f"""أنت مُقابل مهني في {company_name}. 
قم بإجراء مقابلة شاملة وجذابة لتقييم مؤهلات المرشح ومهاراته وملاءمته الثقافية للمنصب. كن محترفاً ومباشراً وثاقب النظر."""
            else:
                system_prompt = f"""You are a professional interviewer at {company_name}. 
Conduct a thorough and engaging interview to assess the candidate's qualifications, 
skills, and cultural fit for the position. Be professional, direct, and insightful."""

        # Prepend CV summary (if any) so the LLM is aware of CV analysis findings
        if cv_summary:
            system_prompt = f"Candidate CV summary:\n{cv_summary}\n\n" + system_prompt
    
    # Log the final system prompt for debugging (truncated)
    logging.getLogger(__name__).info(f"System prompt (truncated): {system_prompt[:1000]}")

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
    msgs = [SystemMessage(content=system_prompt)] + list(state["messages"])
    message = llm.invoke(msgs)
    
    # Update session state - preserve all important fields
    new_state = {
        "messages": [message],
        "last_updated": datetime.now(),
        "current_question": state.get("current_question", 0),
        "session_id": session_id,
        "participant_name": state.get("participant_name"),
        "interview_status": state.get("interview_status", "active"),
        "start_time": state.get("start_time"),
        "questions_asked": state.get("questions_asked", []),
        "responses_received": state.get("responses_received", []),
        "application_details": state.get("application_details"),
        "interview_language": state.get("interview_language", "english")
    }
    
    # Log session progress
    print(f"Session {session_id}: Generated response")
    
    return new_state

def decide_next_action(state: AssistantState) -> str:
    """Decide what to do next: just continue conversation"""
    # No tools to execute, just continue the conversation
    return "end"