#!/bin/bash

# Comprehensive VPS Security Scan
# Scans for malware, suspicious processes, backdoors, and security issues

echo "🔒 VPS Security Scan Starting..."
echo "=================================="
echo "Scanning ALL directories and apps on your VPS..."
echo "Directories being scanned:"
echo "  - /var/www (all web apps)"
echo "  - /home/*/public_html (user web directories)"
echo "  - /home/*/www (user web directories)"
echo "  - /opt (optional apps)"
echo "  - /srv (service data)"
echo "  - /root (root files)"
echo "  - /home (all user directories)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Define directories to scan (all your apps/sites)
WEB_DIRS="/var/www /home/*/public_html /home/*/www /opt /srv /usr/local/www"
APP_DIRS="/var/www /home /root /opt /srv /usr/local/www"

# 1. Check for suspicious processes
echo "1️⃣  Checking for suspicious processes..."
echo "----------------------------------------"
SUSPICIOUS_PROCS=$(ps aux | grep -E '\.(r0qsv8h1|394ly8v9|systemhelper|miner|crypto|bitcoin)' | grep -v grep)
if [ ! -z "$SUSPICIOUS_PROCS" ]; then
    echo -e "${RED}⚠️  SUSPICIOUS PROCESSES FOUND:${NC}"
    echo "$SUSPICIOUS_PROCS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No suspicious processes found${NC}"
fi
echo ""

# 2. Check for suspicious Node.js processes
echo "2️⃣  Checking Node.js processes..."
echo "----------------------------------------"
NODE_PROCS=$(ps aux | grep node | grep -v grep | grep -v 'next\|npm\|pm2')
if [ ! -z "$NODE_PROCS" ]; then
    echo -e "${YELLOW}⚠️  Non-standard Node.js processes:${NC}"
    echo "$NODE_PROCS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No suspicious Node.js processes${NC}"
fi
echo ""

# 3. Check for suspicious directories
echo "3️⃣  Checking for known malware directories..."
echo "----------------------------------------"
SUSPICIOUS_DIRS=(
    "/root/.local/share/.r0qsv8h1"
    "/tmp/.X11-unix"
    "/tmp/.ICE-unix"
    "/var/tmp/.systemhelper"
    "/root/.systemhelper"
    "/tmp/miner"
    "/tmp/crypto"
)
FOUND_DIRS=""
for dir in "${SUSPICIOUS_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        FOUND_DIRS="$FOUND_DIRS\n$dir"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done
if [ ! -z "$FOUND_DIRS" ]; then
    echo -e "${RED}⚠️  SUSPICIOUS DIRECTORIES FOUND:${NC}"
    echo -e "$FOUND_DIRS"
else
    echo -e "${GREEN}✓ No known malware directories found${NC}"
fi
echo ""

# 4. Check cron jobs
echo "4️⃣  Checking cron jobs..."
echo "----------------------------------------"
CRON_JOBS=$(crontab -l 2>/dev/null | grep -v '^#' | grep -v '^$')
ROOT_CRON=$(crontab -l -u root 2>/dev/null | grep -v '^#' | grep -v '^$')
ALL_CRON=$(for user in $(cut -f1 -d: /etc/passwd); do crontab -l -u "$user" 2>/dev/null | grep -v '^#' | grep -v '^$' | sed "s/^/$user: /"; done)

SUSPICIOUS_CRON=$(echo "$ALL_CRON" | grep -E 'curl.*bash|wget.*bash|\.sh.*http|systemhelper|miner|crypto')
if [ ! -z "$SUSPICIOUS_CRON" ]; then
    echo -e "${RED}⚠️  SUSPICIOUS CRON JOBS FOUND:${NC}"
    echo "$SUSPICIOUS_CRON"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No suspicious cron jobs found${NC}"
fi
if [ ! -z "$CRON_JOBS" ] || [ ! -z "$ROOT_CRON" ]; then
    echo -e "${YELLOW}📋 Current cron jobs (review manually):${NC}"
    [ ! -z "$CRON_JOBS" ] && echo "Current user:" && echo "$CRON_JOBS"
    [ ! -z "$ROOT_CRON" ] && echo "Root:" && echo "$ROOT_CRON"
fi
echo ""

# 5. Check systemd services
echo "5️⃣  Checking systemd services..."
echo "----------------------------------------"
SUSPICIOUS_SERVICES=$(systemctl list-units --type=service --all | grep -E 'systemhelper|miner|crypto|suspicious' || true)
if [ ! -z "$SUSPICIOUS_SERVICES" ]; then
    echo -e "${RED}⚠️  SUSPICIOUS SERVICES FOUND:${NC}"
    echo "$SUSPICIOUS_SERVICES"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No suspicious systemd services found${NC}"
fi
echo ""

# 6. Check for suspicious network connections
echo "6️⃣  Checking network connections..."
echo "----------------------------------------"
SUSPICIOUS_CONNS=$(netstat -tulpn 2>/dev/null | grep -E 'ESTABLISHED.*:[0-9]{4,5}' | grep -vE ':(80|443|22|3000|8000|3306|5432)' || ss -tulpn 2>/dev/null | grep -E 'ESTAB.*:[0-9]{4,5}' | grep -vE ':(80|443|22|3000|8000|3306|5432)')
if [ ! -z "$SUSPICIOUS_CONNS" ]; then
    echo -e "${YELLOW}⚠️  Unusual network connections (review manually):${NC}"
    echo "$SUSPICIOUS_CONNS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No unusual network connections${NC}"
fi
echo ""

