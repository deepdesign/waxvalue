# Waxvalue Deployment Script for Hostinger VPS
# Run this from PowerShell on your local machine

Write-Host "🚀 Waxvalue Deployment to Hostinger VPS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$VPS_HOST = "195.35.15.194"
$VPS_PORT = "65002"
$VPS_USER = "u728332901"
$VPS_DIR = "/home/u728332901/waxvalue"

Write-Host "📋 VPS Connection Details:" -ForegroundColor Yellow
Write-Host "   Host: $VPS_HOST"
Write-Host "   Port: $VPS_PORT"
Write-Host "   User: $VPS_USER"
Write-Host "   Directory: $VPS_DIR`n"

Write-Host "⚠️  You will be prompted for your SSH password: Babylon1!" -ForegroundColor Yellow
Write-Host "   Press Enter to continue..." -ForegroundColor Yellow
Read-Host

# Create deployment commands script
$deployCommands = @"
#!/bin/bash
set -e

echo '🔧 Starting Waxvalue Deployment...'

# Navigate to home directory
cd ~

# Step 1: Clone or update repository
if [ -d "waxvalue" ]; then
    echo '📦 Updating existing repository...'
    cd waxvalue
    git fetch origin
    git reset --hard origin/master
    git pull origin master
else
    echo '📦 Cloning repository...'
    git clone https://github.com/deepdesign/waxvalue.git
    cd waxvalue
fi

echo '✅ Repository updated'

# Step 2: Setup backend environment
echo '🔧 Setting up backend environment...'
cd ~/waxvalue/backend

# Create .env file
cat > .env << 'EOF'
DISCOGS_CONSUMER_KEY=WDwjaxApILXXiTrTBbpB
DISCOGS_CONSUMER_SECRET=sRLerNInpEQEGTjUuhltwpVOhIJjnbVO
FRONTEND_URL=https://waxvalue.com
CORS_ORIGINS=https://waxvalue.com,https://www.waxvalue.com,http://waxvalue.com,http://www.waxvalue.com
SESSION_SECRET=WxV2025!SecureRandomKey_ProductionOnly_DoNotShareThis32CharSecret
LOG_LEVEL=INFO
EOF

echo '✅ Backend .env created'

# Step 3: Setup Python virtual environment
if [ ! -d "venv" ]; then
    echo '🐍 Creating Python virtual environment...'
    python3 -m venv venv
fi

source venv/bin/activate
echo '📦 Installing Python dependencies...'
pip install --upgrade pip
pip install -r requirements.txt

echo '✅ Backend setup complete'

# Step 4: Setup frontend environment
echo '🔧 Setting up frontend environment...'
cd ~/waxvalue

# Create .env.production file
cat > .env.production << 'EOF'
NEXT_PUBLIC_BACKEND_URL=https://waxvalue.com/api/backend
EOF

echo '✅ Frontend .env.production created'

# Step 5: Install Node.js dependencies
echo '📦 Installing Node.js dependencies...'
npm install

echo '✅ Dependencies installed'

# Step 6: Build frontend
echo '🏗️  Building Next.js application...'
npm run build

echo '✅ Build complete'

# Step 7: Setup PM2 processes
echo '🔧 Configuring PM2 processes...'

# Stop existing processes if they exist
pm2 delete waxvalue-backend 2>/dev/null || true
pm2 delete waxvalue-frontend 2>/dev/null || true

# Start backend
cd ~/waxvalue/backend
pm2 start venv/bin/python --name waxvalue-backend -- main.py

# Start frontend
cd ~/waxvalue
pm2 start npm --name waxvalue-frontend -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u u728332901 --hp /home/u728332901

echo '✅ PM2 processes configured'

# Step 8: Check process status
echo ''
echo '📊 Process Status:'
pm2 status

echo ''
echo '✅ Deployment Complete!'
echo ''
echo '🌐 Your application should be accessible at:'
echo '   https://waxvalue.com'
echo ''
echo '📝 Next steps:'
echo '   1. Configure Nginx reverse proxy (if not done)'
echo '   2. Setup SSL certificate with Let\'s Encrypt'
echo '   3. Update Discogs OAuth callback URL'
echo ''
echo '💡 Useful commands:'
echo '   pm2 status              - Check process status'
echo '   pm2 logs                - View logs'
echo '   pm2 restart all         - Restart all processes'
echo '   pm2 stop all            - Stop all processes'
echo ''
"@

# Save the deployment script locally
$deployCommands | Out-File -FilePath "deploy-commands.sh" -Encoding UTF8

Write-Host "📝 Created deployment script: deploy-commands.sh`n" -ForegroundColor Green

# Copy script to VPS and execute
Write-Host "📤 Uploading deployment script to VPS..." -ForegroundColor Cyan
scp -P $VPS_PORT deploy-commands.sh ${VPS_USER}@${VPS_HOST}:~/

Write-Host "`n🚀 Executing deployment on VPS..." -ForegroundColor Cyan
Write-Host "   (This may take 5-10 minutes)...`n" -ForegroundColor Yellow

ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} "chmod +x ~/deploy-commands.sh && ~/deploy-commands.sh"

Write-Host "`n✅ Deployment script executed!" -ForegroundColor Green
Write-Host "`n🔍 Checking final status...`n" -ForegroundColor Cyan

ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} "pm2 status"

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "`nYour application should now be running at: https://waxvalue.com" -ForegroundColor Cyan

# Cleanup
Remove-Item deploy-commands.sh -ErrorAction SilentlyContinue

Write-Host "`nPress Enter to exit..." -ForegroundColor Yellow
Read-Host


