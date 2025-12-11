#!/bin/bash
# Deployment script for VPS
# Updates code, dependencies, and restarts services

set -e  # Exit on error

# Determine deployment directory
if [ -d "/var/www/waxvalue" ]; then
    DEPLOY_DIR="/var/www/waxvalue"
elif [ -d "$HOME/waxvalue" ]; then
    DEPLOY_DIR="$HOME/waxvalue"
else
    echo "❌ Error: Cannot find waxvalue directory"
    echo "   Checked: /var/www/waxvalue and $HOME/waxvalue"
    exit 1
fi

echo "📦 Deploying from: $DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Pull latest code
echo "🔄 Pulling latest code..."
git pull origin master

# Update backend
echo "🐍 Updating backend..."
cd "$DEPLOY_DIR/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
    pip install -r requirements.txt -q
    deactivate
else
    echo "⚠️  Warning: venv not found, skipping backend update"
fi

# Update frontend
echo "📦 Updating frontend..."
cd "$DEPLOY_DIR"
npm install

# Build frontend (or use dev mode if build fails due to memory)
if npm run build 2>/dev/null; then
    echo "✅ Frontend built successfully"
else
    echo "⚠️  Build failed, will use dev mode (this is OK for low-memory VPS)"
fi

# Restart services
echo "🔄 Restarting services..."
pm2 restart waxvalue-backend 2>/dev/null || pm2 start "cd $DEPLOY_DIR/backend && source venv/bin/activate && uvicorn main:app --host 127.0.0.1 --port 8000" --name waxvalue-backend --max-memory-restart 500M || true

pm2 restart waxvalue-frontend 2>/dev/null || pm2 start "cd $DEPLOY_DIR && npm run dev" --name waxvalue-frontend --max-memory-restart 500M || true

pm2 save

echo "✅ Deployment complete!"
echo ""
pm2 status
