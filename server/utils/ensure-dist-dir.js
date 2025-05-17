#!/usr/bin/env node

/**
 * This script ensures the dist directory exists before building
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const distDir = path.join(rootDir, 'dist');
const serverDistDir = path.join(distDir, 'server');

console.log('Checking for dist directories...');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory...');
  fs.mkdirSync(distDir);
}

// Create server dist directory if it doesn't exist
if (!fs.existsSync(serverDistDir)) {
  console.log('Creating server dist directory...');
  fs.mkdirSync(serverDistDir);
}

console.log('Dist directories verified!'); 