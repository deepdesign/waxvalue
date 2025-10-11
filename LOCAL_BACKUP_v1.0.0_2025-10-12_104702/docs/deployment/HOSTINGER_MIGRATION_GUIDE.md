# WaxValue Hostinger Migration Guide

## 🌐 Migrating from QNAP to Hostinger

### Hostinger VPS Requirements
For your WaxValue application, you'll need:
- **VPS Plan**: Business or Cloud Startup (recommended)
- **Resources**: 2+ CPU cores, 4GB+ RAM, 80GB+ SSD
- **OS**: Ubuntu 20.04 LTS or later
- **Features**: Full root access, SSH, custom domains

## 🚀 Migration Process

### Phase 1: Prepare for Migration

#### 1. Database Export from QNAP
```bash
# On your QNAP NAS
pg_dump waxvalue_dev > /share/Web/waxvalue-dev/backup_$(date +%Y%m%d_%H%M%S).sql

# Or if using Docker
docker exec waxvalue_postgres pg_dump -U waxvalue waxvalue_dev > backup.sql
```

#### 2. Code Preparation
```bash
# Ensure all changes are committed
git add .
git commit -m "Pre-migration commit"
git push origin main

# Create production branch
git checkout -b production
git push origin production
```

#### 3. Environment Configuration
Create production-specific files:
```bash
# Copy and modify environment files
cp .env.development .env.production
# Edit .env.production with production values
```

### Phase 2: Hostinger VPS Setup

#### 1. Initial Server Configuration
```bash
# Connect to your Hostinger VPS
ssh root@your-hostinger-ip

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y nginx postgresql redis-server certbot python3-certbot-nginx

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Python 3.9+
apt install -y python3.9 python3.9-pip python3.9-venv

# Create application user
useradd -m -s /bin/bash waxvalue
usermod -aG sudo waxvalue
```

#### 2. Application Deployment
```bash
# Switch to application user
su - waxvalue

# Clone repository
git clone https://github.com/deepdesign/waxvalue.git
cd waxvalue

# Switch to production branch
git checkout production

# Install dependencies
npm ci --production
pip3 install -r backend/requirements.txt

# Build application
npm run build
```

### Phase 3: Database Migration

#### 1. Database Setup on Hostinger
```sql
-- Create production database
CREATE DATABASE waxvalue_prod;
CREATE USER waxvalue_user WITH ENCRYPTED PASSWORD 'secure_production_password';
GRANT ALL PRIVILEGES ON DATABASE waxvalue_prod TO waxvalue_user;

-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
```

#### 2. Import Data from QNAP
```bash
# Copy backup file to Hostinger (use scp or rsync)
scp admin@your-qnap-ip:/share/Web/waxvalue-dev/backup.sql ./

# Import database
psql -U waxvalue_user -d waxvalue_prod < backup.sql
```

### Phase 4: Domain and SSL Setup

#### 1. DNS Configuration
Point your domain to Hostinger VPS:
```
A Record: @ → your-hostinger-ip
A Record: www → your-hostinger-ip
```

#### 2. SSL Certificate
```bash
# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Phase 5: Production Configuration

#### 1. Environment Variables
```bash
# Create production environment file
cat > .env.production << EOF
# Production Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://waxvalue_user:secure_production_password@localhost:5432/waxvalue_prod
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waxvalue_prod
DB_USER=waxvalue_user
DB_PASSWORD=secure_production_password

# JWT (generate new secure secret)
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h

# Discogs API (production credentials)
DISCOGS_CONSUMER_KEY=your_production_consumer_key
DISCOGS_CONSUMER_SECRET=your_production_consumer_secret

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECURE_COOKIES=true
CORS_ORIGIN=https://yourdomain.com
EOF
```

#### 2. Nginx Configuration
```nginx
# /etc/nginx/sites-available/waxvalue
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/backend/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Login endpoint with stricter rate limiting
    location /api/backend/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:8000/auth/login;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. Systemd Services
