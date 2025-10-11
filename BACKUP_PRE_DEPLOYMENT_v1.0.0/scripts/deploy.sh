#!/bin/bash
set -e

echo "🚀 Starting WaxValue deployment..."

# Configuration
APP_DIR="/home/waxvalue/waxvalue"
BACKUP_DIR="/home/waxvalue/backups"
DATE=$(date +%Y%m%d_%H%M%S)

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

# Check if running as correct user
if [ "$USER" != "waxvalue" ]; then
    log_error "This script must be run as the 'waxvalue' user"
    exit 1
fi

# Check if in correct directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Are you in the correct directory?"
    exit 1
fi

log_info "Starting deployment process..."

# 1. Create backup
log_info "Creating backup..."
mkdir -p $BACKUP_DIR

# Backup database
log_info "Backing up database..."
pg_dump waxvalue_prod > $BACKUP_DIR/database_$DATE.sql

# Backup application files
log_info "Backing up application files..."
tar -czf $BACKUP_DIR/application_$DATE.tar.gz --exclude=node_modules --exclude=.git .

# 2. Pull latest code
log_info "Pulling latest code from repository..."
git pull origin main

# 3. Install dependencies
log_info "Installing Node.js dependencies..."
npm ci --production

log_info "Installing Python dependencies..."
pip3 install -r backend/requirements.txt

# 4. Run tests
log_info "Running tests..."
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    npm test
fi

if [ -f "backend/tests/" ]; then
    python3 -m pytest backend/tests/ -v
fi

# 5. Build application
log_info "Building Next.js application..."
npm run build

# 6. Run database migrations
log_info "Running database migrations..."
if [ -f "backend/migrate.py" ]; then
    python3 backend/migrate.py
fi

# 7. Restart services
log_info "Restarting services..."
sudo systemctl restart waxvalue-frontend
sudo systemctl restart waxvalue-backend

# 8. Check service status
log_info "Checking service status..."
sleep 5

FRONTEND_STATUS=$(sudo systemctl is-active waxvalue-frontend)
BACKEND_STATUS=$(sudo systemctl is-active waxvalue-backend)

if [ "$FRONTEND_STATUS" = "active" ]; then
    log_info "Frontend service is running"
else
    log_error "Frontend service is not running"
    sudo systemctl status waxvalue-frontend
fi

if [ "$BACKEND_STATUS" = "active" ]; then
    log_info "Backend service is running"
else
    log_error "Backend service is not running"
    sudo systemctl status waxvalue-backend
fi

# 9. Health check
log_info "Performing health check..."
sleep 10

# Check if services are responding
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_info "Frontend health check passed"
else
    log_warn "Frontend health check failed"
fi

if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    log_info "Backend health check passed"
else
    log_warn "Backend health check failed"
fi

# 10. Cleanup old backups
log_info "Cleaning up old backups..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

log_info "✅ Deployment completed successfully!"
log_info "Backup created: $BACKUP_DIR/application_$DATE.tar.gz"
log_info "Database backup: $BACKUP_DIR/database_$DATE.sql"

# Show recent logs
log_info "Recent logs:"
sudo journalctl -u waxvalue-frontend -u waxvalue-backend --since "5 minutes ago" --no-pager
