# Deployment Scripts

Scripts for deploying Waxvalue to production servers.

---

## 📁 Files in this Directory

### VPS Deployment Scripts

**Primary Deployment:**
- `deploy-final.sh` - Complete VPS deployment (run on VPS)
- `setup-project-on-vps.sh` - Project setup (run on VPS)

**VPS Preparation:**
- `CLEANUP_VPS_NOW.sh` - Clean old installation (run on VPS)
- `vps-check.sh` - Check VPS status (run on VPS)
- `vps-cleanup-and-check.sh` - Interactive cleanup (run on VPS)

**From Local Machine:**
- `upload-and-deploy.ps1` - Upload files and deploy from Windows
- `upload-to-vps.ps1` - Upload files only
- `check-vps-remote.ps1` - Check VPS remotely
- `clean-vps-remote.ps1` - Clean VPS remotely

---

## 🚀 Quick Deployment Guide

### Method 1: Manual Upload + Script (Recommended)

1. **Upload files via FileZilla/WinSCP**
   - Host: 195.35.15.194
   - Port: 65002
   - User: u728332901
   - Upload to: `/home/u728332901/waxvalue/`

2. **SSH into VPS**
   ```bash
   ssh -p 65002 u728332901@195.35.15.194
   ```

3. **Run deployment**
   ```bash
   cd ~/waxvalue
   bash deploy-final.sh
   ```

### Method 2: Automated (Windows)

```powershell
.\upload-and-deploy.ps1
```

This will:
- Create deployment package
- Upload to VPS
- Run deployment script
- Install dependencies
- Start services

---

## 🧹 VPS Cleanup

If you have an old installation:

```bash
ssh -p 65002 u728332901@195.35.15.194
bash CLEANUP_VPS_NOW.sh
```

Or manually:
```bash
pm2 delete all
rm -rf ~/waxvalue
sudo rm -f /etc/nginx/sites-enabled/waxvalue
mkdir -p ~/waxvalue
```

---

## 📋 What Each Script Does

### `deploy-final.sh`
- Installs Node.js, Python, Nginx, PM2, Certbot
- Sets up backend Python virtual environment
- Installs all project dependencies
- Builds Next.js production bundle
- Configures Nginx reverse proxy
- Starts services with PM2
- Sets up auto-restart on reboot

### `setup-project-on-vps.sh`
- Assumes dependencies already installed
- Installs project dependencies only
- Builds application
- Configures Nginx
- Starts services

### `CLEANUP_VPS_NOW.sh`
- Stops PM2 processes
- Removes old waxvalue directory
- Removes old Nginx configs
- Cleans ports 3000 and 8000
- Creates fresh directory

---

## ⚠️ Important Notes

- **Password:** Scripts will prompt for SSH password (Babylon1!)
- **Sudo:** Some commands require sudo (will prompt for password)
- **SSL:** Run `sudo certbot --nginx -d waxvalue.com -d www.waxvalue.com` after deployment
- **OAuth:** Update Discogs callback to `https://waxvalue.com/auth/callback` after SSL

---

## 🔧 VPS Access

```
Host: 195.35.15.194
Port: 65002
User: u728332901
Password: Babylon1!
Directory: /home/u728332901/waxvalue
```

---

For complete deployment instructions, see:
[../docs/deployment/DEPLOY_INSTRUCTIONS.md](../docs/deployment/DEPLOY_INSTRUCTIONS.md)

