# WaxValue Configuration Files

## 📁 Configuration Directory

This directory contains all configuration files for different deployment environments.

### 🐧 Systemd Services
- **`systemd/waxvalue-frontend.service`** - Next.js frontend service configuration
- **`systemd/waxvalue-backend.service`** - FastAPI backend service configuration

### 🌍 Environment Configuration
- **`env.production.example`** - Production environment variables template

## 🚀 Usage

### Systemd Services
Copy the service files to your production server:
```bash
sudo cp config/systemd/*.service /etc/systemd/system/
sudo systemctl enable waxvalue-frontend waxvalue-backend
sudo systemctl start waxvalue-frontend waxvalue-backend
```

### Environment Variables
Copy and customize the environment template:
```bash
cp config/env.production.example .env.production
# Edit .env.production with your actual values
```

## 🔧 Configuration Notes

### Service Files
- Configured for production deployment
- Includes security settings and resource limits
- Set up for automatic restart and logging

### Environment Variables
- All sensitive values marked as examples
- Includes all necessary configuration sections
- Organized by category for easy management

---

**⚠️ Security Note**: Never commit actual production environment files to version control. Always use the `.example` files as templates.
