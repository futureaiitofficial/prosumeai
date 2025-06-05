# VPS Deployment Workflow Guide

## 🚀 Complete Development to Production Pipeline

This guide covers the complete workflow for making changes and deploying them to your VPS after initial production deployment.

## 📋 Prerequisites

- VPS with Docker and Docker Compose installed
- Git repository (GitHub/GitLab/etc.)
- SSH access to VPS
- Domain pointing to VPS IP

## 🔄 Development Workflow

### 1. Local Development
```bash
# Start development environment
npm run dev
# OR with Docker
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Make your changes
# Test locally
# Commit changes
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 2. Testing Before Deployment
```bash
# Test production build locally
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify everything works
curl http://localhost:3000/api/health

# Clean up local production test
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## 🖥️ VPS Deployment Methods

### Method 1: Direct Git Pull (Simple)

#### Initial VPS Setup
```bash
# SSH into your VPS
ssh user@your-vps-ip

# Clone repository
git clone https://github.com/yourusername/ProsumeAI.git
cd ProsumeAI

# Create production environment file
cp .env.example .env.production
nano .env.production  # Configure with production values

# Initial deployment
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

#### Update Workflow
```bash
# SSH into VPS
ssh user@your-vps-ip
cd ProsumeAI

# Pull latest changes
git pull origin main

# Rebuild and deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify deployment
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app
```

### Method 2: Deployment Script (Recommended)

Create deployment script on VPS:

```bash
# SSH into VPS and create deployment script
nano deploy.sh
```

#### VPS Deployment Script (`deploy.sh`)
```bash
#!/bin/bash

# ProsumeAI VPS Deployment Script
set -e

PROJECT_DIR="/home/$(whoami)/ProsumeAI"
BACKUP_DIR="/home/$(whoami)/backups"
LOG_FILE="/home/$(whoami)/deploy.log"

echo "$(date): Starting deployment..." | tee -a $LOG_FILE

# Navigate to project directory
cd $PROJECT_DIR

# Create backup before deployment
echo "Creating backup..." | tee -a $LOG_FILE
./scripts/backup/backup-db.sh

# Pull latest changes
echo "Pulling latest changes..." | tee -a $LOG_FILE
git fetch origin
git reset --hard origin/main

# Check if there are actual changes
if git diff --quiet HEAD~1 HEAD; then
    echo "No changes detected. Skipping deployment." | tee -a $LOG_FILE
    exit 0
fi

# Build and deploy with zero downtime
echo "Deploying new version..." | tee -a $LOG_FILE

# Method A: Rolling update (recommended)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps app

# Method B: Full restart (if needed)
# docker compose -f docker-compose.yml -f docker-compose.prod.yml down
# docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Wait for health check
echo "Waiting for application to start..." | tee -a $LOG_FILE
sleep 30

# Verify deployment
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!" | tee -a $LOG_FILE
    
    # Clean up old Docker images
    docker image prune -f
    
    # Send success notification (optional)
    # curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    #      -d "chat_id=$TELEGRAM_CHAT_ID" \
    #      -d "text=✅ ProsumeAI deployed successfully on $(date)"
    
else
    echo "❌ Deployment failed! Rolling back..." | tee -a $LOG_FILE
    
    # Rollback to previous version
    git reset --hard HEAD~1
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps app
    
    echo "Rollback completed." | tee -a $LOG_FILE
    exit 1
fi

echo "$(date): Deployment completed successfully!" | tee -a $LOG_FILE
```

Make script executable:
```bash
chmod +x deploy.sh
```

#### Local Deploy Command
```bash
# From your local machine, trigger VPS deployment
ssh user@your-vps-ip 'cd ProsumeAI && ./deploy.sh'
```

### Method 3: GitHub Actions CI/CD (Advanced)

#### `.github/workflows/deploy-to-vps.yml`
```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to VPS
      uses: appleboy/ssh-action@v0.1.7
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USERNAME }}
        key: ${{ secrets.VPS_SSH_KEY }}
        script: |
          cd ProsumeAI
          ./deploy.sh
