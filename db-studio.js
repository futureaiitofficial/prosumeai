#!/usr/bin/env node

/**
 * Simple script to run Drizzle Studio
 */

console.log('Starting Drizzle Studio...');
console.log('This will use your existing drizzle.config.ts file');

// Just pass through to drizzle-kit studio
import { execSync } from 'child_process';

try {
  // First, set DATABASE_URL in the environment if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgres://raja:raja@localhost:5432/prosumeai';
    console.log(`Set DATABASE_URL to: ${process.env.DATABASE_URL.replace(/\/\/[^:]+:([^@]+)@/, '//***:***@')}`);
  }

  // Run drizzle-kit studio with the environment variable
  console.log('Running: npx drizzle-kit studio --port 4001');
  
  // Execute the command and show output
  execSync('npx drizzle-kit studio --port 4001', { 
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('Error running Drizzle Studio:', error.message);
  process.exit(1);
} 