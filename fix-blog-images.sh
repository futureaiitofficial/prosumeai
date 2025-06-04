#!/bin/bash

# Fix Blog Images Script
# This script helps resolve the missing blog images issue

echo "🔧 Blog Images Fix Script"
echo "========================="

# 1. Create uploads directory structure if it doesn't exist
echo "📁 Creating uploads directory structure..."
mkdir -p server/uploads/blog/{featured,images,videos,audio,documents,other}

# 2. Set proper permissions
echo "🔒 Setting proper permissions..."
chmod -R 755 server/uploads/

# 3. Check if uploads directory exists
if [ -d "server/uploads/blog" ]; then
    echo "✅ Uploads directory structure exists"
    
    # Show directory contents
    echo "📂 Current uploads structure:"
    find server/uploads/blog -type d -exec echo "  {}" \;
    
    # Count files in each directory
    echo ""
    echo "📊 File counts:"
    for dir in featured images videos audio documents other; do
        count=$(find server/uploads/blog/$dir -type f 2>/dev/null | wc -l)
        echo "  $dir: $count files"
    done
else
    echo "❌ Failed to create uploads directory"
    exit 1
fi

echo ""
echo "🐳 Docker Volume Mount Status:"
echo "The uploads directory is now mounted as a persistent volume in:"
echo "  - docker-compose.yml (production)"
echo "  - docker-compose.override.yml (development)"

echo ""
echo "📋 Next Steps:"
echo "1. Restart your Docker containers to apply volume mounts:"
echo "   docker compose down && docker compose up -d"
echo ""
echo "2. Or for development mode:"
echo "   ./docker-dev.sh"
echo ""
echo "3. Any new images uploaded will persist across rebuilds"
echo ""
echo "4. If you have existing posts with missing images, you'll need to:"
echo "   - Re-upload the featured images in the admin panel"
echo "   - Or restore from a backup if available"

echo ""
echo "✅ Setup complete! Your blog images will now persist across container rebuilds." 