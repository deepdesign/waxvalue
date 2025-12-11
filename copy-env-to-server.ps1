# Copy environment files to VPS server
# Run this from PowerShell in the waxvalue project root

$SERVER = "root@93.127.200.187"
$SERVER_PATH = "/var/www/waxvalue"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_ed25519"
$SCP_EXE = "C:\Windows\System32\OpenSSH\scp.exe"

Write-Host ""
Write-Host "=== Copying Environment Files to Server ===" -ForegroundColor Green
Write-Host ""
Write-Host "Note: You'll be prompted for SSH key passphrase: Babylon1!" -ForegroundColor Gray
Write-Host ""

# Step 1: Copy backend .env
if (Test-Path "backend\.env") {
    Write-Host "1. Copying backend/.env to server..." -ForegroundColor Yellow
    $dest = $SERVER + ":" + $SERVER_PATH + "/backend/.env"
    & $SCP_EXE -i $SSH_KEY backend\.env $dest
    Write-Host "   Backend .env copied!" -ForegroundColor Green
} else {
    Write-Host "   ERROR: backend/.env not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. SSH to your server:" -ForegroundColor Yellow
Write-Host "   ssh $SERVER" -ForegroundColor White
Write-Host ""
Write-Host "2. Update backend .env with production values:" -ForegroundColor Yellow
Write-Host "   cd $SERVER_PATH/backend" -ForegroundColor White
Write-Host "   nano .env" -ForegroundColor White
Write-Host "   Add these lines:" -ForegroundColor Gray
Write-Host "   FRONTEND_URL=https://waxvalue.com" -ForegroundColor Gray
Write-Host "   CORS_ORIGINS=https://waxvalue.com,https://www.waxvalue.com" -ForegroundColor Gray
Write-Host "   SESSION_SECRET=(generate with: openssl rand -base64 32)" -ForegroundColor Gray
Write-Host "   LOG_LEVEL=INFO" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Create frontend .env.production:" -ForegroundColor Yellow
Write-Host "   cd $SERVER_PATH" -ForegroundColor White
Write-Host "   echo 'NEXT_PUBLIC_BACKEND_URL=https://waxvalue.com/api/backend' > .env.production" -ForegroundColor White
Write-Host ""
Write-Host "4. Restart services:" -ForegroundColor Yellow
Write-Host "   pm2 restart all" -ForegroundColor White
Write-Host "   pm2 save" -ForegroundColor White
Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
