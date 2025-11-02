import requests
from typing import Optional, Dict, Any
import os
import json
import urllib.parse

try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False
    print("BeautifulSoup not available, using basic HTML parsing")


class GoogleSearchTool:
    """Tool for searching Google and extracting website content"""
    
    def __init__(self):
        self.search_api_key = os.environ.get("GOOGLE_SEARCH_API_KEY")
        self.search_engine_id = os.environ.get("GOOGLE_SEARCH_ENGINE_ID")
    
    def search_company_info(self, company_website: str, company_name: str = None) -> Optional[str]:
        """
        Search for company information using Google Custom Search API
        """
        try:
            # Extract domain name for search
            domain = urllib.parse.urlparse(company_website).netloc
            
            # Create search query
            query = f"site:{domain} OR {domain.replace('www.', '')} company about"
            if company_name:
                query += f" {company_name}"
            
            if not self.search_api_key or not self.search_engine_id:
                print("Google Search API credentials not found, skipping search")
                return None
            
            # Use Google Custom Search API
            search_url = "https://www.googleapis.com/customsearch/v1"
            params = {
                'key': self.search_api_key,
                'cx': self.search_engine_id,
                'q': query,
                'num': 3
            }
            
            response = requests.get(search_url, params=params)
            response.raise_for_status()
            
            results = response.json()
            
            search_info = []
            if 'items' in results:
                for item in results['items'][:3]:
                    search_info.append({
                        'title': item.get('title', ''),
                        'snippet': item.get('snippet', ''),
                        'link': item.get('link', '')
                    })
            
            return str(search_info) if search_info else None
            
        except Exception as e:
            print(f"Error in Google search: {e}")
            return None
    
    def extract_website_content(self, url: str) -> Optional[str]:
        """
        Extract content from company website
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            if BS4_AVAILABLE:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                
                # Extract text content
                text = soup.get_text()
                
                # Clean up text
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = ' '.join(chunk for chunk in chunks if chunk)
            else:
                # Basic HTML cleaning without BeautifulSoup
                text = response.text
                # Remove common HTML tags
                import re
                text = re.sub(r'<script.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
                text = re.sub(r'<style.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
                text = re.sub(r'<[^>]+>', ' ', text)
                text = ' '.join(text.split())
            
            # Return first 2000 characters to avoid too much content
            return text[:2000] if text else None
            
        except Exception as e:
            print(f"Error extracting website content: {e}")
            return None


# Create global instance
google_search_tool = GoogleSearchTool()