#!/bin/bash

# ProsumeAI Docker Logs Monitor
# Usage: ./scripts/docker-monitor-logs.sh [development|production]

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
    echo -e "${GREEN}📊 Starting ProsumeAI Production Logs Monitor${NC}"
else
    COMPOSE_FILES=""
    echo -e "${GREEN}📊 Starting ProsumeAI Development Logs Monitor${NC}"
fi

echo -e "${YELLOW}Environment: $ENV${NC}"
echo -e "${CYAN}Press Ctrl+C to stop monitoring${NC}"
echo "============================================="

# Function to show logs with colors
function show_logs() {
    local service_name=$1
    local service_key=$2
    local color=$3
    
    echo -e "\n${color}=== $service_name Logs (Last 10 lines) ===${NC}"
    docker compose $COMPOSE_FILES logs --tail=10 $service_key 2>/dev/null || echo "❌ $service_name not running"
}

# Function to show container status
function show_status() {
    echo -e "\n${PURPLE}=== Container Status ===${NC}"
    docker compose $COMPOSE_FILES ps 2>/dev/null || echo "❌ No containers running"
}

# Function to show resource usage
function show_resources() {
    echo -e "\n${BLUE}=== Resource Usage ===${NC}"
    if command -v docker >/dev/null 2>&1; then
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null | head -10
    else
        echo "❌ Docker not available"
    fi
}

# Function to check health
function check_health() {
    echo -e "\n${GREEN}=== Health Check ===${NC}"
    
    # Check app health
    if docker compose $COMPOSE_FILES exec -T app curl -f localhost:3000/api/health >/dev/null 2>&1; then
        echo "✅ Application: Healthy"
    else
        echo "❌ Application: Unhealthy"
    fi
    
    # Check database health
    if docker compose $COMPOSE_FILES exec -T db pg_isready -U postgres >/dev/null 2>&1; then
        echo "✅ Database: Healthy"
    else
        echo "❌ Database: Unhealthy"
    fi
}

# Main monitoring loop
while true; do
    clear
    echo -e "${GREEN}=== ProsumeAI Docker Monitor - $(date) ===${NC}"
    
    show_status
    check_health
    show_resources
    show_logs "Application" "app" "$CYAN"
    show_logs "Database" "db" "$YELLOW"
    
    if [ "$ENV" = "development" ]; then
        show_logs "pgAdmin" "pgadmin" "$PURPLE"
    fi
    
    echo -e "\n${GREEN}=== Recent Errors ===${NC}"
    docker compose $COMPOSE_FILES logs --since="5m" app 2>/dev/null | grep -i error | tail -3 || echo "No recent errors"
    
    echo -e "\n${CYAN}Refreshing in 30 seconds... (Ctrl+C to stop)${NC}"
    sleep 30
done 