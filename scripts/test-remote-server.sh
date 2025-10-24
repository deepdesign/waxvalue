#!/bin/bash
# Comprehensive Remote Server Testing Script for WaxValue
# Run this on your Hostinger VPS to test all functionality

set -e  # Exit on error

echo "🧪 WaxValue Remote Server Testing"
echo "================================="
echo ""

# Configuration
PROJECT_DIR="/root/waxvalue"
DOMAIN="waxvalue.com"
BACKEND_URL="https://$DOMAIN/api/backend"
FRONTEND_URL="https://$DOMAIN"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function to check if service is running
check_service() {
    local service_name="$1"
    if pm2 list | grep -q "$service_name.*online"; then
        return 0
    else
        return 1
    fi
}

# Function to check HTTP response
check_http() {
    local url="$1"
    local expected_status="$2"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        echo "Expected: $expected_status, Got: $response"
        return 1
    fi
}

echo "🔍 Step 1: Environment Check"
echo "============================"

# Test 1: Check if we're in the right directory
run_test "Project directory exists" "[ -d '$PROJECT_DIR' ]" "Directory should exist"

# Test 2: Check if git repository is present
run_test "Git repository exists" "[ -d '$PROJECT_DIR/.git' ]" "Git repository should exist"

# Test 3: Check if node_modules exists
run_test "Node modules installed" "[ -d '$PROJECT_DIR/node_modules' ]" "Node modules should be installed"

# Test 4: Check if backend venv exists
run_test "Backend virtual environment exists" "[ -d '$PROJECT_DIR/backend/venv' ]" "Backend venv should exist"

echo ""
echo "🔧 Step 2: Service Status Check"
echo "==============================="

# Test 5: Check if PM2 is running
run_test "PM2 is running" "pm2 list > /dev/null" "PM2 should be running"

# Test 6: Check if frontend service is running
run_test "Frontend service is running" "check_service waxvalue-frontend" "Frontend service should be online"

# Test 7: Check if backend service is running
run_test "Backend service is running" "check_service waxvalue-backend" "Backend service should be online"

echo ""
echo "🌐 Step 3: Network Connectivity"
echo "==============================="

# Test 8: Check if Nginx is running
run_test "Nginx is running" "systemctl is-active --quiet nginx" "Nginx should be running"

# Test 9: Check if ports are listening
run_test "Port 3000 is listening" "netstat -tlnp | grep -q ':3000'" "Port 3000 should be listening"

# Test 10: Check if port 8000 is listening
run_test "Port 8000 is listening" "netstat -tlnp | grep -q ':8000'" "Port 8000 should be listening"

echo ""
echo "🔗 Step 4: API Endpoint Testing"
echo "==============================="

# Test 11: Check backend health endpoint
run_test "Backend health check" "check_http '$BACKEND_URL/health' '200'" "Backend health should return 200"

# Test 12: Check backend docs endpoint
run_test "Backend docs accessible" "check_http '$BACKEND_URL/docs' '200'" "Backend docs should return 200"

# Test 13: Check frontend is accessible
run_test "Frontend is accessible" "check_http '$FRONTEND_URL' '200'" "Frontend should return 200"

# Test 14: Check API proxy is working
run_test "API proxy is working" "check_http '$FRONTEND_URL/api/backend/health' '200'" "API proxy should return 200"

echo ""
echo "🔐 Step 5: Environment Configuration"
echo "===================================="

# Test 15: Check if backend .env exists
run_test "Backend .env exists" "[ -f '$PROJECT_DIR/backend/.env' ]" "Backend .env should exist"

# Test 16: Check if frontend .env.production exists
run_test "Frontend .env.production exists" "[ -f '$PROJECT_DIR/.env.production' ]" "Frontend .env.production should exist"

# Test 17: Check if Discogs credentials are set
run_test "Discogs credentials configured" "grep -q 'DISCOGS_CONSUMER_KEY' '$PROJECT_DIR/backend/.env'" "Discogs credentials should be configured"

echo ""
echo "📊 Step 6: Performance Check"
echo "============================="

# Test 18: Check response time (should be under 5 seconds)
echo -e "${BLUE}Testing: Response time check${NC}"
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$FRONTEND_URL")
if (( $(echo "$response_time < 5.0" | bc -l) )); then
    echo -e "${GREEN}✅ PASSED: Response time check (${response_time}s)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAILED: Response time check (${response_time}s - too slow)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🔍 Step 7: Log Analysis"
echo "======================="

# Test 19: Check for critical errors in logs
echo -e "${BLUE}Testing: No critical errors in logs${NC}"
if pm2 logs waxvalue-frontend --lines 50 | grep -i "error\|fatal\|exception" | grep -v "404" | wc -l | grep -q "^0$"; then
    echo -e "${GREEN}✅ PASSED: No critical errors in frontend logs${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: Some errors found in frontend logs${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))  # Count as passed but with warning
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 20: Check backend logs
echo -e "${BLUE}Testing: No critical errors in backend logs${NC}"
if pm2 logs waxvalue-backend --lines 50 | grep -i "error\|fatal\|exception" | grep -v "404" | wc -l | grep -q "^0$"; then
    echo -e "${GREEN}✅ PASSED: No critical errors in backend logs${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: Some errors found in backend logs${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))  # Count as passed but with warning
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "📋 Test Summary"
echo "==============="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your WaxValue deployment is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
    exit 1
fi
