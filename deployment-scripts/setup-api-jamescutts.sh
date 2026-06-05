#!/bin/bash
# One-time setup: api.jamescutts.me → FastAPI + update backend OAuth URL
# Run ON THE VPS as root (or with sudo):
#   cd /var/www/waxvalue && sudo bash deployment-scripts/setup-api-jamescutts.sh

set -e

FRONTEND_URL="${FRONTEND_URL:-https://waxvalue.jamescutts.me}"
API_DOMAIN="${API_DOMAIN:-api.jamescutts.me}"
PROJECT_DIR="${PROJECT_DIR:-/var/www/waxvalue}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Waxvalue — setup ${API_DOMAIN}${NC}"
echo "  Frontend (OAuth): ${FRONTEND_URL}"
echo ""

if [ "$(id -u)" -ne 0 ]; then
  echo -e "${RED}Run with sudo: sudo bash deployment-scripts/setup-api-jamescutts.sh${NC}"
  exit 1
fi

if [ ! -d "$PROJECT_DIR" ]; then
  PROJECT_DIR="$HOME/waxvalue"
fi
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${RED}Project not found. Clone repo to /var/www/waxvalue first.${NC}"
  exit 1
fi

cd "$PROJECT_DIR"

# --- 1. Backend .env ---
ENV_FILE="$PROJECT_DIR/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$PROJECT_DIR/config/production.env.backend" ]; then
    cp "$PROJECT_DIR/config/production.env.backend" "$ENV_FILE"
    echo -e "${YELLOW}Created backend/.env from config/production.env.backend — add Discogs keys if missing.${NC}"
  else
    echo -e "${RED}No backend/.env found. Create it with DISCOGS_CONSUMER_KEY and DISCOGS_CONSUMER_SECRET.${NC}"
    exit 1
  fi
fi

update_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

update_env "FRONTEND_URL" "$FRONTEND_URL"
echo -e "${GREEN}✅ backend/.env → FRONTEND_URL=${FRONTEND_URL}${NC}"

# --- 2. Nginx ---
if ! command -v nginx >/dev/null 2>&1; then
  echo -e "${RED}nginx not installed. Run: apt install -y nginx${NC}"
  exit 1
fi

cp "$PROJECT_DIR/deployment-scripts/nginx-api.jamescutts.me.conf" \
  "/etc/nginx/sites-available/${API_DOMAIN}"

ln -sf "/etc/nginx/sites-available/${API_DOMAIN}" \
  "/etc/nginx/sites-enabled/${API_DOMAIN}"

nginx -t
systemctl reload nginx
echo -e "${GREEN}✅ Nginx configured for ${API_DOMAIN}${NC}"

# --- 3. SSL (needs DNS A record → this server already) ---
if command -v certbot >/dev/null 2>&1; then
  echo ""
  echo -e "${YELLOW}Requesting SSL certificate (DNS must already point here)...${NC}"
  certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos \
    -m "${CERTBOT_EMAIL:-admin@jamescutts.me}" 2>/dev/null || \
  certbot --nginx -d "$API_DOMAIN" || true
else
  echo -e "${YELLOW}⚠️  certbot not found. After DNS works, run:${NC}"
  echo "    certbot --nginx -d ${API_DOMAIN}"
fi

# --- 4. PM2 backend ---
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart waxvalue-backend 2>/dev/null || {
    echo -e "${YELLOW}waxvalue-backend not in PM2 — start with deploy-on-vps.sh first${NC}"
  }
  echo -e "${GREEN}✅ Backend restarted (if PM2 process existed)${NC}"
fi

echo ""
echo -e "${GREEN}Done on server.${NC}"
echo ""
echo "Verify:"
echo "  curl -sI https://${API_DOMAIN}/docs | head -1"
echo ""
echo "You still must (manual):"
echo "  1. DNS A record: ${API_DOMAIN} → this server's public IP"
echo "  2. Discogs callback: ${FRONTEND_URL}/auth/callback"
echo "  3. Hostinger env: NEXT_PUBLIC_BACKEND_URL=https://${API_DOMAIN}"
