# Local Development Setup

This guide helps you test locally at `http://localhost:3000` without affecting production.

## Quick Setup (3 Steps)

### Step 1: Backend Environment Variables

Create `backend/.env` file with:

```bash
# Local Development Configuration
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# Discogs API Credentials (same as production - copy from your production server)
DISCOGS_CONSUMER_KEY=your_consumer_key_here
DISCOGS_CONSUMER_SECRET=your_consumer_secret_here

# Session Configuration
SESSION_SECRET=your_local_secret_key_here
```

**Important**: The `FRONTEND_URL=http://localhost:3000` setting ensures OAuth callbacks go to `http://localhost:3000/auth/callback` instead of the production site (`www.waxvalue.com`).

### Step 2: Frontend Environment Variables

Create `.env.local` in the project root (same level as `package.json`):

```bash
# Local Development - Frontend
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

### Step 3: Discogs OAuth Settings

**Good news**: You don't need to change Discogs settings! The callback URL is dynamically set based on your `FRONTEND_URL` environment variable.

**However**, Discogs OAuth requires the callback URL to be registered. You have two options:

#### Option A: Add localhost to existing app (Easiest)
1. Go to https://www.discogs.com/settings/developers
2. Edit your Waxvalue application
3. Add `http://localhost:3000` as an **additional** redirect URI (keep `https://waxvalue.com` too)
4. Discogs allows multiple redirect URIs

#### Option B: Use production session (No OAuth needed - Recommended for quick testing)
See "Testing Without OAuth" section below.

## Testing Without OAuth (Easiest Method)

**Recommended**: Use your production session locally - no OAuth setup needed!

### Use Production Session Locally

1. **Open production site**: https://www.waxvalue.com
2. **Authenticate** with Discogs (if not already)
3. **Open DevTools** (F12) → **Application** tab → **Local Storage** → `https://www.waxvalue.com`
4. **Copy** the `waxvalue_session_id` value
5. **Open your local site**: http://localhost:3000
6. **Open DevTools** → **Console** tab
7. **Paste and run**:
   ```javascript
   localStorage.setItem('waxvalue_session_id', 'paste_your_session_id_here')
   ```
8. **Refresh** the page - you'll be authenticated!

**Benefits**:
- ✅ No OAuth setup needed
- ✅ Uses your real Discogs inventory
- ✅ Works immediately
- ✅ No changes to Discogs settings

**Note**: This uses your production Discogs connection, so you'll see your real inventory data. Perfect for testing UI changes!

## Running Locally

1. **Start Backend**:
   ```bash
   cd backend
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

3. **Access**: http://localhost:3000

## Environment Variable Priority

The backend uses this priority:
1. `FRONTEND_URL` from `backend/.env` (local development)
2. System environment variable (production)
3. Default: `http://localhost:3000`

**Production server** should have `FRONTEND_URL=https://waxvalue.com` set in its environment (not in `.env` file).

## Troubleshooting

### Redirected to Production Site

**Problem**: After OAuth, you're redirected to `www.waxvalue.com` instead of `localhost:3000`

**Solution**: 
1. Check `backend/.env` has `FRONTEND_URL=http://localhost:3000`
2. Restart the backend server
3. Clear browser cache/cookies for localhost

### "Session ID required" Error

**Problem**: Frontend can't connect to backend

**Solution**:
1. Verify backend is running on port 8000
2. Check `.env.local` has `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000`
3. Restart frontend dev server

### CORS Errors

**Problem**: Browser blocks requests due to CORS

**Solution**:
1. Ensure `backend/.env` has `CORS_ORIGINS=http://localhost:3000`
2. Restart backend server

## Production vs Development

| Setting | Development | Production |
|---------|------------|------------|
| `FRONTEND_URL` | `http://localhost:3000` | `https://waxvalue.com` |
| `NEXT_PUBLIC_BACKEND_URL` | `http://127.0.0.1:8000` | `https://waxvalue.com/api/backend` |
| Discogs Callback | `http://localhost:3000/auth/callback` | `https://waxvalue.com/auth/callback` |

## Best Practices

1. **Never commit `.env` files** - they're in `.gitignore`
2. **Use separate Discogs apps** for dev/prod if possible
3. **Test OAuth flow** before deploying to production
4. **Keep production env vars** in your hosting platform's UI, not in code

