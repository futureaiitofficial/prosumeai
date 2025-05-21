import 'dotenv/config';
import { scheduleJob } from 'node-schedule';
import { db } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup logging
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'cron.log');
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
};

// Verify database connection
try {
  await db.query.users.findFirst();
  log('Database connection successful');
} catch (error) {
  log(`Database connection error: ${error.message}`);
  process.exit(1);
}

log('Starting cron jobs service...');

// Schedule jobs
try {
  // Process scheduled plan changes daily at 1 AM
  scheduleJob('0 1 * * *', async () => {
    try {
      log('Running scheduled plan changes job');
      const { processScheduledPlanChanges } = await import('../scripts/process-scheduled-plan-changes.js');
      await processScheduledPlanChanges();
      log('Completed scheduled plan changes job');
    } catch (error) {
      log(`Error in scheduled plan changes job: ${error.message}`);
    }
  });

  // Sync subscription invoices every 6 hours
  scheduleJob('0 */6 * * *', async () => {
    try {
      log('Running invoice sync job');
      const { syncSubscriptionInvoices } = await import('../scripts/sync-subscription-invoices.js');
      await syncSubscriptionInvoices();
      log('Completed invoice sync job');
    } catch (error) {
      log(`Error in invoice sync job: ${error.message}`);
    }
  });

  // Session cleanup job - Run daily at 2 AM
  scheduleJob('0 2 * * *', async () => {
    try {
      log('Running session cleanup job');
      const { cleanupExpiredSessions } = await import('../scripts/cleanup-sessions.js');
      await cleanupExpiredSessions();
      log('Completed session cleanup job');
    } catch (error) {
      log(`Error in session cleanup job: ${error.message}`);
    }
  });

  // Transaction currency validation - Run daily at 3 AM
  scheduleJob('0 3 * * *', async () => {
    try {
      log('Running transaction currency validation job');
      // Import dynamically to ensure we get the latest version
      const { validateTransactionCurrencies } = await import('../scripts/validate-transaction-currencies.js');
      await validateTransactionCurrencies();
      log('Completed transaction currency validation job');
    } catch (error) {
      log(`Error in transaction currency validation job: ${error.message}`);
    }
  });

  // Add more scheduled jobs as needed
  
  log('All cron jobs scheduled successfully');
} catch (error) {
  log(`Error scheduling cron jobs: ${error.message}`);
  process.exit(1);
}

// Keep the process running
process.on('SIGINT', () => {
  log('Cron service shutting down');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Cron service terminated');
  process.exit(0);
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  log(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log('Unhandled rejection at:');
  log(promise);
  log(`Reason: ${reason}`);
});

log('Cron service running'); 