from ..state import CompanyDescriptionState
from ..tools.search_tool import google_search_tool


def fetch_company_data(state: CompanyDescriptionState) -> CompanyDescriptionState:
    """
    Fetch company data from website and search results
    """
    print(f"Fetching data for company: {state['website']}")
    
    try:
        # Extract website content
        website_content = google_search_tool.extract_website_content(state['website'])
        
        # Search for additional company information
        search_results = google_search_tool.search_company_info(
            state['website'], 
            # Try to extract company name from website domain
            state['website'].replace('https://', '').replace('http://', '').replace('www.', '').split('.')[0]
        )
        
        return {
            **state,
            'website_content': website_content,
            'search_results': search_results
        }
        
    except Exception as e:
        return {
            **state,
            'error': f"Error fetching company data: {str(e)}"
        }