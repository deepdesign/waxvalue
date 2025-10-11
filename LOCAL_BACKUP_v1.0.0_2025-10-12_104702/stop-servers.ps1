# Stop WaxValue Development Servers
# This script stops both the backend (Python) and frontend (Node.js) servers

Write-Host "Stopping WaxValue Development Servers..." -ForegroundColor Cyan

# Stop Python backend
$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "Stopping Backend Server (Python)..." -ForegroundColor Yellow
    $pythonProcesses | Stop-Process -Force
    Write-Host "✓ Backend server stopped" -ForegroundColor Green
} else {
    Write-Host "Backend server is not running" -ForegroundColor Gray
}

# Stop Node.js frontend
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping Frontend Server (Node.js)..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Write-Host "✓ Frontend server stopped" -ForegroundColor Green
} else {
    Write-Host "Frontend server is not running" -ForegroundColor Gray
}

Write-Host "`nAll servers stopped." -ForegroundColor Cyan

