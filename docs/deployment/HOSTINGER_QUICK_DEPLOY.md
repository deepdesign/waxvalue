# Deploy WaxValue to Hostinger - Quick Start Guide

## 🎯 What You Need

1. **Hostinger VPS** - You'll need VPS hosting (not shared hosting)
   - Your app requires Node.js, Python, and PostgreSQL
   - Shared hosting won't work - you need **VPS Business** or higher
   
2. **Access to your Hostinger hPanel** at https://hpanel.hostinger.com
   - Domain: waxvalue.com
   - SSH access to your VPS

## ⚠️ Important: Check Your Hosting Type

### Option A: You Have VPS Hosting ✅
If you have a VPS, follow this guide below.

### Option B: You Have Shared Hosting ❌
**Your app won't work on shared hosting.** You need to upgrade to VPS:
1. Log into hPanel: https://hpanel.hostinger.com
2. Go to VPS hosting section
3. Purchase VPS Business plan ($3-8/month)
4. Then follow this guide

---

## 🚀 Quick Deployment (VPS)

### Step 1: Connect to Your VPS

1. In hPanel, go to **VPS** section
2. Find your VPS IP address (e.g., `123.45.67.89`)
3. Get your SSH credentials (username: usually `root`, password in hPanel)

4. Connect via SSH (use PowerShell on Windows):
```powershell
ssh root@YOUR_VPS_IP
# Enter password when prompted
```

### Step 2: Initial Server Setup

Run these commands on your VPS:

```bash
# Update system
apt update && apt upgrade -y

# Install required software
apt install -y nginx postgresql redis-server certbot python3-certbot-nginx git

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Python 3 and pip
apt install -y python3.9 python3.9-pip python3.9-venv

# Verify installations
node --version    # Should show v18.x.x
python3 --version # Should show 3.9+
psql --version    # Should show PostgreSQL
```

### Step 3: Create Application User

```bash
# Create dedicated user for security
useradd -m -s /bin/bash waxvalue
usermod -aG sudo waxvalue

# Switch to application user
su - waxvalue
```

### Step 4: Deploy Your Application

```bash
# Clone your repository (or upload via FTP)
git clone https://github.com/YOUR_USERNAME/waxvalue.git
# OR if you don't have it on GitHub yet:
# Upload your project files to /root/waxvalue/

cd waxvalue

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Step 5: Configure Database

```bash
# Switch back to root
exit

# Setup PostgreSQL
sudo -u postgres psql << 'EOF'
CREATE DATABASE waxvalue_prod;
CREATE USER waxvalue_user WITH ENCRYPTED PASSWORD 'ChangeThisToSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE waxvalue_prod TO waxvalue_user;
\q
EOF
```

### Step 6: Configure Environment

```bash
# Switch back to application user
su - waxvalue
cd waxvalue

# Create production environment file
cat > .env.production << 'EOF'
# Database
DATABASE_URL=postgresql://waxvalue_user:ChangeThisToSecurePassword123!@localhost:5432/waxvalue_prod
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waxvalue_prod
DB_USER=waxvalue_user
DB_PASSWORD=ChangeThisToSecurePassword123!

# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://waxvalue.com/api
NEXT_PUBLIC_APP_URL=https://waxvalue.com

# Discogs API (from your current .env)
DISCOGS_CONSUMER_KEY=YOUR_KEY_HERE
DISCOGS_CONSUMER_SECRET=YOUR_SECRET_HERE

# JWT Security (generate new one)
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h

# Redis
REDIS_URL=redis://localhost:6379
EOF

# Copy backend .env
cp .env.production backend/.env
```

**Important**: Edit `.env.production` with your actual Discogs credentials!

```bash
nano .env.production
# Update DISCOGS_CONSUMER_KEY and DISCOGS_CONSUMER_SECRET
# Press Ctrl+X, then Y, then Enter to save
```

### Step 7: Build Application

```bash
# Build Next.js frontend
npm run build

# Initialize database
cd backend
source venv/bin/activate
python3 init_db.py
cd ..
```

### Step 8: Setup Systemd Services

```bash
# Exit to root user
exit

