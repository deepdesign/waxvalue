# 🚨 URGENT: VPS Malware Cleanup & Security Fix

## Immediate Actions Required

### Step 1: Start Your VPS
1. Log into your Hostinger VPS control panel
2. Start the VPS server

### Step 2: Upload and Run Cleanup Script

**On your local machine (PowerShell):**
```powershell
# Upload cleanup script to VPS
scp cleanup-malware.sh root@93.127.200.187:/root/

# Upload security fixes
scp -r src/lib/api-security.ts root@93.127.200.187:/var/www/waxvalue/src/lib/
```

**On your VPS (SSH):**
```bash
# SSH to server
ssh root@93.127.200.187

# Make script executable
chmod +x /root/cleanup-malware.sh

# Run cleanup
/root/cleanup-malware.sh
```

### Step 3: Apply Security Fixes to Code

**On your local machine:**
```powershell
# Commit security fixes
git add src/lib/api-security.ts src/app/api/backend/auth/setup/route.ts cleanup-malware.sh
git commit -m "Security: Add API security middleware and fix CVE-2025-55182"
git push
```

**On your VPS:**
```bash
cd /var/www/waxvalue
git pull origin master

# Update Next.js
npm install next@latest react@latest react-dom@latest --save

# Rebuild frontend
npm run build

# Restart services
pm2 restart all
pm2 save
```

### Step 4: Secure All API Routes

You need to apply the security middleware to ALL API routes. Here's the pattern:

**Before:**
```typescript
export async function POST(request: NextRequest) {
  // handler code
}
```

**After:**
```typescript
import { withSecurity } from '@/lib/api-security'

async function handleRequest(request: NextRequest) {
  // handler code
}

export const POST = withSecurity(handleRequest, { requireAuth: true })
```

### Step 5: Additional Security Measures

1. **Change all passwords:**
   - SSH password
   - Database passwords
   - API keys

2. **Review Nginx logs:**
   ```bash
   tail -f /var/log/nginx/access.log | grep -E "POST|PUT|DELETE"
   ```

3. **Monitor for suspicious activity:**
   ```bash
   # Check running processes
   ps aux | grep -E "systemhelper|minerd|xmrig"
   
   # Check network connections
   netstat -tulpn | grep -vE "127.0.0.1|::1"
   ```

4. **Enable firewall:**
   ```bash
   ufw enable
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ```

## What Was Fixed

1. ✅ Added rate limiting to prevent brute force attacks
2. ✅ Added input validation to prevent code injection
3. ✅ Created security middleware for all API routes
4. ✅ Secured `/api/backend/auth/setup` route
5. ✅ Updated Next.js to latest version

## Remaining Work

You need to apply `withSecurity` middleware to ALL API routes in:
- `src/app/api/backend/**/*.ts`

Routes that need authentication should use:
```typescript
export const POST = withSecurity(handleRequest, { requireAuth: true })
```

Routes that are public (like OAuth setup) should use:
```typescript
export const POST = withSecurity(handleRequest, { allowPublic: true })
```

## Monitoring

After cleanup, monitor your server:
```bash
# Watch PM2 logs
pm2 logs

# Monitor system resources
htop

# Check for suspicious processes
watch -n 5 'ps aux | grep -E "systemhelper|minerd|xmrig"'
```

