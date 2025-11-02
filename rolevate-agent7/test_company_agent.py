#!/usr/bin/env python3
"""
Simple terminal test for the AI Company Description service
"""
import sys
import os
import asyncio
from dotenv import load_dotenv

# Add the project root to Python path
sys.path.append('/Users/husain/Desktop/rolevate/rolevate-agent7')

# Load environment variables
load_dotenv()

from aiautocompletion.company_agent import company_description_agent

def test_company_description():
    """Test the company description agent"""
    
    # Test data based on your example
    test_data = {
        "country": "JO",
        "current_description": "upt house is one 2 three",
        "industry": "HEALTHCARE", 
        "location": "Amman",
        "website": "https://www.papayatrading.com",
        "website_content": None,
        "search_results": None,
        "analysis": None,
        "generated_description": None,
        "confidence_score": None,
        "error": None
    }
    
    print("🚀 Testing AI Company Description Service")
    print("=" * 50)
    print(f"Country: {test_data['country']}")
    print(f"Industry: {test_data['industry']}")
    print(f"Location: {test_data['location']}")
    print(f"Website: {test_data['website']}")
    print(f"Current Description: {test_data['current_description']}")
    print("=" * 50)
    
    try:
        print("🔄 Running AI analysis...")
        result = company_description_agent.invoke(test_data)
        
        print("✅ Analysis Complete!")
        print("=" * 50)
        
        if result.get('error'):
            print(f"❌ Error: {result['error']}")
        else:
            print(f"📊 Analysis: {result.get('analysis', 'N/A')}")
            print("-" * 30)
            print(f"📝 Generated Description:")
            print(f"{result.get('generated_description', 'N/A')}")
            print("-" * 30)
            print(f"🎯 Confidence Score: {result.get('confidence_score', 'N/A')}")
            
            if result.get('website_content'):
                print("-" * 30)
                print(f"🌐 Website Content Preview:")
                print(f"{result['website_content'][:200]}...")
                
    except Exception as e:
        print(f"❌ Error running test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Check for required environment variables
    required_vars = ["OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {missing_vars}")
        print("Please set them in your .env file")
        sys.exit(1)
    
    test_company_description()