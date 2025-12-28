#!/bin/bash

# Waxvalue VPS Deployment Script (Improved)
# Automatically pulls latest code, updates dependencies, and restarts services
# Fixes 502 errors by ensuring production mode and health checks

set -e  # Exit on error - don't continue if build fails

PROJECT_DIR="/var/www/waxvalue"
FALLBACK_DIR="$HOME/waxvalue"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Waxvalue Deployment Starting...${NC}"
echo "===================================="
echo ""

# Navigate to project directory
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    echo -e "${GREEN}📁 Using project directory: $PROJECT_DIR${NC}"
elif [ -d "$FALLBACK_DIR" ]; then
    cd "$FALLBACK_DIR"
    echo -e "${GREEN}📁 Using project directory: $FALLBACK_DIR${NC}"
else
    echo -e "${RED}❌ Error: Project directory not found at $PROJECT_DIR or $FALLBACK_DIR${NC}"
    exit 1
fi

# Step 1: Pull latest code
echo ""
echo -e "${YELLOW}📥 Step 1/7: Pulling latest code from GitHub...${NC}"
git pull origin master || {
    echo -e "${RED}⚠️  Git pull failed - continuing with existing code${NC}"
}

# Step 2: Update backend dependencies
echo ""
echo -e "${YELLOW}🐍 Step 2/7: Updating backend dependencies...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q || {
    echo -e "${RED}❌ Backend dependency installation failed${NC}"
    exit 1
}
deactivate

cd ..

# Step 3: Update frontend dependencies
echo ""
echo -e "${YELLOW}⚛️  Step 3/7: Updating frontend dependencies...${NC}"
npm install || {
    echo -e "${RED}❌ Frontend dependency installation failed${NC}"
    exit 1
}

# Step 4: Build frontend (PRODUCTION BUILD)
echo ""
echo -e "${YELLOW}🏗️  Step 4/7: Building frontend for production...${NC}"
npm run build || {
    echo -e "${RED}❌ Build failed - cannot deploy without successful build${NC}"
    echo -e "${RED}   Fix build errors and try again${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build successful${NC}"

# Step 5: Stop existing PM2 processes
echo ""
echo -e "${YELLOW}🛑 Step 5/7: Stopping existing services...${NC}"
pm2 delete waxvalue-backend 2>/dev/null || echo "  No existing backend process"
pm2 delete waxvalue-frontend 2>/dev/null || echo "  No existing frontend process"
sleep 2  # Give PM2 time to clean up

# Step 6: Start services with PM2 (PRODUCTION MODE)
echo ""
echo -e "${YELLOW}🚀 Step 6/7: Starting services in production mode...${NC}"

# Start backend (Python/FastAPI on port 8000)
echo "  Starting backend on port 8000..."
cd backend
pm2 start "venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000" \
    --name waxvalue-backend \
    --max-memory-restart 500M \
    --log /var/log/waxvalue-backend.log \
    --error /var/log/waxvalue-backend-error.log \
    --time || {
    echo -e "${RED}❌ Failed to start backend${NC}"
    exit 1
}

cd ..

# Start frontend (Next.js PRODUCTION MODE on port 3000)
echo "  Starting frontend in PRODUCTION mode on port 3000..."
pm2 start npm \
    --name waxvalue-frontend \
    --max-memory-restart 500M \
    --log /var/log/waxvalue-frontend.log \
    --error /var/log/waxvalue-frontend-error.log \
    --time \
    -- start || {
    echo -e "${RED}❌ Failed to start frontend${NC}"
    exit 1
}

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Services started${NC}"

# Step 7: Health checks
echo ""
echo -e "${YELLOW}🔍 Step 7/7: Verifying services are healthy...${NC}"

# Wait a bit for services to start
echo "  Waiting 5 seconds for services to initialize..."
sleep 5

# Function to check if port is listening
check_port() {
    local port=$1
    local service=$2
    if ss -tlnp 2>/dev/null | grep -q ":$port " || netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "  ${GREEN}✅ $service is listening on port $port${NC}"
        return 0
    else
        echo -e "  ${RED}❌ $service is NOT listening on port $port${NC}"
        return 1
    fi
}

# Function to check HTTP health
check_http_health() {
    local url=$1
    local service=$2
    if curl -sf "$url" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ $service HTTP health check passed${NC}"
        return 0
    else
        echo -e "  ${YELLOW}⚠️  $service HTTP health check failed (may still be starting)${NC}"
        return 1
    fi
}

# Check ports
BACKEND_PORT_OK=false
FRONTEND_PORT_OK=false

if check_port 8000 "Backend"; then
    BACKEND_PORT_OK=true
fi

if check_port 3000 "Frontend"; then
    FRONTEND_PORT_OK=true
fi

# Check HTTP endpoints
echo ""
echo "  Checking HTTP endpoints..."
check_http_health "http://127.0.0.1:8000/docs" "Backend" || true
check_http_health "http://127.0.0.1:3000" "Frontend" || true

# Check PM2 process status
echo ""
echo "  Checking PM2 process status..."
pm2 status

# Final verification
echo ""
if [ "$BACKEND_PORT_OK" = true ] && [ "$FRONTEND_PORT_OK" = true ]; then
    echo -e "${GREEN}✅ Deployment complete! Services are running.${NC}"
    echo ""
    echo "📊 Service Summary:"
    echo "  • Backend:  http://127.0.0.1:8000 (PM2: waxvalue-backend)"
    echo "  • Frontend: http://127.0.0.1:3000 (PM2: waxvalue-frontend)"
    echo "  • Nginx:    Proxying to http://127.0.0.1:3000"
    echo ""
    echo "📋 Useful commands:"
    echo "  pm2 logs waxvalue-frontend    # View frontend logs"
    echo "  pm2 logs waxvalue-backend     # View backend logs"
    echo "  pm2 restart all               # Restart all services"
    echo "  pm2 monit                     # Monitor services"
    echo ""
    exit 0
else
    echo -e "${RED}❌ WARNING: Some services may not be running correctly!${NC}"
    echo ""
    echo "📋 Troubleshooting:"
    echo "  • Check PM2 logs: pm2 logs"
    echo "  • Check if ports are in use: ss -tlnp | grep -E ':(3000|8000)'"
    echo "  • Check nginx: sudo nginx -t && sudo systemctl status nginx"
    echo ""
    exit 1
fi
