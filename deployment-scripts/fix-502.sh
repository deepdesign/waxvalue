#!/bin/bash

# Quick fix for 502 Bad Gateway
# Run this on your VPS

echo "🔍 Diagnosing 502 Bad Gateway..."

# Check PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 status

# Check if ports are listening
echo ""
echo "🔌 Checking ports:"
netstat -tlnp 2>/dev/null | grep -E ':(3000|8000)' || ss -tlnp 2>/dev/null | grep -E ':(3000|8000)' || echo "⚠️  No services listening on ports 3000 or 8000"

# Check recent logs
echo ""
echo "📋 Recent Backend Logs:"
pm2 logs waxvalue-backend --lines 10 --nostream 2>/dev/null || echo "⚠️  Backend not running"

echo ""
echo "📋 Recent Frontend Logs:"
pm2 logs waxvalue-frontend --lines 10 --nostream 2>/dev/null || echo "⚠️  Frontend not running"

# Try to restart services
echo ""
echo "🔄 Attempting to restart services..."
cd /var/www/waxvalue || cd ~/waxvalue

# Restart backend
pm2 restart waxvalue-backend 2>/dev/null || pm2 start "cd $(pwd)/backend && source venv/bin/activate && uvicorn main:app --host 127.0.0.1 --port 8000" --name waxvalue-backend --max-memory-restart 500M

# Restart frontend
pm2 restart waxvalue-frontend 2>/dev/null || pm2 start "cd $(pwd) && npm run dev" --name waxvalue-frontend --max-memory-restart 500M

pm2 save

echo ""
echo "✅ Services restarted. Check status:"
pm2 status

echo ""
echo "⏳ Waiting 5 seconds for services to start..."
sleep 5

echo ""
echo "🔌 Checking ports again:"
netstat -tlnp 2>/dev/null | grep -E ':(3000|8000)' || ss -tlnp 2>/dev/null | grep -E ':(3000|8000)' || echo "⚠️  Services may still be starting..."

echo ""
echo "✅ Done! Check https://waxvalue.com"

