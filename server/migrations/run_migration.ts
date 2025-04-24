import { runMigration as migration0010 } from './0010_add_api_keys_table';
import { runMigration as migration0020 } from './0020_add_subscription_tables';

async function runAllMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Run migrations in order
    await migration0010();
    await migration0020();
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run all migrations
runAllMigrations(); 