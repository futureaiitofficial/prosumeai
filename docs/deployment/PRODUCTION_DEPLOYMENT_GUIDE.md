# Production VPS Deployment Guide

## Overview
When deploying to a VPS, you'll start with a clean server, so we need to migrate your data and set up proper production persistence.

## Current Local Data to Migrate

### 1. **Database Data** 📊
- **What**: All your blog posts, users, settings, etc.
- **Size**: Check with `docker compose exec db pg_dump -U raja prosumeai | wc -c`
- **Location**: PostgreSQL volume `atscribe_postgres_data`

### 2. **Blog Images** 🖼️
- **What**: 10 blog featured images (9.0MB total)
- **Location**: `./public/images/blog/`
- **Files**: All your blog post featured images

### 3. **Logs** 📝
- **What**: Application logs
- **Size**: 36KB
- **Location**: `./logs/`

## Production Deployment Steps

### Step 1: Backup Current Data

```bash
# 1. Export database
docker compose exec db pg_dump -U raja -d prosumeai > prosumeai_production_backup.sql

# 2. Create data archive
tar -czf production_data.tar.gz public/images/ logs/ prosumeai_production_backup.sql .env

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
# 1. Clone your repository
git clone https://github.com/your-username/ProsumeAI.git
cd ProsumeAI

# 2. Extract backed up data
tar -xzf production_data.tar.gz

# 3. Set up production environment
cp .env .env.production
# Edit .env.production with production settings:
# - Change POSTGRES_PASSWORD to a strong password
# - Set NODE_ENV=production
# - Configure proper domain URLs
# - Set secure session secrets
```

### Step 4: Configure Production Volumes

The volume mounts will work the same way on VPS:

```yaml
# docker-compose.yml already configured with:
volumes:
  - ./public/images:/app/public/images  # ✅ Images persist
  - ./public/sounds:/app/public/sounds  # ✅ Sounds persist

# PostgreSQL data volume:
volumes:
  postgres_data:  # ✅ Database persists
```

### Step 5: Start Production Services

```bash
# 1. Start services
docker compose -f docker-compose.yml up -d

# 2. Wait for database to be ready
docker compose exec db pg_isready -U raja

# 3. Restore database
docker compose exec -T db psql -U raja -d prosumeai < prosumeai_production_backup.sql

# 4. Verify everything works
curl http://your-vps-ip:3000/api/health
curl http://your-vps-ip:3000/images/blog/blog-1748567120762-57782661.png
```

## Data Persistence in Production

### ✅ **What WILL Persist** (Safe from container rebuilds):

1. **Database**: PostgreSQL data in named volume `postgres_data`
2. **Blog Images**: Host directory `./public/images/` mounted to container
3. **Logs**: Host directory `./logs/` mounted to container
4. **Environment Config**: `.env` files on host

### ⚠️ **What you need to backup regularly**:

1. **Database** (automated backup script recommended)
2. **Uploaded files** (images grow over time)
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

### Weekly Full Backup:

```bash
#!/bin/bash
# save as backup-full.sh

DATE=$(date +%Y%m%d)
tar -czf /home/user/backups/full_backup_$DATE.tar.gz \
  public/images/ \
  logs/ \
  .env \
  docker-compose.yml

echo "Full backup created: full_backup_$DATE.tar.gz"
```

## Alternative: Cloud Storage for Images

For better scalability, consider moving images to cloud storage:

### Option 1: AWS S3 / DigitalOcean Spaces
```javascript
// Update blog upload to save to cloud storage instead of local files
// Images would be at: https://your-bucket.s3.amazonaws.com/blog/filename.jpg
```

### Option 2: CloudFlare R2 (cheaper)
```javascript
// Similar to S3 but more cost-effective
```

## Production Monitoring

Add these to your VPS crontab:
```bash
# Daily database backup at 2 AM
0 2 * * * /home/user/ProsumeAI/backup-db.sh

# Weekly full backup on Sundays at 3 AM
0 3 * * 0 /home/user/ProsumeAI/backup-full.sh

# Check disk space daily
0 6 * * * df -h | mail -s "VPS Disk Usage" your-email@domain.com
```

## Summary

- **✅ Data will persist** in production with the same volume setup
- **✅ Easy migration** with backup/restore process
- **✅ Production-ready** Docker configuration already exists
- **⚠️ Requires initial data migration** from your local environment
- **🔄 Regular backups recommended** for safety

The volume persistence strategy is the same locally and in production - the beauty of Docker! 