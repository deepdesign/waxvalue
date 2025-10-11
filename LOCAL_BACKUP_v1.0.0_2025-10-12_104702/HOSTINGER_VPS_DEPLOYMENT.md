# Waxvalue Deployment Guide - Hostinger VPS

## Prerequisites
- VPS IP: `195.35.15.194`
- Domain: `waxvalue.com` (already pointing to VPS)
- SSH access to your VPS
- FTP username: `u728332901.waxvalue.com`

---

## Step 1: SSH into Your VPS

### Get SSH Credentials
1. Go to Hostinger → **VPS** → Your VPS plan
2. Look for **SSH Access** section
3. Note down:
   - **SSH Username** (usually `root` or similar)
   - **SSH Password** (or use SSH key)
   - **SSH Port** (usually `22`)

### Connect via SSH
```bash
# Windows (PowerShell or use PuTTY)
ssh root@195.35.15.194

# If using custom port:
ssh root@195.35.15.194 -p YOUR_PORT
```

---

## Step 2: Install Required Software on VPS

Once connected via SSH, run these commands:

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js (v18 or higher)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v18.x or higher
npm --version
```

### Install Python 3.11+
```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version  # Should show 3.11 or higher
```

### Install Nginx (web server)
```bash
sudo apt install -y nginx
```

### Install PM2 (process manager)
```bash
sudo npm install -g pm2
```

### Install Git
```bash
sudo apt install -y git
```

---

## Step 3: Upload Your Code to VPS

### Option A: Using Git (Recommended)
```bash
# Create directory
cd /var/www
sudo mkdir -p waxvalue
sudo chown -R $USER:$USER waxvalue
cd waxvalue

# Clone or upload your code
# If you have a git repo:
git clone YOUR_REPO_URL .

# If not, you'll need to upload files via FTP/SFTP
```

### Option B: Using SFTP/FTP
1. Use **FileZilla** or **WinSCP** on Windows
2. Connect to: `195.35.15.194`
3. Username: `u728332901.waxvalue.com`
4. Upload entire project to: `/var/www/waxvalue/`

---

## Step 4: Set Up Environment Variables

### Backend Environment Variables
```bash
cd /var/www/waxvalue/backend
nano .env
```

Paste this (update with your actual values):
```bash
DISCOGS_CONSUMER_KEY=your_actual_consumer_key
DISCOGS_CONSUMER_SECRET=your_actual_consumer_secret
FRONTEND_URL=https://waxvalue.com
CORS_ORIGINS=https://waxvalue.com,https://www.waxvalue.com
SESSION_SECRET=GENERATE_A_RANDOM_32_CHAR_STRING_HERE
LOG_LEVEL=INFO
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

### Frontend Environment Variables
```bash
cd /var/www/waxvalue
nano .env.production
```

Paste this:
```bash
NEXT_PUBLIC_BACKEND_URL=https://waxvalue.com/api/backend
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

---

## Step 5: Install Dependencies

### Backend Dependencies
```bash
cd /var/www/waxvalue/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Dependencies
```bash
cd /var/www/waxvalue
npm install
```

---

## Step 6: Build Frontend

```bash
cd /var/www/waxvalue
npm run build
```

This will create an optimized production build in `.next/` folder.

---

## Step 7: Set Up Nginx Reverse Proxy

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/waxvalue
```

Paste this configuration:
```nginx
# Frontend (Next.js on port 3000)
server {
    listen 80;
    server_name waxvalue.com www.waxvalue.com;

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
    }

    # Backend API - FastAPI
    location /api/backend/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle SSE (Server-Sent Events) for streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
    }
}
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

### Enable Site and Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/waxvalue /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## Step 8: Start Services with PM2

### Start Backend
```bash
cd /var/www/waxvalue/backend
pm2 start "venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000" --name waxvalue-backend
```

### Start Frontend
```bash
cd /var/www/waxvalue
pm2 start npm --name waxvalue-frontend -- start
```

