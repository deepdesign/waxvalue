#!/usr/bin/env python3
"""
Test script to debug Discogs OAuth flow
"""

import os
import sys
from dotenv import load_dotenv
from discogs_client import DiscogsOAuth, DiscogsClient

# Load environment variables
load_dotenv()

def test_oauth_flow():
    """Test the complete OAuth flow"""
    
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    if not consumer_key or not consumer_secret:
        print("❌ Error: Discogs API credentials not configured")
        print("Make sure DISCOGS_CONSUMER_KEY and DISCOGS_CONSUMER_SECRET are set in .env file")
        return False
    
    print(f"[OK] Using Consumer Key: {consumer_key}")
    print(f"[OK] Using Consumer Secret: {consumer_secret[:10]}...")
    
    try:
        # Step 1: Get request token
        print("\n[STEP 1] Getting request token...")
        oauth = DiscogsOAuth(consumer_key, consumer_secret)
        request_token, request_token_secret = oauth.get_request_token("http://localhost:3000/auth/callback")
        
        print(f"[OK] Request token: {request_token}")
        print(f"[OK] Request token secret: {request_token_secret}")
        
        # Step 2: Generate authorization URL
        print("\n[STEP 2] Generating authorization URL...")
        auth_url = oauth.get_authorize_url(request_token)
        print(f"[OK] Authorization URL: {auth_url}")
        
        print("\n[MANUAL TEST INSTRUCTIONS]")
        print("1. Copy the authorization URL above")
        print("2. Paste it in your browser")
        print("3. Authorize the application on Discogs")
        print("4. Copy the oauth_verifier from the callback URL")
        print("5. Run this script again with the verifier as an argument")
        print("   python test_oauth.py <oauth_verifier>")
        
        # If verifier is provided as argument, test the access token exchange
        if len(sys.argv) > 1:
            verifier = sys.argv[1]
            print(f"\n[STEP 3] Exchanging for access token with verifier: {verifier}")
            
            access_token, access_token_secret = oauth.get_access_token(
                request_token, request_token_secret, verifier
            )
            
            print(f"[OK] Access token: {access_token}")
            print(f"[OK] Access token secret: {access_token_secret}")
            
            # Step 4: Test API access
            print("\n[STEP 4] Testing API access...")
            client = DiscogsClient(consumer_key, consumer_secret, access_token, access_token_secret)
            user_info = client.get_user_info()
            
            print(f"[OK] User info: {user_info}")
            print("\n[SUCCESS] OAuth flow completed successfully!")
            return True
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_oauth_flow()
