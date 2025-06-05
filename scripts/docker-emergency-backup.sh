#!/bin/bash

# ProsumeAI Docker Emergency Backup
# Usage: ./scripts/docker-emergency-backup.sh [development|production]

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

# Create timestamp for backup folder
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/emergency_backup_${ENV}_${TIMESTAMP}"

# Set Docker Compose files based on environment
if [ "$ENV" = "production" ]; then
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
    echo -e "${RED}🚨 ProsumeAI Production Emergency Backup${NC}"
else
    COMPOSE_FILES=""
    echo -e "${YELLOW}🚨 ProsumeAI Development Emergency Backup${NC}"
fi

echo -e "${CYAN}Timestamp: $(date)${NC}"
echo -e "${CYAN}Backup Directory: $BACKUP_DIR${NC}"
echo "============================================="

# Create backup directory
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

echo -e "\n${PURPLE}🗂️  Creating backup structure...${NC}"

# Function to log operations
log_operation() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "$(date): $1" >> backup.log
}

# Function to handle errors
handle_error() {
    echo -e "${RED}❌ Error: $1${NC}"
    echo "$(date): ERROR - $1" >> backup.log
}

# Start backup log
echo "Emergency Backup Started: $(date)" > backup.log
echo "Environment: $ENV" >> backup.log
echo "Backup Directory: $BACKUP_DIR" >> backup.log
echo "========================================" >> backup.log

# 1. Database Backup
echo -e "\n${BLUE}📊 Backing up database...${NC}"
if docker compose $COMPOSE_FILES ps db | grep -q 'Up'; then
    # Full database dump
    if docker compose $COMPOSE_FILES exec -T db pg_dump -U postgres atscribe > database_full.sql 2>/dev/null; then
        log_operation "Database full dump created (database_full.sql)"
    else
        handle_error "Failed to create database dump"
    fi
    
    # Schema only dump
    if docker compose $COMPOSE_FILES exec -T db pg_dump -U postgres --schema-only atscribe > database_schema.sql 2>/dev/null; then
        log_operation "Database schema dump created (database_schema.sql)"
    else
        handle_error "Failed to create schema dump"
    fi
    
    # Data only dump
    if docker compose $COMPOSE_FILES exec -T db pg_dump -U postgres --data-only atscribe > database_data.sql 2>/dev/null; then
        log_operation "Database data dump created (database_data.sql)"
    else
        handle_error "Failed to create data dump"
    fi
    
    # Database information
    docker compose $COMPOSE_FILES exec -T db psql -U postgres -d atscribe -c "\l+" > database_info.txt 2>/dev/null || handle_error "Failed to get database info"
    docker compose $COMPOSE_FILES exec -T db psql -U postgres -d atscribe -c "\dt+" > tables_info.txt 2>/dev/null || handle_error "Failed to get tables info"
    
    log_operation "Database backup completed"
else
    handle_error "Database container is not running"
fi

# 2. Application Data Backup
echo -e "\n${BLUE}📁 Backing up application data...${NC}"
if docker compose $COMPOSE_FILES ps app | grep -q 'Up'; then
    # Create uploads backup
    mkdir -p uploads
    if docker compose $COMPOSE_FILES cp app:/app/server/uploads/ ./uploads/ 2>/dev/null; then
        log_operation "User uploads backed up to uploads/"
    else
        handle_error "Failed to backup user uploads"
    fi
    
    # Create logs backup
    mkdir -p logs
    if docker compose $COMPOSE_FILES cp app:/app/logs/ ./logs/ 2>/dev/null; then
        log_operation "Application logs backed up to logs/"
    else
        handle_error "Failed to backup application logs"
    fi
    
    # Export environment variables (sanitized)
    if docker compose $COMPOSE_FILES exec -T app printenv | grep -v -E "(PASSWORD|SECRET|TOKEN|KEY)" > environment_vars.txt 2>/dev/null; then
        log_operation "Environment variables exported (sanitized)"
    else
        handle_error "Failed to export environment variables"
    fi
    
    # Package.json and important configs
    docker compose $COMPOSE_FILES exec -T app cat /app/package.json > package.json 2>/dev/null || handle_error "Failed to backup package.json"
    
    log_operation "Application data backup completed"
else
    handle_error "Application container is not running"
fi

# 3. Docker Configuration Backup
echo -e "\n${BLUE}🐳 Backing up Docker configuration...${NC}"
mkdir -p docker_config

# Copy Docker Compose files
cp ../docker-compose.yml docker_config/ 2>/dev/null || handle_error "Failed to copy docker-compose.yml"
cp ../docker-compose.prod.yml docker_config/ 2>/dev/null || handle_error "Failed to copy docker-compose.prod.yml"
cp ../docker-compose.override.yml docker_config/ 2>/dev/null || echo "No docker-compose.override.yml found"

# Copy environment files (sanitized)
if [ -f ../.env ]; then
    grep -v -E "(PASSWORD|SECRET|TOKEN|KEY)" ../.env > docker_config/.env.backup 2>/dev/null || handle_error "Failed to backup .env"
fi

# Docker system information
docker system df > docker_config/docker_system.txt 2>/dev/null || handle_error "Failed to get docker system info"
docker compose $COMPOSE_FILES ps > docker_config/containers_status.txt 2>/dev/null || handle_error "Failed to get container status"
docker volume ls > docker_config/volumes.txt 2>/dev/null || handle_error "Failed to get volumes list"
docker network ls > docker_config/networks.txt 2>/dev/null || handle_error "Failed to get networks list"

log_operation "Docker configuration backup completed"

# 4. System Information
echo -e "\n${BLUE}💻 Collecting system information...${NC}"
mkdir -p system_info

