# VPS Deployment Workflow Guide

## 🚀 Complete Development to Production Pipeline

This guide covers the complete workflow for making changes and deploying them to your VPS after initial production deployment, including the new image architecture for persistent storage.

## 📋 Prerequisites

- VPS with Docker and Docker Compose installed
- Git repository (GitHub/GitLab/etc.)
- SSH access to VPS
- Domain pointing to VPS IP

## 🖼️ **NEW: Image Architecture Overview**

**Important**: The image system has been redesigned for better deployment persistence:

### **Static Images** (Part of Codebase)
- **Location**: `/app/public/images/` (inside container)
- **Content**: Dashboard previews, template thumbnails, blog static images
- **Deployment**: Automatically updated with code pushes
- **Volume Mount**: ❌ **NO MOUNT NEEDED** - these come with the code

### **Dynamic Images** (User Uploads)
- **Location**: `/app/server/uploads/` (volume mounted)
- **Content**: User uploaded files, blog featured images, template uploads
- **Deployment**: ✅ **PERSISTS** across deployments
- **Volume Mount**: ✅ **REQUIRED** - mounted to host directory

### **Volume Mount Configuration**
```yaml
# In docker-compose.yml
volumes:
  - /opt/atscribe/uploads:/app/server/uploads  # ✅ User uploads persist
  - /opt/atscribe/logs:/app/logs              # ✅ Logs persist
  # Note: NO mount for /app/public/images - static images come with code
```

## 🔄 Development Workflow

### 1. Local Development
```bash
# Start development environment
npm run dev
# OR with Docker
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Make your changes
# Test locally (including image functionality)
# Commit changes
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 2. Testing Before Deployment
```bash
# Test production build locally
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify everything works (especially images)
curl http://localhost:3000/api/health
curl http://localhost:3000/images/dashboard-preview.svg  # Static image
curl http://localhost:3000/uploads/blog/images/test.jpg   # Dynamic image (if exists)

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

# Create required directories for persistent data
sudo mkdir -p /opt/atscribe/{uploads,logs}
sudo chown -R $(whoami):$(whoami) /opt/atscribe

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

# Pull latest changes (includes new static images)
git pull origin main

# Rebuild and deploy (user uploads remain intact)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify deployment and images
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app
curl http://localhost:3000/images/dashboard-preview.svg  # Test static images
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

# ProsumeAI VPS Deployment Script with Image Architecture Support
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

# Pull latest changes (includes updated static images)
echo "Pulling latest changes..." | tee -a $LOG_FILE
git fetch origin
git reset --hard origin/main

# Check if there are actual changes
if git diff --quiet HEAD~1 HEAD; then
    echo "No changes detected. Skipping deployment." | tee -a $LOG_FILE
    exit 0
fi

# Verify upload directories exist
echo "Ensuring upload directories exist..." | tee -a $LOG_FILE
mkdir -p /opt/atscribe/{uploads,logs}
mkdir -p /opt/atscribe/uploads/{blog/images,templates,branding}

# Build and deploy with zero downtime
echo "Deploying new version..." | tee -a $LOG_FILE

# Rolling update (user uploads persist automatically)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps app

# Wait for health check
echo "Waiting for application to start..." | tee -a $LOG_FILE
sleep 30

# Verify deployment and image serving
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed!" | tee -a $LOG_FILE
    
    # Test image serving
    if curl -f http://localhost:3000/images/dashboard-preview.svg > /dev/null 2>&1; then
        echo "✅ Static images working!" | tee -a $LOG_FILE
    else
        echo "⚠️ Warning: Static images may not be working" | tee -a $LOG_FILE
    fi
    
    echo "✅ Deployment successful!" | tee -a $LOG_FILE
    
    # Clean up old Docker images
    docker image prune -f
    
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
          # Ensure upload directories exist before deployment
          mkdir -p /opt/atscribe/{uploads,logs}
          mkdir -p /opt/atscribe/uploads/{blog/images,templates,branding}
          ./deploy.sh
```

## 🖼️ **Image Management in Deployments**

### What Happens During Deployment

#### ✅ **Static Images** (Automatically Updated)
- Dashboard previews, template thumbnails
- Blog static images (part of design)
- UI icons and graphics
- **Action**: Automatically updated with code push
- **Location**: Inside container at `/app/public/images/`

#### ✅ **Dynamic Images** (Persist Across Deployments)
- User uploaded blog images
- Custom template thumbnails
- Branding assets uploaded via admin
- **Action**: Remain intact during deployment
- **Location**: Host directory `/opt/atscribe/uploads/`

### Volume Mount Strategy
```yaml
# docker-compose.prod.yml
volumes:
  # ✅ REQUIRED: User uploads must persist
  - /opt/atscribe/uploads:/app/server/uploads
  
  # ✅ REQUIRED: Logs must persist  
  - /opt/atscribe/logs:/app/logs
  
  # ❌ REMOVED: No longer mount public/images
  # Static images come with codebase now!
```

### Directory Structure on VPS
```
/opt/atscribe/
├── uploads/           # ✅ Persists across deployments
│   ├── blog/
│   │   └── images/    # Blog featured images
│   ├── templates/     # Custom template images
│   └── branding/      # Logo/favicon uploads
└── logs/              # ✅ Persists across deployments
    └── server.log

