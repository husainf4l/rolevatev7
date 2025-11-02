import os
import asyncio
import aiohttp
import logging
from typing import Optional, Dict, Any
import re

# Suppress harmless asyncio CancelledError warnings from Soniox STT cleanup
logging.getLogger('asyncio').setLevel(logging.CRITICAL)

logger = logging.getLogger(__name__)

class GraphQLClient:
    def __init__(self):
        self.endpoint = os.getenv('GRAPHQL_ENDPOINT', 'http://localhost:4005/api/graphql')
        self.api_key = os.getenv('ROLEVATE_API_KEY', '31a29647809f2bf22295b854b30eafd58f50ea1559b0875ad2b55f508aa5215e')
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def execute_query(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a GraphQL query"""
        if not self.session:
            raise RuntimeError("GraphQL client not initialized. Use 'async with' context manager.")
            
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': self.api_key
        }
        
        payload = {
            'query': query
        }
        
        if variables:
            payload['variables'] = variables
            
        try:
            async with self.session.post(self.endpoint, json=payload, headers=headers) as response:
                result = await response.json()
                
                if response.status != 200:
                    logger.error(f"GraphQL request failed with status {response.status}: {result}")
                    return None
                    
                if 'errors' in result:
                    logger.error(f"GraphQL errors: {result['errors']}")
                    return None
                    
                return result.get('data')
                
        except Exception as e:
            logger.error(f"GraphQL request failed: {e}")
            return None
    
    def extract_job_id_from_room_name(self, room_name: str) -> Optional[str]:
        """Extract job ID from LiveKit room name pattern"""
        # Pattern: interview-{uuid}-{number} -> corresponds to job ID like AJ_JSBd98MDqmqN
        # We need to find the job ID from the room name somehow
        # For now, let's assume we need to query for interviews by roomId
        return None
    
    async def find_interview_by_room_id(self, room_id: str) -> Optional[str]:
        """Find interview ID by room ID"""
        query = """
        query FindInterviewByRoomId($roomId: String!) {
            interviews(filter: { roomId: $roomId }, limit: 1) {
                id
                roomId
                recordingUrl
                application {
                    id
                    job {
                        id
                    }
                }
            }
        }
        """
        
        variables = {
            "roomId": room_id
        }
        
        logger.info(f"🔍 Searching for interview with roomId: {room_id}")
        result = await self.execute_query(query, variables)
        
        if result and result.get('interviews') and len(result['interviews']) > 0:
            interview = result['interviews'][0]
            logger.info(f"✅ Found interview: {interview['id']}")
            return interview['id']
        
        logger.warning(f"⚠️ No interview found with roomId: {room_id}")
        return None
    
    async def update_interview_recording(self, interview_id: str, recording_url: str, room_id: str) -> bool:
        """Update interview with recording URL"""
        mutation = """
        mutation UpdateInterviewRecording($id: ID!, $input: UpdateInterviewInput!) {
            updateInterview(id: $id, input: $input) {
                id
                recordingUrl
                roomId
            }
        }
        """
        
        variables = {
            "id": interview_id,
            "input": {
                "recordingUrl": recording_url,
                "roomId": room_id
            }
        }
        
        logger.info(f"🎬 Updating interview {interview_id} with recording URL: {recording_url}")
        result = await self.execute_query(mutation, variables)
        
        if result and result.get('updateInterview'):
            logger.info(f"✅ Successfully updated interview recording URL")
            return True
        
        logger.error(f"❌ Failed to update interview recording URL")
        return False

    async def complete_interview(self, interview_id: str) -> bool:
        """Mark interview as completed using the completeInterview mutation"""
        mutation = """
        mutation CompleteInterview($id: ID!) {
            completeInterview(id: $id) {
                id
                status
                aiAnalysis
            }
        }
        """
        
        variables = {
            "id": interview_id
        }
        
        logger.info(f"✅ Completing interview {interview_id} with AI analysis")
        result = await self.execute_query(mutation, variables)
        
        if result and result.get('completeInterview'):
            completed_interview = result['completeInterview']
            logger.info(f"✅ Successfully completed interview {completed_interview['id']} with status: {completed_interview.get('status')}")
            if completed_interview.get('aiAnalysis'):
                logger.info(f"🤖 AI analysis generated for interview")
            return True
        
        logger.error(f"❌ Failed to complete interview")
        return False
    
    def extract_interview_id_from_room_name(self, room_name: str) -> str:
        """
        Extract interview UUID from room name.
        Room format: interview-{uuid}-{room_number}
        Example: interview-471434a7-2297-4b89-9074-3bdd0f99bcd1-97 -> 471434a7-2297-4b89-9074-3bdd0f99bcd1
        """
        if room_name.startswith("interview-"):
            # Remove "interview-" prefix and split by "-"
            parts = room_name[10:].split("-")  # Remove "interview-"
            if len(parts) >= 5:  # UUID has 5 parts (8-4-4-4-12)
                # Take first 5 parts for UUID, ignore room number at the end
                uuid_parts = parts[:5]
                interview_id = "-".join(uuid_parts)
                logger.info(f"🔍 Extracted interview ID: {interview_id} from room: {room_name}")
                return interview_id
        
        logger.warning(f"⚠️ Could not extract interview ID from room name: {room_name}")
        return room_name  # Fallback to full room name

    async def create_interview_with_video(self, room_id: str, video_url: str, job_id: str) -> Optional[str]:
        """
        Create a new interview with video URL.
        Uses the extracted interview UUID as both the applicationId and a reference.
        Returns the interview ID if successful, None if failed.
        """
        try:
            # Extract the actual interview UUID from room name
            interview_uuid = self.extract_interview_id_from_room_name(room_id)
            
            mutation = """
            mutation CreateInterview($input: CreateInterviewInput!) {
                createInterview(input: $input) {
                    id
                    roomId
                    recordingUrl
                    createdAt
                }
            }
            """
            
            # Use only applicationId as the required field (after backend restart)
            variables = {
                "input": {
                    "applicationId": interview_uuid,
                    "roomId": room_id,
                    "recordingUrl": video_url,
                    "type": "VIDEO",  # Valid enum value
                    "status": "STARTED"  # Interview is actively starting
                }
            }
            
            logger.info(f"📝 Creating interview with applicationId: {interview_uuid}")
            
            result = await self.execute_query(mutation, variables)
            if result and result.get("createInterview"):
                interview = result["createInterview"]
                interview_id = interview['id']
                logger.info(f"✅ Created interview {interview_id} with video URL")
                logger.info(f"🎬 Video URL saved: {interview['recordingUrl']}")
                return interview_id
            else:
                logger.error("❌ Failed to create interview")
                logger.error(f"Response: {result}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error creating interview: {str(e)}")
            return None

    async def save_video_url_to_interview(self, room_id: str, video_url: str, job_id: str) -> Optional[str]:
        """
        Save video URL to an interview by creating a new interview record.
        Uses job_id extracted from LiveKit as a reference.
        Returns the interview ID if successful, None if failed.
        """
        logger.info(f"💾 Creating new interview for room: {room_id}")
        logger.info(f"🎬 Video URL: {video_url}")
        logger.info(f"🆔 Job ID: {job_id}")
        
        # Create a new interview with the video URL and return the interview ID
        return await self.create_interview_with_video(room_id, video_url, job_id)

    async def create_transcript(self, interview_id: str, content: str, speaker: str, 
                              timestamp: str, sequence_number: int) -> Optional[str]:
        """
        Create a single transcript entry for an interview.
        Returns transcript ID if successful, None if failed.
        
        Args:
            interview_id: The interview UUID
            content: The transcript content/message
            speaker: Either "AI", "CANDIDATE", or "SYSTEM"  
            timestamp: ISO format timestamp (e.g., "2025-10-31T23:59:00.000Z")
            sequence_number: Sequential order number for this transcript entry
        """
        try:
            mutation = """
            mutation CreateTranscript($input: CreateTranscriptInput!) {
                createTranscript(input: $input) {
                    id
                    content
                    speaker
                    timestamp
                    sequenceNumber
                }
            }
            """
            
            variables = {
                "input": {
                    "interviewId": interview_id,
                    "content": content,
                    "speaker": speaker,
                    "timestamp": timestamp,
                    "sequenceNumber": sequence_number
                }
            }
            
            logger.info(f"📝 Creating transcript entry {sequence_number} for interview {interview_id}")
            
            result = await self.execute_query(mutation, variables)
            if result and result.get("createTranscript"):
                transcript = result["createTranscript"]
                transcript_id = transcript['id']
                logger.info(f"✅ Created transcript {transcript_id} ({speaker}): {content[:50]}...")
                return transcript_id
            else:
                logger.error(f"❌ Failed to create transcript for interview {interview_id}")
                logger.error(f"Response: {result}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error creating transcript: {str(e)}")
            return None

    async def create_bulk_transcripts(self, interview_id: str, transcript_entries: list) -> bool:
        """
        Create multiple transcript entries in a single batch operation.
        Returns True if successful, False if failed.
        
        Args:
            interview_id: The interview UUID
            transcript_entries: List of dicts with keys: content, speaker, timestamp, sequence_number
                Example: [
                    {"content": "Hello", "speaker": "AI", "timestamp": "2025-10-31T23:59:00.000Z", "sequence_number": 1},
                    {"content": "Hi there", "speaker": "CANDIDATE", "timestamp": "2025-10-31T23:59:05.000Z", "sequence_number": 2}
                ]
        """
        try:
            mutation = """
            mutation CreateBulkTranscripts($inputs: [CreateTranscriptInput!]!) {
                createBulkTranscripts(inputs: $inputs) {
                    id
                    content
                    speaker
                    timestamp
                    sequenceNumber
                }
            }
            """
            
            # Prepare inputs with interview_id added to each entry
            inputs = []
            for entry in transcript_entries:
                inputs.append({
                    "interviewId": interview_id,
                    "content": entry["content"],
                    "speaker": entry["speaker"],
                    "timestamp": entry["timestamp"],
                    "sequenceNumber": entry["sequence_number"]
                })
            
            variables = {"inputs": inputs}
            
            logger.info(f"📝 Creating {len(inputs)} transcript entries for interview {interview_id}")
            
            result = await self.execute_query(mutation, variables)
            if result and result.get("createBulkTranscripts"):
                transcripts = result["createBulkTranscripts"]
                logger.info(f"✅ Created {len(transcripts)} transcript entries")
                return True
            else:
                logger.error(f"❌ Failed to create bulk transcripts for interview {interview_id}")
                logger.error(f"Response: {result}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error creating bulk transcripts: {str(e)}")
            return False

    async def get_application_details(self, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive application details including candidate info, job details, and CV analysis.
        
        Args:
            application_id: The application UUID
            
        Returns:
            Dict containing candidate, job, and CV analysis information, or None if failed
        """
        try:
            query = """
            query GetApplicationDetails($id: ID!) {
                application(id: $id) {
                    id
                    applicantName
                    applicantEmail
                    applicantPhone
                    applicantLinkedin
                    coverLetter
                    resumeUrl
                    expectedSalary
                    noticePeriod
                    cvAnalysisScore
                    cvScore
                    cvAnalysisResults
                    aiCvRecommendations
                    candidate {
                        id
                        name
                        email
                        phone
                    }
                    job {
                            id
                            title
                            description
                            responsibilities
                            requirements
                            benefits
                            department
                            location
                            salary
                            experience
                            education
                            skills
                            industry
                            companyDescription
                            interviewPrompt
                            interviewLanguage
                            company {
                                id
                                name
                                description
                            }
                        }
                }
            }
            """
            
            variables = {"id": application_id}
            
            logger.info(f"🔍 Fetching application details for: {application_id}")
            
            result = await self.execute_query(query, variables)
            if result and result.get("application"):
                application = result["application"]
                logger.info(f"✅ Retrieved application details for {application.get('applicantName', 'Unknown')}")
                logger.info(f"📋 Job: {application['job']['title']} at {application['job']['company']['name']}")
                return application
            else:
                logger.error(f"❌ No application found with ID: {application_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error fetching application details: {str(e)}")
            return None




# Utility function for use in other modules
async def save_video_url_to_graphql(room_name: str, job_id: str, video_url: str) -> bool:
    """Convenience function to save video URL to GraphQL"""
    async with GraphQLClient() as client:
        return await client.save_video_to_interview(room_name, job_id, video_url)