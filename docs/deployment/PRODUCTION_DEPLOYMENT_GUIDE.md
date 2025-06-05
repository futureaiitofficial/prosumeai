# Production VPS Deployment Guide

## Overview
When deploying to a VPS, you'll start with a clean server, so we need to migrate your data and set up proper production persistence with the new optimized image architecture.

## 🖼️ **NEW: Image Architecture**

**Important**: ProsumeAI now uses a dual image system for better deployment persistence:

### **Static Images** (Part of Codebase) 📦
- **Content**: Dashboard previews, template thumbnails, UI graphics
- **Location**: `/app/public/images/` (inside container)
- **Deployment**: ✅ **Automatically updated** with code pushes
- **Persistence**: Version controlled with Git

### **Dynamic Images** (User Uploads) 📤  
- **Content**: Blog featured images, user templates, branding assets
- **Location**: `/app/server/uploads/` (volume mounted)
- **Deployment**: ✅ **Persists across deployments**
- **Persistence**: Host directory volume mount

## Current Local Data to Migrate

### 1. **Database Data** 📊
- **What**: All your blog posts, users, settings, etc.
- **Size**: Check with `docker compose exec db pg_dump -U raja prosumeai | wc -c`
- **Location**: PostgreSQL volume `atscribe_postgres_data`

### 2. **Dynamic Images** 🖼️
- **What**: User uploaded blog images, custom templates
- **Size**: Check with `du -sh server/uploads/`
- **Location**: `./server/uploads/` (if any user uploads exist)

### 3. **Static Images** 📁
- **What**: Dashboard graphics, template thumbnails, UI assets
- **Size**: Check with `du -sh public/images/`
- **Location**: `./public/images/` (included in Git repository)
- **Note**: ✅ **Automatically deployed** with code - no manual migration needed

### 4. **Logs** 📝
- **What**: Application logs
- **Size**: 36KB
- **Location**: `./logs/`

## Production Deployment Steps

### Step 1: Backup Current Data

```bash
# 1. Export database
docker compose exec db pg_dump -U raja -d prosumeai > prosumeai_production_backup.sql

# 2. Create data archive (exclude static images - they come with Git)
tar -czf production_data.tar.gz server/uploads/ logs/ prosumeai_production_backup.sql .env

# 3. Upload to your VPS
scp production_data.tar.gz user@your-vps:/home/user/
```

### Step 2: VPS Server Setup

```bash
# On your VPS server
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose-plugin git -y
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Logout and login again for docker group to take effect
```

### Step 3: Deploy Application

```bash
# 1. Clone your repository (includes static images automatically)
git clone https://github.com/your-username/ProsumeAI.git
cd ProsumeAI

# 2. Extract backed up data
tar -xzf ../production_data.tar.gz

# 3. Create required directories for persistent data  
mkdir -p /opt/prosumeai/{uploads,logs}
mkdir -p /opt/prosumeai/uploads/{blog/images,templates,branding}

# 4. Set up production environment
cp .env .env.production
# Edit .env.production with production settings:
# - Change POSTGRES_PASSWORD to a strong password
# - Set NODE_ENV=production
# - Configure proper domain URLs
# - Set secure session secrets
```

### Step 4: Configure Production Volumes

The new volume mounts configuration:

```yaml
# docker-compose.yml configured with NEW architecture:
volumes:
  # ✅ REQUIRED: User uploads persist across deployments
  - /opt/prosumeai/uploads:/app/server/uploads
  
  # ✅ REQUIRED: Logs persist  
  - /opt/prosumeai/logs:/app/logs
  
  # ❌ REMOVED: No mount for public/images (static images come with Git)
  # Static images automatically included in container from codebase

# PostgreSQL data volume:
volumes:
  postgres_data:  # ✅ Database persists
```

### Step 5: Start Production Services

```bash
# 1. Start services (static images automatically included)
docker compose -f docker-compose.yml up -d

# 2. Wait for database to be ready
docker compose exec db pg_isready -U raja

# 3. Restore database
docker compose exec -T db psql -U raja -d prosumeai < prosumeai_production_backup.sql

# 4. Migrate user uploads to persistent storage (if any)
if [ -d "server/uploads" ]; then
    cp -r server/uploads/* /opt/prosumeai/uploads/
    echo "✅ Migrated user uploads to persistent storage"
fi

# 5. Verify everything works
curl http://your-vps-ip:3000/api/health
curl http://your-vps-ip:3000/images/dashboard-preview.svg  # Static image
curl http://your-vps-ip:3000/uploads/blog/images/         # Dynamic images
```

## Data Persistence in Production

### ✅ **What WILL Persist** (Safe from container rebuilds):

1. **Database**: PostgreSQL data in named volume `postgres_data`
2. **User Uploads**: Host directory `/opt/prosumeai/uploads/` mounted to container
3. **Logs**: Host directory `/opt/prosumeai/logs/` mounted to container
4. **Environment Config**: `.env` files on host

### ✅ **What Updates Automatically** (With code deployments):

1. **Static Images**: Dashboard graphics, template thumbnails, UI assets
2. **Application Code**: All functionality updates
3. **Templates**: Resume and cover letter templates

