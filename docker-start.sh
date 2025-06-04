#!/bin/bash

# ATScribe Docker Startup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  dev         Start in development mode with hot reloading"
    echo "  prod        Start in production mode"
    echo "  build       Build the Docker images"
    echo "  stop        Stop all services"
    echo "  clean       Stop and remove all containers, volumes, and images"
    echo "  logs        Show logs from all services"
    echo "  status      Show status of all services"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Start in development mode"
    echo "  $0 prod     # Start in production mode"
    echo "  $0 clean    # Clean up everything"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to build images
build_images() {
    print_status "Building Docker images..."
    docker compose build --no-cache
    print_success "Docker images built successfully!"
}

# Function to start development environment
start_dev() {
    print_status "Starting ATScribe in development mode..."
    docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
    print_success "Development environment started!"
    print_status "Application will be available at:"
    print_status "  - Frontend: http://localhost:5173"
    print_status "  - Backend: http://localhost:3000"
    print_status "  - Database: Internal only (use pgAdmin to access)"
    print_status "  - pgAdmin: http://localhost:5051 (admin@atscribe.com / admin123)"
    print_warning "Use 'docker compose logs -f' to view logs"
}

# Function to start production environment
start_prod() {
    print_status "Starting ATScribe in production mode..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    print_success "Production environment started!"
    print_status "Application available at: http://localhost:3000"
    print_warning "Database is not exposed in production mode"
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    docker compose down
    print_success "All services stopped!"
}

# Function to clean up everything
clean_all() {
    print_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping and removing all containers..."
        docker compose down -v --remove-orphans
        
        print_status "Removing ATScribe images..."
        docker images | grep atscribe | awk '{print $3}' | xargs -r docker rmi -f
        
        print_status "Removing unused volumes..."
        docker volume prune -f
        
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show logs
show_logs() {
    print_status "Showing logs from all services..."
    docker compose logs -f
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker compose ps
}

# Main script logic
case "${1:-help}" in
    "dev")
        check_docker
        start_dev
        ;;
    "prod")
        check_docker
        start_prod
        ;;
    "build")
        check_docker
        build_images
        ;;
    "stop")
        stop_services
        ;;
    "clean")
        clean_all
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "help"|*)
        show_usage
        ;;
esac 