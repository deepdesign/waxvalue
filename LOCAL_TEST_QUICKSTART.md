# Quick Local Testing Guide

## 🚀 Fastest Method: Test UI Without OAuth Setup

**Want to skip OAuth and test UI changes immediately?** See **[test-ui-without-oauth.md](test-ui-without-oauth.md)** for the easiest method using your production session.

This lets you test all UI changes with your real data - no OAuth configuration needed!

---

## Full OAuth Setup (For Testing OAuth Flow)

## Step 0: Create Environment Files

### Create `backend/.env`

Create a file called `.env` in the `backend` folder with:

```bash
# Local Development Configuration
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# Discogs API Credentials
DISCOGS_CONSUMER_KEY=WDwjaxApILXXiTrTBbpB
DISCOGS_CONSUMER_SECRET=sRLerNInpEQEGTjUuhltwpVOhIJjnbVO

# Session Configuration
SESSION_SECRET=local-dev-secret-key-change-in-production-12345678901234567890

# Logging Level
LOG_LEVEL=INFO
```

### Create `.env.local` (in project root)

Create a file called `.env.local` in the root folder (same level as `package.json`) with:

```bash
# Local Development - Frontend
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

## Step 1: Update Discogs App Settings

**Important**: You need to add `http://localhost:3000/auth/callback` as a callback URL in your Discogs app.

1. Go to: https://www.discogs.com/settings/developers
2. Find your "Waxvalue" app (Consumer Key: `WDwjaxApILXXiTrTBbpB`)
3. Edit the app
4. In the "Callback URL" or "Redirect URI" field, add:
   ```
   http://localhost:3000/auth/callback
   ```
   (Keep your production URL too if it's already there)

## Step 2: Start Backend

Open a terminal and run:

```bash
cd backend
venv\Scripts\activate  # Windows
# OR: source venv/bin/activate  # Mac/Linux

uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will be running at: http://127.0.0.1:8000

## Step 3: Start Frontend

Open a **new** terminal and run:

```bash
npm run dev
```

The frontend will be running at: http://localhost:3000

## Step 4: Test OAuth Flow

1. Open http://localhost:3000 in your browser
2. Click "Connect to Discogs" or any auth button
3. You'll be redirected to Discogs to authorize
4. After authorizing, you'll be redirected back to `http://localhost:3000/auth/callback`
5. The app should complete the OAuth flow without the error popup

## What We're Testing

✅ **OAuth callback improvements**:
- Retry logic for token retrieval
- Dual storage (localStorage + sessionStorage)
- Fallback token handling
- No more "Authorisation failed" popup on first attempt

✅ **UI text selection**:
- All text should be selectable
- No I-beam cursor visible

✅ **Focus outlines**:
- No focus outlines on interactive elements

## Alternative: Quick Test Without OAuth

If you want to skip OAuth setup and test UI changes only:

1. Go to https://www.waxvalue.com
2. Authenticate with Discogs
3. Open DevTools (F12) → Application → Local Storage
4. Copy the `waxvalue_session_id` value
5. On http://localhost:3000, open Console and run:
   ```javascript
   localStorage.setItem('waxvalue_session_id', 'paste_session_id_here')
   ```
6. Refresh - you're authenticated!

This uses your production session but lets you test locally.

