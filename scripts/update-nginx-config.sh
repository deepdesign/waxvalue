#!/bin/bash
# Script to update nginx configuration from repository
# This removes HTTP Basic Authentication password protection

set -e

echo "🔧 Updating nginx configuration..."

# Get the project directory (assuming script is run from project root or ~/waxvalue)
if [ -f "nginx-waxvalue-fixed.conf" ]; then
    PROJECT_DIR=$(pwd)
elif [ -f "$HOME/waxvalue/nginx-waxvalue-fixed.conf" ]; then
    PROJECT_DIR="$HOME/waxvalue"
    cd $PROJECT_DIR
else
    echo "❌ Error: nginx-waxvalue-fixed.conf not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Backup current nginx config
echo "📦 Backing up current nginx configuration..."
sudo cp /etc/nginx/sites-available/waxvalue /etc/nginx/sites-available/waxvalue.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Copy updated config
echo "📝 Copying updated nginx configuration..."
sudo cp $PROJECT_DIR/nginx-waxvalue-fixed.conf /etc/nginx/sites-available/waxvalue

# Test configuration
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Configuration test passed"
else
    echo "❌ Configuration test failed! Restoring backup..."
    sudo cp /etc/nginx/sites-available/waxvalue.backup.* /etc/nginx/sites-available/waxvalue 2>/dev/null || true
    exit 1
fi

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Nginx configuration updated successfully!"
echo "🌐 The site is now publicly accessible without password protection"
echo ""
echo "Note: HTTP Basic Authentication has been disabled."
echo "Your application-level authentication (login forms) still works."

