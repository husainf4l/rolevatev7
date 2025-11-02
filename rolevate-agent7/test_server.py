#!/usr/bin/env python3
"""
Simple FastAPI test server for AI Company Description service on port 8006
"""
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import uvicorn
import sys
import os
from dotenv import load_dotenv

# Add the project root to Python path
sys.path.append('/Users/husain/Desktop/rolevate/rolevate-agent7')

# Load environment variables
load_dotenv()

from aiautocompletion.company_agent import company_description_agent

app = FastAPI(title="AI Company Description Service", version="1.0.0")

class CompanyDescriptionRequest(BaseModel):
    country: str
    currentDescription: str
    industry: str
    location: str
    website: str

@app.get("/")
async def read_root():
    return {
        "message": "AI Company Description Service", 
        "version": "1.0.0",
        "endpoints": ["/company-description", "/health"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-company-description"}

@app.post("/company-description")
async def generate_company_description(request: CompanyDescriptionRequest):
    """Generate intelligent company description using AI"""
    try:
        print(f"Processing request for: {request.website}")
        
        result = company_description_agent.invoke({
            "country": request.country,
            "current_description": request.currentDescription,
            "industry": request.industry,
            "location": request.location,
            "website": request.website,
            "website_content": None,
            "search_results": None,
            "analysis": None,
            "generated_description": None,
            "confidence_score": None,
            "error": None
        })
        
        return {
            "success": True,
            "input": {
                "country": request.country,
                "industry": request.industry,
                "location": request.location,
                "website": request.website,
                "original_description": request.currentDescription
            },
            "output": {
                "generated_description": result.get("generated_description"),
                "analysis": result.get("analysis"),
                "confidence_score": result.get("confidence_score"),
                "website_content_found": bool(result.get("website_content")),
                "search_results_found": bool(result.get("search_results"))
            },
            "error": result.get("error")
        }
        
    except Exception as e:
        print(f"Error processing request: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e),
            "input": {
                "country": request.country,
                "industry": request.industry,
                "location": request.location,
                "website": request.website,
                "original_description": request.currentDescription
            }
        }

if __name__ == "__main__":
    print("🚀 Starting AI Company Description Service on port 8006...")
    print("📝 API Documentation: http://localhost:8006/docs")
    print("🔍 Health Check: http://localhost:8006/health")
    
    uvicorn.run(
        "test_server:app",
        host="0.0.0.0",
        port=8006,
        reload=True,
        log_level="info"
    )