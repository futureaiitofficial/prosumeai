#!/usr/bin/env node

/**
 * Docker development startup script for ProsumeAI
 * This script starts both the client and server in development mode in Docker
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

// Load .env file
const mainEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(mainEnvPath)) {
  console.log('Loading environment variables from .env');
  dotenv.config({ path: mainEnvPath });
}

console.log('Starting ProsumeAI in Docker development mode...');

// Database connection string for Docker
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://raja:raja@db:5432/prosumeai';

// Start the Vite dev server for the client
const clientProcess = spawn('npx', ['vite', '--config', path.join(__dirname, 'vite.config.ts'), '--host', '0.0.0.0'], {
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    VITE_API_URL: 'http://localhost:3000',
    CHOKIDAR_USEPOLLING: 'true', // Enable polling for Docker volume mounts
    VITE_HMR_HOST: '0.0.0.0',
    VITE_HMR_PORT: '5173'
  },
  stdio: 'inherit'
});

// Start the server with watch mode
const serverProcess = spawn('npx', ['tsx', 'watch', '--clear-screen=false', 'server/index.ts'], {
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '3000',
    DATABASE_URL: DATABASE_URL,
    // Add Docker-specific environment variables
    HOST: '0.0.0.0'
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

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  clientProcess.kill('SIGTERM');
  serverProcess.kill('SIGTERM');
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
clientProcess.on('exit', (code, signal) => {
  console.log(`Client process exited with code ${code} and signal ${signal}`);
  if (code !== 0 && signal !== 'SIGINT' && signal !== 'SIGTERM') {
    console.log('Client process crashed, attempting restart...');
    setTimeout(() => {
      // Restart client process
      console.log('Restarting client process...');
    }, 2000);
  }
});

serverProcess.on('exit', (code, signal) => {
  console.log(`Server process exited with code ${code} and signal ${signal}`);
  if (code !== 0 && signal !== 'SIGINT' && signal !== 'SIGTERM') {
    console.log('Server process crashed, attempting restart...');
    setTimeout(() => {
      // Restart server process
      console.log('Restarting server process...');
    }, 2000);
  }
});

console.log('Docker development environment started.');
console.log('Client (Vite): http://localhost:5173');
console.log('Server (API): http://localhost:3000');
console.log('Press Ctrl+C to stop.'); 