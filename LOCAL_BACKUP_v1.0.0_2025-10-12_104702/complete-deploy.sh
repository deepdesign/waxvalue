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

# Ensure public files are accessible
echo "📁 Setting up public files..."
mkdir -p public
chmod +x scripts/post-build.sh 2>/dev/null || true

# Setup backend
echo "🐍 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt 2>/dev/null || pip install --no-cache-dir -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python3 init_db.py 2>&1 | grep -v "Error creating sample data" || echo "✓ Database ready"

cd ..

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎯 Services should be running at:"
echo "   Frontend: http://YOUR_IP:3000"
echo "   Backend:  http://YOUR_IP:8000"
echo ""
echo "📝 To restart services (as root):"
echo "   sudo systemctl restart waxvalue-frontend waxvalue-backend"

