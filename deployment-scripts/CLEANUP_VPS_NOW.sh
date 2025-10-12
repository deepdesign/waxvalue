#!/bin/bash
# Waxvalue VPS Cleanup Script
# Run this on your VPS to prepare for fresh deployment

set -e

echo "🧹 Waxvalue VPS Cleanup & Preparation"
echo "======================================"
echo ""
echo "User: $(whoami)"
echo "Home: $HOME"
echo ""

# Step 1: Stop all PM2 processes
echo "Step 1: Stopping PM2 processes..."
if command -v pm2 &> /dev/null; then
    pm2 delete all 2>/dev/null || echo "  No PM2 processes running"
    echo "  ✅ PM2 processes stopped"
else
    echo "  ℹ️  PM2 not installed (will install during deployment)"
fi
echo ""

# Step 2: Remove old waxvalue installation
echo "Step 2: Removing old waxvalue installation..."
if [ -d "$HOME/waxvalue" ]; then
    echo "  Removing: $HOME/waxvalue"
    rm -rf $HOME/waxvalue
    echo "  ✅ Old installation removed"
else
    echo "  ✅ No old installation found"
fi
echo ""

# Step 3: Remove old Nginx config
echo "Step 3: Removing old Nginx configuration..."
if [ -f /etc/nginx/sites-enabled/waxvalue ]; then
    sudo rm -f /etc/nginx/sites-enabled/waxvalue
    sudo rm -f /etc/nginx/sites-available/waxvalue
    echo "  ✅ Old Nginx config removed"
else
    echo "  ✅ No old Nginx config found"
fi
echo ""

# Step 4: Create fresh directory
echo "Step 4: Creating fresh project directory..."
mkdir -p $HOME/waxvalue
chmod 755 $HOME/waxvalue
echo "  ✅ Directory created: $HOME/waxvalue"
echo ""

# Step 5: Clean up any orphaned processes
echo "Step 5: Checking for orphaned processes..."
# Kill any node processes on port 3000 or 8000
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || echo "  No processes on port 3000"
sudo lsof -ti:8000 | xargs sudo kill -9 2>/dev/null || echo "  No processes on port 8000"
echo "  ✅ Ports cleaned"
echo ""

# Step 6: Verify dependencies
echo "Step 6: Checking installed dependencies..."
echo ""

HAS_ALL_DEPS=true

if command -v node &> /dev/null; then
    echo "  ✅ Node.js: $(node --version)"
else
    echo "  ❌ Node.js: NOT INSTALLED"
    HAS_ALL_DEPS=false
fi

if command -v python3 &> /dev/null; then
    echo "  ✅ Python: $(python3 --version)"
else
    echo "  ❌ Python: NOT INSTALLED"
    HAS_ALL_DEPS=false
fi

if command -v nginx &> /dev/null; then
    echo "  ✅ Nginx: installed"
else
    echo "  ❌ Nginx: NOT INSTALLED"
    HAS_ALL_DEPS=false
fi

if command -v pm2 &> /dev/null; then
    echo "  ✅ PM2: $(pm2 --version)"
else
    echo "  ❌ PM2: NOT INSTALLED (will install)"
    HAS_ALL_DEPS=false
fi

echo ""
echo "======================================"
echo "🎉 Cleanup Complete!"
echo ""

if [ "$HAS_ALL_DEPS" = true ]; then
    echo "✅ VPS is CLEAN and READY for deployment!"
    echo ""
    echo "Next steps:"
    echo "  1. Upload project files to: $HOME/waxvalue/"
    echo "  2. Run: bash deploy-final.sh"
else
    echo "⚠️  VPS is CLEAN but missing some dependencies"
    echo ""
    echo "Next steps:"
    echo "  1. Upload project files to: $HOME/waxvalue/"
    echo "  2. Run: bash deploy-final.sh"
    echo "     (This will install missing dependencies)"
fi

echo ""
echo "======================================"