### Save PM2 Configuration (auto-restart on reboot)
```bash
pm2 save
pm2 startup
# Follow the command it outputs (usually a systemctl command)
```

### Check Status
```bash
pm2 status
pm2 logs waxvalue-frontend
pm2 logs waxvalue-backend
```

---

## Step 9: Set Up SSL (HTTPS) - REQUIRED for OAuth

Discogs OAuth **requires HTTPS**. Use Let's Encrypt (free):

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d waxvalue.com -d www.waxvalue.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Redirect HTTP to HTTPS: Yes
```

Certbot will auto-update your Nginx config to use HTTPS.

---

## Step 10: Update Discogs OAuth Settings

1. Go to https://www.discogs.com/settings/developers
2. Edit your application
3. Update **Callback URL** to: `https://waxvalue.com/auth/callback`
4. Update **Application URL** to: `https://waxvalue.com`
5. Save changes

---

## Step 11: Test Your Deployment

```bash
# Check if services are running
pm2 status

# Check Nginx
sudo systemctl status nginx

# Test backend directly
curl http://localhost:8000/docs

# Test frontend directly  
curl http://localhost:3000

# Check from outside
curl https://waxvalue.com
```

---

## Useful PM2 Commands

```bash
# View logs
pm2 logs waxvalue-frontend --lines 100
pm2 logs waxvalue-backend --lines 100

# Restart services
pm2 restart waxvalue-frontend
pm2 restart waxvalue-backend

# Stop services
pm2 stop waxvalue-frontend
pm2 stop waxvalue-backend

# Monitor in real-time
pm2 monit
```

---

## Troubleshooting

### Issue: Port already in use
```bash
# Find process using port 3000
sudo lsof -i :3000
# Kill it
sudo kill -9 PID

# Or for port 8000
sudo lsof -i :8000
sudo kill -9 PID
```

### Issue: Permission denied
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/waxvalue
```

### Issue: Nginx 502 Bad Gateway
```bash
# Check if backend/frontend are running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: OAuth not working
- Verify HTTPS is working
- Check Discogs callback URL matches exactly
- Check FRONTEND_URL and CORS_ORIGINS in backend `.env`

---

## File Locations

- **Application:** `/var/www/waxvalue/`
- **Backend .env:** `/var/www/waxvalue/backend/.env`
- **Frontend .env:** `/var/www/waxvalue/.env.production`
- **Nginx config:** `/etc/nginx/sites-available/waxvalue`
- **PM2 logs:** `~/.pm2/logs/`
- **Sessions:** `/var/www/waxvalue/backend/sessions.json`

---

## Security Checklist

- [ ] SSL certificate installed (HTTPS)
- [ ] Strong SESSION_SECRET generated
- [ ] Firewall configured (ufw)
- [ ] SSH key authentication (disable password)
- [ ] Regular system updates scheduled
- [ ] Fail2ban installed for brute force protection

---

## Next Steps After Deployment

1. Test OAuth login flow
2. Run a pricing analysis
3. Monitor logs for errors
4. Set up regular backups
5. Consider Redis for sessions (production scaling)
6. Set up monitoring (Uptime Robot, etc.)

---

## Quick Deploy Script

Save this as `deploy.sh` on your VPS:

```bash
#!/bin/bash
cd /var/www/waxvalue

# Pull latest code (if using git)
# git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart waxvalue-backend

# Frontend
cd ..
npm install
npm run build
pm2 restart waxvalue-frontend

echo "✅ Deployment complete!"
pm2 status
```

Make executable: `chmod +x deploy.sh`
Run: `./deploy.sh`

---

## Support Resources

- Hostinger VPS Docs: https://support.hostinger.com/en/collections/1691951-vps
- PM2 Guide: https://pm2.keymetrics.io/docs/usage/quick-start/
- Nginx Guide: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/getting-started/

