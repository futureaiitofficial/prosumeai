# ProsumeAI Docker Development Setup

This documentation describes the complete Docker development setup for ProsumeAI, including database configuration, security fixes, and troubleshooting steps.

## 🏗️ Architecture Overview

The development environment consists of three main services:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ProsumeAI     │    │   PostgreSQL    │    │    pgAdmin      │
│   Application   │    │   Database      │    │   (Optional)    │
│   Port: 3000    │◄──►│   Port: 5432    │◄──►│   Port: 5051    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Docker Desktop installed and running
- Node.js 18+ (for local development)
- PostgreSQL 17.4+ (for local compatibility)
- At least 4GB RAM available for Docker

## 🚀 Quick Start

### 1. Clone and Setup
```bash
cd /Users/raja/Development/ProsumeAI
```

### 2. Environment Files
Ensure these environment files exist:
- `.env` - Main environment configuration
- `.env.development` - Development-specific settings
- `prosumeai_backup.sql` - Database backup file

### 3. Start the Services
```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs app --follow
```

## 🐳 Service Details

### Application Service (`app`)
- **Image**: Custom Node.js 18-alpine with development tools
- **Port**: `3000` (exposed to host)
- **Mode**: Development with hot reload via `tsx watch`
- **Entry Point**: `npm run dev:server`
- **Health Check**: `/health` endpoint

**Key Features:**
- TypeScript compilation with `tsx`
- Hot reload for server changes
- Vite development server for client
- Full development environment

### Database Service (`db`)
- **Image**: `postgres:17-alpine`
- **Port**: `5432` (exposed to host)
- **Database**: `prosumeai`
- **Username**: `raja`
- **Password**: `raja`

**Key Features:**
- PostgreSQL 17.5 (compatible with local 17.4)
- Automatic backup restoration on first run
- Health checks with `pg_isready`
- Persistent data storage

### pgAdmin Service (`pgadmin`)
- **Image**: `dpage/pgadmin4:latest`
- **Port**: `5051` (exposed to host)
- **Email**: `admin@atscribe.com`
- **Password**: `admin123`

## 🔧 Configuration Files

### docker-compose.yml
```yaml
name: atscribe

services:
  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: prosumeai
      POSTGRES_USER: raja
      POSTGRES_PASSWORD: raja
      POSTGRES_HOST_AUTH_METHOD: trust
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./prosumeai_backup.sql:/docker-entrypoint-initdb.d/backup.sql:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U raja -d prosumeai"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - atscribe-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://raja:raja@db:5432/prosumeai
      # ... additional environment variables
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
      - ./public/uploads:/app/public/uploads
    networks:
      - atscribe-network

  pgadmin:
    image: dpage/pgadmin4:latest
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@atscribe.com
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "5051:80"
    depends_on:
      - db
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - atscribe-network

volumes:
  postgres_data:
  pgadmin_data:

networks:
  atscribe-network:
    driver: bridge
```

### Dockerfile
```dockerfile
# Development version for easier debugging
FROM node:18-alpine

# Install dependencies for native packages
RUN apk add --no-cache \
    python3 make g++ cairo-dev jpeg-dev pango-dev \
    musl-dev giflib-dev pixman-dev pangomm-dev \
    libjpeg-turbo-dev freetype-dev wget

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY theme.json ./

# Install dependencies
RUN npm ci --include=dev

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY public/ ./public/

# Copy configuration
COPY drizzle.config.ts ./

# Create logs directory and set permissions
RUN mkdir -p logs
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Run development server
CMD ["npm", "run", "dev:server"]
```

## 🗄️ Database Setup

### Connection Details
| Parameter | Value |
|-----------|--------|
| Host | `localhost` (from host) or `db` (from Docker) |
| Port | `5432` |
| Database | `prosumeai` |
| Username | `raja` |
| Password | `raja` |

### pgAdmin Access
1. Open http://localhost:5051
2. Login with:
   - Email: `admin@atscribe.com`
   - Password: `admin123`
3. Add server with database connection details above

### Manual Database Access
```bash
# From host machine
psql -h localhost -p 5432 -U raja -d prosumeai

# From within Docker
docker compose exec db psql -U raja -d prosumeai

# Check tables
docker compose exec db psql -U raja -d prosumeai -c "\dt"
```

## 🛠️ Development Commands

### Container Management
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart a specific service
docker compose restart app

# View logs
docker compose logs app --follow
docker compose logs db --tail=50

# Execute commands in containers
docker compose exec app bash
docker compose exec db psql -U raja -d prosumeai
```

### Database Operations
```bash
# Fresh database (removes all data)
docker compose down -v
docker compose up -d

