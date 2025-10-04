# WaxValue Development Environment Startup Script
Write-Host "Starting WaxValue Development Environment..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Please run this script from the project root directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start the backend
Write-Host "Starting FastAPI backend..." -ForegroundColor Yellow
Push-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Install dependencies if needed
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "Starting backend server on port 8000..." -ForegroundColor Green
Start-Process -FilePath "python" -ArgumentList "main-dev.py" -WindowStyle Normal -WorkingDirectory (Get-Location)

Pop-Location

# Start the frontend
Write-Host "Starting Next.js frontend..." -ForegroundColor Yellow
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Starting frontend server on port 3000..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal

Write-Host ""
Write-Host "WaxValue is starting up!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to exit..." -ForegroundColor Yellow
Read-Host
