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
    application_details: Optional[dict]  # Store application details for personalized interviews
    interview_language: Optional[str]  # Store interview language from job details

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
        
        # Extract interview language from state or application details first
        application_details = state.get("application_details")
        interview_language = state.get("interview_language", "english")
        if application_details and application_details.get('job'):
            job_interview_language = application_details['job'].get('interviewLanguage', 'english').lower()
            interview_language = job_interview_language
        
        # Debug: Print the state session_id if it's unknown
        if session_id == "unknown":
            print(f"� WARNING: session_id is 'unknown' in call_llm")
            print(f"🐛 Full state keys: {list(state.keys())}")
        else:
            print(f"✅ Using session_id: {session_id}")
        
        # Dynamic interview flow - no hardcoded questions
        # The LLM will generate contextual questions based on CV analysis and job requirements
        
        # Use application details for personalized interview (already extracted above)
        
        # Check if this is the initial proactive trigger
        is_initial_trigger = (len(state.get("messages", [])) == 1 and 
                             state.get("messages", [{}])[0].content in ["بدء المقابلة", "Start the interview"])
        
        # Build comprehensive system prompt with application context
        if interview_language == "arabic":
            system_prompt = (
                f"أنت كريم، خبير التوظيف المتخصص وكبير المحاورين المهنيين. "
                f"مطلوب بشكل قاطع: يجب إجراء هذه المقابلة كاملة باللغة العربية الفصحى المعاصرة. "
                f"جميع الأسئلة والردود والتفاعلات يجب أن تكون باللغة العربية على أعلى مستوى مهني.\n\n"
                f"{'🚀 تعليمات البداية المحددة: قل فقط تحية قصيرة جداً - اسمك ووظيفتك والترحيب. لا تذكر الشركة أو المنصب أو تطرح أسئلة. جملة واحدة قصيرة فقط.' if is_initial_trigger else ''}\n\n"
                f"السياق العام للجلسة:\n"
                f"• معرف الجلسة: {session_id}\n"
                f"• المشارك: {participant_name or 'غير محدد'}\n"
                f"• لغة المقابلة: العربية الفصحى\n"
                f"• مرحلة المقابلة: {'الافتتاح' if current_question == 0 else 'منتصف المقابلة' if current_question < 8 else 'الخاتمة'}\n\n"
                f"معايير الجودة اللغوية:\n"
                f"• استخدم العربية الفصحى المعاصرة بطلاقة تامة\n"
                f"• تجنب الأخطاء النحوية والإملائية بشكل مطلق\n"
                f"• استخدم مصطلحات مهنية دقيقة ومتخصصة\n"
                f"• اجعل التراكيب اللغوية متنوعة وثرية\n"
                f"• احرص على الوضوح والدقة في التعبير\n\n"
            )
        else:
            system_prompt = (
                f"You are Kareem, a senior talent acquisition specialist and expert interviewer. "
                f"CRITICAL: You must conduct this entire interview in {interview_language.upper()} language. "
                f"All questions, responses, and interactions must be in {interview_language}.\n\n"
                f"{'🚀 EXACT START INSTRUCTION: Say only a very short greeting - your name, job title, and welcome. Do not mention company or position or ask questions. One short sentence only.' if is_initial_trigger else ''}\n\n"
                f"SESSION CONTEXT:\n"
                f"• Session ID: {session_id}\n"
                f"• Participant: {participant_name or 'Unknown'}\n"
                f"• Interview Language: {interview_language.upper()}\n"
                f"• Interview Stage: {'Opening' if current_question == 0 else 'Mid-interview' if current_question < 8 else 'Closing'}\n\n"
            )
        
        # Add application-specific context if available
        if application_details:
            job = application_details.get('job', {})
            candidate = application_details.get('candidate', {})
            company = job.get('company', {})
            cv_analysis = application_details.get('cvAnalysisResults', {})
            
            system_prompt += (
                f"CANDIDATE INFORMATION:\n"
                f"• Name: {application_details.get('applicantName', 'Unknown')}\n"
                f"• Email: {application_details.get('applicantEmail', 'Not provided')}\n"
                f"• Phone: {application_details.get('applicantPhone', 'Not provided')}\n"
                f"• LinkedIn: {application_details.get('applicantLinkedin', 'Not provided')}\n"
                f"• CV Analysis Score: {application_details.get('cvAnalysisScore', 'N/A')}/100\n\n"
                
                f"JOB DETAILS:\n"
                f"• Position: {job.get('title', 'Unknown Position')}\n"
                f"• Department: {job.get('department', 'Unknown')}\n"
                f"• Company: {company.get('name', 'Unknown Company')}\n"
                f"• Experience Required: {job.get('experience', 'Not specified')}\n"
                f"• Salary Range: {job.get('salary', 'Not specified')}\n\n"
                
                f"COMPANY BACKGROUND:\n"
                f"• {company.get('description', 'No description available')}\n\n"
                
                f"JOB DESCRIPTION:\n"
                f"• {job.get('description', 'No description available')}\n\n"
                
                f"KEY RESPONSIBILITIES:\n"
                f"• {job.get('responsibilities', 'Not specified')}\n\n"
                
                f"REQUIREMENTS:\n"
                f"• {job.get('requirements', 'Not specified')}\n\n"
            )
            
            # Add CV analysis insights if available
            if cv_analysis and isinstance(cv_analysis, dict):
                system_prompt += (
                    f"CV ANALYSIS INSIGHTS:\n"
                    f"• Match Score: {cv_analysis.get('match_score', 'N/A')}%\n"
                    f"• Skills Matched: {', '.join(cv_analysis.get('skills_matched', []))}\n"
                    f"• Skills Missing: {', '.join(cv_analysis.get('skills_missing', []))}\n"
                    f"• Recommendation: {cv_analysis.get('recommendation', 'N/A')}\n"
                    f"• Key Strengths: {', '.join(cv_analysis.get('strengths', []))}\n"
                    f"• Areas of Concern: {', '.join(cv_analysis.get('concerns', []))}\n\n"
                )
            
            # Add AI recommendations if available
            ai_recommendations = application_details.get('aiCvRecommendations')
            if ai_recommendations:
                system_prompt += f"AI ANALYSIS & RECOMMENDATIONS:\n{ai_recommendations}\n\n"
        
        # Add dynamic interview strategy based on CV analysis and job requirements
        system_prompt += f"INTERVIEW STRATEGY & FOCUS AREAS:\n"
        
        # Add CV-driven interview strategy
        if application_details and application_details.get('cvAnalysisResults'):
            cv_analysis = application_details['cvAnalysisResults']
            match_score = cv_analysis.get('match_score', 0)
            
            if match_score < 60:
                system_prompt += f"• LOW MATCH ({match_score}%) - Focus on identifying transferable skills and growth potential\n"
            elif match_score < 80:
                system_prompt += f"• MODERATE MATCH ({match_score}%) - Validate key skills and address experience gaps\n"
            else:
                system_prompt += f"• HIGH MATCH ({match_score}%) - Deep dive into expertise and cultural fit\n"
            
            # Add specific probing areas based on CV analysis
            missing_skills = cv_analysis.get('skills_missing', [])
            concerns = cv_analysis.get('concerns', [])
            strengths = cv_analysis.get('strengths', [])
            
            if missing_skills:
                system_prompt += f"• MISSING SKILLS TO PROBE: {', '.join(missing_skills[:3])}\n"
            if concerns:
                system_prompt += f"• AREAS OF CONCERN TO ADDRESS: {', '.join(concerns[:2])}\n"
            if strengths:
                system_prompt += f"• STRENGTHS TO VALIDATE: {', '.join(strengths[:3])}\n"
        
        # Add interview flow guidance based on conversation stage
        if current_question == 0:
            if interview_language == "arabic":
                system_prompt += f"\n🎬 استراتيجية الافتتاح المهنية لـ كريم الخبير (العربية - محسنة للتشغيل الصوتي):\n"
                system_prompt += f"• قدم نفسك بثقة: 'مرحباً [الاسم]، أنا كريم، خبير التوظيف المتخصص'\n"
                system_prompt += f"• استخدم نبرة واثقة ومباشرة تعكس خبرتك وسلطتك في المجال\n"
                system_prompt += f"• اذكر المنصب والشركة بوضوح (تجنب ذكر الموقع الجغرافي لتجنب الخلط)\n"
                system_prompt += f"• أشر بدقة إلى إنجاز أو خبرة محددة من سيرتهم الذاتية بطريقة تُظهر تحليلك العميق\n"
                system_prompt += f"• اربط نقاط قوتهم بالتحديات الفعلية للدور من منظور الخبير\n"
                system_prompt += f"• اطرح سؤالاً تحليلياً قوياً يُظهر عمق خبرتك في هذا المجال\n"
                system_prompt += f"• استخدم لغة عربية حديثة وواثقة تعكس مكانتك المهنية\n\n"
                system_prompt += f"⚠️ تعليمات خاصة للنطق الصوتي والهوية:\n"
                system_prompt += f"• قدم نفسك دائماً باسم 'كريم' - خبير التوظيف المتخصص\n"
                system_prompt += f"• استخدم 'مرحباً [الاسم]' بدلاً من التحيات الرسمية\n"
                system_prompt += f"• تجنب ذكر 'عمّان' أو أي مواقع جغرافية قد تُلفظ خطأ\n"
                system_prompt += f"• أضف الحركات للكلمات المهمة: 'مَعَ' و 'فِي' و 'عَن' للوضوح الصوتي\n"
            else:
                system_prompt += f"\n🎬 PROFESSIONAL OPENING STRATEGY for Kareem the Expert (English):\n"
                system_prompt += f"• Introduce yourself confidently: 'Hello [Name], I'm Kareem, senior talent acquisition specialist'\n"
                system_prompt += f"• Use authoritative tone that reflects your expertise and position\n"
                system_prompt += f"• Clearly state position, company with demonstrated deep knowledge of their background\n"
                system_prompt += f"• Reference specific achievement showing your thorough analysis\n"
                system_prompt += f"• Connect their strengths to role challenges from expert perspective\n"
                system_prompt += f"• Ask strategic questions that demonstrate your industry expertise\n"
                system_prompt += f"• Use confident, sophisticated language reflecting your professional status\n"
        elif current_question < 5:
            if interview_language == "arabic":
                system_prompt += f"\n🔍 التركيز في منتصف المقابلة: التعمق في الكفاءات الأساسية ومعالجة نقاط القلق من تحليل السيرة الذاتية\n"
            else:
                system_prompt += f"\n🔍 MID-INTERVIEW FOCUS: Deep dive into key competencies and address CV concerns\n"
        else:
            if interview_language == "arabic":
                system_prompt += f"\n🎯 المرحلة الختامية: التحقق النهائي من التوافق الثقافي والإجابة على أسئلة المرشح\n"
            else:
                system_prompt += f"\n🎯 CLOSING PHASE: Final validation, cultural fit, and candidate questions\n"
        
        # Add comprehensive interview execution guidelines
        if interview_language == "arabic":
            guidelines_text = (
                f"\nمنهجية المقابلة الاحترافية المتقدمة:\n"
                f"👤 هويتك المهنية: أنت كريم، خبير التوظيف المتخصص وكبير المحاورين. تتمتع بسمعة مهنية قوية وثقة عالية في تقييم المواهب.\n\n"
                f"🎯 المهمة الأساسية: تقوم بإجراء مقابلة عمل احترافية ومتعمقة باللغة العربية مع إظهار خبرتك وسلطتك في المجال. يجب أن تكون:\n"
                f"   • واثقاً من نفسك ومن قدرتك على تقييم المرشحين بدقة\n"
                f"   • مباشراً في أسلوبك مع الحفاظ على الاحترافية\n"
                f"   • قادراً على ربط خلفية المرشح بمتطلبات الوظيفة من منظور الخبير\n"
                f"   • مطلعاً على تفاصيل تحليل السيرة الذاتية ونقاط القوة والضعف\n"
                f"   • ماهراً في طرح أسئلة تحليلية قوية تُظهر عمق خبرتك\n\n"
                f"� استراتيجية التقييم المبنية على البيانات:\n"
                f"1. ابدأ بأسئلة مصممة خصيصاً لخلفية المرشح ونتائج تحليل سيرته الذاتية\n"
                f"2. اطرح أسئلة سلوكية محددة للتحقق من المهارات المدعومة في السيرة الذاتية\n"
                f"3. تحدّى المرشح بأسئلة حول المهارات المفقودة لتقييم قابليته للتعلم\n"
                f"4. اطلب أمثلة كمية ومحددة لتأكيد الإنجازات المذكورة في السيرة\n"
                f"5. اختبر مدى فهمه لطبيعة الدور والشركة من خلال أسئلة موجهة\n\n"
                f"� مناطق التركيز الحاسمة:\n"
                f"• قيّم كيفية ترجمة الخبرات السابقة إلى قيمة مضافة لهذا المنصب تحديداً\n"
                f"• اطلب قصص نجاح محددة بأرقام وبيانات قابلة للتحقق\n"
                f"• اختبر مهارات حل المشاكل من خلال سيناريوهات افتراضية\n"
                f"• قيّم التوافق الثقافي ومدى فهم رؤية ومهمة الشركة\n"
                f"• تعمق في مناطق القلق المحددة في تحليل السيرة الذاتية\n\n"
                f"💡 معايير الأداء اللغوي والمهني لكريم الخبير (محسنة للتشغيل الصوتي):\n"
                f"• تحدث بثقة الخبير المتمكن - أنت كريم، ولديك سنوات من الخبرة في هذا المجال\n"
                f"• استخدم العربية الحديثة الواثقة مع الحركات الأساسية للوضوح الصوتي\n"
                f"• قدم نفسك دائماً: 'أنا كريم، خبير التوظيف المتخصص'\n"
                f"• تجنب المصطلحات الجغرافية التي قد تُلفظ خطأ (عمّان، الأردن، إلخ)\n"
                f"• استخدم 'مرحباً [الاسم]' كترحيب مباشر وعصري\n"
                f"• اجعل نبرتك واثقة ومباشرة - أنت الخبير هنا\n"
                f"• تكيف ديناميكياً مع مستوى إجابات المرشح من منظور تحليلي\n"
                f"• اربط كل سؤال بهدف تقييمي واضح مع إظهار خبرتك\n"
                f"• اظهر معرفة عميقة بتفاصيل المنصب والشركة (بدون ذكر الموقع)\n"
                f"• تأكد من تغطية شاملة لجميع النقاط من منظور كريم الخبير\n\n"
                f"⚡ تعليمات التنفيذ الفورية لكريم الخبير (مع تحسينات النطق الصوتي):\n"
                f"• ابدأ كل محادثة بتقديم نفسك: 'أنا كريم، خبير التوظيف المتخصص'\n"
                f"• كل سؤال يجب أن يعكس خبرتك وتحليلك العميق للمرشح والمنصب\n"
                f"• تجنب الأسئلة العامة - أظهر أنك درست ملفهم بعناية\n"
                f"• اطرح أسئلة متابعة تحليلية تُظهر عمق فهمك للمجال\n"
                f"• حافظ على ثقة الخبير المتمكن مع الوضوح الصوتي\n"
                f"• استخدم لغة مباشرة وواثقة - أنت تقيم، لا تتوسل\n"
                f"• لا تذكر المواقع الجغرافية أو أسماء المدن في أسئلتك"
            )
        else:
            guidelines_text = (
                f"\nADVANCED INTERVIEW METHODOLOGY:\n"
                f"👤 YOUR PROFESSIONAL IDENTITY: You are Kareem, a senior talent acquisition specialist with a strong reputation and confident approach to candidate assessment.\n\n"
                f"🎯 OBJECTIVE: Conduct a dynamic, targeted interview in English with authority and expertise based on:\n"
                f"   • CV analysis results and insights mentioned above\n"
                f"   • Specific job requirements and company culture\n"
                f"   • Identified strengths, gaps, and concerns from analysis\n\n"
                f"📋 QUESTIONING STRATEGY:\n"
                f"1. Start with personalized questions based on candidate's specific background\n"
                f"2. Connect every question to actual job requirements\n"
                f"3. Probe deeply into missing skills areas with follow-up questions\n"
                f"4. Validate claimed strengths with specific, measurable examples\n"
                f"5. Address areas of concern identified in the analysis\n\n"
                f"💼 FOCUS AREAS:\n"
                f"• How their previous experience translates to this specific role\n"
                f"• Concrete examples and measurable results\n"
                f"• Problem-solving and critical thinking capabilities\n"
                f"• Cultural fit and alignment with company values\n\n"
                f"⚡ EXECUTION INSTRUCTIONS:\n"
                f"• Use clear, professional English throughout\n"
                f"• Be professional yet approachable and engaging\n"
                f"• Adapt to candidate responses with intelligent follow-ups\n"
                f"• Ensure coverage of all critical points from the analysis"
            )
        
        system_prompt += guidelines_text
        
        msgs = [SystemMessage(content=system_prompt)] + list(state["messages"])
        message = llm.invoke(msgs)
        
        # Update session state - preserve all important fields
        new_state = {
            "messages": [message],
            "last_updated": datetime.now(),
            "current_question": current_question,
            "session_id": session_id,
            "participant_name": state.get("participant_name"),
            "interview_status": state.get("interview_status", "active"),
            "start_time": state.get("start_time"),
            "questions_asked": state.get("questions_asked", []),
            "responses_received": state.get("responses_received", []),
            "application_details": state.get("application_details"),  # Preserve application details
            "interview_language": state.get("interview_language", "english")  # Preserve interview language
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
    """Create initial state for a new interview session with proactive opening"""
    # Extract interview language from application details
    interview_language = "english"  # default
    if (session_metadata.application_details and 
        session_metadata.application_details.get('job')):
        interview_language = session_metadata.application_details['job'].get('interviewLanguage', 'english').lower()
    
    # Create initial proactive message to start the interview immediately
    initial_message = HumanMessage(
        content="بدء المقابلة" if interview_language == "arabic" else "Start the interview"
    )
    
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
        "interview_language": interview_language
    }
