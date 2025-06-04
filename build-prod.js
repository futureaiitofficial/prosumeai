#!/usr/bin/env node

/**
 * Production build script for ProsumeAI
 * This script builds both the client and server for production deployment
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building ProsumeAI for production...');

// Ensure dist directories exist
const distDir = path.join(__dirname, 'dist');
const clientDistDir = path.join(distDir, 'client');
const serverDistDir = path.join(distDir, 'server');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

async function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`📦 ${description}...`);
    
    const child = spawn(command, args, {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ ${description} error:`, error);
      reject(error);
    });
  });
}

async function build() {
  try {
    // Step 1: Build client (Vite build)
    await runCommand('npm', ['run', 'build:client'], 'Building client application');

    // Step 2: Build server (TypeScript compilation)  
    await runCommand('npm', ['run', 'build:server'], 'Building server application');

    // Step 3: Ensure dist directory structure
    await runCommand('npm', ['run', 'build:ensure-dist'], 'Ensuring dist directory structure');

    console.log('🎉 Production build completed successfully!');
    console.log('📁 Built files are in the dist/ directory');
    console.log('🔧 Run "npm run start:prod" to start the production server');

  } catch (error) {
    console.error('💥 Build failed:', error.message);
    process.exit(1);
  }
}

build(); 