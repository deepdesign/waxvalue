# Direct VPS connection - uses full path to SSH
# Run this to SSH into your VPS

$SERVER = "root@93.127.200.187"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_ed25519"
$SSH_PATH = "c:\windows\system32\openssh\ssh.exe"

Write-Host ""
Write-Host "=== Connecting to VPS ===" -ForegroundColor Green
Write-Host ""
Write-Host "Server: $SERVER" -ForegroundColor Yellow
Write-Host "SSH Key: $SSH_KEY" -ForegroundColor Yellow
Write-Host "SSH Path: $SSH_PATH" -ForegroundColor Yellow
Write-Host ""
Write-Host "You will be prompted for your key passphrase: Babylon1!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connecting..." -ForegroundColor Gray
Write-Host ""

# Use direct path execution
& $SSH_PATH -i $SSH_KEY $SERVER

