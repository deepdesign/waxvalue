#!/bin/bash
# Waxvalue Update Script for Hostinger VPS
# Run this script to update and rebuild the application

set -e

echo "🚀 Starting Waxvalue update..."

# Navigate to project directory
cd ~/waxvalue

# Pull latest code
echo "📥 Pulling latest code..."
git fetch origin
git pull origin master

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🏗️  Building Next.js application..."
npm run build

# Restart PM2 processes
echo "🔄 Restarting services..."
pm2 restart waxvalue-frontend
pm2 restart waxvalue-backend

# Show status
echo ""
echo "✅ Update complete!"
echo ""
pm2 status

