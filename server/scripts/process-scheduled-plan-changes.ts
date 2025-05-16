/**
 * Script to process scheduled subscription plan changes
 * 
 * This script runs as a scheduled job to:
 * 1. Process downgrades scheduled for the end of billing cycles
 * 2. Process renewals for active subscriptions
 * 3. Move expired subscriptions to grace period
 * 4. Expire subscriptions that have exceeded grace period
 * 
 * Run with: npm run process-plan-changes
 */

import { db } from '../config/db';
import { SubscriptionService } from '../services/subscription-service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Starting scheduled subscription plan changes processing...');
    console.log('Time:', new Date().toISOString());
    
    // Process all subscription cycle operations
    const results = await SubscriptionService.processSubscriptionCycle();
    
    console.log('Processing completed successfully.');
    console.log('Results:', JSON.stringify(results, null, 2));
    
    // Report summary of operations
    console.log('Summary:');
    console.log(`- Renewals: ${results.renewals.succeeded}/${results.renewals.attempted} succeeded`);
    console.log(`- Grace Periods: ${results.gracePeriods.processed} processed`);
    console.log(`- Expirations: ${results.expirations.processed} processed`);
    console.log(`- Plan Upgrades: ${results.planChanges.upgrades.processed} processed, ${results.planChanges.upgrades.failed} failed`);
    console.log(`- Plan Downgrades: ${results.planChanges.downgrades.processed} processed, ${results.planChanges.downgrades.failed} failed`);
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('Error processing scheduled plan changes:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error in process-scheduled-plan-changes script:', error);
  process.exit(1);
}); 