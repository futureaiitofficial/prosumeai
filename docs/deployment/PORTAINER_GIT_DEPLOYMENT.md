# atScribe Portainer Git Deployment Guide

## 🚀 Deploy atScribe using Portainer with Git Integration

This guide shows how to deploy atScribe to your Hostinger VPS using Portainer's Git integration for automatic builds and easy updates.

## 📋 VPS Information

- **Provider**: Hostinger VPS  
- **OS**: Ubuntu 22.04 with Desktop XFCE
- **IP**: 89.116.21.215
- **Portainer URL**: https://docker.futureaiit.com/#!/2/docker/stacks
- **SSH Access**: `ssh root@89.116.21.215`

## 🔧 Prerequisites Setup

### 1. Prepare Git Repository

First, ensure your atScribe repository is accessible (GitHub/GitLab/etc.):
```bash
# Make sure your latest changes are pushed
git add .
git commit -m "feat: prepare for production deployment"
git push origin main
```

### 2. VPS Initial Setup

```bash
# SSH into your VPS
ssh root@89.116.21.215

# Update system
apt update && apt upgrade -y

# Create working directory for persistent data
mkdir -p /opt/atscribe/{uploads,images,logs,backups}
chmod 755 /opt/atscribe

# Clone your atScribe repository to get the database backup
cd /opt
git clone https://github.com/futureaiitofficial/prosumeai.git
cd prosumeai

# Verify your database backup file exists
ls -la prosumeai_backup.sql
# This file contains your existing database with all tables and data
```

## 🌐 Portainer Git Stack Deployment

### 1. Access Portainer

1. Open: https://docker.futureaiit.com/#!/2/docker/stacks
2. Login to your Portainer instance
3. Navigate to **Stacks** in the left sidebar

### 2. Create atScribe Stack with Git

Click **"+ Add Stack"** and configure:

**Stack Name**: `atscribe-production`

**Build Method**: Select **"Repository"**

**Repository Configuration**:
- **Repository URL**: `https://github.com/futureaiitofficial/prosumeai.git`
- **Repository Reference**: `refs/heads/main`
- **Compose Path**: `docker-compose.yml`
- **Additional Files**: `docker-compose.prod.yml`

**⚠️ Important**: Your repository includes `prosumeai_backup.sql` which contains your existing database with all tables, users, blog posts, and settings. This will be automatically restored when the database container starts for the first time.

### 3. Environment Variables Configuration

In the **Environment Variables** section, add:

```env
# Database Configuration
POSTGRES_DB=atscribe
POSTGRES_USER=atscribe_user
POSTGRES_PASSWORD=your_super_secure_db_password_here

# Security Secrets (REQUIRED - Generate these!)
SESSION_SECRET=your_64_char_session_secret_here
COOKIE_SECRET=your_64_char_cookie_secret_here

# Application URLs (Update with your domain)
VITE_API_URL=https://yourdomain.com/api
VITE_APP_URL=https://yourdomain.com
ORIGIN_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Security Settings
NODE_ENV=production
TRUST_PROXY=true
DISABLE_SECURE_COOKIE=false
COOKIE_SAMESITE=strict

# Database Connection
DATABASE_URL=postgres://atscribe_user:your_super_secure_db_password_here@db:5432/atscribe
DB_HOST=db
DB_PORT=5432
DB_NAME=atscribe
DB_USER=atscribe_user
DB_PASSWORD=your_super_secure_db_password_here

# Admin Account
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password

# Application Port
PORT=3000

# Session Configuration
SESSION_MAX_AGE=86400000

# pgAdmin (for debugging if needed)
PGADMIN_DEFAULT_EMAIL=admin@yourdomain.com
PGADMIN_DEFAULT_PASSWORD=your_pgadmin_password
PGADMIN_CONFIG_SERVER_MODE=False
```

### 4. Generate Secure Secrets

