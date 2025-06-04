#!/bin/bash

# ProsumeAI Full Backup Script
# Creates a complete backup including database, images, and config

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_USER=${POSTGRES_USER:-raja}
DB_NAME=${POSTGRES_DB:-prosumeai}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "🚀 Starting full ProsumeAI backup..."

# 1. Create database backup
echo "📊 Backing up database..."
docker compose exec -T db pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_DIR/temp_db_$DATE.sql

if [ $? -ne 0 ]; then
    echo "❌ Database backup failed!"
    exit 1
fi

# 2. Create full archive
echo "📦 Creating full backup archive..."
tar -czf $BACKUP_DIR/prosumeai_full_$DATE.tar.gz \
    --exclude='./backups' \
    --exclude='./node_modules' \
    --exclude='./dist' \
    --exclude='./.git' \
    --exclude='./logs/*.log' \
    public/images/ \
    logs/ \
    .env \
    docker-compose.yml \
    docker-compose.override.yml \
    package.json \
    $BACKUP_DIR/temp_db_$DATE.sql

# 3. Clean up temporary database file
rm $BACKUP_DIR/temp_db_$DATE.sql

# 4. Verify backup
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h $BACKUP_DIR/prosumeai_full_$DATE.tar.gz | cut -f1)
    echo "✅ Full backup created successfully!"
    echo "📁 Location: $BACKUP_DIR/prosumeai_full_$DATE.tar.gz"
    echo "📊 Size: $BACKUP_SIZE"
    
    # List contents
    echo "📋 Backup contents:"
    tar -tzf $BACKUP_DIR/prosumeai_full_$DATE.tar.gz | head -10
    echo "   ... and more"
    
    # Keep only last 3 full backups (they're larger)
    find $BACKUP_DIR -name "prosumeai_full_*.tar.gz" -mtime +21 -delete
    echo "🧹 Old full backups cleaned up (keeping last 3 weeks)"
else
    echo "❌ Full backup failed!"
    exit 1
fi

echo "🎉 Full backup completed successfully!" 