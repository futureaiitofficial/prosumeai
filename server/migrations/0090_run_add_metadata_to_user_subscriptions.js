/**
 * Migration runner for adding metadata column to user_subscriptions table
 */

// Import the migration module
import { runMigration } from './0090_add_metadata_to_user_subscriptions.ts';

/**
 * Execute the migration
 */
async function execute() {
  console.log('Running migration: Add metadata column to user_subscriptions');
  
  try {
    // Run the migration
    await runMigration();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
execute(); 