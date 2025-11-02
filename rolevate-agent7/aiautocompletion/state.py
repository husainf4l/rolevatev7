from typing import Dict, Any, Optional
from typing_extensions import TypedDict

class CompanyDescriptionState(TypedDict):
    """State for company description generation workflow"""
    
    # Input data
    country: str
    current_description: str
    industry: str
    location: str
    website: str
    
    # Processing data
    website_content: Optional[str]
    search_results: Optional[str]
    analysis: Optional[str]
    
    # Output
    generated_description: Optional[str]
    confidence_score: Optional[float]
    
    # Error handling
    error: Optional[str]