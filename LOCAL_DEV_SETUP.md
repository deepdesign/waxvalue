# Quick Local Development Setup

## The Problem
After authorizing on Discogs, you're redirected to `www.waxvalue.com` instead of `localhost:3000`.

## The Solution (Choose One)

### ✅ Option 1: Use Production Session (Easiest - No OAuth Setup)

1. Go to https://www.waxvalue.com and authenticate
2. Open DevTools (F12) → Application → Local Storage → Copy `waxvalue_session_id`
3. On http://localhost:3000, open Console and run:
   ```javascript
   localStorage.setItem('waxvalue_session_id', 'paste_session_id_here')
   ```
4. Refresh - you're authenticated! 🎉

### Option 2: Fix OAuth Redirect

1. **Create `backend/.env`**:
   ```bash
   FRONTEND_URL=http://localhost:3000
   CORS_ORIGINS=http://localhost:3000
   DISCOGS_CONSUMER_KEY=your_key
   DISCOGS_CONSUMER_SECRET=your_secret
   SESSION_SECRET=any_secret
   ```

2. **Create `.env.local`** (project root):
   ```bash
   NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
   ```

3. **Add localhost to Discogs**:
   - Go to https://www.discogs.com/settings/developers
   - Edit your app
   - Add `http://localhost:3000` as redirect URI (keep production one too)

4. **Restart both servers**

## Full Documentation
See [docs/development/LOCAL_DEVELOPMENT.md](docs/development/LOCAL_DEVELOPMENT.md) for complete guide.

