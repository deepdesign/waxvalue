"""
Security utilities for WaxValue backend
"""

import bcrypt
import secrets
import string
import re
import jwt
from datetime import datetime, timedelta
from typing import Tuple, Dict, Any
import os
import logging

logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        logger.error(f"Password verification failed: {e}")
        return False

def generate_secure_token(length: int = 32) -> str:
    """Generate secure random token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def validate_password_strength(password: str) -> Tuple[bool, str]:
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    # Check for common passwords
    common_passwords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ]
    
    if password.lower() in common_passwords:
        return False, "Password is too common. Please choose a more unique password."
    
    return True, "Password is strong"

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def create_jwt_token(user_id: int, expires_hours: int = 24) -> str:
    """Create JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=expires_hours),
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    secret = os.getenv('JWT_SECRET')
    if not secret:
        raise ValueError("JWT_SECRET environment variable not set")
    
    return jwt.encode(payload, secret, algorithm='HS256')

def create_refresh_token(user_id: int) -> str:
    """Create refresh token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30),
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    secret = os.getenv('JWT_SECRET')
    if not secret:
        raise ValueError("JWT_SECRET environment variable not set")
    
    return jwt.encode(payload, secret, algorithm='HS256')

def verify_jwt_token(token: str) -> Dict[str, Any]:
    """Verify JWT token"""
    try:
        secret = os.getenv('JWT_SECRET')
        if not secret:
            raise ValueError("JWT_SECRET environment variable not set")
        
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {e}")

def sanitize_input(input_string: str) -> str:
    """Sanitize user input"""
    if not isinstance(input_string, str):
        return str(input_string)
    
    # Remove null bytes
    input_string = input_string.replace('\x00', '')
    
    # Limit length
    if len(input_string) > 1000:
        input_string = input_string[:1000]
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '`', '$']
    for char in dangerous_chars:
        input_string = input_string.replace(char, '')
    
    return input_string.strip()

def log_security_event(event_type: str, user_id: int = None, ip_address: str = None, details: str = ""):
    """Log security events"""
    security_logger = logging.getLogger('security')
    timestamp = datetime.now().isoformat()
    
    log_message = f"SECURITY_EVENT: {event_type} | User: {user_id} | IP: {ip_address} | Details: {details} | Time: {timestamp}"
    security_logger.warning(log_message)

def check_rate_limit(user_id: int, endpoint: str, max_requests: int = 100, window_minutes: int = 15) -> bool:
    """Check if user has exceeded rate limit"""
    # This is a simplified implementation
    # In production, use Redis or a proper rate limiting service
    import time
    current_time = int(time.time())
    window_start = current_time - (window_minutes * 60)
    
    # For now, just return True (no rate limiting)
    # TODO: Implement proper rate limiting with Redis
    return True

def generate_api_key() -> str:
    """Generate secure API key"""
    return secrets.token_urlsafe(32)

def validate_api_key(api_key: str) -> bool:
    """Validate API key format"""
    if not api_key or len(api_key) < 32:
        return False
    
    # Check if it's a valid base64 URL-safe string
    try:
        import base64
        base64.urlsafe_b64decode(api_key + '==')  # Add padding if needed
        return True
    except Exception:
        return False

def hash_sensitive_data(data: str) -> str:
    """Hash sensitive data for logging"""
    import hashlib
    return hashlib.sha256(data.encode()).hexdigest()[:8]

def mask_email(email: str) -> str:
    """Mask email for logging"""
    if '@' not in email:
        return email
    
    local, domain = email.split('@', 1)
    if len(local) <= 2:
        return f"{'*' * len(local)}@{domain}"
    
    return f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}@{domain}"

def mask_discogs_token(token: str) -> str:
    """Mask Discogs token for logging"""
    if len(token) <= 8:
        return '***'
    
    return f"{token[:4]}...{token[-4:]}"
