#!/usr/bin/env python3
"""
WaxValue Discogs Setup Script

This script helps you configure the Discogs API integration for WaxValue.
It will guide you through getting your API credentials and setting up the environment.
"""

import os
import sys
import webbrowser
from pathlib import Path

def main():
    print("WaxValue Discogs Setup")
    print("=" * 50)
    print()
    
    print("This script will help you set up the Discogs API integration.")
    print("You'll need to create a Discogs API application first.")
    print()
    
    # Check if we're in the right directory
    if not Path("backend").exists():
        print("ERROR: Please run this script from the WaxValue project root directory.")
        sys.exit(1)
    
    print("Step 1: Create Discogs API Application")
    print("-" * 40)
    print()
    print("1. Go to: https://www.discogs.com/settings/developers")
    print("2. Click 'Generate new token' or 'Create new application'")
    print("3. Fill out the application form:")
    print("   - Application Name: WaxValue")
    print("   - Description: Automated pricing suggestions for Discogs inventory")
    print("   - Website URL: http://localhost:3000")
    print("   - Redirect URI: http://localhost:3000")
    print()
    
    # Ask if user wants to open the page
    open_page = input("Would you like me to open the Discogs developers page? (y/n): ").lower().strip()
    if open_page in ['y', 'yes']:
        webbrowser.open("https://www.discogs.com/settings/developers")
        print("Opened Discogs developers page in your browser")
    
    print()
    print("Step 2: Get Your API Credentials")
    print("-" * 40)
    print()
    print("After creating your application, you'll get:")
    print("- Consumer Key (OAuth Consumer Key)")
    print("- Consumer Secret (OAuth Consumer Secret)")
    print()
    
    # Get credentials from user
    consumer_key = input("Enter your Discogs Consumer Key: ").strip()
    consumer_secret = input("Enter your Discogs Consumer Secret: ").strip()
    
    if not consumer_key or not consumer_secret:
        print("ERROR: Both Consumer Key and Consumer Secret are required.")
        sys.exit(1)
    
    print()
    print("Step 3: Configure Environment Variables")
    print("-" * 40)
    print()
    
    # Create .env file for backend
    env_content = f"""# WaxValue Backend Environment Variables
DISCOGS_CONSUMER_KEY={consumer_key}
DISCOGS_CONSUMER_SECRET={consumer_secret}
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_OAUTH_URL=https://www.discogs.com/oauth
DATABASE_URL=sqlite:///./waxvalue.db
SECRET_KEY=waxvalue-secret-key-{os.urandom(16).hex()}
"""
    
    env_file = Path("backend/.env")
    try:
        with open(env_file, "w") as f:
            f.write(env_content)
        print(f"Created {env_file}")
    except Exception as e:
        print(f"ERROR creating .env file: {e}")
        print("Please create backend/.env manually with the following content:")
        print()
        print(env_content)
        return
    
    # Create .env.local for frontend
    frontend_env_content = f"""# WaxValue Frontend Environment Variables
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
"""
    
    env_local_file = Path(".env.local")
    try:
        with open(env_local_file, "w") as f:
            f.write(frontend_env_content)
        print(f"Created {env_local_file}")
    except Exception as e:
        print(f"ERROR creating .env.local file: {e}")
        print("Please create .env.local manually with the following content:")
        print()
        print(frontend_env_content)
    
    print()
    print("Step 4: Update Development Backend")
    print("-" * 40)
    print()
    
    # Update main-dev.py to use real OAuth
    update_dev_backend()
    
    print()
    print("Setup Complete!")
    print("=" * 50)
    print()
    print("Discogs API credentials configured")
    print("Environment variables set up")
    print("Development backend updated for real OAuth")
    print()
    print("Next steps:")
    print("1. Restart your development servers:")
    print("   - Stop the current servers (Ctrl+C)")
    print("   - Run: scripts/start-dev.bat (or start-dev.ps1)")
    print()
    print("2. Test the connection:")
    print("   - Go to http://localhost:3000/dashboard")
    print("   - Click 'Connect to Discogs'")
    print("   - You should be redirected to the real Discogs OAuth page")
    print()
    print("3. After authorizing, you'll be redirected back to WaxValue")
    print("   - Your Discogs account will be connected")
    print("   - You can start testing with your real inventory!")
    print()

