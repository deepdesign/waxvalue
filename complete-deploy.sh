#!/bin/bash
# Complete WaxValue Deployment Script
# Run this as: bash <(curl -s https://raw.githubusercontent.com/deepdesign/waxvalue/master/complete-deploy.sh)

set -e

echo "🚀 WaxValue Complete Deployment"
echo "================================"
echo ""

# Check if running as waxvalue user
if [ "$USER" != "waxvalue" ]; then
    echo "❌ Please run as waxvalue user"
    echo "   Run: su - waxvalue"
    echo "   Then: bash <(curl -s https://raw.githubusercontent.com/deepdesign/waxvalue/master/complete-deploy.sh)"
    exit 1
fi

cd ~

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
if [ -d "waxvalue" ]; then
    cd waxvalue
    git pull
else
    git clone https://github.com/deepdesign/waxvalue.git
    cd waxvalue
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Setup backend
echo "🐍 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python3 init_db.py || echo "⚠️  Database might already be initialized"

cd ..

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Make sure .env.production has your Discogs credentials"
echo "2. Ask admin to setup systemd services (needs root)"
echo "3. Configure Nginx and SSL"
echo ""
echo "To test manually:"
echo "  Frontend: npm start"
echo "  Backend:  cd backend && source venv/bin/activate && python3 main.py"