Before deployment, generate secure secrets on your local machine:
```bash
# Generate SESSION_SECRET
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate COOKIE_SECRET
node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Deploy with Production Override

**Option A: Use Docker Compose Override Files**

Portainer will automatically use both files:
- `docker-compose.yml` (base configuration)
- `docker-compose.prod.yml` (production overrides)

**Option B: Custom Stack Configuration**

If you prefer a single file approach, use this Docker Compose content:

```yaml
name: atscribe

services:
  # PostgreSQL Database
  db:
    image: postgres:17-alpine
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_HOST_AUTH_METHOD: trust
    volumes:
      - postgres_data:/var/lib/postgresql/data
      # Automatically restore your existing database backup on first run
      - ./prosumeai_backup.sql:/docker-entrypoint-initdb.d/backup.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - atscribe-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.25'

  # atScribe Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    restart: always
    environment:
      NODE_ENV: production
      PORT: ${PORT}
      
      # Database Configuration
      DATABASE_URL: ${DATABASE_URL}
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_NAME: ${POSTGRES_DB}
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      
      # Security Configuration
      SESSION_SECRET: ${SESSION_SECRET}
      SESSION_MAX_AGE: ${SESSION_MAX_AGE}
      COOKIE_SECRET: ${COOKIE_SECRET}
      COOKIE_SAMESITE: ${COOKIE_SAMESITE}
      DISABLE_SECURE_COOKIE: "false"
      TRUST_PROXY: "true"
      
      # Admin Configuration
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      
      # Application URLs
      VITE_API_URL: ${VITE_API_URL}
      VITE_APP_URL: ${VITE_APP_URL}
      ORIGIN_URL: ${ORIGIN_URL}
      CORS_ORIGIN: ${CORS_ORIGIN}
      
    ports:
      - "3000:3000"
    volumes:
      # Persistent storage mapped to VPS directories
      - /opt/atscribe/images:/app/public/images
      - /opt/atscribe/uploads:/app/server/uploads
      - /opt/atscribe/logs:/app/logs
    depends_on:
      db:
        condition: service_healthy
    networks:
      - atscribe-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
    driver: local

networks:
  atscribe-network:
    driver: bridge
```

### 6. Deploy the Stack

1. **Configure Auto-updates**: Enable **"Auto-update"** if you want automatic deployments on Git pushes
2. **Click "Deploy the stack"**
3. **Monitor Progress**: Watch the build process in real-time
4. **Check Logs**: Verify containers start successfully

**📊 Database Restoration**: On first deployment, PostgreSQL will automatically restore your `prosumeai_backup.sql` file, which includes:
- All existing tables and schemas
- User accounts and authentication data
- Blog posts and categories
- Resume templates and user data
- Application settings and configurations

**⏱️ Note**: Initial startup may take 2-3 minutes for database restoration. Monitor the database container logs in Portainer to see the restoration progress.

## 🔄 Git-Based Update Workflow

### Automatic Updates (Recommended)

1. **Make changes locally**:
   ```bash
   # Edit your code
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **Auto-deployment**: If auto-update is enabled, Portainer will:
   - Detect the Git push
   - Pull latest code
   - Rebuild containers
   - Deploy automatically

### Manual Updates

1. **In Portainer**:
   - Go to **Stacks** → `atscribe-production`
   - Click **"Update this stack"**
   - Enable **"Re-pull image and redeploy"**
   - Click **"Update the stack"**

### SSH-Based Quick Updates

```bash
# SSH into VPS
ssh root@89.116.21.215

# Update using Portainer API (if configured)
curl -X POST "https://docker.futureaiit.com/api/stacks/YOUR_STACK_ID/git/redeploy" \
  -H "X-API-Key: YOUR_API_KEY"
```

## 🔍 Monitoring with Portainer

### Real-time Monitoring

1. **Dashboard**: Overview of all containers and resources
2. **Containers**: Individual container status and logs
3. **Images**: Automatic image building from Git
4. **Logs**: Real-time application logs
5. **Stats**: CPU, memory, and network usage

### Container Management

- **atscribe-app-1**: Main application container
- **atscribe-db-1**: PostgreSQL database
- **Logs**: Access through Portainer interface
- **Console**: Direct container access if needed

### Health Monitoring

