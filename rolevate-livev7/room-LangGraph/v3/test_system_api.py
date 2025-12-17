#!/usr/bin/env python3
"""
Test script to verify system API key
"""
import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def test_system_api():
    """Test the GraphQL backend with system API key"""
    
    # Backend configuration
    endpoint = os.getenv('GRAPHQL_ENDPOINT', 'https://demo.rolevate.com/api/graphql')
    api_key = "rolevate_sys_7f8d9e2c4a5b6f1e3d8c9a7b4f5e6d2c3a8b9c7d6e5f4a3b2c1d0e9f8a7b6c5d4"
    
    print("=" * 80)
    print("🔧 System API Key Test")
    print("=" * 80)
    print(f"📡 Endpoint: {endpoint}")
    print(f"🔑 API Key: {api_key[:20]}...")
    print("=" * 80)
    
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_key
    }
    
    async with aiohttp.ClientSession() as session:
        # Test 1: Authentication
        print("\n🧪 Test 1: Authentication Check")
        print("-" * 80)
        auth_query = """
        query {
            me {
                id
                email
            }
        }
        """
        try:
            async with session.post(
                endpoint, 
                json={'query': auth_query}, 
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
        
        # Test 2: Query Jobs
        print("\n🧪 Test 2: Query Jobs")
        print("-" * 80)
        jobs_query = """
        query {
            jobs {
                id
                title
                company {
                    id
                    name
                }
                interviewLanguage
            }
        }
        """
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
                        for i, job in enumerate(jobs[:5], 1):  # Show first 5
                            print(f"  {i}. {job.get('title')} at {job.get('company', {}).get('name', 'N/A')}")
                            print(f"     Language: {job.get('interviewLanguage', 'N/A')}")
                else:
                    print(f"❌ Request failed with status {status}")
                    print(f"Response: {result}")
                    
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 3: Query Applications
        print("\n🧪 Test 3: Query Applications")
        print("-" * 80)
        applications_query = """
        query {
            applications {
                id
                status
                participant {
                    name
                    email
                }
                job {
                    title
                }
            }
        }
        """
        try:
            async with session.post(
                endpoint, 
                json={'query': applications_query}, 
                headers=headers
            ) as response:
                status = response.status
                result = await response.json()
                
                print(f"Status Code: {status}")
                
                if status == 200:
                    if 'errors' in result:
                        print(f"❌ GraphQL Errors: {result['errors']}")
                    else:
                        apps = result.get('data', {}).get('applications', [])
                        print(f"✅ Success! Found {len(apps)} applications")
                        for i, app in enumerate(apps[:3], 1):  # Show first 3
                            participant = app.get('participant', {})
                            job = app.get('job', {})
                            print(f"  {i}. {participant.get('name', 'N/A')} - {job.get('title', 'N/A')}")
                            print(f"     Status: {app.get('status', 'N/A')}")
                else:
                    print(f"❌ Request failed with status {status}")
                    print(f"Response: {result}")
                    
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 4: Query Interviews
        print("\n🧪 Test 4: Query Interviews")
        print("-" * 80)
        interviews_query = """
        query {
            interviews {
                id
                roomId
                status
                recordingUrl
                application {
                    participant {
                        name
                    }
                }
            }
        }
        """
        try:
            async with session.post(
                endpoint, 
                json={'query': interviews_query}, 
                headers=headers
            ) as response:
                status = response.status
                result = await response.json()
                
                print(f"Status Code: {status}")
                
                if status == 200:
                    if 'errors' in result:
                        print(f"❌ GraphQL Errors: {result['errors']}")
                    else:
                        interviews = result.get('data', {}).get('interviews', [])
                        print(f"✅ Success! Found {len(interviews)} interviews")
                        for i, interview in enumerate(interviews[:3], 1):  # Show first 3
                            participant = interview.get('application', {}).get('participant', {})
                            print(f"  {i}. Room: {interview.get('roomId', 'N/A')}")
                            print(f"     Participant: {participant.get('name', 'N/A')}")
                            print(f"     Status: {interview.get('status', 'N/A')}")
                            print(f"     Recording: {interview.get('recordingUrl', 'N/A')[:50]}...")
                else:
                    print(f"❌ Request failed with status {status}")
                    print(f"Response: {result}")
                    
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 80)
    print("✅ System API tests completed!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_system_api())
