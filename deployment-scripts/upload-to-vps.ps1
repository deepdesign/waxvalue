# Upload Waxvalue to Hostinger VPS
# Run this AFTER running deploy-to-hostinger.ps1

$VPS_IP = "195.35.15.194"
$VPS_USER = "root"
$PROJECT_DIR = "/var/www/waxvalue"

Write-Host "📤 Uploading Waxvalue to VPS..." -ForegroundColor Cyan
Write-Host ""

# Check if deployment package exists
if (!(Test-Path "deploy-temp")) {
    Write-Host "❌ Deployment package not found. Run .\deploy-to-hostinger.ps1 first!" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Preparing VPS..." -ForegroundColor Yellow

# First, prepare VPS (clean old deployment)
ssh $VPS_USER@$VPS_IP "bash -s" < deploy-temp/vps-prepare.sh

Write-Host ""
Write-Host "📦 Uploading files via SCP..." -ForegroundColor Yellow

# Upload entire project
scp -r deploy-temp/* ${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/

Write-Host "  ✓ Files uploaded" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Installing dependencies and starting services..." -ForegroundColor Yellow
Write-Host ""

# Run installation and startup on VPS
$setupScript = @'
#!/bin/bash
set -e

PROJECT_DIR="/var/www/waxvalue"
cd $PROJECT_DIR

echo "📦 Installing system dependencies..."
apt update
apt install -y curl software-properties-common

# Install Node.js 18
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# Install Python 3 and pip
if ! command -v python3 &> /dev/null; then
    echo "Installing Python..."
    apt install -y python3 python3-pip python3-venv
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt install -y nginx
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

echo ""
echo "🐍 Setting up Python backend..."
cd $PROJECT_DIR/backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "⚛️  Setting up Next.js frontend..."
cd $PROJECT_DIR

# Install dependencies
npm install

# Build production bundle
npm run build

echo ""
echo "🌐 Configuring Nginx..."

# Create Nginx config
cat > /etc/nginx/sites-available/waxvalue << 'NGINX_EOF'
server {
    listen 80;
    server_name waxvalue.com www.waxvalue.com;

    client_max_body_size 50M;

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
    }

    # Backend API - FastAPI
    location /api/backend/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle SSE (Server-Sent Events)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }
}
NGINX_EOF

# Enable site
ln -sf /etc/nginx/sites-available/waxvalue /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

echo ""
echo "🚀 Starting services with PM2..."

# Start backend
cd $PROJECT_DIR/backend
pm2 delete waxvalue-backend 2>/dev/null || true
pm2 start "venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2" --name waxvalue-backend

# Start frontend
cd $PROJECT_DIR
pm2 delete waxvalue-frontend 2>/dev/null || true
pm2 start npm --name waxvalue-frontend -- start

# Save PM2 configuration
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services status:"
pm2 status

echo ""
echo "🌐 Your site should be accessible at:"
echo "   http://waxvalue.com"
echo "   http://www.waxvalue.com"
echo ""
echo "📋 Next steps:"
echo "   1. Install SSL: sudo certbot --nginx -d waxvalue.com -d www.waxvalue.com"
echo "   2. Update Discogs OAuth callback to: https://waxvalue.com/auth/callback"
echo "   3. Update backend/.env with actual Discogs credentials"
echo ""
'@

# Save setup script
$setupScript | Out-File -FilePath "deploy-temp/setup-vps.sh" -Encoding UTF8 -NoNewline

# Upload and run setup script
Write-Host "Uploading setup script..." -ForegroundColor Gray
scp deploy-temp/setup-vps.sh ${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/setup-vps.sh

Write-Host "Running setup on VPS (this may take 5-10 minutes)..." -ForegroundColor Yellow
Write-Host ""

ssh $VPS_USER@$VPS_IP "chmod +x $PROJECT_DIR/setup-vps.sh && bash $PROJECT_DIR/setup-vps.sh"

Write-Host ""
Write-Host "✅ Upload and configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Update your Discogs API credentials!" -ForegroundColor Yellow
Write-Host "   ssh root@$VPS_IP" -ForegroundColor White
Write-Host "   nano /var/www/waxvalue/backend/.env" -ForegroundColor White
Write-Host ""

