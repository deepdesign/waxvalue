#!/bin/bash
set -e

echo "🏠 Setting up WaxValue on QNAP TS-664..."

# Configuration
APP_DIR="/share/Web/waxvalue-dev"
REPO_URL="https://github.com/deepdesign/waxvalue.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as admin
if [ "$USER" != "admin" ]; then
    log_error "This script must be run as the 'admin' user on QNAP"
    exit 1
fi

log_info "Starting QNAP setup for WaxValue development..."

# 1. Install required packages
log_info "Installing required packages..."

# Install Node.js via Entware (if not already installed)
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js..."
    opkg update
    opkg install node
fi

# Install Python 3
if ! command -v python3 &> /dev/null; then
    log_info "Installing Python 3..."
    opkg install python3 python3-pip
fi

# Install Git
if ! command -v git &> /dev/null; then
    log_info "Installing Git..."
    opkg install git
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    log_info "Installing PostgreSQL..."
    opkg install postgresql-server
    # Initialize PostgreSQL
    /opt/bin/initdb -D /opt/var/lib/postgresql/data
fi

# 2. Create application directory
log_info "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# 3. Clone repository
if [ ! -d ".git" ]; then
    log_info "Cloning WaxValue repository..."
    git clone $REPO_URL .
else
    log_info "Repository already exists, pulling latest changes..."
    git pull origin main
fi

# 4. Install Node.js dependencies
log_info "Installing Node.js dependencies..."
npm install

# 5. Install Python dependencies
log_info "Installing Python dependencies..."
pip3 install -r backend/requirements.txt

# 6. Create development environment file
log_info "Creating development environment configuration..."
cat > .env.development << EOF
# Development Configuration for QNAP
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://$(hostname -i):8000
NEXT_PUBLIC_APP_URL=http://$(hostname -i):3000

# Database
DATABASE_URL=postgresql://waxvalue:dev_password@localhost:5432/waxvalue_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waxvalue_dev
DB_USER=waxvalue
DB_PASSWORD=dev_password

# JWT (development only)
JWT_SECRET=dev_jwt_secret_32_characters_long_for_qnap
JWT_EXPIRES_IN=24h

# Discogs API (use test credentials)
DISCOGS_CONSUMER_KEY=your_dev_consumer_key
DISCOGS_CONSUMER_SECRET=your_dev_consumer_secret

# Redis
REDIS_URL=redis://localhost:6379

# Security (relaxed for development)
SECURE_COOKIES=false
CORS_ORIGIN=http://$(hostname -i):3000

# QNAP Specific
QNAP_DEV=true
BACKEND_HOST=$(hostname -i)
BACKEND_PORT=8000
EOF

# 7. Setup PostgreSQL database
log_info "Setting up PostgreSQL database..."

# Start PostgreSQL if not running
if ! pgrep postgres > /dev/null; then
    log_info "Starting PostgreSQL..."
    /opt/bin/pg_ctl -D /opt/var/lib/postgresql/data -l /opt/var/log/postgresql.log start
fi

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE DATABASE waxvalue_dev;
CREATE USER waxvalue WITH ENCRYPTED PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE waxvalue_dev TO waxvalue;
\q
EOF

# 8. Create startup scripts
log_info "Creating startup scripts..."

# Frontend startup script
cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd /share/Web/waxvalue-dev
export NODE_ENV=development
npm run dev
EOF

# Backend startup script
cat > start-backend.sh << 'EOF'
#!/bin/bash
cd /share/Web/waxvalue-dev/backend
export PYTHONPATH=/share/Web/waxvalue-dev/backend
export DATABASE_URL=postgresql://waxvalue:dev_password@localhost:5432/waxvalue_dev
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
EOF

# Make scripts executable
chmod +x start-frontend.sh start-backend.sh

# 9. Create system startup script
log_info "Creating system startup configuration..."

# Add to QNAP startup
cat > /etc/init.d/waxvalue-dev << 'EOF'
#!/bin/sh
# WaxValue Development Services

