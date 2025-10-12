#!/bin/bash
# VPS Status Check - Run this directly on VPS
# Upload and run: bash vps-check.sh

echo "📊 Waxvalue VPS Status Check"
echo "============================="
echo ""

echo "👤 User: $(whoami)"
echo "📁 Home: $HOME"
echo "🖥️  Hostname: $(hostname)"
echo ""

echo "📂 Home Directory Contents:"
ls -lah $HOME
echo ""

echo "🔧 Checking Dependencies..."
echo ""

# Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
    echo "   npm: $(npm --version)"
else
    echo "❌ Node.js: NOT INSTALLED"
fi

# Python
if command -v python3 &> /dev/null; then
    echo "✅ Python: $(python3 --version)"
    pip3 --version 2>&1 | head -1
else
    echo "❌ Python: NOT INSTALLED"
fi

# Nginx
if command -v nginx &> /dev/null; then
    echo "✅ Nginx: $(nginx -v 2>&1)"
    sudo systemctl is-active nginx &>/dev/null && echo "   Status: RUNNING ✅" || echo "   Status: STOPPED ⚠️"
else
    echo "❌ Nginx: NOT INSTALLED"
fi

# PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2: $(pm2 --version)"
    echo ""
    echo "📊 PM2 Processes:"
    pm2 list
else
    echo "❌ PM2: NOT INSTALLED"
fi

# Certbot
if command -v certbot &> /dev/null; then
    echo "✅ Certbot: installed"
else
    echo "❌ Certbot: NOT INSTALLED"
fi

echo ""
echo "💾 Disk Space:"
df -h $HOME

echo ""
echo "🔍 Checking for old Waxvalue installation..."
if [ -d "$HOME/waxvalue" ]; then
    echo "⚠️  FOUND: $HOME/waxvalue"
    echo "   Size: $(du -sh $HOME/waxvalue 2>/dev/null | cut -f1)"
    echo "   Files:"
    ls -lah $HOME/waxvalue | head -15
else
    echo "✅ No existing waxvalue directory"
fi

echo ""
echo "🌐 Nginx Configurations:"
if [ -f /etc/nginx/sites-enabled/waxvalue ]; then
    echo "⚠️  Found existing config: /etc/nginx/sites-enabled/waxvalue"
else
    echo "✅ No existing waxvalue Nginx config"
fi

echo ""
echo "============================="
echo "Check Complete!"
echo ""

if [ -d "$HOME/waxvalue" ] || [ -f /etc/nginx/sites-enabled/waxvalue ]; then
    echo "⚠️  ACTION REQUIRED:"
    echo "   Old installation found. Run clean script to prepare for deployment."
else
    echo "✅ VPS is clean and ready for deployment!"
fi
echo ""

