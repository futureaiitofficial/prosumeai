import { runMigration as migration0010 } from './0010_add_api_keys_table';
import { runMigration as migration0020 } from './0020_add_subscription_tables';

async function runAllMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Run migrations in order
    await migration0010();
    await migration0020();
    
    // Import and run the PayPal support migration dynamically
    try {
      const migration015Module = await import('./015_run_add_paypal_support_migration.js');
      await migration015Module.runMigration();
      console.log('PayPal support migration completed');
    } catch (importError) {
      console.error('Error importing PayPal support migration:', importError);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run all migrations
runAllMigrations(); 