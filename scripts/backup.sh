#!/bin/bash
set -e

echo "💾 Starting WaxValue backup process..."

# Configuration
BACKUP_DIR="/home/waxvalue/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/waxvalue/waxvalue"

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

# Create backup directory
mkdir -p $BACKUP_DIR

log_info "Creating backup with timestamp: $DATE"

# 1. Backup database
log_info "Backing up PostgreSQL database..."
if pg_dump waxvalue_prod > $BACKUP_DIR/database_$DATE.sql; then
    log_info "Database backup completed: database_$DATE.sql"
else
    log_error "Database backup failed"
    exit 1
fi

# 2. Backup application files
log_info "Backing up application files..."
if tar -czf $BACKUP_DIR/application_$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=.env.local \
    --exclude=backups \
    -C /home/waxvalue waxvalue; then
    log_info "Application backup completed: application_$DATE.tar.gz"
else
    log_error "Application backup failed"
    exit 1
fi

# 3. Backup configuration files
log_info "Backing up configuration files..."
mkdir -p $BACKUP_DIR/config_$DATE

# Copy important config files
sudo cp /etc/nginx/sites-available/waxvalue $BACKUP_DIR/config_$DATE/nginx.conf
sudo cp /etc/systemd/system/waxvalue-*.service $BACKUP_DIR/config_$DATE/
sudo cp /home/waxvalue/waxvalue/.env.production $BACKUP_DIR/config_$DATE/env.production

# Create config archive
tar -czf $BACKUP_DIR/config_$DATE.tar.gz -C $BACKUP_DIR config_$DATE
rm -rf $BACKUP_DIR/config_$DATE

log_info "Configuration backup completed: config_$DATE.tar.gz"

# 4. Backup logs
log_info "Backing up recent logs..."
mkdir -p $BACKUP_DIR/logs_$DATE

# Copy application logs
if [ -f "/var/log/waxvalue/backend.log" ]; then
    sudo cp /var/log/waxvalue/backend.log $BACKUP_DIR/logs_$DATE/
fi

if [ -f "/var/log/waxvalue/security.log" ]; then
    sudo cp /var/log/waxvalue/security.log $BACKUP_DIR/logs_$DATE/
fi

# Copy systemd logs
sudo journalctl -u waxvalue-frontend -u waxvalue-backend --since "7 days ago" --no-pager > $BACKUP_DIR/logs_$DATE/systemd.log

# Create logs archive
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz -C $BACKUP_DIR logs_$DATE
rm -rf $BACKUP_DIR/logs_$DATE

log_info "Logs backup completed: logs_$DATE.tar.gz"

# 5. Verify backups
log_info "Verifying backup integrity..."

# Check database backup
if [ -s $BACKUP_DIR/database_$DATE.sql ]; then
    log_info "Database backup verification passed"
else
    log_error "Database backup verification failed"
fi

# Check application backup
if tar -tzf $BACKUP_DIR/application_$DATE.tar.gz > /dev/null 2>&1; then
    log_info "Application backup verification passed"
else
    log_error "Application backup verification failed"
fi

# 6. Cleanup old backups
log_info "Cleaning up old backups (keeping last 7 days)..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Count remaining backups
BACKUP_COUNT=$(find $BACKUP_DIR -name "*.sql" | wc -l)
log_info "Total database backups: $BACKUP_COUNT"

APP_BACKUP_COUNT=$(find $BACKUP_DIR -name "application_*.tar.gz" | wc -l)
log_info "Total application backups: $APP_BACKUP_COUNT"

# 7. Calculate backup sizes
DB_SIZE=$(du -h $BACKUP_DIR/database_$DATE.sql | cut -f1)
APP_SIZE=$(du -h $BACKUP_DIR/application_$DATE.tar.gz | cut -f1)
CONFIG_SIZE=$(du -h $BACKUP_DIR/config_$DATE.tar.gz | cut -f1)
LOGS_SIZE=$(du -h $BACKUP_DIR/logs_$DATE.tar.gz | cut -f1)

log_info "Backup sizes:"
log_info "  Database: $DB_SIZE"
log_info "  Application: $APP_SIZE"
log_info "  Configuration: $CONFIG_SIZE"
log_info "  Logs: $LOGS_SIZE"

# 8. Create backup manifest
log_info "Creating backup manifest..."
cat > $BACKUP_DIR/backup_manifest_$DATE.txt << EOF
WaxValue Backup Manifest
========================
Date: $(date)
Timestamp: $DATE

Files Created:
- database_$DATE.sql ($DB_SIZE)
- application_$DATE.tar.gz ($APP_SIZE)
- config_$DATE.tar.gz ($CONFIG_SIZE)
- logs_$DATE.tar.gz ($LOGS_SIZE)

System Information:
- Hostname: $(hostname)
- User: $(whoami)
- Disk Usage: $(df -h /home/waxvalue | tail -1)
- Memory: $(free -h | grep Mem)

Services Status:
$(sudo systemctl status waxvalue-frontend waxvalue-backend --no-pager -l)

Backup completed successfully!
EOF

log_info "✅ Backup process completed successfully!"
log_info "Backup manifest: backup_manifest_$DATE.txt"
log_info "Backup location: $BACKUP_DIR"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# log_info "Uploading backup to cloud storage..."
# aws s3 cp $BACKUP_DIR/database_$DATE.sql s3://your-backup-bucket/waxvalue/
# aws s3 cp $BACKUP_DIR/application_$DATE.tar.gz s3://your-backup-bucket/waxvalue/