# 7. Check for PHP shells and backdoors (scan ALL web/app directories)
echo "7️⃣  Scanning for PHP shells and backdoors..."
echo "----------------------------------------"
# Scan multiple common web/app directories
WEB_DIRS="/var/www /home/*/public_html /home/*/www /opt /srv /usr/local/www"
PHP_SHELLS=""
for dir in $WEB_DIRS; do
    if [ -d "$dir" ]; then
        FOUND=$(find "$dir" -name "*.php" -type f 2>/dev/null | xargs grep -l "eval\|base64_decode\|system\|exec\|shell_exec\|passthru" 2>/dev/null 2>/dev/null | head -20)
        if [ ! -z "$FOUND" ]; then
            PHP_SHELLS="$PHP_SHELLS\n$FOUND"
        fi
    fi
done
if [ ! -z "$PHP_SHELLS" ]; then
    echo -e "${YELLOW}⚠️  PHP files with suspicious functions (review manually):${NC}"
    echo -e "$PHP_SHELLS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No obvious PHP shells found${NC}"
fi
echo ""

# 8. Check for suspicious scripts in ALL app directories
echo "8️⃣  Checking for suspicious scripts..."
echo "----------------------------------------"
# Scan all common app/web directories
APP_DIRS="/var/www /home /root /opt /srv /usr/local/www"
SUSPICIOUS_SCRIPTS=""
for dir in $APP_DIRS; do
    if [ -d "$dir" ]; then
        FOUND=$(find "$dir" -type f \( -name "*.sh" -o -name "*.py" -o -name "*.js" \) 2>/dev/null | xargs grep -l "curl.*bash\|wget.*bash\|base64.*decode\|eval\|system(" 2>/dev/null | head -20)
        if [ ! -z "$FOUND" ]; then
            SUSPICIOUS_SCRIPTS="$SUSPICIOUS_SCRIPTS\n$FOUND"
        fi
    fi
done
if [ ! -z "$SUSPICIOUS_SCRIPTS" ]; then
    echo -e "${YELLOW}⚠️  Scripts with suspicious patterns (review manually):${NC}"
    echo -e "$SUSPICIOUS_SCRIPTS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No obvious malicious scripts found${NC}"
fi
echo ""

# 9. Check file permissions (ALL web/app directories)
echo "9️⃣  Checking for world-writable files in web directories..."
echo "----------------------------------------"
WW_FILES=""
for dir in $WEB_DIRS; do
    if [ -d "$dir" ]; then
        FOUND=$(find "$dir" -type f -perm -002 2>/dev/null | head -20)
        if [ ! -z "$FOUND" ]; then
            WW_FILES="$WW_FILES\n$FOUND"
        fi
    fi
done
if [ ! -z "$WW_FILES" ]; then
    echo -e "${YELLOW}⚠️  World-writable files found (security risk):${NC}"
    echo -e "$WW_FILES"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No world-writable files in web directories${NC}"
fi
echo ""

# 10. Check for hidden files in ALL web/app directories
echo "🔟 Checking for hidden files in web directories..."
echo "----------------------------------------"
HIDDEN_FILES=""
for dir in $WEB_DIRS; do
    if [ -d "$dir" ]; then
        FOUND=$(find "$dir" -name ".*" -type f 2>/dev/null | grep -v ".git" | head -20)
        if [ ! -z "$FOUND" ]; then
            HIDDEN_FILES="$HIDDEN_FILES\n$FOUND"
        fi
    fi
done
if [ ! -z "$HIDDEN_FILES" ]; then
    echo -e "${YELLOW}⚠️  Hidden files found (review manually):${NC}"
    echo -e "$HIDDEN_FILES"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No suspicious hidden files${NC}"
fi
echo ""

# 11. Check for suspicious file modifications (recent) - ALL directories
echo "1️⃣1️⃣  Checking for recently modified suspicious files..."
echo "----------------------------------------"
RECENT_SUSPICIOUS=""
for dir in $APP_DIRS; do
    if [ -d "$dir" ]; then
        FOUND=$(find "$dir" -type f -mtime -7 \( -name "*.php" -o -name "*.sh" -o -name "*.py" -o -name "*.js" \) 2>/dev/null | head -20)
        if [ ! -z "$FOUND" ]; then
            RECENT_SUSPICIOUS="$RECENT_SUSPICIOUS\n$FOUND"
        fi
    fi
done
if [ ! -z "$RECENT_SUSPICIOUS" ]; then
    echo -e "${YELLOW}📋 Recently modified files (last 7 days - review manually):${NC}"
    echo -e "$RECENT_SUSPICIOUS"
fi
echo ""

# 12. Check disk usage (unusual growth might indicate malware)
echo "1️⃣2️⃣  Checking disk usage..."
echo "----------------------------------------"
df -h | head -5
echo ""

# Summary
echo "=================================="
echo "📊 SCAN SUMMARY"
echo "=================================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No obvious security issues found!${NC}"
else
    echo -e "${RED}⚠️  Found $ISSUES_FOUND potential security issue(s)${NC}"
    echo ""
    echo "🔍 Next steps:"
    echo "   1. Review each flagged item above"
    echo "   2. Check file contents: cat <filename>"
    echo "   3. Check process details: ps aux | grep <pid>"
    echo "   4. Remove confirmed malicious files/processes"
    echo "   5. Review cron jobs: crontab -l"
    echo "   6. Check system logs: journalctl -xe"
fi
echo ""
echo "💡 Additional security checks:"
echo "   - Run: chkrootkit (if installed)"
echo "   - Run: rkhunter (if installed)"
echo "   - Review: /var/log/auth.log for failed login attempts"
echo "   - Review: /var/log/nginx/access.log for suspicious requests"
echo ""

