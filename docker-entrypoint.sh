#!/bin/bash
set -e

echo "Starting ATScribe application..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
    echo "Database is not ready yet, waiting..."
    sleep 2
done
echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
npm run db:migrate || echo "Migration failed or no migrations to run"

# Start the application
echo "Starting the application..."
exec "$@" 