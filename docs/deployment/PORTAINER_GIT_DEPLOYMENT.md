# atScribe Portainer Git Deployment Guide

## 🚀 Deploy atScribe using Portainer with Git Integration

This guide shows how to deploy atScribe to your Hostinger VPS using Portainer's Git integration for automatic builds and easy updates with the new image architecture for optimal persistence.

## 📋 VPS Information

- **Provider**: Hostinger VPS  
- **OS**: Ubuntu 22.04 with Desktop XFCE
- **IP**: 89.116.21.215
- **Portainer URL**: https://docker.futureaiit.com/#!/2/docker/stacks
- **SSH Access**: `ssh root@89.116.21.215`

## 🖼️ **NEW: Image Architecture Overview**

**Important**: atScribe now uses a dual image system for optimal deployment persistence:

### **Static Images** (Part of Codebase) 📦
- **Content**: Dashboard previews, template thumbnails, UI assets
- **Location**: `/app/public/images/` (inside container)
- **Deployment**: ✅ **Automatically updated** with Git pushes
- **Volume Mount**: ❌ **No mount needed** - comes with code

### **Dynamic Images** (User Uploads) 📤
- **Content**: Blog featured images, user-uploaded templates, branding assets
- **Location**: `/app/server/uploads/` (volume mounted to VPS)
- **Deployment**: ✅ **Persists across deployments**
- **Volume Mount**: ✅ **Required** - mounted to host directory

### **Required Volume Mounts**
```yaml
volumes:
  # ✅ REQUIRED: User uploads persist across deployments
  - /home/futureaiit/docker/atscribe/uploads:/app/server/uploads
  
  # ✅ REQUIRED: Application logs persist
  - /home/futureaiit/docker/atscribe/logs:/app/logs
  
  # ❌ REMOVED: No longer mount /app/public/images 
  # Static images come with codebase automatically!
```

## 🔧 Prerequisites Setup

### 1. Prepare Git Repository

First, ensure your atScribe repository is accessible (GitHub/GitLab/etc.):
```bash
# Make sure your latest changes are pushed
git add .
git commit -m "feat: prepare for production deployment with new image architecture"
git push origin main
```

### 2. VPS Initial Setup

```bash
# SSH into your VPS
ssh root@89.116.21.215

# Update system
apt update && apt upgrade -y

# Create working directory for persistent data
mkdir -p /home/futureaiit/docker/atscribe/{uploads,logs}
chmod 755 /home/futureaiit/docker/atscribe

# Create subdirectories for different upload types
mkdir -p /home/futureaiit/docker/atscribe/uploads/{blog/images,templates,branding}

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
BASE_URL=https://yourdomain.com
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
- `docker-compose.prod.yml` (production overrides with new image architecture)

**Option B: Custom Stack Configuration**

If you prefer a single file approach, use this Docker Compose content with the new image architecture:

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
      BASE_URL: ${BASE_URL}
      CORS_ORIGIN: ${CORS_ORIGIN}
      
    ports:
      - "3000:3000"
    volumes:
      # NEW IMAGE ARCHITECTURE: Only mount user uploads and logs
      # Static images come with the codebase automatically!
      - /home/futureaiit/docker/atscribe/uploads:/app/server/uploads  # ✅ User uploads persist
      - /home/futureaiit/docker/atscribe/logs:/app/logs               # ✅ Logs persist
      # ❌ REMOVED: No mount for /app/public/images (static images come with code)
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
   # Edit your code (static images automatically included)
   git add .
   git commit -m "feat: add new feature with updated static images"
   git push origin main
   ```

2. **Auto-deployment**: If auto-update is enabled, Portainer will:
   - Detect the Git push
   - Pull latest code (including updated static images)
   - Rebuild containers with new static images
   - Deploy automatically while preserving user uploads

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

## 🖼️ **Image Management with Git Deployments**

### What Happens During Git-Based Deployment

#### ✅ **Static Images** (Automatically Updated)
- **Source**: Part of your Git repository
- **Examples**: Dashboard previews, template thumbnails, UI icons
- **Update Process**: Automatically pulled and updated with code
- **Location**: `/app/public/images/` (inside container)
- **URL Access**: `https://yourdomain.com/images/filename.svg`

#### ✅ **Dynamic Images** (Persist Across Deployments)
- **Source**: User uploads via admin panel
- **Examples**: Blog featured images, custom templates, branding
- **Update Process**: Remain intact during deployments
- **Location**: `/home/futureaiit/docker/atscribe/uploads/` (on VPS host)
- **URL Access**: `https://yourdomain.com/uploads/blog/images/filename.jpg`

### Git Repository Structure
```
prosumeai/
├── public/
│   └── images/              # ✅ Static images (version controlled)
│       ├── dashboard-preview.svg
│       ├── analytics-chart.svg
│       └── blog/            # Static blog design images
├── server/
│   └── uploads/             # ❌ Empty in repo (runtime only)
└── docker-compose.prod.yml  # ✅ New volume mount config
```

### VPS Directory Structure After Deployment
```
/home/futureaiit/docker/atscribe/
├── uploads/                 # ✅ Persists across Git deployments
│   ├── blog/
│   │   └── images/          # User uploaded blog images
│   ├── templates/           # Custom template images
│   └── branding/            # Logo/favicon uploads
└── logs/                    # ✅ Application logs persist

# Inside container (updated with each Git deployment):
/app/public/images/          # ✅ Static images from Git repo
├── dashboard-preview.svg    # Updated with code changes
├── analytics-chart.svg      # Updated with code changes
└── ...
```

## 🔍 Monitoring with Portainer

### Real-time Monitoring