```

#### Setup GitHub Secrets
- `VPS_HOST`: Your VPS IP address
- `VPS_USERNAME`: SSH username
- `VPS_SSH_KEY`: Private SSH key content

## 🛡️ Zero-Downtime Deployment Strategies

### Rolling Update (Recommended)
```bash
# Update only the app container, keeping database running
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps app
```

### Blue-Green Deployment
```bash
# Start new version alongside current
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --scale app=2

# Test new version
curl http://localhost:3000/api/health

# Switch traffic (requires load balancer)
# Remove old version
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale app=1
```

## 🔧 VPS Management Commands

### Quick Commands
```bash
# SSH into VPS
alias vps="ssh user@your-vps-ip"

# Deploy from local machine
alias deploy="ssh user@your-vps-ip 'cd ProsumeAI && ./deploy.sh'"

# Check VPS status
alias vps-status="ssh user@your-vps-ip 'cd ProsumeAI && docker compose -f docker-compose.yml -f docker-compose.prod.yml ps'"

# View VPS logs
alias vps-logs="ssh user@your-vps-ip 'cd ProsumeAI && docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app'"
```

### VPS Monitoring
```bash
# Check application status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app

# Monitor resources
docker stats

# Check disk space
df -h

# Check memory usage
free -h

# View recent deployments
tail -f deploy.log
```

## 🚨 Rollback Procedures

### Quick Rollback
```bash
# SSH into VPS
ssh user@your-vps-ip
cd ProsumeAI

# Rollback to previous commit
git log --oneline -5  # See recent commits
git reset --hard COMMIT_HASH  # Replace with specific commit

# Redeploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps app
```

### Database Rollback (if needed)
```bash
# Stop application
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop app

# Restore database backup
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB < /path/to/backup.sql

# Restart application
docker compose -f docker-compose.yml -f docker-compose.prod.yml start app
```

## 📱 Automated Notifications

### Telegram Notifications
```bash
# Add to deploy.sh for notifications
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"

# Success notification
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
     -d "chat_id=$TELEGRAM_CHAT_ID" \
     -d "text=✅ ProsumeAI deployed successfully $(date)"

# Failure notification  
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
     -d "chat_id=$TELEGRAM_CHAT_ID" \
     -d "text=❌ ProsumeAI deployment failed $(date)"
```

## 🔍 Troubleshooting

### Common VPS Issues
```bash
# Application not responding
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart app

# Database connection issues
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart db

# Out of disk space
docker system prune -af
docker volume prune -f

# Memory issues
docker stats
free -h
# Consider increasing VPS resources

# Network issues
docker network ls
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Emergency Recovery
```bash
# Complete reset (last resort)
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
git reset --hard origin/main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Restore from backup
./scripts/backup/restore-db.sh backup_file.sql.gz
```

## 📊 Monitoring and Maintenance

### Setup Automated Backups (Cron)
```bash
# Edit crontab on VPS
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /home/$(whoami)/ProsumeAI && ./scripts/backup/backup-db.sh

# Add weekly full backup on Sundays at 3 AM
0 3 * * 0 cd /home/$(whoami)/ProsumeAI && ./scripts/backup/backup-full.sh
```

### Log Rotation
```bash
# Setup log rotation for deploy logs
sudo nano /etc/logrotate.d/prosumeai

# Content:
/home/username/deploy.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

## 🎯 Best Practices

### ✅ Do's
- Always backup before deployment
- Test production builds locally first
- Use rolling updates for zero downtime
- Monitor logs after deployment
- Keep deployment scripts in version control
- Set up automated backups
- Use environment-specific configuration

### ❌ Don'ts
- Don't deploy directly to production without testing
- Don't skip backups
- Don't deploy during peak traffic hours
- Don't ignore deployment logs
- Don't store secrets in version control
- Don't make manual changes on VPS

Your VPS deployment workflow is now complete with automated deployments, rollback procedures, and monitoring! 🚀 