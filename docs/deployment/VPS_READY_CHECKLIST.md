# VPS Deployment Readiness Checklist

## Quick SSH Test

Open PowerShell and run:
```powershell
ssh -p 65002 u728332901@195.35.15.194
```
Password: `Babylon1!`

Once connected, run these quick checks:

---

## Essential Checks

### 1. Check Home Directory
```bash
pwd
ls -la ~
```

**Expected:** `/home/u728332901`

---

### 2. Check Dependencies

```bash
# Node.js
node --version  # Should be v18+

# Python  
python3 --version  # Should be 3.11+

# Nginx
nginx -v

# PM2
pm2 --version
```

---

### 3. Check for Old Installation

```bash
ls -la ~/waxvalue
```

**If exists:** Need to clean it up  
**If not found:** ✅ Ready for fresh install

---

### 4. Check Running Processes

```bash
pm2 list
```

**If shows waxvalue processes:** Need to stop them  
**If empty or not installed:** ✅ Clean

---

### 5. Check Nginx Config

```bash
sudo ls -la /etc/nginx/sites-enabled/
```

**If waxvalue config exists:** Need to remove  
**If not found:** ✅ Clean

---

### 6. Check Disk Space

```bash
df -h ~
```

**Need:** At least 5GB free  
**Recommended:** 10GB+ free

---

## Cleanup Commands (If Needed)

### If old waxvalue exists:
```bash
# Stop services
pm2 delete all

# Remove old installation (it's outdated)
rm -rf ~/waxvalue

# Remove old Nginx config
sudo rm -f /etc/nginx/sites-enabled/waxvalue
sudo rm -f /etc/nginx/sites-available/waxvalue

# Create fresh directory
mkdir -p ~/waxvalue
```

### OR use the automated script:
```bash
# Upload CLEANUP_VPS_NOW.sh to VPS
# Then run:
bash CLEANUP_VPS_NOW.sh
```

---

## ✅ Ready for Deployment When:

- [ ] SSH access working
- [ ] Old installations cleaned/backed up
- [ ] PM2 processes stopped
- [ ] Nginx configs removed
- [ ] Fresh `~/waxvalue` directory exists
- [ ] At least 5GB disk space free
- [ ] Dependencies installed (or ready to install)

---

## Next Step After Cleanup:

Follow **DEPLOY_INSTRUCTIONS.md** to upload and deploy Waxvalue!

---

## VPS Details

- **IP:** 195.35.15.194
- **Port:** 65002
- **User:** u728332901
- **Password:** Babylon1!
- **Deploy to:** /home/u728332901/waxvalue/

---

**The VPS should already have most dependencies installed from previous attempts. We just need to clean up the old installation and do a fresh deploy.**

