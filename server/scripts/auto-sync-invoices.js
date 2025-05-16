#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentDir = process.cwd();

// Configuration
const SYNC_INTERVAL_SECONDS = 900; // 15 minutes
const LOG_DIR = path.join(currentDir, 'logs');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '_').replace('T', '_').split('_').slice(0, 3).join('_');
const LOG_FILE = path.join(LOG_DIR, `auto_sync_${TIMESTAMP}.log`);
const PID_FILE = path.join(currentDir, 'auto_sync.pid');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Write PID file
fs.writeFileSync(PID_FILE, process.pid.toString());

// Set up log file
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

// Logger function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Function to run the sync script
function runSyncScript() {
  log('Starting invoice synchronization...');
  
  const syncScript = path.join(currentDir, 'scripts', 'sync-subscription-invoices.ts');
  log(`Running sync script: ${syncScript}`);
  
  // Use exec instead of spawn, which gives us more flexibility
  const command = `cd ${currentDir} && npx tsx ${syncScript}`;
  log(`Executing command: ${command}`);
  
  exec(command, (error, stdout, stderr) => {
    if (stdout) {
      stdout.split('\n').forEach(line => {
        if (line.trim()) log(`[STDOUT] ${line.trim()}`);
      });
    }
    
    if (stderr) {
      stderr.split('\n').forEach(line => {
        if (line.trim()) log(`[ERROR] ${line.trim()}`);
      });
    }
    
    if (error) {
      log(`[ERROR] Execution failed with code ${error.code}: ${error.message}`);
    } else {
      log('Synchronization completed successfully');
    }
    
    log(`Next sync scheduled in ${SYNC_INTERVAL_SECONDS} seconds`);
  });
}

// Clean up on exit
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down...');
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
  logStream.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down...');
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
  logStream.end();
  process.exit(0);
});

// Initial log
log('=== Razorpay Invoice Auto-Sync Started ===');
log(`Process ID: ${process.pid}`);
log(`Current directory: ${currentDir}`);
log(`Log file: ${LOG_FILE}`);
log(`Sync interval: ${SYNC_INTERVAL_SECONDS} seconds`);

// Run immediately on start
runSyncScript();

// Set up interval
setInterval(runSyncScript, SYNC_INTERVAL_SECONDS * 1000); 