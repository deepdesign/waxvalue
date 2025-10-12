# Check VPS Status Remotely
# Run from local machine

$VPS_HOST = "195.35.15.194"
$VPS_PORT = "65002"
$VPS_USER = "u728332901"

Write-Host "`n🔍 Checking VPS Status..." -ForegroundColor Cyan
Write-Host "Password: Babylon1!" -ForegroundColor Yellow
Write-Host ""

# Check VPS status
$vpsCheck = @'
echo "📊 VPS Status Check"
echo "==================="
echo ""
echo "👤 User: $(whoami)"
echo "📁 Home: $HOME"
echo "🖥️  Hostname: $(hostname)"
echo ""

echo "📂 Home Directory Contents:"
ls -lah $HOME | head -20
echo ""

echo "🔧 Installed Dependencies:"
echo ""

# Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
    echo "   npm: $(npm --version)"
else
    echo "❌ Node.js: Not installed"
fi

# Python
if command -v python3 &> /dev/null; then
    echo "✅ Python: $(python3 --version)"
else
    echo "❌ Python: Not installed"
fi

# Nginx
if command -v nginx &> /dev/null; then
    echo "✅ Nginx: installed"
    sudo systemctl is-active nginx &>/dev/null && echo "   Status: Running" || echo "   Status: Stopped"
else
    echo "❌ Nginx: Not installed"
fi

# PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2: $(pm2 --version)"
    echo ""
    echo "   PM2 Processes:"
    pm2 list
else
    echo "❌ PM2: Not installed"
fi

echo ""
echo "💾 Disk Space:"
df -h $HOME | tail -1
echo ""

# Check for old waxvalue
if [ -d "$HOME/waxvalue" ]; then
    echo "⚠️  Existing waxvalue directory found:"
    ls -lh $HOME/waxvalue | head -10
else
    echo "✅ No existing waxvalue directory"
fi

echo ""
echo "==================="
'@

ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} $vpsCheck

Write-Host ""
Write-Host "VPS check complete!" -ForegroundColor Green
Write-Host ""

