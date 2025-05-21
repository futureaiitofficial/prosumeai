import pg from 'pg';
const { Pool } = pg;
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/node-postgres';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file for local development
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Run the migration to add reference fields to the invoices table
 */
async function runMigration() {
  console.log('Starting migration to add reference fields to invoices table...');
  
  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  
  const db = drizzle(pool);
  
  try {
    // Check if columns already exist before adding them
    const checkResult = await pool.query(`
      SELECT 
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subscription_id') as has_subscription_id,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subscription_plan') as has_subscription_plan,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'next_payment_date') as has_next_payment_date,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'gateway_transaction_id') as has_gateway_transaction_id,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'razorpay_payment_id') as has_razorpay_payment_id
    `);
    
    // Properly type the result
    const checks = {
      has_subscription_id: checkResult.rows[0].has_subscription_id === true,
      has_subscription_plan: checkResult.rows[0].has_subscription_plan === true,
      has_next_payment_date: checkResult.rows[0].has_next_payment_date === true,
      has_gateway_transaction_id: checkResult.rows[0].has_gateway_transaction_id === true,
      has_razorpay_payment_id: checkResult.rows[0].has_razorpay_payment_id === true
    };
    
    // Start transaction for the migration
    await db.execute(sql`BEGIN`);
    
    // Add subscription_id column if it doesn't exist
    if (!checks.has_subscription_id) {
      console.log('Adding subscription_id column to invoices table...');
      await db.execute(sql`
        ALTER TABLE invoices
        ADD COLUMN subscription_id INTEGER REFERENCES user_subscriptions(id)
      `);
    }
    
    // Add subscription_plan column if it doesn't exist
    if (!checks.has_subscription_plan) {
      console.log('Adding subscription_plan column to invoices table...');
      await db.execute(sql`
        ALTER TABLE invoices
        ADD COLUMN subscription_plan TEXT
      `);
    }
    
    // Add next_payment_date column if it doesn't exist
    if (!checks.has_next_payment_date) {
      console.log('Adding next_payment_date column to invoices table...');
      await db.execute(sql`
        ALTER TABLE invoices
        ADD COLUMN next_payment_date TIMESTAMP
      `);
    }
    
    // Add gateway_transaction_id column if it doesn't exist
    if (!checks.has_gateway_transaction_id) {
      console.log('Adding gateway_transaction_id column to invoices table...');
      await db.execute(sql`
        ALTER TABLE invoices
        ADD COLUMN gateway_transaction_id TEXT
      `);
    }
    
    // Add razorpay_payment_id column if it doesn't exist
    if (!checks.has_razorpay_payment_id) {
      console.log('Adding razorpay_payment_id column to invoices table...');
      await db.execute(sql`
        ALTER TABLE invoices
        ADD COLUMN razorpay_payment_id TEXT
      `);
    }
    
    // Commit the transaction
    await db.execute(sql`COMMIT`);
    
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK`);
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the connection
    await pool.end();
  }
}

// Run the migration if this file is being executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default runMigration; 