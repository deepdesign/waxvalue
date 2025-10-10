# Start WaxValue Development Servers
# This script starts both the backend (Python) and frontend (Node.js) servers

Write-Host "Starting WaxValue Development Servers..." -ForegroundColor Cyan

# Check if backend is already running
$backendProcess = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Python*" -and $_.CommandLine -like "*main-dev.py*" }
if ($backendProcess) {
    Write-Host "Backend server is already running (PID: $($backendProcess.Id))" -ForegroundColor Yellow
} else {
    Write-Host "Starting Backend Server (Python)..." -ForegroundColor Green
    Start-Process -FilePath "python" -ArgumentList "main-dev.py" -WorkingDirectory "backend" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    
    # Verify backend started
    $backendTest = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($backendTest.StatusCode -eq 200) {
        Write-Host "✓ Backend server started successfully on http://localhost:8000" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend server failed to start" -ForegroundColor Red
    }
}

# Check if frontend is already running
$frontendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" }
if ($frontendProcess) {
    Write-Host "Frontend server is already running (PID: $($frontendProcess.Id))" -ForegroundColor Yellow
} else {
    Write-Host "Starting Frontend Server (Next.js)..." -ForegroundColor Green
    Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "." -WindowStyle Hidden
    Start-Sleep -Seconds 3
    
    # Verify frontend started
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($frontendTest.StatusCode -eq 200) {
        Write-Host "✓ Frontend server started successfully on http://localhost:3000" -ForegroundColor Green
    } else {
        Write-Host "✗ Frontend server failed to start" -ForegroundColor Red
    }
}

Write-Host "`nServers Status:" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "`nTo stop servers, run: .\stop-servers.ps1" -ForegroundColor Gray

