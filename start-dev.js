#!/usr/bin/env node

/**
 * Developer startup script for ProsumeAI
 * This script starts both the client and server in development mode
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.development if it exists
const envPath = path.join(__dirname, '.env.development');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env.development');
  dotenv.config({ path: envPath });
}

console.log('Starting ProsumeAI in development mode...');

// Start the Vite dev server for the client
const clientProcess = spawn('npx', ['vite', '--config', path.join(__dirname, 'vite.config.ts')], {
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    VITE_API_URL: 'http://localhost:4000'
  },
  stdio: 'inherit'
});

// Start the server
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/prosumeai'
  },
  stdio: 'inherit'
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down development servers...');
  clientProcess.kill('SIGINT');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

// Log any errors
clientProcess.on('error', (error) => {
  console.error('Client process error:', error);
});

serverProcess.on('error', (error) => {
  console.error('Server process error:', error);
});

// Handle process exit
clientProcess.on('exit', (code) => {
  console.log(`Client process exited with code ${code}`);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
});

console.log('Development environment started. Press Ctrl+C to stop.'); 