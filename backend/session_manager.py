import json
import os
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class SessionManager:
    def __init__(self, sessions_file: str = None):
        # Use absolute path - default to backend directory
        if sessions_file is None:
            # Get the directory where this file is located (backend/)
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            sessions_file = os.path.join(backend_dir, "sessions.json")
        elif not os.path.isabs(sessions_file):
            # If relative path provided, make it relative to backend directory
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            sessions_file = os.path.join(backend_dir, sessions_file)
        
        self.sessions_file = sessions_file
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.load_sessions()
    
    def load_sessions(self):
        """Load sessions from file"""
        try:
            if os.path.exists(self.sessions_file):
                with open(self.sessions_file, 'r') as f:
                    self.sessions = json.load(f)
                logger.info(f"Loaded {len(self.sessions)} sessions from {self.sessions_file}")
            else:
                logger.info(f"No sessions file found at {self.sessions_file}, starting with empty sessions")
                # Ensure directory exists
                os.makedirs(os.path.dirname(self.sessions_file), exist_ok=True)
                self.sessions = {}
        except Exception as e:
            logger.error(f"Error loading sessions from {self.sessions_file}: {e}")
            self.sessions = {}
    
    def save_sessions(self):
        """Save sessions to file"""
        try:
            with open(self.sessions_file, 'w') as f:
                json.dump(self.sessions, f, indent=2)
            logger.debug(f"Saved {len(self.sessions)} sessions to {self.sessions_file}")
        except Exception as e:
            logger.error(f"Error saving sessions: {e}")
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        return self.sessions.get(session_id)
    
    def set_session(self, session_id: str, session_data: Dict[str, Any]):
        """Set session data and save to file"""
        self.sessions[session_id] = session_data
        self.save_sessions()
        logger.debug(f"Updated session {session_id[:10]}...")
    
    def delete_session(self, session_id: str):
        """Delete session and save to file"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            self.save_sessions()
            logger.debug(f"Deleted session {session_id[:10]}...")
    
    def update_session_data(self, session_id: str, key: str, value: Any):
        """Update specific data in session and save to file"""
        if session_id in self.sessions:
            self.sessions[session_id][key] = value
            self.save_sessions()
            logger.debug(f"Updated session {session_id[:10]}... key: {key}")
    
    def has_session(self, session_id: str) -> bool:
        """Check if session exists"""
        return session_id in self.sessions

# Global session manager instance
session_manager = SessionManager()