```bash
# Copy systemd service files
sudo cp systemd/waxvalue-frontend.service /etc/systemd/system/
sudo cp systemd/waxvalue-backend.service /etc/systemd/system/

# Enable services
sudo systemctl enable waxvalue-frontend waxvalue-backend nginx
sudo systemctl start waxvalue-frontend waxvalue-backend nginx
```

### Phase 6: Testing and Go-Live

#### 1. Pre-Migration Testing
```bash
# Test all endpoints
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/backend/auth/me

# Test frontend
curl -I https://yourdomain.com
```

#### 2. Data Verification
```sql
-- Verify data migration
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM listings;
SELECT COUNT(*) FROM strategies;
```

#### 3. Performance Testing
```bash
# Test response times
time curl https://yourdomain.com/api/backend/dashboard/summary

# Check memory usage
free -h
df -h
```

## 🔄 Migration Script

Create an automated migration script:
```bash
#!/bin/bash
# File: migrate-to-hostinger.sh

set -e

echo "🚀 Starting WaxValue migration to Hostinger..."

# Configuration
QNAP_IP="your-qnap-ip"
HOSTINGER_IP="your-hostinger-ip"
DOMAIN="yourdomain.com"

# 1. Export from QNAP
echo "📤 Exporting data from QNAP..."
ssh admin@$QNAP_IP "cd /share/Web/waxvalue-dev && pg_dump waxvalue_dev > backup_$(date +%Y%m%d_%H%M%S).sql"

# 2. Copy to Hostinger
echo "📋 Copying data to Hostinger..."
scp admin@$QNAP_IP:/share/Web/waxvalue-dev/backup_*.sql waxvalue@$HOSTINGER_IP:~/

# 3. Deploy to Hostinger
echo "🚀 Deploying to Hostinger..."
ssh waxvalue@$HOSTINGER_IP << 'EOF'
    cd waxvalue
    git pull origin production
    npm ci --production
    npm run build
    
    # Import database
    psql -U waxvalue_user -d waxvalue_prod < ~/backup_*.sql
    
    # Restart services
    sudo systemctl restart waxvalue-frontend waxvalue-backend
EOF

echo "✅ Migration completed!"
echo "🌐 Your site is now live at: https://$DOMAIN"
```

## 🔧 Post-Migration Tasks

### 1. Update QNAP for Backup Only
```bash
# On QNAP - convert to backup server
# Keep development environment but disable production services
# Use for testing and development only
```

### 2. Monitor Hostinger Performance
```bash
# Set up monitoring
# Check logs regularly
# Monitor resource usage
# Set up alerts for downtime
```

### 3. Backup Strategy
```bash
# Regular backups on Hostinger
# Cross-backup to QNAP
# Cloud backup for critical data
```

## 🚨 Rollback Plan

If migration fails:
```bash
# 1. Revert DNS to QNAP
# 2. Restart QNAP services
# 3. Verify QNAP is working
# 4. Fix Hostinger issues
# 5. Retry migration
```

## 📊 Cost Comparison

### QNAP Development
- **Cost**: One-time hardware purchase
- **Electricity**: ~$2-5/month
- **Internet**: Existing connection
- **Total**: Very low ongoing cost

### Hostinger Production
- **VPS Cost**: $3-15/month
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)
- **Total**: $5-20/month

## 💡 Best Practices

### Development Workflow
1. **Develop on QNAP**: Local development and testing
2. **Test on QNAP**: Staging environment
3. **Deploy to Hostinger**: Production deployment
4. **Backup to QNAP**: Regular backups from Hostinger

### Security
- **QNAP**: Development credentials
- **Hostinger**: Production credentials
- **Separate**: Keep environments isolated
- **Backup**: Regular cross-backups

---

**🎉 Result**: You'll have a robust development environment on your QNAP NAS and a professional production deployment on Hostinger, with easy migration between them!
