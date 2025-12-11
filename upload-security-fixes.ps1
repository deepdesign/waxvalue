# Upload security fixes to VPS
# Run this from PowerShell in the waxvalue project root
# Uses SSH key authentication (C:\Users\JCutts\.ssh\id_ed25519)

$SERVER = "root@93.127.200.187"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_ed25519"
$SSH_EXE = "C:\Windows\System32\OpenSSH\ssh.exe"
$SCP_EXE = "C:\Windows\System32\OpenSSH\scp.exe"

Write-Host ""
Write-Host "=== Uploading Security Fixes to VPS ===" -ForegroundColor Green
Write-Host ""

# Check if SSH tools exist
if (-not (Test-Path $SSH_EXE)) {
    Write-Host "ERROR: SSH not found. Please install OpenSSH Client:" -ForegroundColor Red
    Write-Host "  Run as Administrator: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Yellow
    exit 1
}

# Check if SSH key exists
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "ERROR: SSH key not found at $SSH_KEY" -ForegroundColor Red
    Write-Host "Please ensure your SSH key is in the correct location." -ForegroundColor Yellow
    exit 1
}

Write-Host "Using SSH key: $SSH_KEY" -ForegroundColor Gray
Write-Host ""

# Upload cleanup script
Write-Host "1. Uploading cleanup script..." -ForegroundColor Yellow
& $SCP_EXE -i $SSH_KEY cleanup-malware.sh "${SERVER}:/root/"
Write-Host "   Cleanup script uploaded!" -ForegroundColor Green

# Upload security middleware
Write-Host "2. Uploading security middleware..." -ForegroundColor Yellow
# Create directory if it doesn't exist
& $SSH_EXE -i $SSH_KEY $SERVER "mkdir -p /var/www/waxvalue/src/lib" 2>&1 | Out-Null
& $SCP_EXE -i $SSH_KEY src/lib/api-security.ts "${SERVER}:/var/www/waxvalue/src/lib/"
Write-Host "   Security middleware uploaded!" -ForegroundColor Green

# Upload secured setup route
Write-Host "3. Uploading secured API route..." -ForegroundColor Yellow
# Create directory if it doesn't exist
& $SSH_EXE -i $SSH_KEY $SERVER "mkdir -p /var/www/waxvalue/src/app/api/backend/auth/setup" 2>&1 | Out-Null
& $SCP_EXE -i $SSH_KEY src/app/api/backend/auth/setup/route.ts "${SERVER}:/var/www/waxvalue/src/app/api/backend/auth/setup/"
Write-Host "   Secured API route uploaded!" -ForegroundColor Green

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. SSH to your VPS (you'll be prompted for key passphrase: Babylon1!):" -ForegroundColor Yellow
Write-Host "   .\connect-to-vps.ps1" -ForegroundColor White
Write-Host "   OR: $SSH_EXE -i `"$SSH_KEY`" $SERVER" -ForegroundColor White
Write-Host ""
Write-Host "2. Run the cleanup script:" -ForegroundColor Yellow
Write-Host "   chmod +x /root/cleanup-malware.sh" -ForegroundColor White
Write-Host "   /root/cleanup-malware.sh" -ForegroundColor White
Write-Host ""
Write-Host "3. After cleanup, update and restart:" -ForegroundColor Yellow
Write-Host "   cd /var/www/waxvalue" -ForegroundColor White
Write-Host "   npm install next@latest react@latest react-dom@latest --save" -ForegroundColor White
Write-Host "   npm run build" -ForegroundColor White
Write-Host "   pm2 restart all" -ForegroundColor White
Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Note: When connecting via SSH, you'll be asked for:" -ForegroundColor Gray
Write-Host "  - Key passphrase: Babylon1!" -ForegroundColor Gray

