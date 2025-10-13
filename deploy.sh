#!/bin/bash
# Waxvalue VPS Deployment Script
set -e

echo "🚀 Starting Waxvalue Deployment..."

# Step 1: Clone or update repository
cd ~
if [ -d "waxvalue" ]; then
    echo "📦 Updating repository..."
    cd waxvalue
    git fetch origin
    git reset --hard origin/master
    git pull origin master
else
    echo "📦 Cloning repository..."
    git clone https://github.com/deepdesign/waxvalue.git
    cd waxvalue
fi
echo "✅ Repository ready"

# Step 2: Backend setup
echo "🐍 Setting up backend..."
cd ~/waxvalue/backend
cat > .env << 'EOF'
DISCOGS_CONSUMER_KEY=WDwjaxApILXXiTrTBbpB
DISCOGS_CONSUMER_SECRET=sRLerNInpEQEGTjUuhltwpVOhIJjnbVO
FRONTEND_URL=https://waxvalue.com
CORS_ORIGINS=https://waxvalue.com,https://www.waxvalue.com,http://waxvalue.com,http://www.waxvalue.com
SESSION_SECRET=WxV2025!SecureRandomKey_ProductionOnly_DoNotShareThis32CharSecret
LOG_LEVEL=INFO
EOF

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✅ Backend configured"

# Step 3: Frontend setup
echo "⚛️  Setting up frontend..."
cd ~/waxvalue
cat > .env.production << 'EOF'
NEXT_PUBLIC_BACKEND_URL=https://waxvalue.com/api/backend
EOF

npm install --silent
echo "✅ Dependencies installed"

# Step 4: Build
echo "🏗️  Building application..."
npm run build
echo "✅ Build complete"

# Step 5: Start services
echo "🚀 Starting services..."
pm2 delete waxvalue-backend waxvalue-frontend 2>/dev/null || true
cd ~/waxvalue/backend
pm2 start venv/bin/python --name waxvalue-backend -- main.py
cd ~/waxvalue
pm2 start npm --name waxvalue-frontend -- start
pm2 save
echo "✅ Services started"

# Show status
echo ""
echo "📊 Process Status:"
pm2 status

echo ""
echo "✅ Deployment Complete!"
echo "🌐 Application: https://waxvalue.com"


