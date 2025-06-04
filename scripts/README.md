# ProsumeAI Scripts

Utility scripts for managing ProsumeAI deployment and maintenance.

## 📁 Scripts Structure

### 💾 [Backup Scripts](./backup/)
Database and system backup utilities:

#### `backup-db.sh`
- **Purpose**: Create compressed database backups
- **Usage**: `./scripts/backup/backup-db.sh`
- **Features**:
  - Automatic compression with gzip
  - Cleanup of old backups (7 days retention)
  - Environment variable support
  - Error handling and validation

#### `backup-full.sh`
- **Purpose**: Complete system backup including database, images, and config
- **Usage**: `./scripts/backup/backup-full.sh`
- **Features**:
  - Full application backup
  - Excludes unnecessary files (node_modules, .git, etc.)
  - 3-week retention for full backups
  - Verification and size reporting

## 🚀 Quick Usage

### Database Backup
```bash
# From project root
./scripts/backup/backup-db.sh

# Output: ./backups/prosumeai_YYYYMMDD_HHMMSS.sql.gz
```

### Full System Backup
```bash
# From project root
./scripts/backup/backup-full.sh

# Output: ./backups/prosumeai_full_YYYYMMDD_HHMMSS.tar.gz
```

## 📋 Backup Contents

### Database Backup Includes:
- All PostgreSQL data
- Blog posts and categories
- User accounts and sessions
- Application settings
- Media metadata

### Full Backup Includes:
- Everything from database backup
- Blog images (`public/images/`)
- Application logs (`logs/`)
- Environment configuration (`.env`)
- Docker configuration files
- Package configuration (`package.json`)

## ⚙️ Setup for Production

### VPS Cron Jobs
Add to your crontab (`crontab -e`):

```bash
# Daily database backup at 2 AM
0 2 * * * cd /path/to/ProsumeAI && ./scripts/backup/backup-db.sh

# Weekly full backup on Sundays at 3 AM  
0 3 * * 0 cd /path/to/ProsumeAI && ./scripts/backup/backup-full.sh
```

### Backup Restoration
```bash
# Restore database from backup
gunzip -c backups/prosumeai_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T db psql -U raja -d prosumeai

# Restore full system from backup
tar -xzf backups/prosumeai_full_YYYYMMDD_HHMMSS.tar.gz
```

## 🔧 Environment Variables

The backup scripts respect these environment variables:
- `POSTGRES_USER` - Database username (default: raja)
- `POSTGRES_DB` - Database name (default: prosumeai)

## 📝 Adding New Scripts

When creating new scripts:
1. Place them in appropriate subdirectories
2. Make them executable (`chmod +x script.sh`)
3. Include proper error handling
4. Add documentation here
5. Use consistent naming conventions 