#!/bin/bash
# Test script to get Discogs OAuth URL

echo "🔗 Getting Discogs OAuth URL..."

# Make POST request to auth/setup endpoint
response=$(curl -s -X POST http://localhost:3000/api/backend/auth/setup \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Response: $response"

# Extract auth URL using jq (if available) or simple parsing
if command -v jq &> /dev/null; then
    auth_url=$(echo "$response" | jq -r '.authUrl')
    echo ""
    echo "✅ OAuth URL:"
    echo "$auth_url"
    echo ""
    echo "🌐 Open this URL in your regular browser to complete the OAuth flow:"
    echo "$auth_url"
else
    echo ""
    echo "📝 Install 'jq' for better JSON parsing, or manually extract the 'authUrl' from the response above"
fi