# Backup database
docker compose exec db pg_dump -U raja -d prosumeai > backup.sql

# Check database health
docker compose exec db pg_isready -U raja -d prosumeai
```

### Application Operations
```bash
# View application status
curl http://localhost:3000/health

# Check container status
docker compose ps

# Monitor resource usage
docker stats
```

## 🔒 Security Features

### Input Sanitization
The application includes comprehensive input sanitization:

**Client-side (`client/src/utils/sanitize.ts`):**
- XSS prevention
- SQL injection protection
- HTML tag filtering
- Script tag removal

**Server-side (`server/src/utils/resume-sanitizer.ts`):**
- Deep object sanitization
- URL validation with domain restrictions
- Email format validation
- Phone number sanitization
- Suspicious pattern detection

### Security Patterns Detected
The system monitors for:
- Script injection attempts
- SQL injection patterns
- Dangerous JavaScript functions
- Malicious URL schemes
- Template injection attempts

## 🚨 Troubleshooting

### Common Issues

#### 1. "payment_gateway_configs does not exist"
**Cause**: Database not properly initialized with backup file.
**Solution**:
```bash
docker compose down -v  # Remove volumes
docker compose up -d    # Restart with fresh DB
```

#### 2. "Security check failed: Suspicious pattern detected"
**Cause**: Overly strict input sanitization.
**Solution**: The sanitization has been optimized to reduce false positives while maintaining security.

#### 3. Container restart loops
**Cause**: Build or configuration issues.
**Solution**:
```bash
docker compose logs app --tail=50  # Check logs
docker compose build --no-cache app  # Rebuild
```

#### 4. pgAdmin connection fails
**Cause**: Database not exposed or wrong connection details.
**Solution**: Use the correct connection details from this documentation.

#### 5. Port already in use
**Cause**: Another service using the same port.
**Solution**:
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5432

# Kill the process or change ports in docker-compose.yml
```

### Performance Issues

#### 1. Slow startup
- Ensure Docker has enough resources (4GB+ RAM)
- Check if antivirus is scanning Docker files
- Use Docker Desktop's resource settings to allocate more CPU/RAM

#### 2. Database connection timeouts
- Check if database container is healthy: `docker compose ps`
- Verify backup file is loading: `docker compose logs db`

### Debugging Tips

#### 1. Check service health
```bash
docker compose ps
docker compose logs --tail=20
```

#### 2. Monitor resource usage
```bash
docker stats
```

#### 3. Test individual components
```bash
# Test database
docker compose exec db psql -U raja -d prosumeai -c "SELECT 1;"

# Test application
curl http://localhost:3000/health

# Test pgAdmin
curl http://localhost:5051
```

## 📊 Monitoring & Logs

### Log Locations
- **Application logs**: `docker compose logs app`
- **Database logs**: `docker compose logs db`
- **pgAdmin logs**: `docker compose logs pgadmin`
- **File logs**: `./logs/` directory (mounted volume)

### Health Checks
- **Application**: http://localhost:3000/health
- **Database**: Automatic with `pg_isready`
- **Overall status**: `docker compose ps`

## 🔄 Development Workflow

### 1. Starting Development
```bash
cd /Users/raja/Development/ProsumeAI
docker compose up -d
docker compose logs app --follow
```

### 2. Making Changes
- **Client code**: Auto-reloads via Vite
- **Server code**: Auto-reloads via `tsx watch`
- **Database changes**: May require migration or restart

### 3. Testing
```bash
# Run tests (if available)
docker compose exec app npm test

# Manual testing
curl http://localhost:3000/health
```

### 4. Stopping Development
```bash
docker compose down
# or to keep data:
docker compose stop
```

## 📈 Production Considerations

**Note**: This setup is optimized for development. For production:

1. **Security**: Change default passwords and secrets
2. **Performance**: Use production Node.js build
3. **Monitoring**: Add proper logging and monitoring
4. **Backup**: Implement automated database backups
5. **SSL**: Add HTTPS/TLS certificates
6. **Environment**: Use production environment variables

## 🆘 Support

### Getting Help
1. Check this documentation first
2. Review container logs: `docker compose logs`
3. Verify service status: `docker compose ps`
4. Test individual components as described above

### Useful Commands Reference
```bash
# Quick health check
docker compose ps && curl -s http://localhost:3000/health

# Full restart
docker compose down && docker compose up -d

# Emergency reset (loses data)
docker compose down -v && docker compose up -d

# Resource usage
docker stats $(docker compose ps -q)
```

---

**Last Updated**: December 2024  
**Environment**: Development  
**PostgreSQL Version**: 17.5 (alpine)  
**Node.js Version**: 18 (alpine) 