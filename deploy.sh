#!/bin/bash

# ProsumeAI Production Deployment Script
# This script handles the deployment process for ProsumeAI in a production environment

# Exit on any error
set -e

echo "Starting ProsumeAI deployment..."

# Update repository
if [ -d ".git" ]; then
  echo "Updating from git repository..."
  git pull
else
  echo "Not a git repository, skipping update"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build:client
npm run build:server:force

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p logs
mkdir -p public
mkdir -p server/logs

# Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
  echo "PM2 not found, installing globally..."
  npm install -g pm2
fi

# Setup environment variables if .env file doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "Please update the .env file with your configuration values."
  else
    echo "ERROR: .env.example file not found! Please create a .env file manually."
    exit 1
  fi
fi

# Skip migrations for now, will need to run manually
echo "Skipping database migrations - please run them manually if needed"

# Start or reload the application using PM2
if pm2 list | grep -q "prosumeai-server"; then
  echo "Reloading existing PM2 service..."
  NODE_ENV=production pm2 reload ecosystem.config.cjs
else
  echo "Starting new PM2 service..."
  NODE_ENV=production pm2 start ecosystem.config.cjs --node-args="--experimental-specifier-resolution=node --es-module-specifier-resolution=node"
fi

# Setup PM2 to start on system boot (requires sudo)
if [ "$(id -u)" = "0" ]; then
  echo "Setting up PM2 to start on system boot..."
  pm2 startup
  pm2 save
else
  echo "Note: Run 'sudo pm2 startup' and 'pm2 save' to enable PM2 to start on system boot."
fi

echo "Deployment completed successfully!" 