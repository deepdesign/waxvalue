#!/usr/bin/env python3
"""
Manual OAuth test script to verify Discogs credentials
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_discogs_oauth():
    """Test Discogs OAuth with manual approach"""
    
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    if not consumer_key or not consumer_secret:
        print("❌ Discogs credentials not found!")
        return
    
    print(f"✅ Found credentials:")
    print(f"   Consumer Key: {consumer_key}")
    print(f"   Consumer Secret: {consumer_secret[:10]}...")
    
    # Test basic API access first
    try:
        headers = {
            'User-Agent': 'WaxValue/1.0 +http://localhost:3000',
            'Authorization': f'Discogs key={consumer_key}, secret={consumer_secret}'
        }
        
        response = requests.get('https://api.discogs.com/database/search?q=nirvana', headers=headers)
        
        if response.status_code == 200:
            print("✅ Basic API access works!")
            data = response.json()
            print(f"   Found {data.get('pagination', {}).get('items', 0)} results")
        else:
            print(f"❌ API access failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
    
    # Test OAuth request token
    try:
        from discogs_client import DiscogsOAuth
        oauth = DiscogsOAuth(consumer_key, consumer_secret)
        
        # Try to get request token
        request_token, request_token_secret = oauth.get_request_token("http://localhost:3000")
        auth_url = oauth.get_authorize_url(request_token)
        
        print("✅ OAuth setup successful!")
        print(f"   Request Token: {request_token}")
        print(f"   Auth URL: {auth_url}")
        print("\n📋 Next steps:")
        print("1. Visit the auth URL above")
        print("2. Authorize the application")
        print("3. Copy the verification code from the redirect")
        print("4. Use it to complete the OAuth flow")
        
    except Exception as e:
        print(f"❌ OAuth setup failed: {e}")
        print("\n💡 Possible solutions:")
        print("1. Check if your Discogs app callback URL is set to: http://localhost:3000")
        print("2. Verify your Consumer Key and Secret are correct")
        print("3. Make sure your Discogs app is approved for OAuth")

if __name__ == "__main__":
    test_discogs_oauth()

