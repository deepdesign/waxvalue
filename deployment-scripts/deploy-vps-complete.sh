#!/bin/bash
# Complete VPS Deployment Script for Waxvalue
# Run this ON the VPS after uploading files

set -e  # Exit on error

echo "🚀 Waxvalue VPS Deployment Starting..."
echo "======================================"
echo ""

# Configuration
PROJECT_DIR="/var/www/waxvalue"
DOMAIN="waxvalue.com"
BACKUP_DIR="/var/backups/waxvalue"

# Create backup directory
mkdir -p $BACKUP_DIR

# Step 1: Clean previous deployment if exists
echo "🧹 Step 1/10: Cleaning previous deployment..."
pm2 delete waxvalue-frontend 2>/dev/null || echo "  No frontend service to stop"
pm2 delete waxvalue-backend 2>/dev/null || echo "  No backend service to stop"

if [ -d "$PROJECT_DIR" ]; then
    echo "  Backing up old deployment..."
    tar -czf "$BACKUP_DIR/waxvalue-old-$(date +%Y%m%d-%H%M%S).tar.gz" $PROJECT_DIR 2>/dev/null || true
    echo "  Removing old files..."
    rm -rf $PROJECT_DIR
fi

mkdir -p $PROJECT_DIR
echo "  ✅ Cleanup complete"
echo ""

# Step 2: Update system packages
echo "📦 Step 2/10: Updating system packages..."
apt update -qq
apt upgrade -y -qq
echo "  ✅ System updated"
echo ""

# Step 3: Install Node.js
echo "⚛️  Step 3/10: Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
node --version
npm --version
echo "  ✅ Node.js ready"
echo ""

# Step 4: Install Python
echo "🐍 Step 4/10: Installing Python..."
apt install -y python3 python3-pip python3-venv
python3 --version
echo "  ✅ Python ready"
echo ""

# Step 5: Install Nginx
echo "🌐 Step 5/10: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi
nginx -v
echo "  ✅ Nginx ready"
echo ""

# Step 6: Install PM2
echo "⚙️  Step 6/10: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
pm2 --version
echo "  ✅ PM2 ready"
echo ""

# Step 7: Install Certbot for SSL
echo "🔒 Step 7/10: Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx
echo "  ✅ Certbot ready"
echo ""

echo "✅ All system dependencies installed!"
echo ""
echo "📁 Project directory ready at: $PROJECT_DIR"
echo ""
echo "Next: Upload your project files to $PROJECT_DIR"
echo ""

