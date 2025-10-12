# Clean VPS Before Deployment
# Run from local machine

$VPS_HOST = "195.35.15.194"
$VPS_PORT = "65002"
$VPS_USER = "u728332901"

Write-Host "`n🧹 Cleaning VPS for Fresh Deployment..." -ForegroundColor Cyan
Write-Host "Password: Babylon1!" -ForegroundColor Yellow
Write-Host ""

$cleanScript = @'
#!/bin/bash
set -e

echo "🧹 Cleaning VPS..."
echo ""

# Stop any running PM2 processes
if command -v pm2 &> /dev/null; then
    echo "Stopping PM2 processes..."
    pm2 delete all 2>/dev/null || echo "  No PM2 processes to stop"
fi

# Backup old waxvalue if exists
if [ -d "$HOME/waxvalue" ]; then
    echo "Backing up old waxvalue installation..."
    BACKUP_NAME="waxvalue.old.$(date +%Y%m%d_%H%M%S)"
    mv $HOME/waxvalue $HOME/$BACKUP_NAME
    echo "  ✅ Old installation backed up to: $HOME/$BACKUP_NAME"
fi

# Remove old Nginx config
if [ -f /etc/nginx/sites-enabled/waxvalue ]; then
    echo "Removing old Nginx config..."
    sudo rm -f /etc/nginx/sites-enabled/waxvalue
    sudo rm -f /etc/nginx/sites-available/waxvalue
    echo "  ✅ Old Nginx config removed"
fi

# Create fresh project directory
echo "Creating fresh project directory..."
mkdir -p $HOME/waxvalue
echo "  ✅ Directory created: $HOME/waxvalue"

echo ""
echo "✅ VPS Cleaned and Ready!"
echo ""
echo "Next: Upload your project files to: $HOME/waxvalue"
'@

ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} "bash -s" <<< $cleanScript

Write-Host ""
Write-Host "✅ VPS cleaned successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "VPS is now ready for deployment" -ForegroundColor Cyan
Write-Host ""

