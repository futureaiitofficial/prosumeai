#!/bin/bash

# atScribe Docker Development Commands
# Helper script for common development tasks

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.override.yml"

show_help() {
    echo "🚀 atScribe Docker Development Commands"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start development environment with hot reloading"
    echo "  stop        Stop all services"
    echo "  restart     Restart the app service"
    echo "  build       Rebuild the development image"
    echo "  logs        Show logs from all services"
    echo "  logs-app    Show logs from app service only"
    echo "  shell       Open a shell in the app container"
    echo "  db-shell    Open PostgreSQL shell"
    echo "  clean       Stop and remove all containers and volumes"
    echo "  status      Show status of all services"
    echo "  migrate     Run database migrations"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start        # Start development environment"
    echo "  $0 logs-app     # Follow app logs"
    echo "  $0 shell        # Open shell in container"
}

case "$1" in
    start)
        echo "🌟 Starting development environment..."
        docker compose $COMPOSE_FILES up --build
        ;;
    
    stop)
        echo "🛑 Stopping all services..."
        docker compose $COMPOSE_FILES down
        ;;
    
    restart)
        echo "🔄 Restarting app service..."
        docker compose $COMPOSE_FILES restart app
        ;;
    
    build)
        echo "🔨 Rebuilding development image..."
        docker compose $COMPOSE_FILES build --no-cache app
        ;;
    
    logs)
        echo "📋 Showing logs from all services..."
        docker compose $COMPOSE_FILES logs -f
        ;;
    
    logs-app)
        echo "📋 Showing app logs..."
        docker compose $COMPOSE_FILES logs -f app
        ;;
    
    shell)
        echo "🐚 Opening shell in app container..."
        docker compose $COMPOSE_FILES exec app /bin/bash
        ;;
    
    db-shell)
        echo "🗄️ Opening PostgreSQL shell..."
        docker compose $COMPOSE_FILES exec db psql -U ${POSTGRES_USER:-raja} -d ${POSTGRES_DB:-prosumeai}
        ;;
    
    clean)
        echo "🧹 Cleaning up containers and volumes..."
        echo "⚠️  This will remove all data including database!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker compose $COMPOSE_FILES down -v
            docker system prune -f
            echo "✅ Cleanup complete!"
        else
            echo "❌ Cleanup cancelled."
        fi
        ;;
    
    status)
        echo "📊 Service status:"
        docker compose $COMPOSE_FILES ps
        ;;
    
    migrate)
        echo "🔄 Running database migrations..."
        docker compose $COMPOSE_FILES exec app npm run db:migrate
        ;;
    
    help|--help|-h)
        show_help
        ;;
    
    "")
        echo "❌ No command specified."
        echo ""
        show_help
        ;;
    
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 