# 🚀 QNAP Quick Start for WaxValue

## Your Setup Details
- **QNAP IP**: 192.168.1.230
- **Web Interface**: http://192.168.1.230:8080/
- **SSH Access**: admin@192.168.1.230
- **Password**: Babylon1
- **Repository**: https://github.com/deepdesign/waxvalue.git

## 🏃‍♂️ Fastest Setup (5 minutes)

### Option 1: Container Station (Recommended)

1. **Open QNAP Web Interface**:
   ```
   http://192.168.1.230:8080/
   Login: admin / Babylon1
   ```

2. **Install Container Station**:
   - Go to **App Center**
   - Search "Container Station"
   - Install and launch

3. **Upload Your Code**:
   - Use **File Station** to upload your WaxValue project
   - Or use SCP from your computer:
   ```bash
   scp -r . admin@192.168.1.230:/share/Web/waxvalue-dev/
   ```

4. **Create Docker Compose**:
   Create `/share/Web/waxvalue-dev/docker-compose.yml`:
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

     frontend:
       build: .
       ports:
         - "3000:3000"
       volumes:
         - .:/app
         - /app/node_modules
       environment:
         - NODE_ENV=development
         - NEXT_PUBLIC_API_URL=http://192.168.1.230:8000

     backend:
       build: ./backend
       ports:
         - "8000:8000"
       volumes:
         - ./backend:/app
       environment:
         - DATABASE_URL=postgresql://waxvalue:dev_password@postgres:5432/waxvalue_dev
         - JWT_SECRET=dev_jwt_secret_32_characters_long

   volumes:
     postgres_data:
   ```

5. **Start the Application**:
   - In Container Station, click **Create** → **Create Application**
   - Upload the docker-compose.yml
   - Click **Create**

6. **Access Your App**:
   - **Frontend**: http://192.168.1.230:3000
   - **Backend**: http://192.168.1.230:8000

### Option 2: SSH Direct Setup

1. **Connect to QNAP**:
   ```bash
   ssh admin@192.168.1.230
   # Password: Babylon1
   ```

2. **Run the Setup Script**:
   ```bash
   # Download and run the setup script
   curl -o qnap-setup.sh https://raw.githubusercontent.com/deepdesign/waxvalue/main/scripts/qnap-setup.sh
   chmod +x qnap-setup.sh
   ./qnap-setup.sh
   ```

3. **Or Manual Setup**:
   ```bash
   # Install packages
   opkg update
   opkg install node npm python3 python3-pip postgresql-server git

   # Clone repository
   mkdir -p /share/Web/waxvalue-dev
   cd /share/Web/waxvalue-dev
   git clone https://github.com/deepdesign/waxvalue.git .

   # Install dependencies
   npm install
   pip3 install -r backend/requirements.txt

   # Start services
   npm run dev &  # Frontend on port 3000
   python3 backend/main.py &  # Backend on port 8000
   ```

## 🔧 Development Workflow

### Daily Development Process:
1. **Develop locally** on your Windows machine
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "New feature"
   git push origin main
   ```
3. **Pull on QNAP**:
   ```bash
   ssh admin@192.168.1.230
   cd /share/Web/waxvalue-dev
   git pull origin main
   ```
4. **Test immediately** at http://192.168.1.230:3000

### Quick Commands:
```bash
# Connect to QNAP
ssh admin@192.168.1.230

# Update your app
cd /share/Web/waxvalue-dev
git pull origin main
npm install
npm run build

# Restart services (if needed)
# Kill and restart the processes
```

## 📱 Access Your Development Environment

- **Frontend**: http://192.168.1.230:3000
- **Backend API**: http://192.168.1.230:8000
- **Health Check**: http://192.168.1.230:8000/health
- **Database**: 192.168.1.230:5432 (if using PostgreSQL)

## 🔄 Auto-Deploy Script

Create this script on your QNAP for easy updates:
```bash
#!/bin/bash
# File: /share/Web/waxvalue-dev/update.sh

echo "🚀 Updating WaxValue on QNAP..."

cd /share/Web/waxvalue-dev

# Pull latest changes
git pull origin main

# Update dependencies
npm install
pip3 install -r backend/requirements.txt

# Build frontend
npm run build

echo "✅ Update complete!"
echo "🌐 Access at: http://192.168.1.230:3000"
```

## 🎯 Your QNAP Benefits

- ✅ **24/7 Development Server** - Always available
- ✅ **Local Network Access** - Fast development
- ✅ **Perfect Hardware** - 4 cores, 8GB RAM
- ✅ **Easy Backup** - QNAP's built-in backup tools
- ✅ **Network Access** - Test from any device on your network

## 🚨 Troubleshooting

### If services don't start:
```bash
# Check if ports are in use
netstat -tlnp | grep -E ':(3000|8000|5432)'

# Check logs
tail -f /var/log/messages
```

### If you can't access the web interface:
- Check if QNAP is running: `ping 192.168.1.230`
- Try different ports: http://192.168.1.230:8080/
- Check firewall settings in QNAP Control Panel

### If Git clone fails:
- Check internet connection on QNAP
- Verify repository URL: https://github.com/deepdesign/waxvalue.git
- Try using HTTPS instead of SSH

---

**🎉 Ready to go!** Your QNAP TS-664 is perfect for WaxValue development. Once set up, you'll have a powerful, always-available development server on your local network!
