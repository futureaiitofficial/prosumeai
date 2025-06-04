# Docker Development with Hot Reloading 🔥

This guide explains how to set up ProsumeAI for development using Docker with live reloading, so you don't need to rebuild containers every time you make changes.

## Quick Start

The fastest way to get started with development hot reloading:

```bash
./docker-dev.sh
```

This script will:
- Check your environment setup
- Build the development Docker image
- Start all services with volume mounts for hot reloading
- Display access URLs

## Manual Setup

If you prefer to run commands manually:

```bash
# Build the development image
docker compose -f docker-compose.yml -f docker-compose.override.yml build app

# Start development services
docker compose -f docker-compose.yml -f docker-compose.override.yml up
```

## What's Different in Development Mode

### Volume Mounts
Your source code is mounted as volumes into the container:
- `./client` → `/app/client` (React/Vite frontend)
- `./server` → `/app/server` (Node.js backend)
- `./shared` → `/app/shared` (Shared types/utilities)
- `./public` → `/app/public` (Static assets)

### Hot Reloading Configuration
- **Frontend**: Vite dev server with HMR (Hot Module Replacement)
- **Backend**: tsx watch mode for automatic server restarts
- **File Watching**: Polling enabled for Docker volume mounts
- **Network**: Services bound to `0.0.0.0` for container access

### Environment Variables
Development-specific environment variables are automatically set:
- `NODE_ENV=development`
- `CHOKIDAR_USEPOLLING=true` (enables file watching in Docker)
- `VITE_HMR_HOST=0.0.0.0` (allows HMR in Docker)
- `VITE_HMR_PORT=5173` (Vite dev server port)

## Access Points

When running in development mode:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Vite dev server with HMR |
| Backend API | http://localhost:3000 | Express server with auto-restart |
| Database | localhost:5432 | PostgreSQL database |
| PgAdmin | http://localhost:5051 | Database administration |

## File Structure

```
ProsumeAI/
├── docker-compose.yml              # Production configuration
├── docker-compose.override.yml     # Development overrides
├── Dockerfile                      # Production Dockerfile
├── Dockerfile.dev                  # Development Dockerfile
├── start-dev-docker.js            # Docker development script
├── docker-dev.sh                  # Quick start script
└── ...
```

## How It Works

### Development Dockerfile (`Dockerfile.dev`)
- Optimized for development with additional tools
- Installs dependencies but doesn't copy source code
- Source code is mounted as volumes at runtime

### Docker Compose Override (`docker-compose.override.yml`)
- Automatically included when running `docker compose up`
- Mounts source code directories as volumes
- Configures development environment variables
- Enables file watching and hot reloading

### Development Script (`start-dev-docker.js`)
- Starts both frontend and backend concurrently
- Configures proper environment for Docker
- Handles graceful shutdown
- Enables polling for file changes

## Performance Optimization

### Node Modules
The `node_modules` directory is excluded from volume mounts to avoid performance issues:
```yaml
volumes:
  - ./client:/app/client
  - ./server:/app/server
  - /app/node_modules  # This overrides the mount
```

### File Watching
Polling is enabled for reliable file watching in Docker:
```javascript
CHOKIDAR_USEPOLLING: true
```

## Troubleshooting

### Changes Not Reflecting
1. **Check if services are running**: `docker compose ps`
2. **Verify volume mounts**: `docker compose logs app`
3. **Restart if needed**: `docker compose restart app`

### Port Conflicts
If ports 3000 or 5173 are in use:
1. Stop other services using these ports
2. Or modify ports in `docker-compose.override.yml`

### Slow Performance
1. **Ensure node_modules is excluded** from volume mounts
2. **Check Docker resources** (CPU/Memory allocation)
3. **Use Docker Desktop's new file sharing** if on macOS

### Environment Issues
1. **Check .env files exist**: `.env` and `.env.development`
2. **Verify database connection**: Check DATABASE_URL in logs
3. **Reset environment**: `docker compose down -v && docker compose up`

## Comparison: Before vs After

### Before (Rebuild Required)
```bash
# Make code changes
# Rebuild container (slow)
docker compose build app
# Restart services
docker compose up
```

### After (Instant Updates)
```bash
# Make code changes
# Changes automatically reflected (fast)
# No rebuild needed! 🎉
```

## Additional Commands

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
```

### Rebuild Development Image
```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml build --no-cache app
```

### Clean Start
```bash
# Stop and remove containers
docker compose down

# Remove volumes (careful: this removes database data)
docker compose down -v

# Start fresh
docker compose up --build
```

### Database Management
```bash
# Access database directly
docker compose exec db psql -U raja -d prosumeai

# Run migrations
docker compose exec app npm run db:migrate
```

## Production vs Development

| Aspect | Production | Development |
|--------|------------|-------------|
| Build | Source code copied | Source code mounted |
| Restarts | Manual | Automatic |
| File watching | Disabled | Enabled |
| Hot reloading | No | Yes |
| Performance | Optimized | Debug-friendly |
| Image size | Smaller | Larger (dev tools) |

## Tips for Development

1. **Keep containers running** - don't stop/start frequently
2. **Use Docker Desktop** for better file system performance
3. **Monitor resource usage** with `docker stats`
4. **Use .dockerignore** to exclude unnecessary files
5. **Regular cleanup** with `docker system prune`

---

Happy coding! 🚀 Your changes will now be reflected instantly without rebuilding containers. 