#!/bin/bash

echo "🔄 Rebuilding Docker container with Puppeteer support..."

# Stop the current containers
echo "📦 Stopping existing containers..."
docker compose down

# Remove the old app image to force rebuild
echo "🗑️  Removing old app image..."
docker rmi atscribe-app 2>/dev/null || echo "No existing image to remove"

# Rebuild and start the containers
echo "🔨 Rebuilding container with Chrome/Chromium support..."
docker compose up --build -d

echo "✅ Container rebuilt successfully!"
echo "📝 The new container includes:"
echo "   - Chrome/Chromium browser for Puppeteer"
echo "   - Proper font support"
echo "   - Docker-optimized Puppeteer configuration"
echo ""
echo "🔍 Check container status:"
echo "   docker compose ps"
echo ""
echo "📋 View logs:"
echo "   docker compose logs -f app" 