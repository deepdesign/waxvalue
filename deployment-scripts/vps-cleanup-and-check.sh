#!/bin/bash
# VPS Cleanup and Verification Script
# Run this on your VPS: ssh -p 65002 u728332901@195.35.15.194

echo "🔍 Waxvalue VPS - Cleanup and Verification"
echo "=========================================="
echo ""

# Check current user
echo "👤 Current user: $(whoami)"
echo "📁 Home directory: $HOME"
echo "🖥️  Hostname: $(hostname)"
echo ""

# Check what's currently in the home directory
echo "📂 Current files in home directory:"
ls -lah $HOME
echo ""

# Check if old waxvalue installation exists
if [ -d "$HOME/waxvalue" ]; then
    echo "⚠️  Found existing waxvalue directory"
    echo "   Location: $HOME/waxvalue"
    
    # Check if services are running
    if command -v pm2 &> /dev/null; then
        echo ""
        echo "📊 PM2 services:"
        pm2 list
    fi
    
    echo ""
    echo "🧹 Cleanup Options:"
    echo "   1. Backup and remove: mv $HOME/waxvalue $HOME/waxvalue.old.$(date +%Y%m%d)"
    echo "   2. Complete removal: rm -rf $HOME/waxvalue"
    echo ""
    read -p "Clean up old installation? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v pm2 &> /dev/null; then
            echo "Stopping PM2 services..."
            pm2 delete all 2>/dev/null || true
        fi
        echo "Backing up old installation..."
        mv $HOME/waxvalue $HOME/waxvalue.old.$(date +%Y%m%d)
        echo "✅ Old installation backed up"
    fi
else
    echo "✅ No existing waxvalue installation found"
fi

echo ""
echo "🔧 Checking installed dependencies..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
    echo "   npm: $(npm --version)"
else
    echo "❌ Node.js: Not installed"
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python: $(python3 --version)"
    echo "   pip: $(pip3 --version 2>&1 | head -n1)"
else
    echo "❌ Python: Not installed"
fi

# Check Nginx
if command -v nginx &> /dev/null; then
    echo "✅ Nginx: $(nginx -v 2>&1)"
    echo "   Status: $(systemctl is-active nginx 2>/dev/null || echo 'not running')"
else
    echo "❌ Nginx: Not installed"
fi

# Check PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2: $(pm2 --version)"
else
    echo "❌ PM2: Not installed"
fi

# Check Certbot
if command -v certbot &> /dev/null; then
    echo "✅ Certbot: $(certbot --version 2>&1 | head -n1)"
else
    echo "❌ Certbot: Not installed"
fi

echo ""
echo "💾 Checking MySQL database..."
if command -v mysql &> /dev/null; then
    echo "✅ MySQL client installed"
    # Don't test connection here as it might fail
    echo "   Database: u728332901_"
    echo "   User: u728332901_"
else
    echo "⚠️  MySQL client not found (database might still be available)"
fi

echo ""
echo "🌐 Checking current web server config..."
if [ -f /etc/nginx/sites-enabled/waxvalue ]; then
    echo "⚠️  Found existing Nginx config for waxvalue"
    echo "   Location: /etc/nginx/sites-enabled/waxvalue"
else
    echo "✅ No existing Nginx config for waxvalue"
fi

echo ""
echo "📊 Disk Usage:"
df -h $HOME
echo ""

echo "🔍 Open Ports:"
sudo netstat -tuln | grep -E ':(80|443|3000|8000|65002)\s' || echo "No web server ports open yet"
echo ""

echo "=========================================="
echo "VPS Status Check Complete"
echo ""
echo "📋 Summary:"
echo "   Home: $HOME"
echo "   Space available: $(df -h $HOME | awk 'NR==2 {print $4}')"
echo ""
echo "Next: Upload your project files and run deploy-final.sh"
echo "=========================================="

