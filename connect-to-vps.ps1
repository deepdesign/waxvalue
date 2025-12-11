# Quick script to connect to VPS
# Run this to SSH into your VPS

$SERVER = "root@93.127.200.187"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_ed25519"

# Find SSH - try Get-Command first (if in PATH), then check file locations
$SSH_EXE = $null

# First, try Get-Command (works if SSH is in PATH)
try {
    $sshCmd = Get-Command ssh -ErrorAction Stop
    $SSH_EXE = $sshCmd.Source
    Write-Host "Found SSH at: $SSH_EXE" -ForegroundColor Gray
} catch {
    # SSH not in PATH, try file locations
    $possiblePaths = @(
        "c:\windows\system32\openssh\ssh.exe",
        "C:\Windows\System32\OpenSSH\ssh.exe",
        "C:\Windows\System32\openssh\ssh.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if ($path -and (Test-Path $path)) {
            $SSH_EXE = $path
            Write-Host "Found SSH at: $SSH_EXE" -ForegroundColor Gray
            break
        }
    }
}

# Final check - if we found it via Get-Command, use it even if Test-Path fails
if (-not $SSH_EXE) {
    Write-Host "ERROR: SSH not found" -ForegroundColor Red
    Write-Host "Please install OpenSSH Client:" -ForegroundColor Yellow
    Write-Host "  Run PowerShell as Administrator and execute:" -ForegroundColor Cyan
    Write-Host "  Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "=== Connecting to VPS ===" -ForegroundColor Green
Write-Host ""
Write-Host "Server: $SERVER" -ForegroundColor Yellow
Write-Host "SSH Key: $SSH_KEY" -ForegroundColor Yellow
Write-Host ""
Write-Host "You will be prompted for your key passphrase: Babylon1!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connecting..." -ForegroundColor Gray
Write-Host ""

# Use the SSH executable we found
# If we got the path from Get-Command but it's not working, try the direct path
if (-not (Test-Path $SSH_EXE)) {
    $SSH_EXE = "c:\windows\system32\openssh\ssh.exe"
}

Write-Host "Using SSH: $SSH_EXE" -ForegroundColor Gray
& $SSH_EXE -i $SSH_KEY $SERVER
