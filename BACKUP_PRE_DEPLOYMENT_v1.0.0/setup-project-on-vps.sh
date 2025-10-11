#!/bin/bash
# Setup and configure Waxvalue project on VPS
# Run this AFTER uploading project files

set -e

PROJECT_DIR="/var/www/waxvalue"
cd $PROJECT_DIR

echo "🔧 Setting up Waxvalue project..."
echo ""

# Step 1: Install Python dependencies
echo "🐍 Installing Python backend dependencies..."
cd $PROJECT_DIR/backend

# Create virtual environment if doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate and install
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo "  ✅ Python dependencies installed"
echo ""

# Step 2: Install Node.js dependencies  
echo "⚛️  Installing Node.js frontend dependencies..."
cd $PROJECT_DIR
npm install

echo "  ✅ Node.js dependencies installed"
echo ""

# Step 3: Build Next.js production bundle
echo "🏗️  Building Next.js production bundle..."
npm run build

echo "  ✅ Production build complete"
echo ""

# Step 4: Configure Nginx
echo "🌐 Configuring Nginx reverse proxy..."

cat > /etc/nginx/sites-available/waxvalue << 'NGINX_CONFIG'
server {
    listen 80;
    server_name waxvalue.com www.waxvalue.com;

    client_max_body_size 50M;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend - Next.js on port 3000
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

    # Backend API - FastAPI on port 8000
    location /api/backend/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Server-Sent Events (SSE) support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        
        # Required for SSE
        chunked_transfer_encoding on;
        tcp_nodelay on;
    }
}
NGINX_CONFIG

# Enable site
ln -sf /etc/nginx/sites-available/waxvalue /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

echo "  ✅ Nginx configured"
echo ""

# Step 5: Start services with PM2
echo "🚀 Starting services with PM2..."

# Start backend
cd $PROJECT_DIR/backend
pm2 delete waxvalue-backend 2>/dev/null || true
pm2 start "venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2" \
    --name waxvalue-backend \
    --log /var/log/waxvalue-backend.log \
    --error /var/log/waxvalue-backend-error.log

# Start frontend
cd $PROJECT_DIR
pm2 delete waxvalue-frontend 2>/dev/null || true
pm2 start npm \
    --name waxvalue-frontend \
    --log /var/log/waxvalue-frontend.log \
    --error /var/log/waxvalue-frontend-error.log \
    -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup systemd -u root --hp /root | grep -v "PM2" | bash || true

echo "  ✅ Services started"
echo ""

# Step 6: Check service status
echo "📊 Service Status:"
pm2 status

echo ""
echo "✅ Project setup complete!"
echo ""
echo "🌐 Your site is now accessible at:"
echo "   http://waxvalue.com"
echo "   http://www.waxvalue.com"
echo "   http://195.35.15.194"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "   1. Install SSL certificate (REQUIRED for OAuth):"
echo "      sudo certbot --nginx -d waxvalue.com -d www.waxvalue.com"
echo ""
echo "   2. Update Discogs OAuth settings at:"
echo "      https://www.discogs.com/settings/developers"
echo "      Callback URL: https://waxvalue.com/auth/callback"
echo ""
echo "   3. Test the deployment:"
echo "      Visit https://waxvalue.com"
echo "      Try OAuth login"
echo ""
echo "📋 Useful commands:"
echo "   pm2 logs waxvalue-frontend  # View frontend logs"
echo "   pm2 logs waxvalue-backend   # View backend logs"
echo "   pm2 restart all             # Restart all services"
echo "   systemctl status nginx      # Check Nginx status"
echo ""

