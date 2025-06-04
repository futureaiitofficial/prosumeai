-- Initialize ATScribe Database (prosumeai)
-- This file is run automatically when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (this is already handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS prosumeai;

-- Use the prosumeai database
\c prosumeai;

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant necessary permissions to the user
GRANT ALL PRIVILEGES ON DATABASE prosumeai TO raja;
GRANT ALL PRIVILEGES ON SCHEMA public TO raja;

-- Set timezone
SET timezone = 'UTC';

-- Create log entry
DO $$
BEGIN
    RAISE NOTICE 'ATScribe database initialization completed successfully';
END $$; 