#!/bin/bash
# Final update script - run this on VPS as root
# Usage: ssh root@93.127.200.187 < final-update.sh

echo "🔄 Updating WaxValue to latest version..."

cd /home/waxvalue/waxvalue

# Pull latest code
git reset --hard origin/master
git pull

# Rebuild frontend
echo "🔨 Rebuilding frontend..."
npm run build

# Restart both services
echo "🔄 Restarting services..."
systemctl restart waxvalue-frontend
systemctl restart waxvalue-backend

# Wait for services to start
sleep 3

# Check status
echo ""
echo "✅ Update complete!"
echo ""
systemctl status waxvalue-frontend --no-pager | grep Active
systemctl status waxvalue-backend --no-pager | grep Active

echo ""
echo "🎯 Your site should now be fully working at http://93.127.200.187"

