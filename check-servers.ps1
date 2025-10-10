# Check WaxValue Development Servers Status
# This script checks if both servers are running and accessible

Write-Host "Checking WaxValue Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Check Python processes
$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "Backend Process:" -ForegroundColor Green
    $pythonProcesses | Format-Table Id, CPU, WorkingSet, StartTime -AutoSize
} else {
    Write-Host "✗ Backend process not running" -ForegroundColor Red
}

# Check Node processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Frontend Processes:" -ForegroundColor Green
    $nodeProcesses | Format-Table Id, CPU, WorkingSet, StartTime -AutoSize
} else {
    Write-Host "✗ Frontend processes not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "Server Accessibility:" -ForegroundColor Cyan

# Test backend
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Backend (8000): $($backend.StatusCode) - Accessible" -ForegroundColor Green
} catch {
    Write-Host "Backend (8000): Not accessible" -ForegroundColor Red
}

# Test frontend
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Frontend (3000): $($frontend.StatusCode) - Accessible" -ForegroundColor Green
} catch {
    Write-Host "Frontend (3000): Not accessible" -ForegroundColor Red
}

Write-Host ""

