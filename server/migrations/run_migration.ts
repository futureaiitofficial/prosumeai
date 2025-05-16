import { runMigration as migration0010 } from './0010_add_api_keys_table';
import { runMigration as migration0020 } from './0020_add_subscription_tables';
import { runMigration as migration0070 } from './0070_add_pending_plan_change_fields';
import { runMigration as migration0080 } from './0080_add_razorpay_customer_id';
import { runMigration as migration0100 } from './0100_add_password_reset_fields';
import { runMigration as resetUserAuthFields } from './reset-user-auth-fields.js';
import './run-encryption-settings';

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
    
    // Run the pending plan change fields migration
    await migration0070();
    
    // Run the razorpay customer ID migration
    await migration0080();
    
    // Run the payment transactions metadata migration
    try {
      const migration0100Module = await import('./0100_run_add_metadata_to_payment_transactions');
      await migration0100Module.runMigration();
      console.log('Payment transactions metadata migration completed');
    } catch (importError) {
      console.error('Error importing payment transactions metadata migration:', importError);
    }
    
    // Run the password reset fields migration
    await migration0100();
    
    // Run the reset user auth fields migration
    try {
      await resetUserAuthFields();
      console.log('Reset user authentication fields migration completed');
    } catch (error) {
      console.error('Error running reset user auth fields migration:', error);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run all migrations
runAllMigrations(); 