#!/bin/bash

# ProsumeAI Docker Health Check
# Usage: ./scripts/docker-health-check.sh [development|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get environment (default to development)
ENV=${1:-development}

# Set Docker Compose files based on environment
if [ "$ENV" = "production" ]; then
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
    echo -e "${GREEN}🏥 ProsumeAI Production Health Check${NC}"
else
    COMPOSE_FILES=""
    echo -e "${GREEN}🏥 ProsumeAI Development Health Check${NC}"
fi

echo -e "${YELLOW}Environment: $ENV${NC}"
echo -e "${CYAN}Timestamp: $(date)${NC}"
echo "============================================="

# Counters for summary
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Function to run a check
run_check() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    printf "%-40s" "$test_name:"
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Function to show detailed info
show_info() {
    local title="$1"
    local command="$2"
    
    echo -e "\n${BLUE}=== $title ===${NC}"
    if eval "$command" 2>/dev/null; then
        return 0
    else
        echo -e "${RED}❌ Unable to retrieve $title${NC}"
        return 1
    fi
}

echo -e "\n${PURPLE}🔍 Running Health Checks...${NC}\n"

# 1. Docker System Checks
echo -e "${CYAN}--- Docker System ---${NC}"
run_check "Docker daemon running" "docker info"
run_check "Docker Compose available" "docker compose version"

# 2. Container Status Checks
echo -e "\n${CYAN}--- Container Status ---${NC}"
run_check "App container running" "docker compose $COMPOSE_FILES ps app | grep -q 'Up'"
run_check "Database container running" "docker compose $COMPOSE_FILES ps db | grep -q 'Up'"

if [ "$ENV" = "development" ]; then
    run_check "pgAdmin container running" "docker compose $COMPOSE_FILES ps pgadmin | grep -q 'Up'"
fi

# 3. Service Health Checks
echo -e "\n${CYAN}--- Service Health ---${NC}"
run_check "Application responding" "docker compose $COMPOSE_FILES exec -T app curl -f localhost:3000/api/health"
run_check "Database accepting connections" "docker compose $COMPOSE_FILES exec -T db pg_isready -U postgres"

# 4. API Endpoint Checks
echo -e "\n${CYAN}--- API Endpoints ---${NC}"
if docker compose $COMPOSE_FILES ps app | grep -q 'Up'; then
    # Get the app container port
    APP_PORT=$(docker compose $COMPOSE_FILES port app 3000 2>/dev/null | cut -d: -f2)
    if [ ! -z "$APP_PORT" ]; then
        run_check "API health endpoint" "curl -f localhost:$APP_PORT/api/health"
        run_check "API status endpoint" "curl -f localhost:$APP_PORT/api/status"
    else
        echo "Application port:                        ${YELLOW}⚠️  SKIP (No port mapping)${NC}"
    fi
else
    echo "API endpoints:                           ${YELLOW}⚠️  SKIP (App not running)${NC}"
fi

# 5. Database Connectivity
echo -e "\n${CYAN}--- Database Connectivity ---${NC}"
run_check "Database connection from app" "docker compose $COMPOSE_FILES exec -T app node -e 'const { Client } = require(\"pg\"); const client = new Client(process.env.DATABASE_URL); client.connect().then(() => client.end()).catch(() => process.exit(1))'"
run_check "Database tables exist" "docker compose $COMPOSE_FILES exec -T db psql -U postgres -d atscribe -c '\dt' | grep -q 'users'"

# 6. File System Checks
echo -e "\n${CYAN}--- File System ---${NC}"
run_check "App directory accessible" "docker compose $COMPOSE_FILES exec -T app ls /app"
run_check "Uploads directory writable" "docker compose $COMPOSE_FILES exec -T app test -w /app/server/uploads"
run_check "Logs directory accessible" "docker compose $COMPOSE_FILES exec -T app test -d /app/logs"

# 7. Environment Variables
echo -e "\n${CYAN}--- Environment Variables ---${NC}"
run_check "NODE_ENV set" "docker compose $COMPOSE_FILES exec -T app printenv NODE_ENV"
run_check "DATABASE_URL set" "docker compose $COMPOSE_FILES exec -T app printenv DATABASE_URL"
run_check "SESSION_SECRET set" "docker compose $COMPOSE_FILES exec -T app printenv SESSION_SECRET"

# 8. Resource Usage Check
echo -e "\n${CYAN}--- Resource Usage ---${NC}"
if docker stats --no-stream >/dev/null 2>&1; then
    # Check if any container is using > 90% CPU
    HIGH_CPU=$(docker stats --no-stream --format "table {{.CPUPerc}}" | tail -n +2 | sed 's/%//' | awk '$1 > 90 {print $1}')
    if [ -z "$HIGH_CPU" ]; then
        echo "CPU usage normal:                        ${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo "CPU usage normal:                        ${RED}❌ FAIL (High CPU detected)${NC}"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Check if any container is using > 1GB memory
    HIGH_MEM=$(docker stats --no-stream --format "table {{.MemUsage}}" | tail -n +2 | grep -o '[0-9.]*GiB' | sed 's/GiB//' | awk '$1 > 1 {print $1}')
    if [ -z "$HIGH_MEM" ]; then
        echo "Memory usage normal:                     ${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo "Memory usage normal:                     ${YELLOW}⚠️  WARN (High memory usage)${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
else
    echo "Resource monitoring:                     ${YELLOW}⚠️  SKIP (Docker stats unavailable)${NC}"
fi

# Detailed Information Section
echo -e "\n${PURPLE}📊 Detailed Information${NC}"

show_info "Container Status" "docker compose $COMPOSE_FILES ps"
show_info "Resource Usage" "docker stats --no-stream --format 'table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}'"
show_info "Volume Usage" "docker system df -v | head -10"

# Recent Logs Check
echo -e "\n${BLUE}=== Recent Error Logs ===${NC}"
RECENT_ERRORS=$(docker compose $COMPOSE_FILES logs --since="10m" app 2>/dev/null | grep -i error | wc -l)
if [ "$RECENT_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ No errors in the last 10 minutes${NC}"
else
    echo -e "${YELLOW}⚠️  Found $RECENT_ERRORS errors in the last 10 minutes:${NC}"
    docker compose $COMPOSE_FILES logs --since="10m" app 2>/dev/null | grep -i error | tail -5
fi

# Network Check
echo -e "\n${BLUE}=== Network Connectivity ===${NC}"
if docker compose $COMPOSE_FILES exec -T app ping -c 1 db >/dev/null 2>&1; then
    echo -e "${GREEN}✅ App can reach database${NC}"
else
    echo -e "${RED}❌ App cannot reach database${NC}"
fi

# Summary
echo -e "\n${PURPLE}===============================================${NC}"
echo -e "${PURPLE}📋 HEALTH CHECK SUMMARY${NC}"
echo -e "${PURPLE}===============================================${NC}"

PASS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$((TOTAL_CHECKS - PASSED_CHECKS))${NC}"
echo -e "Pass Rate: ${CYAN}$PASS_RATE%${NC}"

if [ "$PASS_RATE" -ge 90 ]; then
    echo -e "\n${GREEN}🎉 OVERALL STATUS: HEALTHY${NC}"
    exit 0
elif [ "$PASS_RATE" -ge 70 ]; then
    echo -e "\n${YELLOW}⚠️  OVERALL STATUS: WARNING${NC}"
    exit 1
else
    echo -e "\n${RED}🚨 OVERALL STATUS: CRITICAL${NC}"
    exit 2
fi 