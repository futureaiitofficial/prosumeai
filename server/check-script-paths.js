#!/usr/bin/env node

/**
 * Utility script to check script paths for auto-sync
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory from import.meta
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Different path resolution methods to try
const pathMethods = {
  'process.cwd()': process.cwd(),
  '__dirname': __dirname,
  'path.resolve(__dirname, "..")': path.resolve(__dirname, ".."),
  'Server dir (__dirname)': __dirname,
  'Project root': path.resolve(__dirname, "..")
};

console.log('========== Script Path Checker ==========');
console.log('Checking various path resolution methods:');
console.log('');

// Check each path method
for (const [methodName, resolvedPath] of Object.entries(pathMethods)) {
  console.log(`Method: ${methodName}`);
  console.log(`Resolved Path: ${resolvedPath}`);
  
  // Check important files
  const files = [
    'start-auto-sync.sh',
    'stop-auto-sync.sh',
    'scripts/auto-sync-invoices.js',
    'logs'
  ];
  
  for (const file of files) {
    const fullPath = path.join(resolvedPath, file);
    const exists = fs.existsSync(fullPath);
    console.log(`  - ${file}: ${exists ? 'EXISTS' : 'MISSING'} (${fullPath})`);
  }
  
  console.log('');
}

console.log('Examining node_modules structure:');
const modulePaths = [
  path.join(process.cwd(), 'node_modules'),
  path.join(process.cwd(), '..', 'node_modules')
];

for (const modulePath of modulePaths) {
  console.log(`- ${modulePath}: ${fs.existsSync(modulePath) ? 'EXISTS' : 'MISSING'}`);
}

console.log('');
console.log('Path check complete. Use this information to determine the correct path for your scripts.'); 