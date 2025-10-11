# Waxvalue Deployment Script for Hostinger VPS
# Run this from your local machine (Windows PowerShell)

param(
    [switch]$CleanDeploy = $false
)

$VPS_IP = "195.35.15.194"
$VPS_USER = "root"
$PROJECT_DIR = "/var/www/waxvalue"
$DOMAIN = "waxvalue.com"

Write-Host "🚀 Deploying Waxvalue to Hostinger VPS..." -ForegroundColor Cyan
Write-Host ""

# Check if SSH key exists
if (!(Test-Path "$env:USERPROFILE\.ssh\id_ed25519")) {
    Write-Host "❌ SSH key not found at $env:USERPROFILE\.ssh\id_ed25519" -ForegroundColor Red
    Write-Host "Please ensure your SSH key is set up correctly." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow

# Create a temporary deployment directory
$deployDir = "deploy-temp"
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy necessary files (exclude node_modules, .next, etc.)
$excludeDirs = @("node_modules", ".next", "backend/__pycache__", "backend/venv", ".git", "deploy-temp")
$filesToCopy = @(
    "src",
    "public",
    "backend",
    "package.json",
    "package-lock.json",
    "next.config.js",
    "tsconfig.json",
    "tailwind.config.js",
    "postcss.config.js",
    "next-env.d.ts"
)

Write-Host "Copying project files..." -ForegroundColor Gray
foreach ($item in $filesToCopy) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination $deployDir -Recurse -Force
        Write-Host "  ✓ Copied $item" -ForegroundColor Green
    }
}

# Create .env files
Write-Host ""
Write-Host "📝 Creating environment configuration..." -ForegroundColor Yellow

# Backend .env
$backendEnv = @"
DISCOGS_CONSUMER_KEY=your_consumer_key
DISCOGS_CONSUMER_SECRET=your_consumer_secret
FRONTEND_URL=https://$DOMAIN
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
SESSION_SECRET=$(New-Guid)
LOG_LEVEL=INFO
"@

$backendEnv | Out-File -FilePath "$deployDir\backend\.env" -Encoding UTF8

# Frontend .env.production
$frontendEnv = @"
NEXT_PUBLIC_BACKEND_URL=https://$DOMAIN/api/backend
"@

$frontendEnv | Out-File -FilePath "$deployDir\.env.production" -Encoding UTF8

Write-Host "  ✓ Environment files created" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Update Discogs credentials in backend/.env before deploying!" -ForegroundColor Yellow
Write-Host ""

# Create deployment script for VPS
$vpsDeployScript = @'
#!/bin/bash
set -e

echo "🚀 Starting Waxvalue deployment on VPS..."

PROJECT_DIR="/var/www/waxvalue"
CLEAN_DEPLOY=$1

# Stop existing services
echo "🛑 Stopping existing services..."
pm2 stop waxvalue-frontend waxvalue-backend 2>/dev/null || true

# Clean deploy if requested
if [ "$CLEAN_DEPLOY" = "true" ]; then
    echo "🧹 Cleaning previous deployment..."
    rm -rf $PROJECT_DIR
    mkdir -p $PROJECT_DIR
fi

# Ensure directory exists
mkdir -p $PROJECT_DIR

echo "✅ VPS prepared for deployment"
'@

$vpsDeployScript | Out-File -FilePath "$deployDir\vps-prepare.sh" -Encoding UTF8 -NoNewline

Write-Host "📤 Deployment package ready in: $deployDir" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update Discogs credentials in: $deployDir\backend\.env" -ForegroundColor White
Write-Host "2. Run: .\upload-to-vps.ps1" -ForegroundColor White
Write-Host ""

