#!/bin/bash

# ProsumeAI Upgrade Script
echo "🚀 Starting ProsumeAI upgrade process..."

# Load environment variables from .env
if [ -f .env ]; then
  echo "🟢 Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
else
  echo "⚠️  Warning: .env file not found. DATABASE_URL may be missing."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if DATABASE_URL is set in environment
if [ -z "$DATABASE_URL" ]; then
  echo "🔴 DATABASE_URL environment variable is not set."

  # Check if it exists in .env file
  if grep -q "DATABASE_URL" .env; then
    echo "✓ Found DATABASE_URL in .env file, attempting to use it."
  else
    echo "🔴 Database connection information missing!"
    echo "Please set DATABASE_URL in your .env file before running migrations."
    echo "Example: DATABASE_URL=postgresql://username:password@localhost:5432/prosumeai"
    
    # Ask if we should continue without running migrations
    read -p "Continue without running migrations? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Upgrade aborted. Please set up your database connection and try again."
      exit 1
    fi
  fi
fi

# Run migrations to update database schema
echo "🔄 Running database migrations..."
npm run db:migrate || {
  echo "⚠️  Migration failed, but we'll continue with the upgrade process."
  echo "You can run 'npm run db:migrate' manually later."
}

# Deploy updated app
echo "🚀 Starting application with new architecture..."
npm run dev
