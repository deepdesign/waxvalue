# Switch local frontend to use production backend API
# This allows you to test with real listings data

Write-Host "=== Switching to Production Backend API ==`n" -ForegroundColor Cyan

$envLocalPath = ".env.local"
$productionBackendUrl = "https://waxvalue.com/api/backend"

# Check if .env.local exists
if (Test-Path $envLocalPath) {
    # Read current content
    $currentContent = Get-Content $envLocalPath -Raw
    
    # Replace the backend URL
    $newContent = $currentContent -replace "NEXT_PUBLIC_BACKEND_URL=.*", "NEXT_PUBLIC_BACKEND_URL=$productionBackendUrl"
    
    # Write back
    $newContent | Out-File -FilePath $envLocalPath -Encoding utf8 -NoNewline
    
    Write-Host "✅ Updated .env.local to use production backend" -ForegroundColor Green
    Write-Host "   NEXT_PUBLIC_BACKEND_URL=$productionBackendUrl`n" -ForegroundColor White
} else {
    # Create new file
    $content = @"
# Local Development - Frontend
NEXT_PUBLIC_BACKEND_URL=$productionBackendUrl
"@
    $content | Out-File -FilePath $envLocalPath -Encoding utf8
    
    Write-Host "✅ Created .env.local with production backend URL`n" -ForegroundColor Green
}

Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "   1. Restart your dev server (npm run dev)" -ForegroundColor White
Write-Host "   2. Refresh your browser" -ForegroundColor White
Write-Host "   3. Your production session will now work!" -ForegroundColor White
Write-Host "`n   The frontend will connect to: $productionBackendUrl`n" -ForegroundColor Cyan

