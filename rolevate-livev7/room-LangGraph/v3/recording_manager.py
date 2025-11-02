# recording_manager.py
"""
Recording Manager for LiveKit Voice Agent

This module handles video recording functionality using LiveKit's native Egress API
to automatically save recordings to AWS S3.
"""

import os
import asyncio
import aiohttp
import logging
from typing import Optional, Dict, Any
from livekit import api
import boto3
from botocore.exceptions import ClientError
from graphql_client import GraphQLClient
from dotenv import load_dotenv

load_dotenv(".env.local")
logger = logging.getLogger(__name__)


class RecordingManager:
    """
    LiveKit Recording Manager using native Egress API
    
    Best practices implementation:
    - No global API client initialization 
    - Async-safe API client creation
    - Direct S3 upload via LiveKit
    - Organized S3 folder structure
    """
    
    def __init__(self, job_context=None):
        """Initialize recording manager with job context"""
        self.job_context = job_context
        
        # AWS Configuration
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.aws_region = os.getenv("AWS_REGION", "me-central-1")
        self.bucket_name = os.getenv("AWS_BUCKET_NAME", "4wk-garage-media")
        
        # LiveKit Configuration
        self.livekit_url = os.getenv("LIVEKIT_URL")
        self.livekit_api_key = os.getenv("LIVEKIT_API_KEY")
        self.livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")
        
        # Validate configuration
        self._validate_config()
        
        # Track recording state
        self.recording_id = None
        self.recording_url = None
        
        logger.info("✅ Recording Manager initialized")
    
    async def _create_livekit_api(self):
        """Create a new LiveKit API client for single use"""
        return api.LiveKitAPI(
            url=self.livekit_url,
            api_key=self.livekit_api_key,
            api_secret=self.livekit_api_secret
        )
    
    async def cleanup(self):
        """Clean up resources (no persistent API client to clean up)"""
        try:
            # Reset recording state
            self.recording_id = None
            self.recording_url = None
            logger.info("✅ Recording manager cleaned up")
        except Exception as e:
            logger.warning(f"⚠️ Cleanup warning: {e}")
    
    def _validate_config(self):
        """Validate required configuration"""
        required_vars = [
            "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", 
            "LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"
        ]
        
        missing = [var for var in required_vars if not os.getenv(var)]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    async def start_recording(self, room_name: str = None, session_id: str = None) -> Optional[str]:
        """
        Start room composite recording using LiveKit Egress
        
        Returns:
            Recording URL if successful, None if failed
        """
        try:
            # Use job context if available
            if self.job_context and not room_name:
                room_name = self.job_context.room.name
            
            if not room_name:
                logger.error("❌ No room name provided for recording")
                return None
            
            # Generate session ID if not provided
            if not session_id:
                session_id = f"session_{room_name}_{self.job_context.job.id if self.job_context else 'manual'}"
            
            # Generate S3 path with timestamp
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            s3_filepath = f"interviews/{session_id}/{timestamp}/recording.mp4"
            
            # Configure recording request with basic parameters
            recording_request = api.RoomCompositeEgressRequest(
                room_name=room_name,
                layout="speaker-dark",  # Professional layout for interviews
                file_outputs=[
                    api.EncodedFileOutput(
                        file_type=api.EncodedFileType.MP4,
                        filepath=s3_filepath,
                        s3=api.S3Upload(
                            access_key=self.aws_access_key,
                            secret=self.aws_secret_key,
                            region=self.aws_region,
                            bucket=self.bucket_name
                        )
                    )
                ]
                # Removed encoding options for now to ensure compatibility
            )
            
            # Create API client and ensure proper cleanup
            livekit_api = await self._create_livekit_api()
            
            try:
                # Start recording using the correct API method
                egress = await livekit_api.egress.start_room_composite_egress(recording_request)
                logger.info(f"✅ Recording egress started: {egress.egress_id}")
            finally:
                # Ensure session cleanup
                if hasattr(livekit_api, '_session') and livekit_api._session:
                    await livekit_api._session.close()
                elif hasattr(livekit_api, 'session') and livekit_api.session:
                    await livekit_api.session.close()
            
            self.recording_id = egress.egress_id
            self.recording_url = f"https://{self.bucket_name}.s3.{self.aws_region}.amazonaws.com/{s3_filepath}"
            
            logger.info(f"🎥 Recording started successfully")
            logger.info(f"   Room: {room_name}")
            logger.info(f"   Session: {session_id}")
            logger.info(f"   Recording ID: {self.recording_id}")
            logger.info(f"   S3 Path: s3://{self.bucket_name}/{s3_filepath}")
            
            return self.recording_url
            
        except Exception as e:
            logger.error(f"❌ Failed to start recording: {e}")
            return None
    
    async def stop_recording(self) -> bool:
        """
        Stop the current recording
        
        Returns:
            True if successful, False if failed
        """
        if not self.recording_id:
            logger.warning("⚠️ No active recording to stop")
            return False
        
        try:
            # Create API client for this operation
            livekit_api = await self._create_livekit_api()
            
            try:
                # Stop recording
                await livekit_api.egress.stop_egress(api.StopEgressRequest(
                    egress_id=self.recording_id
                ))
                
                logger.info(f"🛑 Recording stopped successfully: {self.recording_id}")
                return True
            finally:
                # Ensure session cleanup
                if hasattr(livekit_api, '_session') and livekit_api._session:
                    await livekit_api._session.close()
                elif hasattr(livekit_api, 'session') and livekit_api.session:
                    await livekit_api.session.close()
            
        except Exception as e:
            logger.error(f"❌ Failed to stop recording: {e}")
            return False
    
    def setup_transcript_saving(self, session, recording_url: str):
        """Setup transcript saving for the recording (placeholder for future enhancement)"""
        logger.info(f"📝 Transcript saving setup for recording: {recording_url}")
        # This can be enhanced to save transcripts alongside recordings
        pass
    
    async def save_video_to_backend(self, room_name: str, job_id: str, video_url: str = None) -> Optional[str]:
        """
        Agent12-compatible method to save video URL to backend.
        Uses GraphQL instead of REST API for better integration.
        Returns the interview ID if successful, None if failed.
        """
        try:
            # Use provided video URL or generate fallback
            if video_url:
                video_url_to_save = video_url
            else:
                # Fallback URL generation for backward compatibility
                bucket_name = os.getenv('AWS_BUCKET_NAME', '4wk-garage-media')
                region = os.getenv('AWS_REGION', 'me-central-1')
                video_url_to_save = f"https://{bucket_name}.s3.{region}.amazonaws.com/recordings/{room_name}_{job_id}.mp4"
            
            logger.info(f"💾 Saving video URL to GraphQL interview: {room_name}")
            logger.info(f"🎬 Video URL: {video_url_to_save}")
            
            # Use GraphQL client to save video URL and get interview ID
            async with GraphQLClient() as client:
                interview_id = await client.save_video_url_to_interview(room_name, video_url_to_save, job_id)
                
                if interview_id:
                    logger.info(f"✅ Video URL saved to interview {interview_id} via GraphQL")
                    return interview_id
                else:
                    logger.error("❌ Failed to save video URL to interview via GraphQL")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error in save_video_to_backend: {str(e)}")
            return None

    async def complete_interview(self, interview_id: str) -> bool:
        """
        Mark interview as completed when session ends.
        Returns True if successful, False if failed.
        """
        try:
            async with GraphQLClient() as client:
                return await client.complete_interview(interview_id)
        except Exception as e:
            logger.error(f"❌ Error completing interview: {e}")
            return False

    async def save_transcript_entry(self, interview_id: str, content: str, speaker: str, 
                                  sequence_number: int) -> Optional[str]:
        """
        Save a single transcript entry with proper speaker identification and sequencing.
        
        Args:
            interview_id: The interview UUID from GraphQL
            content: The message content
            speaker: "AI", "CANDIDATE", or "SYSTEM"
            sequence_number: Sequential order number
            
        Returns:
            Transcript ID if successful, None if failed
        """
        try:
            from datetime import datetime
            timestamp = datetime.now().isoformat() + "Z"  # ISO format with Z suffix
            
            async with GraphQLClient() as client:
                transcript_id = await client.create_transcript(
                    interview_id, content, speaker, timestamp, sequence_number
                )
                
                if transcript_id:
                    logger.info(f"✅ Transcript entry saved: {transcript_id}")
                    return transcript_id
                else:
                    logger.error(f"❌ Failed to save transcript entry")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error saving transcript entry: {str(e)}")
            return None
