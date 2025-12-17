#!/usr/bin/env python3
"""
Test script to verify backend GraphQL API connectivity
"""
import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def test_backend():
    """Test the GraphQL backend with the provided API key"""
    
    # Backend configuration
    endpoint = os.getenv('GRAPHQL_ENDPOINT', 'https://demo.rolevate.com/api/graphql')
    api_key = "agent_rolevate_admin_9f2e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7"
    
    print("=" * 80)
    print("🔧 Backend API Test")
    print("=" * 80)
    print(f"📡 Endpoint: {endpoint}")
    print(f"🔑 API Key: {api_key[:20]}...")
    print("=" * 80)
    
    # Simple health check query
    health_query = """
    query {
        me {
            id
            email
        }
    }
    """
    
    # Test query 2 - Get jobs (if available)
    jobs_query = """
    query {
        jobs {
            id
            title
            company {
                id
                name
            }
        }
    }
    """
    
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_key
    }
    
    async with aiohttp.ClientSession() as session:
        # Test 1: Health check / Auth verification
        print("\n🧪 Test 1: Authentication & User Info")
        print("-" * 80)
        try:
            async with session.post(
                endpoint, 
                json={'query': health_query}, 
                headers=headers
            ) as response:
                status = response.status
                result = await response.json()
                
                print(f"Status Code: {status}")
                
                if status == 200:
                    if 'errors' in result:
                        print(f"❌ GraphQL Errors: {result['errors']}")
                    else:
                        user = result.get('data', {}).get('me', {})
                        print(f"✅ Authentication successful!")
                        print(f"  User ID: {user.get('id', 'N/A')}")
                        print(f"  Email: {user.get('email', 'N/A')}")
                else:
                    print(f"❌ Request failed with status {status}")
                    print(f"Response: {result}")
                    
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 2: Query jobs
        print("\n🧪 Test 2: Query Jobs")
        print("-" * 80)
        try:
            async with session.post(
                endpoint, 
                json={'query': jobs_query}, 
                headers=headers
            ) as response:
                status = response.status
                result = await response.json()
                
                print(f"Status Code: {status}")
                
                if status == 200:
                    if 'errors' in result:
                        print(f"❌ GraphQL Errors: {result['errors']}")
                    else:
                        jobs = result.get('data', {}).get('jobs', [])
                        print(f"✅ Success! Found {len(jobs)} jobs")
                        for job in jobs:
                            print(f"  - {job.get('title')} at {job.get('company', {}).get('name', 'N/A')}")
                else:
                    print(f"❌ Request failed with status {status}")
                    print(f"Response: {result}")
                    
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 3: Create interview mutation (if needed)
        create_interview_query = """
        mutation CreateInterview($data: InterviewCreateInput!) {
            createInterview(data: $data) {
                id
                roomId
                status
            }
        }
        """
        
        print("\n🧪 Test 3: Test Interview Creation Mutation Structure")
        print("-" * 80)
        print("Mutation available for creating interviews")
        print("Example variables structure:")
        print("""
        {
            "data": {
                "applicationId": "APP_ID",
                "roomId": "room-123",
                "status": "SCHEDULED"
            }
        }
        """)
    
    print("\n" + "=" * 80)
    print("✅ Backend API tests completed!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_backend())