/home/user/ProsumeAI/
├── public/
│   └── images/        # ✅ Static images (updated with code)
└── server/
    └── uploads/       # ❌ No files here (volume mounted)
```

## 🛡️ Zero-Downtime Deployment Strategies

### Rolling Update (Recommended)
```bash
# Update only the app container, keeping database and uploads intact
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps app

# Benefits:
# ✅ Database stays running
# ✅ User uploads remain accessible
# ✅ Static images updated automatically
# ✅ Zero downtime
```

### Blue-Green Deployment
```bash
# Start new version alongside current
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --scale app=2

# Test new version (both static and dynamic images)
curl http://localhost:3000/api/health
curl http://localhost:3000/images/dashboard-preview.svg
curl http://localhost:3000/uploads/blog/images/test.jpg

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

# Test image serving
alias vps-test-images="ssh user@your-vps-ip 'curl -I http://localhost:3000/images/dashboard-preview.svg && curl -I http://localhost:3000/uploads/blog/images/'"
```

### VPS Monitoring
```bash
# Check application status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app

# Monitor resources
docker stats

# Check image serving
curl -I http://localhost:3000/images/dashboard-preview.svg  # Static
curl -I http://localhost:3000/uploads/blog/images/         # Dynamic

# Check upload directory sizes
du -sh /opt/atscribe/uploads/

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

# Rollback to previous commit (static images rollback too)
git log --oneline -5  # See recent commits
git reset --hard COMMIT_HASH  # Replace with specific commit

# Redeploy (user uploads remain intact)
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
     -d "text=✅ ProsumeAI deployed successfully $(date)
     
🖼️ Static images: Updated with codebase
💾 User uploads: Preserved and accessible
🔗 Health check: Passed"

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

# Images not loading
# Check static images (should work immediately after deployment)
curl -I http://localhost:3000/images/dashboard-preview.svg

# Check dynamic images (should persist from before)
ls -la /opt/atscribe/uploads/blog/images/

# Check upload serving route
curl -I http://localhost:3000/uploads/blog/images/

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

### Image-Specific Troubleshooting
```bash
# Static images not loading
echo "Check if codebase was pulled correctly:"
ls -la public/images/
git status

# Dynamic images not loading
echo "Check upload directories and permissions:"
ls -la /opt/atscribe/uploads/
docker compose exec app ls -la /app/server/uploads/

# Image serving route not working
echo "Check server logs for route errors:"
docker compose logs app | grep -E "(uploads|images|static)"

# Volume mount issues
echo "Verify volume mounts:"
docker compose config | grep -A 5 volumes
```

### Emergency Recovery
```bash
# Complete reset (last resort)
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
git reset --hard origin/main

# Recreate upload directories
mkdir -p /opt/atscribe/{uploads,logs}
mkdir -p /opt/atscribe/uploads/{blog/images,templates,branding}

# Restart
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

# Add weekly full backup on Sundays at 3 AM (includes uploads)
0 3 * * 0 cd /home/$(whoami)/ProsumeAI && ./scripts/backup/backup-full.sh

# Add monthly upload directory backup
0 4 1 * * tar -czf /home/$(whoami)/backups/uploads_$(date +%Y%m).tar.gz -C /opt/atscribe uploads/
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
- Set up automated backups (database + uploads)
- Use environment-specific configuration
- **NEW**: Verify both static and dynamic images after deployment
- **NEW**: Ensure upload directories exist before deployment

### ❌ Don'ts
- Don't deploy directly to production without testing
- Don't skip backups
- Don't deploy during peak traffic hours
- Don't ignore deployment logs
- Don't store secrets in version control
- Don't make manual changes on VPS
- **NEW**: Don't mount `/app/public/images` (static images come with code)
- **NEW**: Don't store user uploads in the codebase directory

## 🚀 **Migration Guide for Existing Deployments**

If you have an existing deployment, follow these steps to migrate to the new image architecture:

### 1. Backup Current State
```bash
# SSH into VPS
ssh user@your-vps-ip
cd ProsumeAI

# Backup database
./scripts/backup/backup-db.sh

# Backup current images (if any user uploads exist)
mkdir -p /opt/atscribe/migration-backup
cp -r public/images/blog/ /opt/atscribe/migration-backup/ 2>/dev/null || true
```

### 2. Update Configuration
```bash
# Pull latest code with new image architecture
git pull origin main

# Remove old image volume mount from docker-compose if it exists
# The new config should not mount public/images
```

### 3. Create Upload Directories
```bash
# Create required persistent directories
mkdir -p /opt/atscribe/{uploads,logs}
mkdir -p /opt/atscribe/uploads/{blog/images,templates,branding}

# Move any existing user uploads to persistent storage
if [ -d "/opt/atscribe/migration-backup/blog" ]; then
    cp -r /opt/atscribe/migration-backup/blog/* /opt/atscribe/uploads/blog/images/
    echo "✅ Migrated existing blog images to persistent storage"
fi
```

### 4. Deploy New Version
```bash
# Deploy with new architecture
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify migration
curl http://localhost:3000/images/dashboard-preview.svg  # Static images
curl http://localhost:3000/uploads/blog/images/          # Dynamic images
```

Your VPS deployment workflow is now complete with the new image architecture for optimal persistence and deployment efficiency! 🚀 