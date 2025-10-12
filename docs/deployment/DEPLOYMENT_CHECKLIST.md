# WaxValue Deployment Checklist

## Pre-Deployment Fixes Completed ✅

### 1. Environment Variables
- ✅ Added `FRONTEND_URL` support in backend CORS configuration
- ✅ Added `NEXT_PUBLIC_BACKEND_URL` support for all API routes
- ✅ OAuth callback now uses `FRONTEND_URL` environment variable
- ✅ All 21 API routes use `buildBackendUrl()` utility for dynamic URLs
- ✅ Created ENV_TEMPLATE.md with all required variables

### 2. Code Quality
- ✅ All TypeScript linter errors fixed
- ✅ No hardcoded localhost URLs in frontend code
- ✅ Centralized API configuration in `src/lib/api-config.ts`
- ✅ Proper error handling throughout
- ✅ Production console.log removal configured in `next.config.js`

### 3. Features
- ✅ Discogs avatar support (Gravatar integration)
- ✅ 50 randomized vinyl facts during loading
- ✅ Settings persistence (localStorage)
- ✅ Filter persistence across sessions
- ✅ British English spelling throughout

### 4. Security
- ✅ API credentials loaded from environment variables
- ✅ Sessions and sensitive data in `.gitignore`
- ✅ CORS properly configured
- ✅ `poweredByHeader: false` in Next.js config
- ✅ Session structure includes proper initialization

---

## Environment Variables Required

See `docs/ENV_TEMPLATE.md` for complete template.

### Backend (`backend/.env`)
```bash
DISCOGS_CONSUMER_KEY=your_consumer_key_here
DISCOGS_CONSUMER_SECRET=your_consumer_secret_here
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
SESSION_SECRET=your_random_secret_here
LOG_LEVEL=INFO
```

### Frontend (`.env.local` or `.env.production`)
```bash
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

---

## Deployment Steps

### 1. **Backend Deployment**

**Option A: Traditional Server**
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Set environment variables
export FRONTEND_URL=https://yourdomain.com
export DISCOGS_CONSUMER_KEY=your_key
export DISCOGS_CONSUMER_SECRET=your_secret

# Run with production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Option B: Docker**
```bash
# Create backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. **Frontend Deployment**

**Build for production:**
```bash
# Set environment variables
export BACKEND_URL=https://api.yourdomain.com

# Build
npm run build

# Start production server
npm start
```

**Recommended Platforms:**
- **Vercel** (easiest for Next.js) - Set env vars in dashboard
- **Netlify** - Works well with Next.js
- **Railway** / **Render** - Good for full-stack apps

### 3. **Database** (if upgrading from SQLite)

For production, consider PostgreSQL:
```bash
# Set in backend/.env
DATABASE_URL=postgresql://user:password@host:5432/waxvalue
```

### 4. **Discogs Developer Settings**

Update your Discogs app settings:
- **Callback URL**: `https://yourdomain.com/auth/callback`
- **Application URL**: `https://yourdomain.com`

---

## Production Recommendations

### Performance
- [ ] Enable caching for static assets
- [ ] Use CDN for Next.js static files
- [ ] Consider Redis for session management (currently using file-based)
- [ ] Monitor API rate limits

### Security
- [ ] Enable HTTPS (required for OAuth)
- [ ] Set up proper session encryption
- [ ] Configure security headers
- [ ] Regular dependency updates

### Monitoring
- [ ] Set up error tracking (Sentry recommended)
- [ ] Monitor Discogs API usage
- [ ] Track application performance
- [ ] Set up uptime monitoring

### Scalability
- [ ] Move sessions from file to Redis/PostgreSQL
- [ ] Implement proper rate limiting with Redis
- [ ] Consider background workers for analysis
- [ ] Set up load balancing if needed

---

## Known Limitations

1. **Session Storage**: Currently file-based (`sessions.json`)
   - Works for single server
   - For multi-server, migrate to Redis or database

2. **Rate Limiting**: In-memory token bucket
   - Resets on server restart
   - For production, use Redis-backed rate limiting

3. **OAuth Tokens**: Stored in session
   - Consider encrypting sensitive data
   - Implement token refresh mechanism

---

## Testing Before Deployment

- [ ] Test OAuth flow with production URLs
- [ ] Verify all API endpoints work
- [ ] Test pricing analysis with real data
- [ ] Check mobile responsiveness
- [ ] Test dark/light mode
- [ ] Verify all filters work correctly
- [ ] Test bulk apply functionality
- [ ] Check error handling

---

## Post-Deployment

1. Monitor error logs
2. Check Discogs API rate limits
3. Verify OAuth callbacks work
4. Test from different devices/browsers
5. Monitor performance metrics

---

## Support

- Discogs API Docs: https://www.discogs.com/developers
- Next.js Deployment: https://nextjs.org/docs/deployment
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/

