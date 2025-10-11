# Environment Variables Template

Copy this to `.env` in your project root (frontend) and `backend/.env` (backend).

## Frontend (.env)

```bash
# ==================================
# waxvalue Environment Configuration
# ==================================

# Backend API URL
# In development: http://127.0.0.1:8000
# In production: Your backend server URL (e.g., https://api.waxvalue.com)
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

## Backend (backend/.env)

```bash
# ==================================
# waxvalue Backend Configuration
# ==================================

# Discogs API Credentials
# Get these from https://www.discogs.com/settings/developers
DISCOGS_CONSUMER_KEY=your_consumer_key_here
DISCOGS_CONSUMER_SECRET=your_consumer_secret_here

# Frontend URL for OAuth callback
# In development: http://localhost:3000
# In production: Your frontend domain (e.g., https://waxvalue.com)
FRONTEND_URL=http://localhost:3000

# Session Configuration
SESSION_SECRET=your_secret_key_here

# CORS Configuration
# Allowed origins for CORS (comma-separated for multiple)
CORS_ORIGINS=http://localhost:3000

# Logging Level (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO
```

## Production Deployment

### Frontend (Next.js)
1. Set `NEXT_PUBLIC_BACKEND_URL` to your backend API URL
2. Build: `npm run build`
3. Start: `npm start`

### Backend (FastAPI)
1. Set `FRONTEND_URL` for OAuth callbacks
2. Set `CORS_ORIGINS` to match your frontend domain
3. Install deps: `pip install -r backend/requirements.txt`
4. Run: `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000`

### Environment Variable Security
- ⚠️ **Never commit `.env` files to version control**
- Use your hosting platform's environment variable UI
- Examples: Railway, Vercel, AWS, Heroku, DigitalOcean, etc.
- Generate strong random strings for `SESSION_SECRET`