# System information
uname -a > system_info/system.txt 2>/dev/null || handle_error "Failed to get system info"
df -h > system_info/disk_usage.txt 2>/dev/null || handle_error "Failed to get disk usage"
free -h > system_info/memory.txt 2>/dev/null || handle_error "Failed to get memory info"

# Docker information
docker version > system_info/docker_version.txt 2>/dev/null || handle_error "Failed to get docker version"
docker info > system_info/docker_info.txt 2>/dev/null || handle_error "Failed to get docker info"

# Container resource usage
if docker stats --no-stream >/dev/null 2>&1; then
    docker stats --no-stream > system_info/container_stats.txt 2>/dev/null || handle_error "Failed to get container stats"
fi

log_operation "System information collected"

# 5. Application Logs and Debugging
echo -e "\n${BLUE}📋 Collecting application logs...${NC}"
mkdir -p debug_logs

# Recent application logs
docker compose $COMPOSE_FILES logs --tail=500 app > debug_logs/app_recent.log 2>/dev/null || handle_error "Failed to get recent app logs"
docker compose $COMPOSE_FILES logs --tail=200 db > debug_logs/db_recent.log 2>/dev/null || handle_error "Failed to get recent db logs"

# All logs since last hour
docker compose $COMPOSE_FILES logs --since="1h" > debug_logs/all_last_hour.log 2>/dev/null || handle_error "Failed to get last hour logs"

# Error logs only
docker compose $COMPOSE_FILES logs app 2>/dev/null | grep -i error > debug_logs/error_logs.log || echo "No error logs found"

log_operation "Application logs collected"

# 6. Create compressed backup
echo -e "\n${BLUE}📦 Creating compressed backup...${NC}"
cd ..
ARCHIVE_NAME="emergency_backup_${ENV}_${TIMESTAMP}.tar.gz"

if tar -czf "$ARCHIVE_NAME" "emergency_backup_${ENV}_${TIMESTAMP}/" 2>/dev/null; then
    ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
    log_operation "Compressed backup created: $ARCHIVE_NAME ($ARCHIVE_SIZE)"
    echo -e "${GREEN}✅ Compressed backup: $ARCHIVE_NAME ($ARCHIVE_SIZE)${NC}"
else
    handle_error "Failed to create compressed backup"
fi

# 7. Generate backup summary
cd "emergency_backup_${ENV}_${TIMESTAMP}"
echo -e "\n${PURPLE}📋 Generating backup summary...${NC}"

cat > BACKUP_SUMMARY.md << EOF
# Emergency Backup Summary

**Backup Date:** $(date)
**Environment:** $ENV
**Backup Directory:** $BACKUP_DIR

## Backup Contents

### 📊 Database Backup
- \`database_full.sql\` - Complete database dump
- \`database_schema.sql\` - Database schema only
- \`database_data.sql\` - Database data only
- \`database_info.txt\` - Database information
- \`tables_info.txt\` - Tables information

### 📁 Application Data
- \`uploads/\` - User uploaded files
- \`logs/\` - Application logs
- \`environment_vars.txt\` - Environment variables (sanitized)
- \`package.json\` - Application dependencies

### 🐳 Docker Configuration
- \`docker_config/\` - Docker Compose files and configuration
- \`docker_config/containers_status.txt\` - Container status at backup time
- \`docker_config/volumes.txt\` - Docker volumes list
- \`docker_config/networks.txt\` - Docker networks list

### 💻 System Information
- \`system_info/\` - System specifications and resource usage
- \`system_info/docker_info.txt\` - Docker daemon information
- \`system_info/container_stats.txt\` - Container resource usage

### 📋 Debug Information
- \`debug_logs/\` - Application logs and error information
- \`debug_logs/error_logs.log\` - Error logs only

## Recovery Instructions

### Database Recovery
\`\`\`bash
# Restore full database
cat database_full.sql | docker compose exec -T db psql -U postgres -d atscribe

# Or restore schema and data separately
cat database_schema.sql | docker compose exec -T db psql -U postgres -d atscribe
cat database_data.sql | docker compose exec -T db psql -U postgres -d atscribe
\`\`\`

### Application Data Recovery
\`\`\`bash
# Restore uploads
docker compose cp uploads/ app:/app/server/

# Restore logs
docker compose cp logs/ app:/app/
\`\`\`

### Environment Recovery
1. Review \`environment_vars.txt\` for environment configuration
2. Update \`.env\` file with production values
3. Restart containers: \`docker compose up -d\`

## Backup Log
See \`backup.log\` for detailed operation log.

---
*Emergency backup completed at $(date)*
EOF

log_operation "Backup summary generated (BACKUP_SUMMARY.md)"

# Final summary
echo -e "\n${PURPLE}===============================================${NC}"
echo -e "${PURPLE}🎯 EMERGENCY BACKUP COMPLETED${NC}"
echo -e "${PURPLE}===============================================${NC}"

BACKUP_SIZE=$(du -sh . | cut -f1)
echo -e "Backup Location: ${CYAN}$(pwd)${NC}"
echo -e "Backup Size: ${CYAN}$BACKUP_SIZE${NC}"
echo -e "Archive: ${CYAN}../$ARCHIVE_NAME${NC}"
echo -e "Environment: ${CYAN}$ENV${NC}"

# Count successful operations
SUCCESSFUL_OPS=$(grep -c "✅" backup.log || echo "0")
FAILED_OPS=$(grep -c "❌" backup.log || echo "0")

echo -e "\nOperations Summary:"
echo -e "✅ Successful: ${GREEN}$SUCCESSFUL_OPS${NC}"
echo -e "❌ Failed: ${RED}$FAILED_OPS${NC}"

if [ "$FAILED_OPS" -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All backup operations completed successfully!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some operations failed. Check backup.log for details.${NC}"
    exit 1
fi 