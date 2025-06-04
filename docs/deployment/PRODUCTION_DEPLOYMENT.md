# ProsumeAI Production Deployment Guide

## 🚀 Production Docker Setup

Your Docker setup is now **production-ready** with proper multi-stage builds, security configurations, and optimizations.

## Quick Production Deployment

### 1. Start Production Environment
```bash
# Build and start production containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app
```

### 2. Environment Configuration

Create `.env.production` file:
```bash
# Database Configuration
POSTGRES_DB=prosumeai
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgres://your_user:your_secure_password@db:5432/prosumeai

# Security (REQUIRED)
SESSION_SECRET=your_64_char_session_secret
COOKIE_SECRET=your_64_char_cookie_secret

# Application URLs
VITE_API_URL=https://yourdomain.com/api
VITE_APP_URL=https://yourdomain.com
ORIGIN_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Security Settings
NODE_ENV=production
TRUST_PROXY=true
DISABLE_SECURE_COOKIE=false
COOKIE_SAMESITE=strict

# Admin Account
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password
```

### 3. Generate Secure Keys
```bash
# Generate SESSION_SECRET
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate COOKIE_SECRET  
node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

## 🔒 Production Security Features

### ✅ **Implemented Security**
- Multi-stage Docker builds (smaller production images)
- Database port not exposed (internal network only)
- pgAdmin disabled in production
- Proper user permissions (non-root)
- Security headers configured
- HTTPS cookie settings
- Resource limits and health checks

### 🛡️ **Database Security**
- No external port exposure
- Password authentication required
- Internal Docker network only

### 🔐 **Application Security**
- Secure cookie settings
- Trusted proxy configuration
- Session management
- Rate limiting ready

## 📊 Production Monitoring

### Container Health Checks
```bash
# Check container status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View application health
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec app curl localhost:3000/api/health
```

### Resource Usage
```bash
# Monitor resource usage
docker stats

# View container logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app
```

## 🚀 Deployment Commands

### Production Start
```bash
# Fresh deployment
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Update deployment (rebuild only app)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app

# Stop production
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Database Management
```bash
# Backup database
./scripts/backup/backup-db.sh

# Full backup (including images)
./scripts/backup/backup-full.sh

# Access database (if needed)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U $POSTGRES_USER -d $POSTGRES_DB
```

## 🌐 Reverse Proxy Setup (Nginx)

### Sample Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

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
    }
}
```

## 📋 Production Checklist

### Before Deployment
- [ ] `.env.production` configured with secure values
- [ ] SSL certificates ready (if using HTTPS)
- [ ] Domain DNS pointing to server
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Backup strategy in place

### After Deployment  
- [ ] Application accessible via domain
- [ ] Database connection working
- [ ] File uploads working
- [ ] Email sending configured
- [ ] SSL/HTTPS working
- [ ] Health checks passing
- [ ] Monitoring/logging set up

### Regular Maintenance
- [ ] Database backups (automated)
- [ ] Security updates
- [ ] Log rotation
- [ ] SSL certificate renewal
- [ ] Resource monitoring

## 🚨 Troubleshooting

### Common Issues
```bash
# App not starting
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs app

# Database connection issues  
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs db

# Port conflicts
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker system prune -f

# Resource issues
docker stats
docker system df
```

### Emergency Recovery
```bash
# Restore from backup
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
# Restore database backup
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## ⚡ Performance Optimization

### Production Settings Applied
- Resource limits (1GB RAM, 0.5 CPU for app)
- Optimized Docker images
- Production builds with minification
- Database connection pooling
- Static file serving optimization

Your ProsumeAI application is now **production-ready** with enterprise-grade security and performance configurations! 🎉 