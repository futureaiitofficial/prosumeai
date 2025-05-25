#!/usr/bin/env node

/**
 * Run Drizzle Studio properly for database management
 * This script starts Drizzle Studio on a dedicated port
 */

import { spawn } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Drizzle Studio setup...');

// Load environment variables
const envPath = resolve(__dirname, '.env.development');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env.development');
  dotenv.config({ path: envPath });
} else {
  console.log('No .env.development file found, using default environment');
  dotenv.config();
}

// Database connection string
const connectionString = process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/prosumeai';

console.log('Starting Drizzle Studio...');
console.log(`Using database connection: ${connectionString.replace(/\/\/[^:]+:([^@]+)@/, '//***:***@')}`);

// Check if schema file exists
const schemaPath = resolve(__dirname, 'shared', 'schema.ts');
if (!fs.existsSync(schemaPath)) {
  console.error(`Error: Schema file not found at ${schemaPath}`);
  console.log('Checking for alternative schema locations...');
  
  // Look for schema.ts in other potential locations
  const possibleSchemaLocations = [
    resolve(__dirname, 'server', 'schema.ts'),
    resolve(__dirname, 'server', 'models', 'schema.ts'),
    resolve(__dirname, 'server', 'db', 'schema.ts'),
    resolve(__dirname, 'db', 'schema.ts')
  ];
  
  let schemaFound = false;
  for (const path of possibleSchemaLocations) {
    if (fs.existsSync(path)) {
      console.log(`Found schema at: ${path}`);
      schemaFound = true;
      break;
    }
  }
  
  if (!schemaFound) {
    console.error('Error: Could not locate schema.ts file in any expected location');
    console.log('Please run this command from the project root or specify the schema path manually');
    process.exit(1);
  }
}

// Create a temporary config file for Drizzle Studio
const tempConfigContent = `
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: "${connectionString}",
  },
});
`;

const tempConfigPath = resolve(__dirname, 'drizzle-studio-temp.config.ts');
try {
  fs.writeFileSync(tempConfigPath, tempConfigContent);
  console.log(`Created temporary config at: ${tempConfigPath}`);
} catch (err) {
  console.error('Error creating temporary config file:', err);
  process.exit(1);
}

// Run Drizzle Studio using drizzle-kit directly
console.log('Launching Drizzle Studio...');
console.log('Command: npx drizzle-kit studio --port 4001 --verbose --config drizzle-studio-temp.config.ts');

const drizzleProcess = spawn('npx', [
  'drizzle-kit',
  'studio',
  '--port',
  '4001',
  '--verbose',
  '--config',
  tempConfigPath
], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: connectionString
  }
});

// Capture and log stdout
drizzleProcess.stdout.on('data', (data) => {
  console.log(`Drizzle Studio: ${data.toString().trim()}`);
});

// Capture and log stderr
drizzleProcess.stderr.on('data', (data) => {
  console.error(`Drizzle Studio Error: ${data.toString().trim()}`);
});

drizzleProcess.on('error', (error) => {
  console.error('Failed to start Drizzle Studio:', error);
});

drizzleProcess.on('exit', (code, signal) => {
  console.log(`Drizzle Studio exited with code ${code} and signal ${signal}`);
  
  // Clean up the temporary config file
  if (fs.existsSync(tempConfigPath)) {
    fs.unlinkSync(tempConfigPath);
    console.log('Removed temporary config file');
  }
  
  if (code !== 0) {
    console.log('\nTrying alternative approach...');
    console.log('Running with default drizzle.config.ts');
    
    // Try running with the project's existing drizzle.config.ts
    const fallbackProcess = spawn('npx', [
      'drizzle-kit',
      'studio',
      '--port',
      '4001'
    ], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: connectionString
      }
    });
    
    fallbackProcess.on('error', (error) => {
      console.error('Failed to start Drizzle Studio with fallback approach:', error);
    });
  }
});

console.log('\nDrizzle Studio should be available at: http://localhost:4001\n');
console.log('Press Ctrl+C to stop Drizzle Studio');

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down Drizzle Studio...');
  drizzleProcess.kill();
  
  // Clean up the temporary config file
  if (fs.existsSync(tempConfigPath)) {
    fs.unlinkSync(tempConfigPath);
    console.log('Removed temporary config file');
  }
  
  process.exit(0);
}); 