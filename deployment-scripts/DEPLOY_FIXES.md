# Deployment Script Fixes - Preventing 502 Errors

## Problem Summary
The 502 Bad Gateway error was caused by:
1. **Using `npm run dev` instead of `npm run start`** - Development mode doesn't run in production
2. **No build verification** - Script continued even if build failed
3. **No health checks** - No verification that services were actually listening on ports 3000 and 8000
4. **Silent failures** - Script didn't stop on errors

## Fixes Applied

### 1. Main Deploy Script (`deploy-on-vps.sh`)
- ✅ **Uses production mode**: `npm run start` (via `pm2 start npm -- start`)
- ✅ **Build verification**: Exits if build fails (uses `set -e`)
- ✅ **Health checks**: Verifies ports 3000 and 8000 are listening
- ✅ **HTTP health checks**: Tests if services respond to HTTP requests
- ✅ **Better error handling**: Stops on errors, shows clear error messages
- ✅ **PM2 logging**: Proper log file paths configured

### 2. Fix 502 Script (`fix-502.sh`)
- ✅ **Updated to use production mode**: Now uses `npm run start` instead of `npm run dev`

## Usage

### Standard Deployment
```bash
cd /var/www/waxvalue
bash deployment-scripts/deploy-on-vps.sh
```

### Quick Fix for 502 Errors
```bash
cd /var/www/waxvalue
bash deployment-scripts/fix-502.sh
```

### Manual One-Liner (for Hostinger Terminal)
```bash
cd /var/www/waxvalue && git pull origin master && cd backend && source venv/bin/activate && pip install -r requirements.txt -q && deactivate && cd .. && npm install && npm run build && pm2 delete waxvalue-backend waxvalue-frontend 2>/dev/null; cd backend && pm2 start "source venv/bin/activate && uvicorn main:app --host 127.0.0.1 --port 8000" --name waxvalue-backend --interpreter bash --max-memory-restart 500M && cd .. && pm2 start npm --name waxvalue-frontend --max-memory-restart 500M -- start && pm2 save && sleep 5 && ss -tlnp | grep -E ':(3000|8000)' && echo "✅ Deployment complete!"
```

## Key Changes

### Before (Problematic)
```bash
npm run build 2>/dev/null || echo "Build failed, using dev mode"
pm2 start "cd $(pwd) && npm run dev" --name waxvalue-frontend
```

### After (Fixed)
```bash
npm run build || { echo "❌ Build failed"; exit 1; }
pm2 start npm --name waxvalue-frontend -- start
```

## Verification Steps

After deployment, verify:
1. **PM2 Status**: `pm2 status` - Both services should show "online"
2. **Ports Listening**: `ss -tlnp | grep -E ':(3000|8000)'` - Both ports should appear
3. **HTTP Health**: 
   - `curl http://127.0.0.1:3000` - Should return HTML
   - `curl http://127.0.0.1:8000/docs` - Should return backend docs
4. **Nginx**: `sudo nginx -t && sudo systemctl status nginx` - Should be running

## Troubleshooting

If you still get 502 errors:

1. **Check if services are running**:
   ```bash
   pm2 status
   pm2 logs waxvalue-frontend --lines 50
   pm2 logs waxvalue-backend --lines 50
   ```

2. **Check if ports are listening**:
   ```bash
   ss -tlnp | grep -E ':(3000|8000)'
   ```

3. **Check nginx configuration**:
   ```bash
   sudo nginx -t
   sudo tail -n 50 /var/log/nginx/error.log
   ```

4. **Manual service test**:
   ```bash
   # Test backend
   curl http://127.0.0.1:8000/docs
   
   # Test frontend
   curl http://127.0.0.1:3000
   ```

## Production vs Development

- **Development**: `npm run dev` - Hot reload, slower, not for production
- **Production**: `npm run start` - Optimized build, faster, what nginx expects

Always use `npm run start` on the VPS!

