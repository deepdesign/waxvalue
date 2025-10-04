#!/bin/bash

# WaxValue Development Startup Script

echo "🚀 Starting WaxValue Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Start the backend
echo "📡 Starting FastAPI backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python -m venv venv
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

echo "🏃‍♂️ Starting backend server on port 8000..."
python main.py &
BACKEND_PID=$!

cd ..

# Start the frontend
echo "🎨 Starting Next.js frontend..."
npm install
echo "🏃‍♂️ Starting frontend server on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo "✅ WaxValue is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "📡 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

echo "Press Ctrl+C to stop all services"
wait
