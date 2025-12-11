# Switch back to local backend API
# Use this to test with local backend again

Write-Host "=== Switching to Local Backend API ==`n" -ForegroundColor Cyan

$envLocalPath = ".env.local"
$localBackendUrl = "http://127.0.0.1:8000"

if (Test-Path $envLocalPath) {
    $currentContent = Get-Content $envLocalPath -Raw
    $newContent = $currentContent -replace "NEXT_PUBLIC_BACKEND_URL=.*", "NEXT_PUBLIC_BACKEND_URL=$localBackendUrl"
    $newContent | Out-File -FilePath $envLocalPath -Encoding utf8 -NoNewline
    
    Write-Host "✅ Updated .env.local to use local backend" -ForegroundColor Green
    Write-Host "   NEXT_PUBLIC_BACKEND_URL=$localBackendUrl`n" -ForegroundColor White
} else {
    $content = @"
# Local Development - Frontend
NEXT_PUBLIC_BACKEND_URL=$localBackendUrl
"@
    $content | Out-File -FilePath $envLocalPath -Encoding utf8
    Write-Host "✅ Created .env.local with local backend URL`n" -ForegroundColor Green
}

Write-Host "⚠️  Don't forget to restart your dev server (npm run dev)`n" -ForegroundColor Yellow

