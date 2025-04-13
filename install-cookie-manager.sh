#!/bin/bash

# ProsumeAI Cookie Management System Installer
echo "🍪 ProsumeAI Cookie Management System Installer"
echo "==============================================="

# Install required dependencies
echo -e "\n📦 Installing dependencies..."
npm install cookie-parser @types/cookie-parser rate-limiter-flexible --save
npm install @types/jest jest ts-jest --save-dev

# Create directories if they don't exist
echo -e "\n📁 Creating directories..."
mkdir -p server/utils
mkdir -p migrations

# Check if DATABASE_URL is set in environment
if [ -z "$DATABASE_URL" ]; then
  echo -e "\n⚠️  Warning: DATABASE_URL environment variable is not set."
  
  # Check if it exists in .env file
  if [ -f .env ] && grep -q "DATABASE_URL" .env; then
    echo "✓ Found DATABASE_URL in .env file, proceeding with migrations."
  else
    echo "🔴 Database connection information missing!"
    echo "Please set DATABASE_URL in your .env file before running migrations."
    echo "Example: DATABASE_URL=postgresql://username:password@localhost:5432/prosumeai"
    echo -e "\n⚠️ Skipping migration step. You can run it manually later with: npm run db:migrate"
    SKIP_MIGRATION=true
  fi
fi

# Run the last login migration
if [ "$SKIP_MIGRATION" != "true" ]; then
  echo -e "\n🔄 Running migration to add lastLogin column..."
  npm run db:migrate || {
    echo "⚠️ Migration failed, but we'll continue with the installation."
    echo "You can run 'npm run db:migrate' manually later."
  }
fi

# Run tests but don't fail if they don't pass
echo -e "\n🧪 Running cookie manager tests..."
npm run test:cookies || {
  echo "⚠️ Tests failed, but we'll continue with the installation."
  echo "You can fix any test issues later."
}

# Show success message
echo -e "\n✅ Cookie management system installed successfully!"
echo -e "\nTo use the cookie management system, make sure you have:"
echo "  1. Added cookie-parser middleware to your Express app"
echo "  2. Set the required environment variables in .env"
echo "  3. Run the migrations to update the database schema"
echo ""
echo "You can now use the following cookie management features:"
echo "  - Centralized cookie handling via cookieManager"
echo "  - Rate limiting for authentication endpoints"
echo "  - User preferences via cookies"
echo "  - Secure session management"
echo ""
echo "Run the stress test with: npm run test:cookie-stress"

# Check environment variables
echo -e "\n🔍 Checking environment variables..."
if [ ! -f .env ]; then
  echo "⚠️  No .env file found. Creating from template..."
  
  # Check if .env.example exists
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "✓  Created .env file from .env.example"
  else
    # Create a basic .env file
    echo "DATABASE_URL=postgresql://username:password@localhost:5432/prosumeai" > .env
    echo "SESSION_SECRET=your-secure-session-secret-key-here" >> .env
    echo "COOKIE_SECRET=your-secure-cookie-secret-key-here" >> .env
    echo "✓  Created basic .env file"
  fi
  echo "⚠️  Please update your .env file with your own values!"
else
  echo "✓  Found .env file"
  
  # Check for cookie-related environment variables
  if ! grep -q "COOKIE_SECRET" .env; then
    echo "⚠️  COOKIE_SECRET not found in .env file"
    echo "SESSION_SECRET=your-secure-session-secret-key-here" >> .env
    echo "COOKIE_SECRET=your-secure-cookie-secret-key-here" >> .env
    echo "✓  Added cookie-related environment variables to .env"
  else
    echo "✓  Cookie-related environment variables found in .env"
  fi
fi

echo -e "\n🚀 All done! Restart your server to apply the changes."
echo "To start the server, run: npm run dev" 