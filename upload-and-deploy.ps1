# Waxvalue - Upload and Deploy to Hostinger VPS
# Run from: C:\Projects\Web\waxvalue

$VPS_HOST = "195.35.15.194"
$VPS_PORT = "65002"
$VPS_USER = "u728332901"
$VPS_DIR = "/home/u728332901/waxvalue"

Write-Host "`n🚀 Waxvalue Deployment to Hostinger VPS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "⚠️  You will be prompted for SSH password: Babylon1!" -ForegroundColor Yellow
Write-Host ""

# Create temporary clean directory for upload
$tempDir = "deploy-package"
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow

if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy project files (exclude build artifacts and dependencies)
$itemsToCopy = @(
    "src",
    "public",
    "backend",
    "package.json",
    "package-lock.json",
    "next.config.js",
    "tsconfig.json",
    "tailwind.config.js",
    "postcss.config.js",
    "next-env.d.ts",
    "deploy-final.sh",
    "setup-project-on-vps.sh"
)

foreach ($item in $itemsToCopy) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination $tempDir -Recurse -Force
        Write-Host "  ✓ Copied $item" -ForegroundColor Green
    }
}

# Remove unnecessary files from backend
if (Test-Path "$tempDir/backend/venv") {
    Remove-Item -Recurse -Force "$tempDir/backend/venv"
}
if (Test-Path "$tempDir/backend/__pycache__") {
    Remove-Item -Recurse -Force "$tempDir/backend/__pycache__"
}
if (Test-Path "$tempDir/backend/sessions.json") {
    Remove-Item -Force "$tempDir/backend/sessions.json"
}

# Copy environment files
Copy-Item "config/production.env.backend" "$tempDir/backend/.env"
Copy-Item "config/production.env.frontend" "$tempDir/.env.production"

Write-Host "  ✓ Environment files added" -ForegroundColor Green
Write-Host ""

Write-Host "📤 Uploading to VPS..." -ForegroundColor Yellow
Write-Host "  This will take a few minutes..." -ForegroundColor Gray
Write-Host ""

# Create project directory on VPS
Write-Host "  Creating directory on VPS..." -ForegroundColor Gray
ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} "mkdir -p $VPS_DIR"

# Upload files using SCP
Write-Host "  Uploading files (this may take 3-5 minutes)..." -ForegroundColor Gray
scp -P $VPS_PORT -r $tempDir/* ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/

Write-Host ""
Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green
Write-Host ""

# Make scripts executable and run deployment
Write-Host "🔧 Running deployment script on VPS..." -ForegroundColor Yellow
Write-Host ""

ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} @"
cd $VPS_DIR
chmod +x deploy-final.sh setup-project-on-vps.sh
bash deploy-final.sh
"@

Write-Host ""
Write-Host "✅ Deployment script completed!" -ForegroundColor Green
Write-Host ""

# Cleanup
Remove-Item -Recurse -Force $tempDir

Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Install SSL certificate:" -ForegroundColor White
Write-Host "   ssh -p 65002 u728332901@195.35.15.194" -ForegroundColor Gray
Write-Host "   sudo certbot --nginx -d waxvalue.com -d www.waxvalue.com" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update Discogs OAuth callback:" -ForegroundColor White
Write-Host "   https://www.discogs.com/settings/developers" -ForegroundColor Gray
Write-Host "   Callback URL: https://waxvalue.com/auth/callback" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test your site:" -ForegroundColor White
Write-Host "   https://waxvalue.com" -ForegroundColor Gray
Write-Host ""

