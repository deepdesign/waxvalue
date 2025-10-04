@echo off
echo 🚀 Starting WaxValue Development Environment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

REM Start the backend
echo 📡 Starting FastAPI backend...
cd backend
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

echo 📥 Installing Python dependencies...
pip install -r requirements.txt

echo 🏃‍♂️ Starting backend server on port 8000...
start "WaxValue Backend" python main.py

cd ..

REM Start the frontend
echo 🎨 Starting Next.js frontend...
npm install
echo 🏃‍♂️ Starting frontend server on port 3000...
start "WaxValue Frontend" npm run dev

echo ✅ WaxValue is starting up!
echo 📱 Frontend: http://localhost:3000
echo 📡 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause >nul
