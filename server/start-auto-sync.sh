#!/bin/bash

# Ensure we're in the server directory
cd "$(dirname "$0")"

# Ensure the scripts have execution permissions
chmod +x start-auto-sync.sh
chmod +x stop-auto-sync.sh
chmod +x reset-auto-sync.sh

# Check if the process is already running
if [ -f "auto_sync.pid" ]; then
  pid=$(cat auto_sync.pid)
  if ps -p $pid > /dev/null; then
    echo "Auto-sync is already running with PID $pid"
    exit 1
  else
    echo "Removing stale PID file"
    rm auto_sync.pid
  fi
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Create a temporary log file for startup debugging
TEMP_LOG="logs/startup_$(date +%Y%m%d_%H%M%S).log"
echo "Creating temporary startup log: $TEMP_LOG"

# Find the Node.js executable
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
  # If not found in PATH, try common locations
  for path in "/usr/local/bin/node" "/usr/bin/node" "$HOME/.nvm/versions/node/*/bin/node"; do
    if [ -x "$path" ]; then
      NODE_PATH=$path
      break
    fi
  done
fi

if [ -z "$NODE_PATH" ]; then
  echo "ERROR: Could not find Node.js executable. Please ensure Node.js is installed."
  exit 1
fi

echo "Using Node.js at: $NODE_PATH"

# Start the auto-sync script in the background using nohup to survive terminal closing
echo "Starting auto-sync for Razorpay subscription invoices..."
nohup "$NODE_PATH" scripts/auto-sync-invoices.js > "$TEMP_LOG" 2>&1 &

# Wait a moment to ensure the process creates its own PID file
sleep 2

# Check if process started successfully
if [ -f "auto_sync.pid" ]; then
  pid=$(cat auto_sync.pid)
  echo "Auto-sync started with PID $pid"
  echo "Logs are being written to the logs directory"
  exit 0
else
  echo "Failed to start auto-sync process"
  echo "Startup log contents (for debugging):"
  echo "----------------------------------------"
  cat "$TEMP_LOG"
  echo "----------------------------------------"
  echo "Check the above startup log for errors"
  exit 1
fi 