### ⚠️ **What you need to backup regularly**:

1. **Database** (automated backup script recommended)
2. **User Uploads** (grows over time with user content)
3. **Environment configuration**

## Production Backup Strategy

### Daily Database Backup Script:

```bash
#!/bin/bash
# save as backup-db.sh on your VPS

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"
mkdir -p $BACKUP_DIR

# Create database backup
docker compose exec -T db pg_dump -U raja prosumeai > $BACKUP_DIR/prosumeai_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "prosumeai_*.sql" -mtime +7 -delete

echo "Database backup created: prosumeai_$DATE.sql"
```

### Weekly Full Backup (Including User Uploads):

```bash
#!/bin/bash
# save as backup-full.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/home/user/backups"

# Database backup
docker compose exec -T db pg_dump -U raja prosumeai > $BACKUP_DIR/prosumeai_$DATE.sql

# User uploads backup (important with new architecture)
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /opt/prosumeai uploads/

# Application logs backup
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz -C /opt/prosumeai logs/

# Environment and config backup
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env docker-compose.yml

echo "Full backup created:"
echo "  Database: prosumeai_$DATE.sql"
echo "  Uploads: uploads_$DATE.tar.gz"
echo "  Logs: logs_$DATE.tar.gz"
echo "  Config: config_$DATE.tar.gz"
```

## Alternative: Cloud Storage for User Uploads

For better scalability, consider moving user uploads to cloud storage:

### Option 1: AWS S3 / DigitalOcean Spaces
```javascript
// Update upload routes to save to cloud storage instead of local files
// Images would be at: https://your-bucket.s3.amazonaws.com/blog/images/filename.jpg
```

### Option 2: CloudFlare R2 (cheaper)
```javascript
// Similar to S3 but more cost-effective for user uploads
```

## 🚀 **Migration Guide for Existing Deployments**

If you have an existing deployment with the old image system:

### 1. Backup Current State
```bash
# SSH into VPS
ssh user@your-vps-ip
cd ProsumeAI

# Backup database
./scripts/backup/backup-db.sh

# Backup any existing user uploads
mkdir -p /opt/prosumeai/migration-backup
# If you mounted public/images before, backup user content
docker cp container-name:/app/public/images/blog/ /opt/prosumeai/migration-backup/ 2>/dev/null || true
```

### 2. Update to New Architecture
```bash
# Pull latest code with new image architecture
git pull origin main

# Remove old volume mount configuration if it exists
# The new docker-compose.yml has the correct mounts
```

### 3. Create New Directory Structure
```bash
# Create required directories for new architecture
mkdir -p /opt/prosumeai/{uploads,logs}
mkdir -p /opt/prosumeai/uploads/{blog/images,templates,branding}

# Migrate any existing user uploads to persistent storage
if [ -d "/opt/prosumeai/migration-backup/blog" ]; then
    cp -r /opt/prosumeai/migration-backup/blog/* /opt/prosumeai/uploads/blog/images/
    echo "✅ Migrated existing blog images to persistent storage"
fi
```

### 4. Deploy New Version
```bash
# Deploy with new architecture
docker compose -f docker-compose.yml up -d --build

# Verify both static and dynamic images work
curl http://localhost:3000/images/dashboard-preview.svg  # Static (from Git)
curl http://localhost:3000/uploads/blog/images/          # Dynamic (persistent)
```

## Production Monitoring

Add these to your VPS crontab:
```bash
# Daily database backup at 2 AM
0 2 * * * /home/user/ProsumeAI/backup-db.sh

# Weekly full backup on Sundays at 3 AM (includes user uploads)
0 3 * * 0 /home/user/ProsumeAI/backup-full.sh

# Monthly user uploads archive (with new architecture)
0 4 1 * * tar -czf /home/user/backups/uploads_monthly_$(date +%Y%m).tar.gz -C /opt/prosumeai uploads/

# Check disk space daily
0 6 * * * df -h | mail -s "VPS Disk Usage" your-email@domain.com
```

## 🔍 Image Architecture Benefits

### For Deployments
✅ **Static Images**: Automatically updated with code pushes
✅ **User Uploads**: Never lost during deployments
✅ **Version Control**: Static assets managed with Git
✅ **Performance**: Optimal caching for both image types

### For Maintenance
✅ **Backup Efficiency**: Separate backup strategies for different data types
✅ **Storage Optimization**: Static images don't consume upload storage
✅ **Update Simplicity**: Static assets update automatically with code
✅ **Rollback Safety**: User uploads preserved during rollbacks

## Summary

- **✅ Data will persist** in production with the new volume setup
- **✅ Easy migration** with backup/restore process  
- **✅ Production-ready** Docker configuration already exists
- **✅ Automatic static image updates** with Git deployments
- **⚠️ Requires initial data migration** from your local environment
- **🔄 Regular backups recommended** for safety (database + user uploads)

The new image architecture provides the perfect balance:
- **Static images** update automatically with your code
- **User uploads** persist safely across all deployments
- **Version control** for design assets  
- **Data persistence** for user content

The volume persistence strategy now optimally separates static and dynamic content - the beauty of the new architecture! 🎉 