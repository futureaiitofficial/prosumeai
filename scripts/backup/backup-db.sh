#!/bin/bash

# ProsumeAI Database Backup Script
# Use locally: ./backup-db.sh
# Use on VPS: setup as cron job

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_USER=${POSTGRES_USER:-raja}
DB_NAME=${POSTGRES_DB:-prosumeai}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
echo "Creating database backup..."
docker compose exec -T db pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_DIR/prosumeai_$DATE.sql

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Database backup created successfully: $BACKUP_DIR/prosumeai_$DATE.sql"
    
    # Compress the backup
    gzip $BACKUP_DIR/prosumeai_$DATE.sql
    echo "✅ Backup compressed: $BACKUP_DIR/prosumeai_$DATE.sql.gz"
    
    # Show backup size
    BACKUP_SIZE=$(du -h $BACKUP_DIR/prosumeai_$DATE.sql.gz | cut -f1)
    echo "📊 Backup size: $BACKUP_SIZE"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "prosumeai_*.sql.gz" -mtime +7 -delete
    echo "🧹 Old backups cleaned up (keeping last 7 days)"
else
    echo "❌ Database backup failed!"
    exit 1
fi 