1. **Dashboard**: Overview of all containers and resources
2. **Containers**: Individual container status and logs
3. **Images**: Automatic image building from Git with static images
4. **Logs**: Real-time application logs
5. **Stats**: CPU, memory, and network usage

### Container Management

- **atscribe-app-1**: Main application container
- **atscribe-db-1**: PostgreSQL database
- **Logs**: Access through Portainer interface
- **Console**: Direct container access if needed

### Health Monitoring

Monitor the health endpoint and image serving:
- **Internal**: Container health checks
- **External**: https://yourdomain.com/api/health
- **Static Images**: https://yourdomain.com/images/dashboard-preview.svg
- **Dynamic Images**: https://yourdomain.com/uploads/blog/images/ (user uploads)

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

    # Main application proxy
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

    # Static images caching (served from container)
    location /images/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Dynamic uploads caching (served from container via /uploads route)
    location /uploads/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1h;
        expires 1h;
        add_header Cache-Control "public";
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

# User uploads backup (important for new architecture)
tar -czf $BACKUP_DIR/atscribe_uploads_$DATE.tar.gz -C /home/futureaiit/docker/atscribe uploads/

# Compress database backup
gzip $BACKUP_DIR/atscribe_db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "atscribe_db_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "atscribe_uploads_*.tar.gz" -mtime +7 -delete

echo "$(date): Backup completed:"
echo "  Database: $BACKUP_DIR/atscribe_db_$DATE.sql.gz"
echo "  Uploads: $BACKUP_DIR/atscribe_uploads_$DATE.tar.gz"
EOF

chmod +x /opt/atscribe/backup.sh
```

### Setup Cron Jobs

```bash
# Edit crontab
crontab -e

# Daily backup at 2 AM (database + user uploads)
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

**Images Not Loading**:
1. **Static Images**: Check if Git deployment succeeded
   ```bash
   # SSH into VPS
   docker exec atscribe-app-1 ls -la /app/public/images/
   curl -I https://yourdomain.com/images/dashboard-preview.svg
   ```

2. **Dynamic Images**: Check upload directories and volume mounts
   ```bash
   # Check host directory
   ls -la /home/futureaiit/docker/atscribe/uploads/
   
   # Check container mount
   docker exec atscribe-app-1 ls -la /app/server/uploads/
   
   # Test upload serving
   curl -I https://yourdomain.com/uploads/blog/images/
   ```

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

# Restore user uploads if needed
tar -xzf /opt/atscribe/backups/atscribe_uploads_YYYYMMDD_HHMMSS.tar.gz \
  -C /home/futureaiit/docker/atscribe/

# Restart through Portainer web interface
```

## ✅ Deployment Checklist

### Before Deployment
- [ ] Git repository accessible and up to date with new image architecture
- [ ] `prosumeai_backup.sql` file exists in repository root
- [ ] Environment variables configured with secure values
- [ ] Secrets generated and added to Portainer
- [ ] VPS directories created (`/home/futureaiit/docker/atscribe/uploads/`)
- [ ] Repository cloned to VPS (`/opt/prosumeai/`)
- [ ] Domain pointing to VPS IP

### After Deployment  
- [ ] All containers running (check Portainer dashboard)
- [ ] Database restoration completed (check db container logs)
- [ ] Application accessible via domain
- [ ] Health check endpoint responding (`/api/health`)
- [ ] **NEW**: Static images loading (`/images/dashboard-preview.svg`)
- [ ] **NEW**: Upload directory accessible (`/uploads/` endpoint)
- [ ] Database connection working and data restored
- [ ] Admin login working with existing credentials
- [ ] Blog posts and content accessible
- [ ] SSL certificate installed and working
- [ ] Backup automation configured
- [ ] Auto-update configured (if desired)

### Image Verification
- [ ] **Static Images**: Dashboard, analytics charts, template thumbnails load
- [ ] **Dynamic Images**: User uploaded blog images display correctly
- [ ] **Upload Functionality**: New image uploads work via admin panel
- [ ] **Persistence Test**: User uploads survive container restart

## 🎯 Advantages of Git-Based Deployment with New Image Architecture

✅ **Automatic Updates**: Push to Git → Auto-deploy with updated static images  
✅ **Version Control**: Full Git history and rollback capability for static assets  
✅ **No Manual File Transfer**: Portainer pulls everything from Git automatically  
✅ **Consistent Builds**: Same environment every time with fresh static images  
✅ **Easy Rollbacks**: Git-based version management for code and static assets  
✅ **Team Collaboration**: Multiple developers can deploy and update static assets  
✅ **Persistent User Data**: User uploads never lost during deployments  
✅ **Optimal Performance**: Static images cached, user uploads preserved  

## 🔮 Future Updates and Maintenance

### Adding New Static Images
1. Add images to `public/images/` in your local repository
2. Commit and push to Git
3. Portainer automatically deploys with new images
4. Images immediately available at `/images/filename.ext`

### Managing User Uploads
- User uploads automatically persist in `/home/futureaiit/docker/atscribe/uploads/`
- Regular backups include both database and upload files
- Upload functionality works independently of deployments

### Version Management
- Static images version controlled with code
- User uploads managed separately from code versions
- Perfect balance of automatic updates and data persistence

## 🔗 Quick Access Links

- **Portainer**: https://docker.futureaiit.com/#!/2/docker/stacks
- **Application**: https://yourdomain.com (after domain setup)
- **SSH**: `ssh root@89.116.21.215`
- **Health Check**: https://yourdomain.com/api/health
- **Static Images**: https://yourdomain.com/images/dashboard-preview.svg
- **Upload Endpoint**: https://yourdomain.com/uploads/

Your atScribe application is now deployed using Portainer with Git integration and the new optimized image architecture for seamless updates and persistent user data! 🎉 