def update_dev_backend():
    """Update the development backend to use real OAuth instead of mock"""
    main_dev_path = Path("backend/main-dev.py")
    
    if not main_dev_path.exists():
        print("ERROR: backend/main-dev.py not found")
        return
    
    try:
        with open(main_dev_path, "r") as f:
            content = content.read()
        
        # Check if already updated
        if "DISCOGS_CONSUMER_KEY" in content:
            print("Development backend already configured for real OAuth")
            return
        
        # Update the auth/setup endpoint
        old_auth_setup = '''@app.post("/auth/setup")
async def setup_auth(credentials: dict = None):
    # Mock OAuth setup - always returns same mock data for development
    # In production, this would generate real OAuth URLs with proper tokens
    return {
        "authUrl": "https://www.discogs.com/oauth/authorize?oauth_token=mock_token&oauth_callback=http://localhost:3000",
        "requestToken": "mock_request_token"
    }'''
        
        new_auth_setup = '''@app.post("/auth/setup")
async def setup_auth(credentials: dict = None):
    # Real OAuth setup for development
    import os
    from discogs_client import DiscogsOAuth
    
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    if not consumer_key or not consumer_secret:
        raise HTTPException(status_code=500, detail="Discogs API credentials not configured")
    
    oauth = DiscogsOAuth(consumer_key, consumer_secret)
    
    try:
        # Get request token
        request_token = oauth.get_request_token("http://localhost:3000")
        
        # Generate authorization URL
        auth_url = oauth.get_authorization_url(request_token)
        
        return {
            "authUrl": auth_url,
            "requestToken": request_token["oauth_token"]
        }
    except Exception as e:
        logger.error(f"OAuth setup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to setup OAuth")'''
        
        content = content.replace(old_auth_setup, new_auth_setup)
        
        # Update the verify endpoint
        old_verify = '''@app.post("/auth/verify")
async def verify_auth(verification: dict):
    # Mock verification - reconnect the user
    if 1 in mock_data["users"]:
        mock_data["users"][1].discogsUserId = 12345
        mock_data["users"][1].username = "demouser"
    
    return {
        "user": mock_data["users"][1],
        "message": "Account connected successfully"
    }'''
        
        new_verify = '''@app.post("/auth/verify")
async def verify_auth(verification: dict):
    # Real OAuth verification for development
    import os
    from discogs_client import DiscogsOAuth, DiscogsClient
    
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    if not consumer_key or not consumer_secret:
        raise HTTPException(status_code=500, detail="Discogs API credentials not configured")
    
    request_token = verification.get("requestToken")
    verifier_code = verification.get("verifierCode")
    
    if not request_token or not verifier_code:
        raise HTTPException(status_code=400, detail="Missing request token or verifier code")
    
    try:
        oauth = DiscogsOAuth(consumer_key, consumer_secret)
        access_token = oauth.get_access_token(request_token, verifier_code)
        
        # Create authenticated client to get user info
        client = DiscogsClient(consumer_key, consumer_secret, 
                              access_token["oauth_token"], access_token["oauth_token_secret"])
        user_info = client.get_user_info()
        
        # Update mock user with real data
        if 1 in mock_data["users"]:
            mock_data["users"][1].discogsUserId = user_info["id"]
            mock_data["users"][1].username = user_info["username"]
        
        return {
            "user": mock_data["users"][1],
            "message": "Account connected successfully"
        }
    except Exception as e:
        logger.error(f"OAuth verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify OAuth")'''
        
        content = content.replace(old_verify, new_verify)
        
        # Add imports at the top
        if "from discogs_client import" not in content:
            import_section = '''import os
from discogs_client import DiscogsOAuth, DiscogsClient
import logging

logger = logging.getLogger(__name__)'''
            
            # Find the first import and add after it
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('from ') or line.startswith('import '):
                    lines.insert(i + 1, import_section)
                    break
            content = '\n'.join(lines)
        
        with open(main_dev_path, "w") as f:
            f.write(content)
        
        print("Updated development backend for real Discogs OAuth")
        
    except Exception as e:
        print(f"ERROR updating development backend: {e}")
        print("Please manually update backend/main-dev.py to use real OAuth")

if __name__ == "__main__":
    main()
