#!/usr/bin/env python3
"""
Direct test of Discogs OAuth to debug the issue
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_discogs_oauth():
    """Test Discogs OAuth directly"""
    
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    print(f"Consumer Key: {consumer_key}")
    print(f"Consumer Secret: {consumer_secret[:10]}...")
    
    if not consumer_key or not consumer_secret:
        print("[ERROR] No credentials found!")
        return
    
    try:
        # Import our OAuth class
        from discogs_client import DiscogsOAuth
        
        print("[OK] Creating OAuth instance...")
        oauth = DiscogsOAuth(consumer_key, consumer_secret)
        
        print("[OK] Getting request token...")
        callback_url = "http://localhost:3000/auth/callback"
        request_token, request_token_secret = oauth.get_request_token(callback_url)
        
        print(f"[OK] Request token: {request_token}")
        print(f"[OK] Request token secret: {request_token_secret[:10]}...")
        
        print("[OK] Getting authorization URL...")
        auth_url = oauth.get_authorize_url(request_token)
        
        print(f"[OK] Authorization URL: {auth_url}")
        
        print("\n[SUCCESS] Use this URL in your browser:")
        print(auth_url)
        
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_discogs_oauth()