Monitor the health endpoint:
- **Internal**: Container health checks
- **External**: https://yourdomain.com/api/health

## 🔒 Security Configuration

### Firewall Setup

```bash
# SSH into VPS and configure firewall
ssh root@89.116.21.215

ufw enable
ufw allow 22    # SSH
ufw allow 80    # HTTP  
ufw allow 443   # HTTPS
ufw allow 9000  # Portainer (if needed externally)
ufw deny 5432   # Block direct database access
ufw status
```

### SSL Certificate Setup

```bash
# Install Certbot for Let's Encrypt
apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
certbot --nginx -d yourdomain.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🌐 Nginx Reverse Proxy

Create `/etc/nginx/sites-available/atscribe`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/atscribe /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 📊 Backup and Maintenance

### Automated Backups

Create backup script on VPS:
```bash
# SSH into VPS
ssh root@89.116.21.215

# Create backup script
cat > /opt/atscribe/backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/opt/atscribe/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "$(date): Starting atScribe backup..."

# Database backup
docker exec atscribe-db-1 pg_dump -U atscribe_user -d atscribe > $BACKUP_DIR/atscribe_db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/atscribe_db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "atscribe_db_*.sql.gz" -mtime +7 -delete

echo "$(date): Backup completed: $BACKUP_DIR/atscribe_db_$DATE.sql.gz"
EOF

chmod +x /opt/atscribe/backup.sh
```

### Setup Cron Jobs

```bash
# Edit crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/atscribe/backup.sh

# Weekly system cleanup on Sundays at 3 AM
0 3 * * 0 docker system prune -f
```

## 🚨 Troubleshooting

### Common Issues

**Build Failures**:
1. Check Git repository access
2. Verify Dockerfile exists and is correct
3. Check build logs in Portainer

**Container Won't Start**:
1. Check environment variables
2. Verify database connection
3. Review container logs

**Git Integration Issues**:
1. Verify repository URL is correct
2. Check branch name (main vs master)
3. Ensure repository is public or add deploy keys

### Emergency Recovery

```bash
# SSH into VPS
ssh root@89.116.21.215

# Stop containers
docker stop atscribe-app-1 atscribe-db-1

# Restore database from backup
gunzip -c /opt/atscribe/backups/atscribe_db_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i atscribe-db-1 psql -U atscribe_user -d atscribe

# Restart through Portainer web interface
```

## ✅ Deployment Checklist

### Before Deployment
- [ ] Git repository accessible and up to date
- [ ] `prosumeai_backup.sql` file exists in repository root
- [ ] Environment variables configured with secure values
- [ ] Secrets generated and added to Portainer
- [ ] VPS directories created (`/opt/atscribe/`)
- [ ] Repository cloned to VPS (`/opt/prosumeai/`)
- [ ] Domain pointing to VPS IP

### After Deployment
- [ ] All containers running (check Portainer dashboard)
- [ ] Database restoration completed (check db container logs)
- [ ] Application accessible via domain
- [ ] Health check endpoint responding
- [ ] Database connection working and data restored
- [ ] Admin login working with existing credentials
- [ ] Blog posts and content accessible
- [ ] SSL certificate installed and working
- [ ] Backup automation configured
- [ ] Auto-update configured (if desired)

## 🎯 Advantages of Git-Based Deployment

✅ **Automatic Updates**: Push to Git → Auto-deploy  
✅ **Version Control**: Full Git history and rollback capability  
✅ **No Manual File Transfer**: Portainer pulls directly from Git  
✅ **Consistent Builds**: Same environment every time  
✅ **Easy Rollbacks**: Git-based version management  
✅ **Team Collaboration**: Multiple developers can deploy  

## 🔗 Quick Access Links

- **Portainer**: https://docker.futureaiit.com/#!/2/docker/stacks
- **Application**: https://yourdomain.com (after domain setup)
- **SSH**: `ssh root@89.116.21.215`
- **Health Check**: https://yourdomain.com/api/health

Your atScribe application is now deployed using Portainer with Git integration for seamless updates! 🎉 