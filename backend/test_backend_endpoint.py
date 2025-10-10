#!/usr/bin/env python3
"""
Test the backend auth/setup endpoint directly
"""

import requests
import json

def test_backend_endpoint():
    """Test the backend auth/setup endpoint"""
    
    url = "http://localhost:8000/auth/setup"
    
    print(f"Testing endpoint: {url}")
    
    try:
        response = requests.post(url, json={})
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response JSON: {json.dumps(data, indent=2)}")
                
                # Check if required fields are present
                required_fields = ['authUrl', 'requestToken', 'requestTokenSecret']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    print(f"ERROR: Missing required fields: {missing_fields}")
                    return False
                else:
                    print("SUCCESS: All required fields present")
                    return True
                    
            except json.JSONDecodeError as e:
                print(f"ERROR: Invalid JSON response: {e}")
                return False
        else:
            print(f"ERROR: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("ERROR: Cannot connect to backend server")
        print("Make sure the backend is running on port 8000")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    test_backend_endpoint()
