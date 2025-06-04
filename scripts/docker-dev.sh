#!/bin/bash

# ProsumeAI Docker Development Setup
# This script sets up the development environment with hot reloading

echo "🚀 Starting ProsumeAI Development Environment with Docker"
echo "This will enable live reloading with volume mounts..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and configure your environment variables."
    exit 1
fi

# Check if .env.development exists, if not create it
if [ ! -f .env.development ]; then
    echo "📝 Creating .env.development file..."
    cp .env .env.development
    echo "NODE_ENV=development" >> .env.development
    echo "CHOKIDAR_USEPOLLING=true" >> .env.development
    echo "VITE_HMR_HOST=0.0.0.0" >> .env.development
    echo "VITE_HMR_PORT=5173" >> .env.development
fi

# Build the development image first
echo "🔨 Building development Docker image..."
docker compose -f docker-compose.yml -f docker-compose.override.yml build app

# Start the services
echo "🌟 Starting development services..."
docker compose -f docker-compose.yml -f docker-compose.override.yml up

echo "🎉 Development environment started!"
echo ""
echo "📍 Access your application at:"
echo "   Frontend (Vite): http://localhost:5173"
echo "   Backend API: http://localhost:3000"
echo "   Database: localhost:5432"
echo "   PgAdmin: http://localhost:5051"
echo ""
echo "✨ Your code changes will be automatically reloaded!"
echo "Press Ctrl+C to stop the development environment." 