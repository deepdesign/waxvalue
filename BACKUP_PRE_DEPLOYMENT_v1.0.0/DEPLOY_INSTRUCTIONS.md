# Waxvalue Deployment to Hostinger VPS

## ✅ Milestone & Backup Complete
- **Backup:** `waxvalue_pre-deployment_2025-10-12_093529.zip`
- **Milestone:** `MILESTONE_PRE_DEPLOYMENT.md`
- **Status:** Ready for production deployment

---

## SSH Access Details

```
Host: 195.35.15.194
Port: 65002
Username: u728332901
Password: Babylon1!
```

**Connect via:**
```bash
ssh -p 65002 u728332901@195.35.15.194
```

---

## Quick Deploy Method (Recommended)

### Step 1: Upload Files via SFTP

Use **FileZilla** or **WinSCP**:

**Connection Settings:**
- **Protocol:** SFTP
- **Host:** 195.35.15.194
- **Port:** 65002
- **Username:** u728332901
- **Password:** Babylon1!

**Upload to:** `/home/u728332901/waxvalue/`

**Files to upload:**
- All `src/` folder
- All `public/` folder
- All `backend/` folder (except venv, __pycache__)
- `package.json`, `package-lock.json`
- `next.config.js`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`
- `next-env.d.ts`
- `config/production.env.backend` → rename to `backend/.env`
- `config/production.env.frontend` → rename to `.env.production`
- `setup-project-on-vps.sh`
- `deploy-vps-complete.sh`

### Step 2: SSH and Run Setup

```bash
# Connect
ssh -p 65002 u728332901@195.35.15.194

# Navigate to project
cd ~/waxvalue

# Make scripts executable
chmod +x deploy-vps-complete.sh setup-project-on-vps.sh

# Run initial system setup (installs Node, Python, Nginx, PM2)
sudo bash deploy-vps-complete.sh

# Run project setup (installs dependencies, builds, starts services)
bash setup-project-on-vps.sh
```

### Step 3: Install SSL Certificate

```bash
# Still in SSH session
sudo certbot --nginx -d waxvalue.com -d www.waxvalue.com
```

Follow prompts and choose to redirect HTTP → HTTPS.

### Step 4: Update Discogs OAuth

1. Go to: https://www.discogs.com/settings/developers
2. Edit your application
3. Update **Callback URL:** `https://waxvalue.com/auth/callback`
4. Save

### Step 5: Test

Visit https://waxvalue.com and test the login!

---

## Alternative: Manual Command-by-Command Deployment

If scripts don't work, follow these manual steps:

### 1. Connect via SSH
```bash
ssh -p 65002 u728332901@195.35.15.194
```

### 2. Check current directory
```bash
pwd
ls -la
```

### 3. Install Node.js (if not installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

### 4. Install Python (if not installed)
```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version
```

### 5. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 6. Install PM2
```bash
sudo npm install -g pm2
```

### 7. Navigate to project and install dependencies
```bash
cd ~/waxvalue

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Frontend
cd ..
npm install
```

### 8. Build frontend
```bash
npm run build
```

### 9. Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/waxvalue
```

Paste the configuration from `setup-project-on-vps.sh` (the NGINX_CONFIG section).

Then:
```bash
sudo ln -sf /etc/nginx/sites-available/waxvalue /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 10. Start services with PM2
```bash
cd ~/waxvalue

# Backend
cd backend
pm2 start "venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2" --name waxvalue-backend

# Frontend
cd ..
pm2 start npm --name waxvalue-frontend -- start

# Save configuration
pm2 save
pm2 startup
```

### 11. Install SSL
```bash
sudo certbot --nginx -d waxvalue.com -d www.waxvalue.com
```

---

## Verification Commands

```bash
# Check PM2 services
pm2 status

# View logs
pm2 logs waxvalue-frontend --lines 20
pm2 logs waxvalue-backend --lines 20

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
pm2 restart all              # Restart both services
pm2 stop all                 # Stop all services
pm2 delete all               # Remove all services
pm2 logs                     # View all logs
pm2 monit                    # Real-time monitoring
pm2 save                     # Save current configuration
```

---

## Rollback Plan

If deployment fails:

```bash
# Stop services
pm2 delete all

# Restore backup
cd /var/www
rm -rf waxvalue
# Re-upload from backup: waxvalue_pre-deployment_2025-10-12_093529.zip
```

---

## Post-Deployment Checklist

- [ ] Site loads at https://waxvalue.com
- [ ] SSL certificate active (padlock icon)
- [ ] Discogs OAuth login works
- [ ] Can run pricing analysis
- [ ] Avatar displays correctly
- [ ] Filters persist after refresh
- [ ] Mobile view works correctly
- [ ] Dark mode works
- [ ] No console errors

---

## Environment Variables Summary

**Backend (.env):**
- `DISCOGS_CONSUMER_KEY=WDwjaxApILXXiTrTBbpB`
- `DISCOGS_CONSUMER_SECRET=sRLerNInpEQEGTjUuhltwpVOhIJjnbVO`
- `FRONTEND_URL=https://waxvalue.com`
- `CORS_ORIGINS=https://waxvalue.com,https://www.waxvalue.com`
- `SESSION_SECRET=<already set in config file>`
- `LOG_LEVEL=INFO`

**Frontend (.env.production):**
- `NEXT_PUBLIC_BACKEND_URL=https://waxvalue.com/api/backend`

---

**You're ready to deploy! Start with Step 1 above using FileZilla/WinSCP.** 🚀