case "$1" in
    start)
        echo "Starting WaxValue development services..."
        
        # Start PostgreSQL
        /opt/bin/pg_ctl -D /opt/var/lib/postgresql/data -l /opt/var/log/postgresql.log start
        
        # Start backend (in background)
        cd /share/Web/waxvalue-dev
        nohup ./start-backend.sh > /share/Web/waxvalue-dev/backend.log 2>&1 &
        echo $! > /share/Web/waxvalue-dev/backend.pid
        
        # Start frontend (in background)
        cd /share/Web/waxvalue-dev
        nohup ./start-frontend.sh > /share/Web/waxvalue-dev/frontend.log 2>&1 &
        echo $! > /share/Web/waxvalue-dev/frontend.pid
        
        echo "WaxValue development services started"
        ;;
    stop)
        echo "Stopping WaxValue development services..."
        
        # Stop frontend
        if [ -f /share/Web/waxvalue-dev/frontend.pid ]; then
            kill $(cat /share/Web/waxvalue-dev/frontend.pid) 2>/dev/null
            rm /share/Web/waxvalue-dev/frontend.pid
        fi
        
        # Stop backend
        if [ -f /share/Web/waxvalue-dev/backend.pid ]; then
            kill $(cat /share/Web/waxvalue-dev/backend.pid) 2>/dev/null
            rm /share/Web/waxvalue-dev/backend.pid
        fi
        
        # Stop PostgreSQL
        /opt/bin/pg_ctl -D /opt/var/lib/postgresql/data stop
        
        echo "WaxValue development services stopped"
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    status)
        echo "WaxValue Development Services Status:"
        echo "Frontend: $(pgrep -f 'npm run dev' > /dev/null && echo 'Running' || echo 'Stopped')"
        echo "Backend: $(pgrep -f 'uvicorn main:app' > /dev/null && echo 'Running' || echo 'Stopped')"
        echo "PostgreSQL: $(pgrep postgres > /dev/null && echo 'Running' || echo 'Stopped')"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

exit 0
EOF

chmod +x /etc/init.d/waxvalue-dev

# 10. Create development deployment script
log_info "Creating development deployment script..."
cat > deploy-dev.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying WaxValue development version..."

# Pull latest changes
git pull origin main

# Install/update dependencies
npm install
pip3 install -r backend/requirements.txt

# Build frontend
npm run build

# Restart services
/etc/init.d/waxvalue-dev restart

echo "✅ Development deployment complete!"
echo "Frontend: http://$(hostname -i):3000"
echo "Backend: http://$(hostname -i):8000"
EOF

chmod +x deploy-dev.sh

# 11. Start services
log_info "Starting WaxValue development services..."
/etc/init.d/waxvalue-dev start

# 12. Wait for services to start
log_info "Waiting for services to start..."
sleep 10

# 13. Check service status
log_info "Checking service status..."
/etc/init.d/waxvalue-dev status

# 14. Test endpoints
log_info "Testing endpoints..."
QNAP_IP=$(hostname -i)

# Test backend
if curl -f http://$QNAP_IP:8000/health > /dev/null 2>&1; then
    log_info "✅ Backend health check passed"
else
    log_warn "⚠️ Backend health check failed"
fi

# Test frontend
if curl -f http://$QNAP_IP:3000 > /dev/null 2>&1; then
    log_info "✅ Frontend health check passed"
else
    log_warn "⚠️ Frontend health check failed"
fi

# 15. Display access information
log_info "🎉 WaxValue development setup completed!"
echo ""
echo "📱 Access your application:"
echo "   Frontend: http://$QNAP_IP:3000"
echo "   Backend:  http://$QNAP_IP:8000"
echo "   Health:   http://$QNAP_IP:8000/health"
echo ""
echo "📁 Application directory: $APP_DIR"
echo ""
echo "🔧 Management commands:"
echo "   Start:   /etc/init.d/waxvalue-dev start"
echo "   Stop:    /etc/init.d/waxvalue-dev stop"
echo "   Restart: /etc/init.d/waxvalue-dev restart"
echo "   Status:  /etc/init.d/waxvalue-dev status"
echo "   Deploy:  ./deploy-dev.sh"
echo ""
echo "📋 Logs:"
echo "   Frontend: $APP_DIR/frontend.log"
echo "   Backend:  $APP_DIR/backend.log"
echo "   PostgreSQL: /opt/var/log/postgresql.log"
echo ""
echo "🔐 Database:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: waxvalue_dev"
echo "   User: waxvalue"
echo "   Password: dev_password"
echo ""
log_info "✅ Setup complete! Your QNAP is now ready for WaxValue development."
