#!/bin/bash
# Quick fix for backend - Run this on VPS to restart backend properly

cd /var/www/waxvalue/backend || cd ~/waxvalue/backend

echo "🔍 Checking backend logs..."
pm2 logs waxvalue-backend --lines 30 --nostream

echo ""
echo "🛑 Stopping failed backend..."
pm2 delete waxvalue-backend 2>/dev/null

echo "🚀 Starting backend with correct command..."
pm2 start "venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000" \
    --name waxvalue-backend \
    --max-memory-restart 500M \
    --log /var/log/waxvalue-backend.log \
    --error /var/log/waxvalue-backend-error.log \
    --time

pm2 save

echo ""
echo "⏳ Waiting 3 seconds..."
sleep 3

echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🔍 Checking if port 8000 is listening..."
ss -tlnp | grep :8000 || netstat -tlnp | grep :8000 || echo "⚠️  Port 8000 not yet listening"

