#!/bin/bash

# Ensure we're in the server directory
cd "$(dirname "$0")"

echo "=== Auto-Sync Reset Script ==="
echo "Stopping any running auto-sync process..."

# Stop the process if it's running
./stop-auto-sync.sh

# Wait a moment to ensure everything is cleaned up
sleep 2

echo ""
echo "Starting a new auto-sync process..."

# Start a new process
./start-auto-sync.sh

echo ""
echo "Auto-sync reset completed" 