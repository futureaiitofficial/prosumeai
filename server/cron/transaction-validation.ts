/**
 * Transaction validation cron job
 * 
 * This script sets up a scheduled task to validate transactions daily
 * and alert on any currency/amount mismatches.
 */

import { CronJob } from 'cron';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Schedule to run every day at 1:00 AM
const job = new CronJob(
  '0 1 * * *', // Cron pattern: minute hour day-of-month month day-of-week
  function() {
    console.log('Running transaction validation...');
    
    // Path to the validation script
    const scriptPath = path.join(__dirname, '../scripts/validate-transaction-currencies.ts');
    
    // Run the script using tsx
    const validation = spawn('npx', ['tsx', scriptPath]);
    
    validation.stdout.on('data', (data) => {
      console.log(`Validation output: ${data}`);
    });
    
    validation.stderr.on('data', (data) => {
      console.error(`Validation error: ${data}`);
    });
    
    validation.on('close', (code) => {
      console.log(`Validation process exited with code ${code}`);
    });
  },
  null, // onComplete
  true, // start
  'UTC' // timezone
);

console.log('Transaction validation cron job scheduled!');
console.log('Next run:', job.nextDate().toString());

// Export the job for potential use in other modules
export default job; 