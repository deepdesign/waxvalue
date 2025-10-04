@echo off
echo Starting WaxValue Development Environment...

echo.
echo Installing frontend dependencies...
call npm install

echo.
echo Starting backend server...
start "WaxValue Backend" cmd /k "cd backend && python main-dev.py"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting frontend server...
start "WaxValue Frontend" cmd /k "npm run dev"

echo.
echo WaxValue is starting up!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
