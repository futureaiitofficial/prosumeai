# Docker Commands Reference Guide

## 📋 Overview

This guide provides essential Docker commands for managing, monitoring, and debugging your ProsumeAI application in different environments.

## 🚀 Quick Start Commands

### **Development Environment**
```bash
# Start development with hot reloading
docker compose up -d

# Start with specific override
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Build and start (force rebuild)
docker compose up -d --build
```

### **Production Environment**
```bash
# Start production environment
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Start with rebuild
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Pull latest images and start
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Monitoring & Logs

### **View Logs**

#### **All Services**
```bash
# Follow all logs in real-time
docker compose logs -f

# View last 100 lines and follow
docker compose logs -f --tail=100

# View logs without following
docker compose logs

# View logs for specific time period
docker compose logs --since="2024-01-01T10:00:00" --until="2024-01-01T12:00:00"
```

#### **Specific Service Logs**
```bash
# Application logs only
docker compose logs -f app

# Database logs only
docker compose logs -f db

# pgAdmin logs only (if enabled)
docker compose logs -f pgadmin

# Last 50 lines of app logs
docker compose logs --tail=50 app
```

#### **Production Logs**
```bash
# Production app logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app

# Production database logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f db

# All production services
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### **Log Filtering**
```bash
# Filter logs by level (if your app supports it)
docker compose logs app | grep "ERROR"
docker compose logs app | grep "WARN"
docker compose logs app | grep "DEBUG"

# Search for specific terms
docker compose logs app | grep -i "email"
docker compose logs app | grep -i "database"
docker compose logs app | grep -i "auth"

# Save logs to file
docker compose logs app > app-logs.txt
docker compose logs --since="1h" > recent-logs.txt
```

## 🔍 Container Status & Health

### **Check Container Status**
```bash
# List running containers
docker compose ps

# Detailed container information
docker compose ps -a

# Check resource usage
docker stats

# Check specific container stats
docker stats prosumeai-app-1
```

### **Health Checks**
```bash
# Check container health
docker compose exec app curl localhost:3000/api/health

# Check database connectivity
docker compose exec app curl localhost:3000/api/health/db

# Manual health check
docker compose exec db pg_isready -U atscribe_user -d atscribe
```

### **Service Details**
```bash
# Inspect container configuration
docker inspect prosumeai-app-1

# View container processes
docker compose top

# Check port mappings
docker compose port app 3000
```

## 🐛 Debugging Commands

### **Access Container Shell**
```bash
# Enter app container shell
docker compose exec app sh
docker compose exec app bash  # if bash is available

# Enter database container
docker compose exec db sh

# Enter as root user
docker compose exec --user root app sh
```

### **Execute Commands in Container**
```bash
# Check Node.js version
docker compose exec app node --version

# Check npm packages
docker compose exec app npm list

# Run database migrations
docker compose exec app npm run db:migrate

# Check environment variables
docker compose exec app printenv

# Check file permissions
docker compose exec app ls -la /app
```

### **Database Operations**
```bash
# Access PostgreSQL shell
docker compose exec db psql -U atscribe_user -d atscribe

# Run SQL commands
docker compose exec db psql -U atscribe_user -d atscribe -c "SELECT version();"

# Check database size
docker compose exec db psql -U atscribe_user -d atscribe -c "\l+"

# List tables
docker compose exec db psql -U atscribe_user -d atscribe -c "\dt"

# Backup database
docker compose exec db pg_dump -U atscribe_user atscribe > backup.sql

# Restore database
cat backup.sql | docker compose exec -T db psql -U atscribe_user -d atscribe
```

### **File System Operations**
```bash
# Copy files from container to host
docker compose cp app:/app/logs/server.log ./server.log

# Copy files from host to container
docker compose cp ./config.json app:/app/config.json

# View file contents
docker compose exec app cat /app/package.json

# Check disk usage in container
docker compose exec app df -h
docker compose exec app du -sh /app/*
```

## 🔧 Environment & Configuration

### **Environment Variables**
```bash
# Check all environment variables
docker compose exec app printenv

# Check specific variables
docker compose exec app printenv | grep -E "(DATABASE|EMAIL|SESSION)"
docker compose exec app printenv | grep -i url

# Check Node environment
docker compose exec app printenv NODE_ENV
```

### **Configuration Verification**
```bash
# Test email configuration
docker compose exec app node -e "console.log('SMTP:', process.env.SMTP_HOST)"

# Test database connection
docker compose exec app node -e "console.log('DB:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'))"

# Verify file uploads directory
docker compose exec app ls -la /app/server/uploads/
```

## 🚨 Troubleshooting

### **Container Issues**
```bash
# Restart specific service
docker compose restart app
docker compose restart db

# Stop and start service
docker compose stop app
docker compose start app

# Recreate containers
docker compose up -d --force-recreate app

# Check why container stopped
docker compose ps -a
docker compose logs --tail=100 app
```

