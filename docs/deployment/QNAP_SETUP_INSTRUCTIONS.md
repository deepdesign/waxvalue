# QNAP TS-664 WaxValue Development Setup

## 🏠 Your QNAP Configuration
- **IP**: 192.168.1.230
- **Web Interface**: http://192.168.1.230:8080/
- **SSH**: admin@192.168.1.230
- **Password**: Babylon1
- **Model**: TS-664 (4-core Intel Celeron J4125, 8GB RAM)

## 🐳 Method 1: Container Station (Recommended)

### Step 1: Install Container Station
1. Open QNAP web interface: http://192.168.1.230:8080/
2. Login: admin / Babylon1
3. Go to **App Center**
4. Search for "Container Station"
5. Install and launch Container Station

### Step 2: Create Development Environment

#### Create the following files on your QNAP:

**1. Frontend Container (Next.js)**
Create: `/share/Web/waxvalue-dev/containers/frontend/Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

**2. Backend Container (FastAPI)**
Create: `/share/Web/waxvalue-dev/containers/backend/Dockerfile`
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ .

# Expose port
EXPOSE 8000

# Start development server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

**3. Docker Compose Configuration**
Create: `/share/Web/waxvalue-dev/docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: waxvalue_dev
      POSTGRES_USER: waxvalue
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  frontend:
    build: ./containers/frontend
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://192.168.1.230:8000
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build: ./containers/backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://waxvalue:dev_password@postgres:5432/waxvalue_dev
      - REDIS_URL=redis://redis:6379
      - DISCOGS_CONSUMER_KEY=your_dev_key
      - DISCOGS_CONSUMER_SECRET=your_dev_secret
      - JWT_SECRET=dev_jwt_secret_32_characters_long
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Step 3: Deploy Your Application

**1. Upload Your Code**
- Copy your WaxValue project to `/share/Web/waxvalue-dev/` on your QNAP
- You can use File Station in the web interface or SCP

**2. Start the Development Environment**
```bash
# Via Container Station web interface:
# 1. Go to Container Station
# 2. Click "Create" → "Create Application"
# 3. Upload docker-compose.yml
# 4. Click "Create"

# Or via SSH:
cd /share/Web/waxvalue-dev
docker-compose up -d
```

**3. Access Your Application**
- **Frontend**: http://192.168.1.230:3000
- **Backend API**: http://192.168.1.230:8000
- **Health Check**: http://192.168.1.230:8000/health

## 🐧 Method 2: Native Linux Development

### Step 1: Enable SSH Access
1. Go to **Control Panel** → **Network & File Services** → **Telnet/SSH**
2. Enable SSH service
3. Set port (default 22)

### Step 2: Install Development Tools
```bash
# Connect via SSH
ssh admin@192.168.1.230

# Update package manager
opkg update

# Install Node.js
opkg install node npm

# Install Python
opkg install python3 python3-pip

# Install PostgreSQL
opkg install postgresql-server

# Install Git
opkg install git
```

### Step 3: Setup Development Environment
```bash
# Create development directory
mkdir -p /share/Web/waxvalue-dev
cd /share/Web/waxvalue-dev

# Clone your repository (or copy files)
git clone https://github.com/deepdesign/waxvalue.git .

# Install dependencies
npm install
pip3 install -r backend/requirements.txt

# Create development environment file
cat > .env.development << EOF
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://192.168.1.230:8000
NEXT_PUBLIC_APP_URL=http://192.168.1.230:3000

DATABASE_URL=postgresql://waxvalue:dev_password@localhost:5432/waxvalue_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waxvalue_dev
DB_USER=waxvalue
DB_PASSWORD=dev_password

JWT_SECRET=dev_jwt_secret_32_characters_long
JWT_EXPIRES_IN=24h

DISCOGS_CONSUMER_KEY=your_dev_consumer_key
DISCOGS_CONSUMER_SECRET=your_dev_consumer_secret

REDIS_URL=redis://localhost:6379

SECURE_COOKIES=false
CORS_ORIGIN=http://192.168.1.230:3000
EOF
```

### Step 4: Start Development Services
```bash
# Terminal 1: Start backend
cd /share/Web/waxvalue-dev
python3 backend/main.py

# Terminal 2: Start frontend
cd /share/Web/waxvalue-dev
npm run dev
```

## 🔧 Development Workflow

### Daily Development Process
1. **Make changes** on your local machine
2. **Push to Git** repository
3. **Pull on QNAP**: `git pull origin main`
4. **Restart services** if needed
5. **Test immediately** at http://192.168.1.230:3000

### Access Your Development Environment
- **Frontend**: http://192.168.1.230:3000
- **Backend**: http://192.168.1.230:8000
- **Database**: 192.168.1.230:5432
- **File Access**: Use QNAP File Station or network drive mapping

## 📱 Testing Your Setup

### 1. Health Checks
```bash
# Test backend
curl http://192.168.1.230:8000/health

# Test frontend
curl -I http://192.168.1.230:3000
```

### 2. Database Connection
```bash
# Connect to PostgreSQL
psql -h 192.168.1.230 -p 5432 -U waxvalue -d waxvalue_dev
```

### 3. Application Features
- Test user registration/login
- Test Discogs OAuth flow
- Test price suggestions
- Test all dashboard features

## 🔄 Auto-Deployment Script

Create a deployment script on your QNAP:
```bash
#!/bin/bash
# File: /share/Web/waxvalue-dev/deploy-dev.sh

echo "🚀 Deploying WaxValue to QNAP..."

# Pull latest changes
git pull origin main

# Install/update dependencies
npm install
pip3 install -r backend/requirements.txt

# Build frontend
npm run build

# Restart services (if using systemd or similar)
# systemctl restart waxvalue-frontend
# systemctl restart waxvalue-backend

echo "✅ Deployment complete!"
echo "Frontend: http://192.168.1.230:3000"
echo "Backend: http://192.168.1.230:8000"
```

## 💡 QNAP-Specific Tips

### Performance Optimization
- Your TS-664 has 4 cores and 8GB RAM - perfect for development
- Use SSD storage for better performance
- Enable RAM caching in QNAP settings

### Network Access
- Your QNAP is accessible from your local network at 192.168.1.230
- You can access it from any device on your network
- Perfect for testing on different devices

### Backup Strategy
- Use QNAP's built-in backup tools
- Backup your development database regularly
- Include your code in QNAP snapshots

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 3000, 8000, 5432 are available
2. **Permission issues**: Ensure admin user has proper permissions
3. **Network access**: Verify firewall settings
4. **Container issues**: Check Container Station logs

### Getting Help
- Check QNAP system logs
- Monitor resource usage in Resource Monitor
- Use Container Station logs for Docker issues

---

**🎉 Result**: Your QNAP TS-664 will serve as a perfect 24/7 development server for WaxValue, accessible from anywhere on your network!
