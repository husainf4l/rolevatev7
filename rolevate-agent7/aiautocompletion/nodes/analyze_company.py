from ..state import CompanyDescriptionState
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import os


def analyze_company_info(state: CompanyDescriptionState) -> CompanyDescriptionState:
    """
    Analyze company information using LangChain and OpenAI
    """
    print("Analyzing company information...")
    
    try:
        # Initialize OpenAI model
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=os.environ.get("OPENAI_API_KEY"),
            temperature=0.3
        )
        
        # Create prompt template
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are an expert HR and recruitment copywriter specializing in creating compelling company descriptions for job platforms like Rolevate.com. 
            Your task is to create professional, candidate-focused company descriptions that attract top talent and showcase employer brand.
            
            Guidelines for Rolevate.com Company Descriptions:
            1. Keep descriptions between 80-150 words (concise but informative)
            2. Focus on what makes the company an attractive employer
            3. Highlight company culture, values, and employee benefits
            4. Emphasize growth opportunities and career development
            5. Include industry leadership and market position
            6. Use candidate-friendly language that appeals to job seekers
            7. Mention company size, founding year, or notable achievements if available
            8. Include location and any remote/hybrid work options
            9. Avoid overly promotional language - focus on facts and employee value
            10. Make it recruitment-focused: "Why would someone want to work here?"
            """),
            ("user", """
            Create a professional company description for Rolevate.com (recruitment platform) based on the following information:
            
            Current Description: {current_description}
            Industry: {industry}
            Location: {location}
            Country: {country}
            Website: {website}
            
            Website Content (if available):
            {website_content}
            
            Search Results (if available):
            {search_results}
            
            Requirements:
            1. Analyze the current description and available information
            2. Generate a recruitment-focused company description suitable for job postings
            3. Make it appealing to potential candidates and job seekers
            4. Highlight what makes this company a great place to work
            5. Focus on company culture, career opportunities, and employee value proposition
            6. Provide a confidence score based on available information quality
            
            Format your response as:
            ANALYSIS: [Your analysis of the current description and available information for recruitment purposes]
            
            NEW_DESCRIPTION: [The improved, recruitment-focused company description that would attract job candidates]
            
            CONFIDENCE_SCORE: [Your confidence score 0-100]
            """)
        ])
        
        # Prepare the input data
        input_data = {
            "current_description": state.get('current_description', ''),
            "industry": state.get('industry', ''),
            "location": state.get('location', ''),
            "country": state.get('country', ''),
            "website": state.get('website', ''),
            "website_content": state.get('website_content') or 'No website content available',
            "search_results": state.get('search_results') or 'No search results available'
        }
        
        # Generate response
        chain = prompt_template | llm
        response = chain.invoke(input_data)
        
        # Parse the response
        response_text = response.content
        
        # Extract sections from response
        analysis = ""
        new_description = ""
        confidence_score = 75.0  # Default confidence
        
        for line in response_text.split('\n'):
            if line.startswith('ANALYSIS:'):
                analysis = line.replace('ANALYSIS:', '').strip()
            elif line.startswith('NEW_DESCRIPTION:'):
                new_description = line.replace('NEW_DESCRIPTION:', '').strip()
            elif line.startswith('CONFIDENCE_SCORE:'):
                try:
                    confidence_score = float(line.replace('CONFIDENCE_SCORE:', '').strip())
                except:
                    confidence_score = 75.0
        
        # If parsing failed, use the full response as description
        if not new_description:
            new_description = response_text.strip()
        
        return {
            **state,
            'analysis': analysis or response_text,
            'generated_description': new_description,
            'confidence_score': confidence_score
        }
        
    except Exception as e:
        return {
            **state,
            'error': f"Error analyzing company info: {str(e)}"
        }