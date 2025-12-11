# Test UI Changes Without OAuth Setup ⚡

**Easiest way to test UI changes locally** - uses your existing production Discogs connection.

## Quick Method (Copy-Paste)

### Step 1: Get Your Production Session

1. **Open production site**: https://www.waxvalue.com
2. **Authenticate** if needed (click "Connect to Discogs")
3. **Open DevTools**: Press `F12` (or right-click → Inspect)
4. **Go to**: `Application` tab → `Local Storage` → `https://www.waxvalue.com`
5. **Find**: `waxvalue_session_id`
6. **Copy** the value (double-click to select, Ctrl+C)

### Step 2: Use Session on Localhost

1. **Start your local servers** (see below)
2. **Open**: http://localhost:3000
3. **Open DevTools**: Press `F12` → `Console` tab
4. **Paste and run**:
   ```javascript
   localStorage.setItem('waxvalue_session_id', 'PASTE_YOUR_SESSION_ID_HERE')
   ```
5. **Refresh** the page (F5)
6. **Done!** You're authenticated with your real Discogs data 🎉

## Start Local Servers

### Terminal 1: Backend
```powershell
cd backend
venv\Scripts\activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2: Frontend
```powershell
npm run dev
```

Then open: http://localhost:3000

## What This Lets You Test

✅ **All UI changes**:
- Text selection (should work everywhere)
- No I-beam cursor
- No focus outlines
- Footer logo updates
- Inventory table price display
- All visual changes

✅ **Real Data**:
- Your actual Discogs inventory
- Real pricing suggestions
- All your existing data

❌ **What You Can't Test This Way**:
- New OAuth flow (you're already authenticated)
- First-time authentication
- OAuth callback improvements

## Pro Tip: Bookmarklet (One-Click Setup)

Save this as a bookmark for even faster setup:

**Bookmark URL**:
```javascript
javascript:(function(){const s=prompt('Paste your production session ID:');if(s)localStorage.setItem('waxvalue_session_id',s);location.reload();})();
```

**How to use**:
1. Create a new bookmark
2. Set the URL to the code above
3. Name it "Use Prod Session"
4. On localhost, click the bookmark
5. Paste your session ID when prompted
6. Done!

## Session Expiration

Production sessions typically last 7-30 days. If you get "Not authenticated" errors:
1. Go back to production site
2. Re-authenticate if needed
3. Copy the new session ID
4. Update it on localhost

## Troubleshooting

**"Not authenticated" error**:
- Check session ID was copied correctly (no extra spaces)
- Make sure you copied from `https://www.waxvalue.com` local storage
- Try getting a fresh session ID from production

**Backend not responding**:
- Check backend is running on port 8000
- Verify `.env.local` has `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000`

**Frontend not connecting**:
- Check frontend is running on port 3000
- Clear browser cache for localhost
- Check browser console for errors

