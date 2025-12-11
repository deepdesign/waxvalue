#!/bin/bash

# Waxvalue VPS Deployment Script
# Automatically pulls latest code, updates dependencies, and restarts services

cd /var/www/waxvalue || cd ~/waxvalue

echo "📥 Pulling latest code from GitHub..."
git pull origin master

echo "📦 Updating backend dependencies..."
cd backend

source venv/bin/activate

pip install -r requirements.txt -q

deactivate

cd ..

echo "📦 Updating frontend dependencies..."
npm install

echo "🏗️  Building frontend..."
npm run build 2>/dev/null || echo "⚠️  Build failed, will use dev mode"

echo "🔄 Restarting services..."
pm2 restart waxvalue-backend 2>/dev/null || pm2 start "cd $(pwd)/backend && source venv/bin/activate && uvicorn main:app --host 127.0.0.1 --port 8000" --name waxvalue-backend --max-memory-restart 500M

pm2 restart waxvalue-frontend 2>/dev/null || pm2 start "cd $(pwd) && npm run dev" --name waxvalue-frontend --max-memory-restart 500M

pm2 save

echo "✅ Deployment complete!"

pm2 status
