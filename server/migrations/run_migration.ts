import { runMigration as migration0010 } from './0010_add_api_keys_table';

async function runAllMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Run migrations in order
    await migration0010();
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run all migrations
runAllMigrations(); 