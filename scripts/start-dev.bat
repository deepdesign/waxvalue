@echo off
chcp 65001 > nul
echo Starting WaxValue Development Environment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Start the backend
echo Starting FastAPI backend...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt

echo Starting backend server on port 8000...
start "WaxValue Backend" cmd /k "venv\Scripts\activate.bat && python main-dev.py"

cd ..

REM Start the frontend
echo Starting Next.js frontend...
echo Installing npm dependencies...
npm install
echo Starting frontend server on port 3000...
start "WaxValue Frontend" cmd /k "npm run dev"

echo.
echo WaxValue is starting up!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Both servers are starting in separate windows.
echo Press any key to exit this launcher...
pause >nul
