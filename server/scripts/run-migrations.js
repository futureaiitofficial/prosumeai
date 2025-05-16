#!/usr/bin/env node

import { execSync } from 'child_process';

// Run the encryption settings migration using ts-node
console.log('Running encryption settings migration...');
try {
  execSync('npx ts-node --esm migrations/add-encryption-settings.ts', {
    stdio: 'inherit'
  });
  console.log('Migration completed successfully.');
  process.exit(0);
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} 