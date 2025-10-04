# WaxValue Quick Deployment Summary

## 🚀 Essential Steps for Secure Deployment

### 1. Server Setup (Ubuntu 20.04+)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx postgresql redis-server certbot python3-certbot-nginx

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create application user
sudo useradd -m -s /bin/bash waxvalue
```

### 2. Application Deployment
```bash
# Switch to application user
sudo su - waxvalue

# Clone and setup
git clone https://github.com/yourusername/waxvalue.git
cd waxvalue
npm ci --production
pip3 install -r backend/requirements.txt
npm run build

# Configure environment
cp env.production.example .env.production
# Edit .env.production with your secure values
```

### 3. Database Setup
```sql
-- Create database and user
CREATE DATABASE waxvalue_prod;
CREATE USER waxvalue_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE waxvalue_prod TO waxvalue_user;
```

### 4. Security Configuration

#### Generate Secure Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Database Password
openssl rand -base64 16

# Session Secret
openssl rand -base64 24
```

#### SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5. Service Configuration
```bash
# Copy systemd services
sudo cp systemd/*.service /etc/systemd/system/

# Enable services
sudo systemctl enable waxvalue-frontend waxvalue-backend nginx
sudo systemctl start waxvalue-frontend waxvalue-backend nginx
```

### 6. Firewall Setup
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔐 Critical Security Settings

### Environment Variables (.env.production)
```bash
# REQUIRED: Change these values!
JWT_SECRET=your_32_character_random_secret
DB_PASSWORD=your_secure_database_password
DISCOGS_CONSUMER_KEY=your_discogs_key
DISCOGS_CONSUMER_SECRET=your_discogs_secret
```

### Password Security Features
- ✅ **bcrypt hashing** with salt
- ✅ **Password strength validation** (8+ chars, complexity)
- ✅ **Account lockout** after failed attempts
- ✅ **JWT tokens** with expiration
- ✅ **Rate limiting** on login attempts

### Database Security
- ✅ **SSL/TLS encryption** for connections
- ✅ **Strong passwords** required
- ✅ **Limited privileges** for database user
- ✅ **Regular backups** with encryption

### Network Security
- ✅ **HTTPS/TLS 1.2+** enforced
- ✅ **Security headers** (HSTS, CSP, etc.)
- ✅ **Rate limiting** (100 req/15min)
- ✅ **CORS** restricted to your domain
- ✅ **Firewall** configured

## 📋 Post-Deployment Checklist

### Immediate Tasks
- [ ] Test login/registration functionality
- [ ] Verify SSL certificate is working
- [ ] Check all API endpoints respond
- [ ] Test Discogs OAuth flow
- [ ] Verify database connections
- [ ] Check logs for errors

### Security Verification
- [ ] Run security scan: `npm audit`
- [ ] Check SSL rating: https://www.ssllabs.com/ssltest/
- [ ] Verify rate limiting works
- [ ] Test password strength requirements
- [ ] Confirm sensitive data is not in logs

### Monitoring Setup
- [ ] Set up log monitoring
- [ ] Configure health check alerts
- [ ] Monitor disk space and memory
- [ ] Set up backup verification
- [ ] Configure security event alerts

## 🔄 Maintenance Commands

### Deploy Updates
```bash
./scripts/deploy.sh
```

### Create Backup
```bash
./scripts/backup.sh
```

### Check Service Status
```bash
sudo systemctl status waxvalue-frontend waxvalue-backend
```

### View Logs
```bash
sudo journalctl -u waxvalue-frontend -f
sudo journalctl -u waxvalue-backend -f
```

### Health Check
```bash
curl https://yourdomain.com/api/health
```

## 🚨 Emergency Procedures

### Service Restart
```bash
sudo systemctl restart waxvalue-frontend waxvalue-backend nginx
```

### Database Backup
```bash
pg_dump waxvalue_prod > emergency_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Rollback Deployment
```bash
# Restore from backup
cd /home/waxvalue
tar -xzf backups/application_YYYYMMDD_HHMMSS.tar.gz
sudo systemctl restart waxvalue-frontend waxvalue-backend
```

## 📞 Support Information

### Important Files
- **Configuration**: `.env.production`
- **Logs**: `/var/log/waxvalue/`
- **Backups**: `/home/waxvalue/backups/`
- **Services**: `/etc/systemd/system/waxvalue-*.service`

### Monitoring URLs
- **Health Check**: `https://yourdomain.com/api/health`
- **Frontend**: `https://yourdomain.com`
- **Backend API**: `https://yourdomain.com/api/backend/`

---

**⚠️ Critical**: Always test in a staging environment first. Keep your secrets secure and never commit them to version control. Monitor your application logs regularly for security issues.
