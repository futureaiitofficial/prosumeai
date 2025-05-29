#!/usr/bin/env node

/**
 * Production startup script for ProsumeAI
 * This script starts the server in production mode
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.production if it exists
const envPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env.production');
  dotenv.config({ path: envPath });
} else {
  // Fall back to regular .env
  console.log('No .env.production found. Using .env file if available');
  dotenv.config();
}

console.log('Starting ProsumeAI in production mode...');

// Set NODE_ENV to production explicitly
process.env.NODE_ENV = 'production';

// Ensure necessary environment variables are set
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set! Using default connection string.');
  process.env.DATABASE_URL = 'postgres://raja:raja@localhost:5432/prosumeai';
}

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET not set! Using default secret (not recommended for production)');
  process.env.SESSION_SECRET = '5021472849459a3e98f7fde1f6221f5593e5f9b8970c4470304c289e523e4669';
}

// Start the server using tsx to handle TypeScript files directly
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'production'
  },
  stdio: 'inherit'
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down production server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

// Log any errors
serverProcess.on('error', (error) => {
  console.error('Server process error:', error);
});

// Handle process exit
serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  
  if (code !== 0) {
    console.error('Server crashed! Attempting restart in 5 seconds...');
    setTimeout(() => {
      console.log('Restarting server...');
      process.exit(1); // Exit with error code so systemd/pm2 can restart
    }, 5000);
  }
});

console.log('Production server started. Press Ctrl+C to stop.'); 