# Create frontend service
cat > /etc/systemd/system/waxvalue-frontend.service << 'EOF'
[Unit]
Description=WaxValue Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=waxvalue
WorkingDirectory=/home/waxvalue/waxvalue
Environment=NODE_ENV=production
EnvironmentFile=/home/waxvalue/waxvalue/.env.production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create backend service
cat > /etc/systemd/system/waxvalue-backend.service << 'EOF'
[Unit]
Description=WaxValue Backend (FastAPI)
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=waxvalue
WorkingDirectory=/home/waxvalue/waxvalue/backend
EnvironmentFile=/home/waxvalue/waxvalue/.env.production
ExecStart=/home/waxvalue/waxvalue/backend/venv/bin/python3 main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
systemctl enable waxvalue-frontend waxvalue-backend
systemctl start waxvalue-frontend waxvalue-backend

# Check status
systemctl status waxvalue-frontend
systemctl status waxvalue-backend
```

### Step 9: Configure Nginx

```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/waxvalue << 'EOF'
server {
    listen 80;
    server_name waxvalue.com www.waxvalue.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name waxvalue.com www.waxvalue.com;

    # SSL Configuration (will be added by Certbot)
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/backend/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/waxvalue /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
```

### Step 10: Configure DNS in hPanel

1. Go to your Hostinger hPanel: https://hpanel.hostinger.com
2. Navigate to: **Domains** → **waxvalue.com** → **DNS/Nameservers**
3. Add/Update these DNS records:
   - **A Record**: `@` → Your VPS IP address
   - **A Record**: `www` → Your VPS IP address
   - **TTL**: 14400 (4 hours)

**Wait 1-4 hours** for DNS to propagate.

### Step 11: Get SSL Certificate

```bash
# Get free SSL certificate from Let's Encrypt
certbot --nginx -d waxvalue.com -d www.waxvalue.com

# Follow prompts:
# - Enter your email
# - Agree to terms
# - Redirect HTTP to HTTPS: Yes

# Setup auto-renewal
crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 12: Configure Firewall

```bash
# Setup firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## ✅ Verify Deployment

1. **Check services are running**:
```bash
systemctl status waxvalue-frontend
systemctl status waxvalue-backend
systemctl status nginx
```

2. **Test your site**:
   - Open browser: https://waxvalue.com
   - You should see your WaxValue app!

3. **Check logs if issues**:
```bash
journalctl -u waxvalue-frontend -n 50
journalctl -u waxvalue-backend -n 50
tail -f /var/log/nginx/error.log
```

## 🔄 Update Your App Later

Create a deployment script on your VPS:

```bash
cat > /root/deploy.sh << 'EOF'
#!/bin/bash
cd /root/waxvalue
git pull origin feature/discogs-price-alerts
npm install
npm run build
pm2 restart all
EOF

chmod +x /root/deploy.sh
```

To update later:
```bash
./deploy.sh
```

## 🆘 Troubleshooting

### Frontend won't start
```bash
# Check logs
journalctl -u waxvalue-frontend -n 100

# Restart
sudo systemctl restart waxvalue-frontend
```

### Backend won't start
```bash
# Check logs
journalctl -u waxvalue-backend -n 100

# Check if port 8000 is in use
sudo lsof -i :8000

# Restart
sudo systemctl restart waxvalue-backend
```

### Database connection issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -U waxvalue_user -d waxvalue_prod -h localhost
```

### DNS not working
- Wait 1-4 hours for DNS propagation
- Check DNS with: `dig waxvalue.com`
- Verify A records in hPanel

## 💰 Estimated Costs

- **VPS Business**: $3-8/month
- **Domain** (waxvalue.com): $10-15/year (you already own this)
- **SSL Certificate**: Free (Let's Encrypt)
- **Total**: ~$5-10/month

## 📱 Quick Reference Commands

```bash
# View logs
journalctl -u waxvalue-frontend -f
journalctl -u waxvalue-backend -f

# Restart services
sudo systemctl restart waxvalue-frontend
sudo systemctl restart waxvalue-backend
sudo systemctl restart nginx

# Update app
cd /root/waxvalue
git pull origin feature/discogs-price-alerts
npm install
npm run build
pm2 restart all
```

## 🔐 Security Best Practices

1. ✅ Change default passwords immediately
2. ✅ Use strong database password
3. ✅ Keep system updated: `apt update && apt upgrade -y`
4. ✅ Monitor logs regularly
5. ✅ Backup database weekly

---

**Need Help?** 
- Hostinger Support: https://www.hostinger.com/cpanel-login
- Your deployment docs: `docs/deployment/` folder