### **Performance Issues**
```bash
# Monitor resource usage
docker stats --no-stream

# Check container resource limits
docker inspect prosumeai-app-1 | grep -A 10 "Resources"

# Monitor specific container
watch -n 1 'docker stats --no-stream prosumeai-app-1'
```

### **Network Issues**
```bash
# List networks
docker network ls

# Inspect application network
docker network inspect prosumeai_atscribe-network

# Test connectivity between containers
docker compose exec app ping db
docker compose exec app curl http://db:5432
```

### **Volume Issues**
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect prosumeai_postgres_data

# Check volume usage
docker system df -v

# Backup volume data
docker run --rm -v prosumeai_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## 🧹 Maintenance Commands

### **Cleanup Operations**
```bash
# Remove stopped containers
docker compose down

# Remove containers and volumes
docker compose down -v

# Remove containers, volumes, and images
docker compose down -v --rmi all

# Clean up all unused Docker resources
docker system prune -f

# Clean up including volumes
docker system prune -a --volumes -f
```

### **Image Management**
```bash
# Pull latest images
docker compose pull

# Rebuild specific service
docker compose build app

# Build without cache
docker compose build --no-cache app

# Remove old images
docker image prune -f
```

### **Update and Redeploy**
```bash
# Full update sequence
git pull
docker compose down
docker compose build --no-cache
docker compose up -d

# Production update
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📈 Monitoring Scripts

### **Log Monitoring Script**
```bash
#!/bin/bash
# save as monitor-logs.sh
echo "=== ProsumeAI Docker Logs Monitor ==="
echo "Press Ctrl+C to stop"
echo "=================================="

# Create a function to show colored output
function show_logs() {
    echo -e "\033[1;32m=== $1 Logs ===\033[0m"
    docker compose logs --tail=20 $2
    echo ""
}

while true; do
    clear
    echo "=== $(date) ==="
    show_logs "Application" "app"
    show_logs "Database" "db"
    echo "=== Container Status ==="
    docker compose ps
    echo ""
    echo "=== Resource Usage ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    sleep 30
done
```

### **Health Check Script**
```bash
#!/bin/bash
# save as health-check.sh
echo "=== ProsumeAI Health Check ==="

# Check if containers are running
echo "1. Container Status:"
docker compose ps

echo -e "\n2. Application Health:"
if docker compose exec app curl -f localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ Application: Healthy"
else
    echo "❌ Application: Unhealthy"
fi

echo -e "\n3. Database Health:"
if docker compose exec db pg_isready -U atscribe_user -d atscribe >/dev/null 2>&1; then
    echo "✅ Database: Healthy"
else
    echo "❌ Database: Unhealthy"
fi

echo -e "\n4. Recent Errors:"
docker compose logs --since="5m" app | grep -i error | tail -5

echo -e "\n5. Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### **Make Scripts Executable**
```bash
chmod +x monitor-logs.sh
chmod +x health-check.sh

# Run them
./monitor-logs.sh
./health-check.sh
```

## 🔒 Security Commands

### **Security Checks**
```bash
# Check running processes in container
docker compose exec app ps aux

# Check open ports
docker compose exec app netstat -tlnp

# Check file permissions
docker compose exec app ls -la /app/
docker compose exec app ls -la /app/server/uploads/

# Scan for vulnerabilities (if available)
docker scout cves prosumeai-app
```

### **Secrets Management**
```bash
# Check environment variables (be careful with output)
docker compose exec app printenv | grep -v -E "(PASSWORD|SECRET|TOKEN)" | sort

# Verify sensitive data is not in logs
docker compose logs app | grep -i -E "(password|secret|token)" | head -5
```

## 🆘 Emergency Commands

### **Emergency Stop**
```bash
# Force stop all containers
docker compose kill

# Emergency cleanup
docker compose down --remove-orphans
docker system prune -f
```

### **Data Recovery**
```bash
# Export database immediately
docker compose exec db pg_dump -U atscribe_user atscribe > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# Copy application data
docker compose cp app:/app/server/uploads ./backup_uploads_$(date +%Y%m%d_%H%M%S)

# Export logs
docker compose logs > emergency_logs_$(date +%Y%m%d_%H%M%S).txt
```

---

## 💡 Tips & Best Practices

1. **Use `-f` flag** for non-interactive operations in scripts
2. **Always backup** before major operations
3. **Monitor disk space** regularly with `docker system df`
4. **Use specific tags** for production images instead of `latest`
5. **Rotate logs** to prevent disk space issues
6. **Test commands** in development before running in production
7. **Use `.dockerignore`** to reduce build context size
8. **Monitor resource usage** to prevent container crashes

---

*This reference guide covers the most common Docker operations for ProsumeAI. For more advanced operations, consult the official Docker documentation.* 