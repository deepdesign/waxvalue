# 🚀 Manual Deployment Steps for Hostinger VPS

## Step 1: Connect to VPS

Open PowerShell and run:
```powershell
ssh -p 65002 u728332901@195.35.15.194
```
Password: `Babylon1!`

---

## Step 2: Clone/Update Repository

Once connected to VPS, run these commands:

```bash
# Navigate to home directory
cd ~

# If waxvalue directory exists, update it. Otherwise, clone it.
if [ -d "waxvalue" ]; then
    echo "Updating repository..."
    cd waxvalue
    git fetch origin
    git reset --hard origin/master
    git pull origin master
else
    echo "Cloning repository..."
    git clone https://github.com/deepdesign/waxvalue.git
    cd waxvalue
fi
```

---

## Step 3: Setup Backend Environment

```bash
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

echo "Backend .env created"
```

---

## Step 4: Setup Python Virtual Environment

```bash
cd ~/waxvalue/backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

echo "Backend dependencies installed"
```

---

## Step 5: Setup Frontend Environment

```bash
cd ~/waxvalue

# Create .env.production file
cat > .env.production << 'EOF'
NEXT_PUBLIC_BACKEND_URL=https://waxvalue.com/api/backend
EOF

echo "Frontend .env.production created"
```

---

## Step 6: Install Node.js Dependencies

```bash
cd ~/waxvalue

npm install

echo "Node dependencies installed"
```

---

## Step 7: Build Frontend

```bash
cd ~/waxvalue

npm run build

echo "Build complete"
```

---

## Step 8: Start Services with PM2

```bash
# Stop existing processes (ignore errors if they don't exist)
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

# Setup PM2 to start on boot
pm2 startup systemd -u u728332901 --hp /home/u728332901
```

---

## Step 9: Check Status

```bash
pm2 status
pm2 logs --lines 20
```

---

## Step 10: Configure Nginx (if not already done)

```bash
sudo nano /etc/nginx/sites-available/waxvalue.com
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name waxvalue.com www.waxvalue.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
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
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/waxvalue.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 11: Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d waxvalue.com -d www.waxvalue.com
```

---

## ✅ Deployment Complete!

Your application should now be live at: **https://waxvalue.com**

### Useful Commands:

```bash
# Check process status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Check Nginx status
sudo systemctl status nginx

# View Nginx error log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting

### If backend won't start:
```bash
cd ~/waxvalue/backend
source venv/bin/activate
python main.py  # Run directly to see errors
```

### If frontend won't start:
```bash
cd ~/waxvalue
npm run build  # Check for build errors
npm start      # Run directly to see errors
```

### If Nginx isn't working:
```bash
sudo nginx -t  # Test configuration
sudo systemctl status nginx  # Check service status
sudo tail -f /var/log/nginx/error.log  # View errors
```

---

**Next:** Update your Discogs OAuth callback URL to `https://waxvalue.com/auth/callback`


