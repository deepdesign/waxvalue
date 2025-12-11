# Setup Local Development Environment
# This script creates the necessary .env files for local testing

Write-Host "=== Setting up Local Development Environment ==`n" -ForegroundColor Cyan

# Create backend/.env
$backendEnvPath = "backend\.env"
$backendEnvContent = @"
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
"@

if (Test-Path $backendEnvPath) {
    Write-Host "⚠️  $backendEnvPath already exists. Skipping..." -ForegroundColor Yellow
} else {
    $backendEnvContent | Out-File -FilePath $backendEnvPath -Encoding utf8
    Write-Host "✅ Created $backendEnvPath" -ForegroundColor Green
}

# Create .env.local
$frontendEnvPath = ".env.local"
$frontendEnvContent = @"
# Local Development - Frontend
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
"@

if (Test-Path $frontendEnvPath) {
    Write-Host "⚠️  $frontendEnvPath already exists. Skipping..." -ForegroundColor Yellow
} else {
    $frontendEnvContent | Out-File -FilePath $frontendEnvPath -Encoding utf8
    Write-Host "✅ Created $frontendEnvPath" -ForegroundColor Green
}

Write-Host "`n=== Next Steps ==`n" -ForegroundColor Cyan
Write-Host "1. Update Discogs App:" -ForegroundColor Yellow
Write-Host "   - Go to: https://www.discogs.com/settings/developers" -ForegroundColor White
Write-Host "   - Edit your app (Consumer Key: WDwjaxApILXXiTrTBbpB)" -ForegroundColor White
Write-Host "   - Add callback URL: http://localhost:3000/auth/callback" -ForegroundColor White
Write-Host "`n2. Start Backend:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   venv\Scripts\activate" -ForegroundColor White
Write-Host "   uvicorn main:app --host 127.0.0.1 --port 8000 --reload" -ForegroundColor White
Write-Host "`n3. Start Frontend (in new terminal):" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "`n4. Test at: http://localhost:3000" -ForegroundColor Green
Write-Host "`nSee LOCAL_TEST_QUICKSTART.md for more details!`n" -ForegroundColor Cyan

