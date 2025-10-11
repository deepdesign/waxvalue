# WaxValue QNAP Development Setup

## 🏠 Running on QNAP TS-664 NAS

### System Requirements Check
Your QNAP TS-664 has:
- **CPU**: Intel Celeron J4125 (4 cores)
- **RAM**: 8GB (expandable to 32GB)
- **Storage**: 6-bay NAS with SSD support
- **Network**: Gigabit Ethernet

**✅ Perfect for development!** Your NAS has enough resources to run:
- Next.js frontend (Node.js)
- FastAPI backend (Python)
- PostgreSQL database
- Redis for caching

## 🐳 Option 1: Docker Container Station (Recommended)

### Install Container Station
1. Open QNAP App Center
2. Search for "Container Station"
3. Install and launch Container Station

### Create Development Environment

#### Frontend Container (Next.js)
```dockerfile
# Create: containers/nextjs-dev/Dockerfile
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

#### Backend Container (FastAPI)
```dockerfile
# Create: containers/fastapi-dev/Dockerfile
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

#### Database Container (PostgreSQL)
```yaml
# Create: containers/docker-compose.yml
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
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  frontend:
    build: ./nextjs-dev
    ports:
      - "3000:3000"
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://your-qnap-ip:8000
    depends_on:
      - backend

  backend:
    build: ./fastapi-dev
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

volumes:
  postgres_data:
  redis_data:
```

## 🐧 Option 2: Native Linux Development

### Enable SSH Access
1. Go to **Control Panel** → **Network & File Services** → **Telnet/SSH**
2. Enable SSH service
3. Set port (default 22)

### Install Development Tools via SSH
```bash
# Connect to your QNAP via SSH
ssh admin@your-qnap-ip

# Update package manager
opkg update

# Install Node.js (if not available, use Entware)
opkg install node npm

# Install Python and pip
opkg install python3 python3-pip

# Install PostgreSQL
opkg install postgresql-server

# Install Git
opkg install git
```

### Setup Development Environment
```bash
# Create development directory
mkdir -p /share/Web/waxvalue-dev
cd /share/Web/waxvalue-dev

# Clone your repository
git clone https://github.com/yourusername/waxvalue.git .

# Install dependencies
npm install
pip3 install -r backend/requirements.txt

# Create development environment file
cp env.production.example .env.development
```

## 🌐 Network Configuration

### Access from Your Network
Your QNAP NAS will be accessible at:
- **Frontend**: `http://your-qnap-ip:3000`
- **Backend**: `http://your-qnap-ip:8000`
- **Database**: `your-qnap-ip:5432`

### Port Forwarding (Optional)
If you want external access:
1. Go to **Control Panel** → **Network & Virtual Switch** → **Port Forwarding**
2. Add rules:
   - Port 3000 → Frontend
   - Port 8000 → Backend
   - Port 5432 → Database (only if needed externally)

## 🔧 Development Configuration

### Environment Variables (.env.development)
```bash
# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://your-qnap-ip:8000
NEXT_PUBLIC_APP_URL=http://your-qnap-ip:3000

# Database
DATABASE_URL=postgresql://waxvalue:dev_password@localhost:5432/waxvalue_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waxvalue_dev
DB_USER=waxvalue
DB_PASSWORD=dev_password

# JWT (development only)
JWT_SECRET=dev_jwt_secret_32_characters_long
JWT_EXPIRES_IN=24h

# Discogs API (use test credentials)
DISCOGS_CONSUMER_KEY=your_dev_consumer_key
DISCOGS_CONSUMER_SECRET=your_dev_consumer_secret

# Redis
REDIS_URL=redis://localhost:6379

# Security (relaxed for development)
SECURE_COOKIES=false
CORS_ORIGIN=http://your-qnap-ip:3000
```

### Next.js Configuration (next.config.js)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DISCOGS_API_URL: process.env.DISCOGS_API_URL || 'https://api.discogs.com',
    DATABASE_URL: process.env.DATABASE_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `http://${process.env.BACKEND_HOST || 'localhost'}:${process.env.BACKEND_PORT || '8000'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

## 🚀 Starting Development Server

### Docker Method
```bash
# In Container Station terminal
cd /share/Web/waxvalue-dev
docker-compose up -d

# View logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Native Method
```bash
# Terminal 1: Start backend
cd /share/Web/waxvalue-dev
python3 backend/main.py

# Terminal 2: Start frontend
cd /share/Web/waxvalue-dev
npm run dev
```

## 📱 Testing Your Setup

### Access Your Application
1. **Frontend**: Open browser to `http://your-qnap-ip:3000`
2. **Backend API**: Test at `http://your-qnap-ip:8000/health`
3. **Database**: Connect with pgAdmin or similar tool

### Development Workflow
1. Make code changes on your local machine
2. Push to Git repository
3. Pull changes on QNAP: `git pull origin main`
4. Restart services if needed
5. Test changes immediately

## 🔄 Auto-Deployment Script

Create a simple deployment script:
```bash
#!/bin/bash
# File: /share/Web/waxvalue-dev/deploy.sh

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
echo "Frontend: http://your-qnap-ip:3000"
echo "Backend: http://your-qnap-ip:8000"
```

## 💡 QNAP-Specific Tips

### Performance Optimization
- Use SSD storage for better performance
- Enable RAM caching in QNAP settings
- Monitor CPU and RAM usage in QNAP Resource Monitor

### Backup Strategy
- Use QNAP's built-in backup tools
- Backup to external drive or cloud storage
- Include your development database in backups

### Security Considerations
- Use strong passwords for all services
- Enable firewall rules
- Regular firmware updates
- SSH key authentication instead of passwords

---

**Next Step**: Once your development environment is working on QNAP, we'll set up the migration to Hostinger!
