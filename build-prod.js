#!/usr/bin/env node

/**
 * Production build script for ProsumeAI
 * This script builds both the client and server for production
 */

import { spawn, spawnSync } from 'child_process';
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

console.log('Building ProsumeAI for production...');

// Ensure dist directory exists
const ensureDistDir = spawnSync('node', ['server/utils/ensure-dist-dir.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

if (ensureDistDir.status !== 0) {
  console.error('Failed to ensure dist directory exists');
  process.exit(1);
}

// Build client
console.log('\n=== Building client ===');
const clientBuild = spawnSync('npx', ['vite', 'build', '--config', path.join(__dirname, 'vite.config.ts')], {
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'production'
  },
  stdio: 'inherit'
});

if (clientBuild.status !== 0) {
  console.error('Client build failed');
  process.exit(1);
}

// Build server
console.log('\n=== Building server ===');
// Create a simple index.js in dist that imports and runs the server
const serverEntryContent = `
// Production server entry point
import { createServer } from 'http';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.production') });

// Set NODE_ENV to production explicitly
process.env.NODE_ENV = 'production';
console.log('Starting server in production mode');

// Import server
import '../server/index.js';
`;

fs.writeFileSync(path.join(__dirname, 'dist', 'index.js'), serverEntryContent);
console.log('Created production server entry point');

console.log('\n=== Build completed successfully ===');
console.log('You can now run the application using: npm run start:prod'); 