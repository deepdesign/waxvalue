# WaxValue Deployment Guide

## 🚀 Production Deployment with Security Best Practices

This guide covers deploying your WaxValue application to a production server with enterprise-grade security for usernames, passwords, and overall application security.

## 📋 Pre-Deployment Checklist

### 1. Security Configuration
- [ ] Environment variables configured securely
- [ ] Database security hardened
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Rate limiting implemented
- [ ] Authentication security verified
- [ ] API keys secured
- [ ] CORS policies configured

### 2. Server Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum SSD
- **OS**: Ubuntu 20.04 LTS or later
- **Node.js**: 18.x or later
- **Python**: 3.9 or later

## 🛡️ Security Configuration

### 1. Environment Variables (.env.production)

Create a secure `.env.production` file:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/waxvalue_prod
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waxvalue_prod
DB_USER=waxvalue_user
DB_PASSWORD=your_secure_db_password_here

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=24h

# Discogs API Configuration
DISCOGS_CONSUMER_KEY=your_discogs_consumer_key
DISCOGS_CONSUMER_SECRET=your_discogs_consumer_secret

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Redis Configuration (for sessions and caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Email Configuration (for notifications)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_email_password

# Security Headers
SECURE_COOKIES=true
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Database Security

#### PostgreSQL Configuration

```sql
-- Create production database and user
CREATE DATABASE waxvalue_prod;
CREATE USER waxvalue_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE waxvalue_prod TO waxvalue_user;

-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/etc/ssl/certs/server.crt';
ALTER SYSTEM SET ssl_key_file = '/etc/ssl/private/server.key';

-- Configure authentication
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
```

#### User Password Security

Update your backend to use secure password hashing:

```python
# Add to backend/main.py
import bcrypt
import secrets
import string

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_secure_token(length: int = 32) -> str:
    """Generate secure random token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))
```

## 🏗️ Server Setup

### 1. Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx postgresql redis-server certbot python3-certbot-nginx

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.9+
sudo apt install -y python3.9 python3.9-pip python3.9-venv

# Create application user
sudo useradd -m -s /bin/bash waxvalue
sudo usermod -aG sudo waxvalue
```

### 2. Application Deployment

```bash
# Switch to application user
sudo su - waxvalue

# Clone repository
git clone https://github.com/yourusername/waxvalue.git
cd waxvalue

# Install dependencies
npm ci --production
pip3 install -r backend/requirements.txt

# Build application
npm run build

# Set up environment
cp .env.example .env.production
# Edit .env.production with your secure values
```

### 3. Database Setup

```bash
# Create database tables
python3 backend/setup_database.py

# Run migrations
python3 backend/migrate.py
```

## 🔒 Security Hardening

### 1. Nginx Configuration

Create `/etc/nginx/sites-available/waxvalue`:

```nginx
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
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.discogs.com;";

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

    # Static files
    location /_next/static {
        alias /home/waxvalue/waxvalue/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. SSL Certificate

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔄 Process Management

### 1. Systemd Services

Create `/etc/systemd/system/waxvalue-frontend.service`:

```ini
[Unit]
Description=WaxValue Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=waxvalue
WorkingDirectory=/home/waxvalue/waxvalue
Environment=NODE_ENV=production
EnvironmentFile=/home/waxvalue/waxvalue/.env.production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/waxvalue-backend.service`:

```ini
[Unit]
Description=WaxValue Backend (FastAPI)
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=waxvalue
WorkingDirectory=/home/waxvalue/waxvalue/backend
EnvironmentFile=/home/waxvalue/waxvalue/.env.production
ExecStart=/home/waxvalue/waxvalue/backend/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Enable Services

```bash
# Enable and start services
sudo systemctl enable waxvalue-frontend
sudo systemctl enable waxvalue-backend
sudo systemctl enable nginx
sudo systemctl enable postgresql
sudo systemctl enable redis

# Start services
sudo systemctl start waxvalue-frontend
sudo systemctl start waxvalue-backend
sudo systemctl start nginx
```

## 🔐 Password Security Implementation

### 1. Enhanced Authentication

Update your authentication endpoints with secure password handling:

```python
# Add to backend/main.py
import jwt
from datetime import datetime, timedelta
import re

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is strong"

def create_jwt_token(user_id: int) -> str:
    """Create JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, os.getenv('JWT_SECRET'), algorithm='HS256')

def verify_jwt_token(token: str) -> dict:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, os.getenv('JWT_SECRET'), algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Update register endpoint
@app.post("/auth/register")
async def register(user_data: dict):
    """Register a new user with enhanced security"""
    email = user_data.get("email")
    password = user_data.get("password")
    firstName = user_data.get("firstName")
    lastName = user_data.get("lastName")

    if not all([email, password, firstName, lastName]):
        raise HTTPException(status_code=400, detail="All fields are required")

    # Validate email format
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Validate password strength
    is_strong, message = validate_password_strength(password)
    if not is_strong:
        raise HTTPException(status_code=400, detail=message)

    # Check if email already exists
    for user_id, user in users_db.items():
        if user.email == email:
            raise HTTPException(status_code=409, detail="Email already registered")

    # Hash password
    hashed_password = hash_password(password)

    # Create new user
    new_user_id = len(users_db) + 1
    new_user = User(
        id=new_user_id,
        username=email.split("@")[0],
        discogsUserId=None,
        email=email,
        firstName=firstName,
        lastName=lastName,
        passwordHash=hashed_password  # Store hashed password
    )
    users_db[str(new_user_id)] = new_user

    # Create JWT token
    token = create_jwt_token(new_user_id)

    return {
        "user": new_user,
        "token": token,
        "message": "Registration successful"
    }

# Update login endpoint
@app.post("/auth/login")
async def login(credentials: dict):
    """Login user with enhanced security"""
    email = credentials.get("email")
    password = credentials.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    # Find user by email
    user = None
    for user_id, u in users_db.items():
        if u.email == email:
            user = u
            break

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify password
    if not verify_password(password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT token
    token = create_jwt_token(user.id)

    return {
        "user": user,
        "token": token,
        "message": "Login successful"
    }
```

## 📊 Monitoring & Logging

### 1. Log Configuration

```python
# Add to backend/main.py
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('/var/log/waxvalue/backend.log', maxBytes=10485760, backupCount=5),
        logging.StreamHandler()
    ]
)

# Security logging
security_logger = logging.getLogger('security')
security_logger.addHandler(RotatingFileHandler('/var/log/waxvalue/security.log', maxBytes=10485760, backupCount=10))

# Log security events
def log_security_event(event_type: str, user_id: int = None, ip_address: str = None, details: str = ""):
    """Log security events"""
    security_logger.info(f"SECURITY_EVENT: {event_type} | User: {user_id} | IP: {ip_address} | Details: {details}")
```

### 2. Health Checks

```python
# Add to backend/main.py
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check"""
    try:
        # Check database connection
        # Check Redis connection
        # Check Discogs API connectivity
        return {
            "status": "healthy",
            "database": "connected",
            "redis": "connected",
            "discogs_api": "accessible",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
```

## 🔄 Deployment Scripts

### 1. Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting WaxValue deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production
pip3 install -r backend/requirements.txt

# Run tests
npm run test
python3 -m pytest backend/tests/

# Build application
npm run build

# Run database migrations
python3 backend/migrate.py

# Restart services
sudo systemctl restart waxvalue-frontend
sudo systemctl restart waxvalue-backend

# Check service status
sudo systemctl status waxvalue-frontend
sudo systemctl status waxvalue-backend

echo "✅ Deployment completed successfully!"
```

### 2. Backup Script

Create `scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/waxvalue/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump waxvalue_prod > $BACKUP_DIR/database_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/application_$DATE.tar.gz /home/waxvalue/waxvalue

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $DATE"
```

## 🚨 Security Checklist

- [ ] All passwords are hashed with bcrypt
- [ ] JWT tokens are used for authentication
- [ ] SSL/TLS certificates are installed and auto-renewing
- [ ] Rate limiting is configured
- [ ] Security headers are set
- [ ] Database connections are encrypted
- [ ] Environment variables are secured
- [ ] Logging is configured for security events
- [ ] Firewall rules are in place
- [ ] Regular backups are scheduled
- [ ] Monitoring is set up
- [ ] Dependencies are updated regularly

## 📞 Support & Maintenance

### Regular Tasks:
- [ ] Weekly security updates
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Daily backup verification
- [ ] Monitor logs for security events

### Emergency Procedures:
- [ ] Incident response plan
- [ ] Backup restoration process
- [ ] Service restart procedures
- [ ] Security breach response

---

**⚠️ Important**: Always test your deployment in a staging environment before deploying to production. Keep your dependencies updated and monitor your application logs regularly for any security issues.
