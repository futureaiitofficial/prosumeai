#!/bin/bash

# Ensure we're in the server directory
cd "$(dirname "$0")"

# Check if PID file exists
if [ ! -f "auto_sync.pid" ]; then
  echo "Auto-sync is not running (no PID file found)"
  exit 0
fi

# Get the process ID
pid=$(cat auto_sync.pid)

# Check if process is running
if ! ps -p $pid > /dev/null; then
  echo "Process is not running, removing stale PID file"
  rm auto_sync.pid
  exit 0
fi

# Send SIGTERM to allow graceful shutdown
echo "Stopping auto-sync process with PID $pid..."
kill -SIGTERM $pid

# Wait for process to terminate
MAX_WAIT=10
counter=0
while ps -p $pid > /dev/null && [ $counter -lt $MAX_WAIT ]; do
  echo "Waiting for process to terminate..."
  sleep 1
  counter=$((counter + 1))
done

# Check if process is still running
if ps -p $pid > /dev/null; then
  echo "Process did not terminate gracefully, forcing shutdown..."
  kill -9 $pid
  sleep 1
fi

# Remove PID file if it still exists
if [ -f "auto_sync.pid" ]; then
  rm auto_sync.pid
fi

echo "Auto-sync process stopped successfully"
exit 0 