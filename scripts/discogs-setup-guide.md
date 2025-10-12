# Waxvalue Discogs API setup guide

This guide will help you set up the real Discogs API integration for Waxvalue.

## Step 1: Create Discogs API application

1. **Go to**: https://www.discogs.com/settings/developers
2. **Click**: "Generate new token" or "Create new application"
3. **Fill out the application form**:
   - **Application Name**: `Waxvalue`
   - **Description**: `Automated pricing suggestions for Discogs inventory`
   - **Website URL**: `http://localhost:3000`
   - **Redirect URI**: `http://localhost:3000`

4. **Note down**:
   - **Consumer Key** (OAuth Consumer Key)
   - **Consumer Secret** (OAuth Consumer Secret)

## Step 2: Configure environment variables

### Backend environment (.env)

Create `backend/.env` with:

```env
# Waxvalue Backend Environment Variables
DISCOGS_CONSUMER_KEY=your_consumer_key_here
DISCOGS_CONSUMER_SECRET=your_consumer_secret_here
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_OAUTH_URL=https://www.discogs.com/oauth
DATABASE_URL=sqlite:///./waxvalue.db
SECRET_KEY=waxvalue-secret-key-12345
```

### Frontend environment (.env.local)

Create `.env.local` with:

```env
# Waxvalue Frontend Environment Variables
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Step 3: Update development backend

The development backend (`backend/main-dev.py`) needs to be updated to use real OAuth instead of mock data. The production backend (`backend/main.py`) already has proper Discogs integration.

## Step 4: Test the connection

1. **Restart your development servers**:
   - Stop current servers (Ctrl+C)
   - Run: `scripts/start-dev.bat` (or `start-dev.ps1`)

2. **Test the connection**:
   - Go to http://localhost:3000/dashboard
   - Click "Connect to Discogs"
   - You should be redirected to the real Discogs OAuth page
   - After authorizing, you'll be redirected back to Waxvalue

3. **Verify connection**:
   - Your Discogs account should be connected
   - You can start testing with your real inventory

## Troubleshooting

### Common issues

1. **"Discogs API credentials not configured"**
   - Make sure `backend/.env` exists with your credentials
   - Restart the backend server after adding credentials

2. **OAuth redirect issues**
   - Ensure redirect URI in Discogs app matches `http://localhost:3000`
   - Check that both frontend and backend are running

3. **Rate limiting**
   - Discogs has API rate limits
   - The client includes automatic retry with exponential backoff

### Next steps

Once connected, you can:
- View your real Discogs inventory
- Run pricing analysis on your actual listings
- Test the pricing strategies with your real data
- Export pricing suggestions

## Security notes

- Never commit your `.env` files to version control
- Keep your Consumer Secret secure
- Use environment variables in production
- Consider using a secrets management system for production deployment
