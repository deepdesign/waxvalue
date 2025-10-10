#!/usr/bin/env python3
"""
Simple OAuth test to verify the complete flow
"""

import os
import requests
import requests_oauthlib
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv()

def test_complete_oauth_flow():
    """Test the complete OAuth flow step by step"""
    
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    callback_url = "http://localhost:3000/auth/callback"
    
    print(f"Consumer Key: {consumer_key}")
    print(f"Callback URL: {callback_url}")
    
    # Step 1: Get request token
    print("\n=== STEP 1: Getting Request Token ===")
    
    oauth = requests_oauthlib.OAuth1Session(
        consumer_key,
        client_secret=consumer_secret,
        callback_uri=callback_url
    )
    
    oauth.headers.update({
        'User-Agent': 'WaxValue/1.0 +https://waxvalue.com'
    })
    
    try:
        response = oauth.fetch_request_token("https://api.discogs.com/oauth/request_token")
        request_token = response['oauth_token']
        request_token_secret = response['oauth_token_secret']
        
        print(f"SUCCESS: Request token obtained")
        print(f"Token: {request_token}")
        print(f"Secret: {request_token_secret}")
        
    except Exception as e:
        print(f"ERROR: Failed to get request token: {e}")
        return False
    
    # Step 2: Generate authorization URL
    print("\n=== STEP 2: Generating Authorization URL ===")
    
    auth_url = f"https://www.discogs.com/oauth/authorize?oauth_token={request_token}"
    print(f"Authorization URL: {auth_url}")
    
    print("\n=== MANUAL TEST ===")
    print("1. Copy the URL above and paste it in your browser")
    print("2. Authorize the application")
    print("3. You should be redirected to: http://localhost:3000/auth/callback?oauth_token=...&oauth_verifier=...")
    print("4. If you get an error, the callback URL in your Discogs app is wrong")
    
    return True

if __name__ == "__main__":
    test_complete_oauth_flow()
