# ATScribe Docker Deployment Guide

This guide will help you run ATScribe completely in Docker containers, including the application, database, and optional pgAdmin for database management.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)
- At least 2GB of free RAM
- At least 5GB of free disk space

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd ProsumeAI

# Make the startup script executable
chmod +x docker-start.sh
```

### 2. Environment Configuration

The Docker setup uses environment variables defined in the `docker-compose.yml` file. You can override them by creating a `.env` file:

```bash
# Optional: Create a .env file for custom settings
cp .env.docker .env
```

Edit the `.env` file to customize:
- `SESSION_SECRET`: Change to a strong random string
- `POSTGRES_PASSWORD`: Change the database password
- Other application-specific settings

### 3. Start the Application

#### Development Mode (with hot reloading)
```bash
./docker-start.sh dev
```

#### Production Mode
```bash
./docker-start.sh prod
```

#### Build Only (without starting)
```bash
./docker-start.sh build
```

## Available Services

When running, the following services will be available:

### Development Mode
- **Frontend (Vite)**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL Database**: localhost:5433
- **pgAdmin**: http://localhost:5051
  - Email: `admin@atscribe.com`
  - Password: `admin123`

### Production Mode
- **Application**: http://localhost:3000
- **pgAdmin**: http://localhost:5051 (optional)
- Database is not exposed externally

## Docker Commands

### Using the Convenience Script

```bash
# Start in development mode
./docker-start.sh dev

# Start in production mode
./docker-start.sh prod

# Build images
./docker-start.sh build

# Stop all services
./docker-start.sh stop

# View logs
./docker-start.sh logs

# Check status
./docker-start.sh status

# Clean up everything (containers, volumes, images)
./docker-start.sh clean

# Show help
./docker-start.sh help
```

### Manual Docker Compose Commands

```bash
# Development mode
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Production mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Clean up with volumes
docker compose down -v
```

## Architecture

The Docker setup includes:

1. **Application Container** (`app`):
   - Multi-stage build (base → build → production)
   - Node.js 18 Alpine Linux
   - Runs both frontend and backend
   - Health checks enabled

2. **PostgreSQL Database** (`db`):
   - PostgreSQL 15 Alpine
   - Persistent data storage
   - Health checks enabled
   - Initialization scripts

3. **pgAdmin** (`pgadmin`) - Optional:
   - Web-based database administration
   - Only available in development by default

## File Structure

```
ProsumeAI/
├── Dockerfile                 # Main application Dockerfile
├── docker-compose.yml         # Base Docker Compose configuration
├── docker-compose.override.yml # Development overrides
├── docker-compose.prod.yml    # Production overrides
├── .dockerignore             # Files to exclude from Docker build
├── init-db.sql              # Database initialization script
├── docker-entrypoint.sh     # Application entrypoint script
├── docker-start.sh          # Convenience startup script
├── .env.docker              # Template environment file
└── README-Docker.md         # This documentation
```

## Database Information

**Important:** The Docker setup creates a **separate** PostgreSQL database container that does NOT interfere with your existing local database.

- **Your Local Database**: `postgres://raja:raja@localhost:5432/prosumeai` (unchanged)
- **Docker Database**: `postgres://raja:raja@localhost:5433/prosumeai` (containerized, externally accessible)

Both databases coexist safely:
- Local database runs on your machine
- Docker database runs in an isolated container
- No conflicts or data loss

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Application port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://raja:raja@db:5432/prosumeai` |
| `SESSION_SECRET` | Session encryption key | `ATScribe-secure-production-key` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |
| `POSTGRES_DB` | Database name | `prosumeai` |
| `POSTGRES_USER` | Database user | `raja` |
| `POSTGRES_PASSWORD` | Database password | `raja` |

## Volumes

- `postgres_data`: PostgreSQL data persistence
- `pgadmin_data`: pgAdmin configuration persistence
- `./logs`: Application logs (mounted from host)
- `./public/uploads`: File uploads (mounted from host)

## Networking

All services communicate through a custom Docker network (`atscribe-network`) which provides:
- Service discovery by name
- Isolation from other Docker applications
- Automatic DNS resolution

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :5433
   
   # Stop conflicting services or change ports in docker-compose.yml
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker compose logs db
   
   # Verify database is ready
   docker compose exec db pg_isready -U raja -d prosumeai
   ```

3. **Build Failures**
   ```bash
   # Clean build (no cache)
   docker compose build --no-cache
   
   # Check Docker disk space
   docker system df
   docker system prune
   ```

4. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER logs/
   sudo chown -R $USER:$USER public/uploads/
   ```

### Logs and Debugging

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs app
docker compose logs db

# Follow logs in real-time
docker compose logs -f

# Execute commands in running containers
docker compose exec app sh
docker compose exec db psql -U raja -d prosumeai
```

### Performance Tuning

For production deployments, consider:

1. **Resource Limits**: Adjust in `docker-compose.prod.yml`
2. **Database Tuning**: Modify PostgreSQL configuration
3. **Node.js Optimization**: Set appropriate `NODE_OPTIONS`
4. **Scaling**: Use Docker Swarm or Kubernetes for multiple replicas

## Security Considerations

1. **Change Default Passwords**: Update all default passwords
2. **Environment Variables**: Use Docker secrets for sensitive data
3. **Network Security**: Use custom networks and firewalls
4. **Image Security**: Regularly update base images
5. **File Permissions**: Run containers as non-root users

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker compose exec db pg_dump -U raja prosumeai > backup.sql

# Restore backup
docker compose exec -T db psql -U raja prosumeai < backup.sql
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v prosumeai_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## Development

For development with hot reloading:

1. Use the development override: `./docker-start.sh dev`
2. Source code is mounted as volumes
3. Changes trigger automatic rebuilds
4. Both frontend (Vite) and backend support hot reloading

## Production Deployment

For production:

1. Use production configuration: `./docker-start.sh prod`
2. Database ports are not exposed
3. Resource limits are applied
4. pgAdmin is disabled by default
5. Optimized builds with multi-stage Dockerfile

## Support

For issues with Docker deployment:

1. Check the logs: `./docker-start.sh logs`
2. Verify service status: `./docker-start.sh status`
3. Review this documentation
4. Check Docker and Docker Compose versions
5. Ensure sufficient system resources

---

**Note**: This Docker setup is configured for both development and production use. Make sure to review and adjust security settings, passwords, and resource limits for your specific deployment environment. 