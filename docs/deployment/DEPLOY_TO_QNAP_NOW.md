# 🚀 Deploy WaxValue to Your QNAP NAS - Step by Step

## Your QNAP Details
- **IP**: 192.168.1.230
- **Web Interface**: http://192.168.1.230:8080/
- **SSH**: admin@192.168.1.230
- **Password**: Babylon1
- **Repository**: https://github.com/deepdesign/waxvalue.git

## 🎯 Method 1: Container Station (Easiest - 10 minutes)

### Step 1: Access Your QNAP
1. Open browser: http://192.168.1.230:8080/
2. Login: admin / Babylon1

### Step 2: Install Container Station
1. Go to **App Center**
2. Search "Container Station"
3. Click **Install** and wait for completion
4. Launch Container Station

### Step 3: Upload Your Project
**Option A: Using File Station (Easiest)**
1. In QNAP web interface, open **File Station**
2. Navigate to `/share/Web/`
3. Create folder `waxvalue-dev`
4. Upload your entire WaxValue project folder to `/share/Web/waxvalue-dev/`

**Option B: Using SCP from your computer**
```bash
# From your Windows computer, in PowerShell:
scp -r "C:\Projects\Web\waxvalue\*" admin@192.168.1.230:/share/Web/waxvalue-dev/
```

### Step 4: Create Docker Compose File
In File Station, create a new file `/share/Web/waxvalue-dev/docker-compose.yml`:

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
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://waxvalue:dev_password@postgres:5432/waxvalue_dev
      - JWT_SECRET=dev_jwt_secret_32_characters_long_for_qnap
      - DISCOGS_CONSUMER_KEY=your_dev_key
      - DISCOGS_CONSUMER_SECRET=your_dev_secret
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 5: Start the Application
1. In Container Station, click **Create**
2. Select **Create Application**
3. Choose **Upload** and select your `docker-compose.yml` file
4. Click **Create**
5. Wait for all containers to start (green status)

### Step 6: Access Your Application
- **Frontend**: http://192.168.1.230:3000
- **Backend**: http://192.168.1.230:8000
- **Health Check**: http://192.168.1.230:8000/health

---

## 🎯 Method 2: SSH Direct Setup (Advanced)

### Step 1: Connect via SSH
```bash
ssh admin@192.168.1.230
# Password: Babylon1
```

### Step 2: Install Required Packages
```bash
# Update package manager
opkg update

# Install Node.js and npm
opkg install node npm

# Install Python and pip
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

# Clone your repository
git clone https://github.com/deepdesign/waxvalue.git .

# Install dependencies
npm install
pip3 install -r backend/requirements.txt
```

### Step 4: Create Environment File
```bash
cat > .env.development << 'EOF'
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://192.168.1.230:8000
NEXT_PUBLIC_APP_URL=http://192.168.1.230:3000

DATABASE_URL=postgresql://waxvalue:dev_password@localhost:5432/waxvalue_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waxvalue_dev
DB_USER=waxvalue
DB_PASSWORD=dev_password

JWT_SECRET=dev_jwt_secret_32_characters_long_for_qnap
JWT_EXPIRES_IN=24h

DISCOGS_CONSUMER_KEY=your_dev_consumer_key
DISCOGS_CONSUMER_SECRET=your_dev_consumer_secret

REDIS_URL=redis://localhost:6379

SECURE_COOKIES=false
CORS_ORIGIN=http://192.168.1.230:3000
EOF
```

### Step 5: Start Services
```bash
# Start backend (in background)
cd backend
python3 main.py &

# Start frontend (in background)
cd ..
npm run dev &
```

---

## 🔧 Quick Commands for You to Run

### If using Container Station:
1. **Upload files** via File Station to `/share/Web/waxvalue-dev/`
2. **Create docker-compose.yml** with the content above
3. **Deploy** in Container Station

### If using SSH:
```bash
# Connect to QNAP
ssh admin@192.168.1.230

# Run these commands one by one:
mkdir -p /share/Web/waxvalue-dev
cd /share/Web/waxvalue-dev
git clone https://github.com/deepdesign/waxvalue.git .
npm install
pip3 install -r backend/requirements.txt
```

## 📱 Testing Your Deployment

Once deployed, test these URLs:
- **Frontend**: http://192.168.1.230:3000
- **Backend Health**: http://192.168.1.230:8000/health
- **API Docs**: http://192.168.1.230:8000/docs

## 🚨 Troubleshooting

### If Container Station fails:
- Check if all containers are running (green status)
- Look at container logs in Container Station
- Ensure ports 3000 and 8000 are not blocked

### If SSH setup fails:
- Check if packages installed correctly: `opkg list-installed`
- Verify Node.js: `node --version`
- Verify Python: `python3 --version`

### If you can't access the app:
- Check QNAP firewall settings
- Ensure services are running: `ps aux | grep node`
- Check port status: `netstat -tlnp | grep -E ':(3000|8000)'`

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ WaxValue running on your QNAP NAS
- ✅ Accessible from any device on your network
- ✅ 24/7 development server
- ✅ Easy updates via git pull

**Your app will be live at: http://192.168.1.230:3000**

---

**Need help?** Let me know which method you're using and I can guide you through any issues!
