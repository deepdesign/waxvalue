#!/bin/bash
# Waxvalue Complete Deployment Script
# Run on VPS: bash deploy-final.sh

set -e

echo "🚀 Waxvalue Deployment Starting..."
echo "=================================="
echo ""

# Configuration
PROJECT_DIR="$HOME/waxvalue"
DOMAIN="waxvalue.com"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check current user
echo "👤 Current user: $(whoami)"
echo "📁 Home directory: $HOME"
echo ""

# Step 2: Install system dependencies
echo -e "${YELLOW}📦 Step 1/10: Installing system dependencies...${NC}"
sudo apt update -qq
sudo apt install -y curl software-properties-common build-essential

echo -e "${GREEN}  ✅ System dependencies installed${NC}"
echo ""

# Step 3: Install Node.js 18
echo -e "${YELLOW}⚛️  Step 2/10: Installing Node.js...${NC}"
if ! command -v node &> /dev/null || [ "$(node --version | cut -d'.' -f1 | tr -d 'v')" -lt "18" ]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "  Node.js version: $(node --version)"
echo "  npm version: $(npm --version)"
echo -e "${GREEN}  ✅ Node.js ready${NC}"
echo ""

# Step 4: Install Python 3
echo -e "${YELLOW}🐍 Step 3/10: Installing Python...${NC}"
sudo apt install -y python3 python3-pip python3-venv
echo "  Python version: $(python3 --version)"
echo -e "${GREEN}  ✅ Python ready${NC}"
echo ""

# Step 5: Install Nginx
echo -e "${YELLOW}🌐 Step 4/10: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
fi
echo "  Nginx version: $(nginx -v 2>&1)"
echo -e "${GREEN}  ✅ Nginx ready${NC}"
echo ""

# Step 6: Install PM2
echo -e "${YELLOW}⚙️  Step 5/10: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "  PM2 version: $(pm2 --version)"
echo -e "${GREEN}  ✅ PM2 ready${NC}"
echo ""

# Step 7: Install Certbot
echo -e "${YELLOW}🔒 Step 6/10: Installing Certbot...${NC}"
sudo apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}  ✅ Certbot ready${NC}"
echo ""

# Step 8: Setup Python backend
echo -e "${YELLOW}🐍 Step 7/10: Setting up Python backend...${NC}"
cd $PROJECT_DIR/backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Install dependencies
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
deactivate

echo -e "${GREEN}  ✅ Backend dependencies installed${NC}"
echo ""

# Step 9: Setup Node.js frontend
echo -e "${YELLOW}⚛️  Step 8/10: Setting up Next.js frontend...${NC}"
cd $PROJECT_DIR

# Install dependencies
npm install

# Build production bundle
echo "  Building production bundle (this may take a few minutes)..."
npm run build

echo -e "${GREEN}  ✅ Frontend built${NC}"
echo ""

# Step 10: Configure Nginx
echo -e "${YELLOW}🌐 Step 9/10: Configuring Nginx...${NC}"

sudo tee /etc/nginx/sites-available/waxvalue > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    server_name waxvalue.com www.waxvalue.com;

    client_max_body_size 50M;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend - Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }

    # Backend API
    location /api/backend/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        chunked_transfer_encoding on;
        tcp_nodelay on;
    }
}
NGINX_CONFIG

# Enable site
sudo ln -sf /etc/nginx/sites-available/waxvalue /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo -e "${GREEN}  ✅ Nginx configured${NC}"
echo ""

# Step 11: Start services
echo -e "${YELLOW}🚀 Step 10/10: Starting services...${NC}"

# Stop existing if running
pm2 delete waxvalue-backend 2>/dev/null || true
pm2 delete waxvalue-frontend 2>/dev/null || true

# Start backend
cd $PROJECT_DIR/backend
pm2 start "venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2" \
    --name waxvalue-backend \
    --log $HOME/waxvalue-backend.log \
    --error $HOME/waxvalue-backend-error.log

# Start frontend
cd $PROJECT_DIR
pm2 start npm \
    --name waxvalue-frontend \
    --log $HOME/waxvalue-frontend.log \
    --error $HOME/waxvalue-frontend-error.log \
    -- start

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup systemd -u u728332901 --hp $HOME | grep -v PM2 | sudo bash || true

echo -e "${GREEN}  ✅ Services started${NC}"
echo ""

# Show status
echo "📊 Service Status:"
pm2 status

echo ""
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo ""
echo "🌐 Your site is accessible at:"
echo "   http://waxvalue.com"
echo "   http://www.waxvalue.com"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1️⃣  Install SSL certificate (REQUIRED for OAuth):"
echo "   sudo certbot --nginx -d waxvalue.com -d www.waxvalue.com"
echo ""
echo "2️⃣  Update Discogs OAuth settings:"
echo "   https://www.discogs.com/settings/developers"
echo "   Callback URL: https://waxvalue.com/auth/callback"
echo ""
echo "3️⃣  Test your deployment:"
echo "   Visit: https://waxvalue.com"
echo ""
echo "📋 Useful commands:"
echo "   pm2 logs waxvalue-frontend  # Frontend logs"
echo "   pm2 logs waxvalue-backend   # Backend logs"
echo "   pm2 restart all             # Restart services"
echo "   pm2 monit                   # Monitor in real-time"
echo ""

