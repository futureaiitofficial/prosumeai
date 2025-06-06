import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// First try to load from .env.local, if not found, fallback to .env
try {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
} catch (error) {
  console.log('No .env.local file found, falling back to .env');
}

// Default fallback
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Use the correct database URL as provided by the user
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/prosumeai';

export async function runMigration() {
  console.log('Running migration: Add razorpayCustomerId to users table');
  console.log(`Using database URL: ${DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);
  
  // For migrations, don't use the queryResult from postgres
  const migrationClient = postgres(DATABASE_URL, { max: 1 });
  
  try {
    // Execute the raw SQL to add the column
    await migrationClient`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;
    `;
    
    console.log('Successfully added razorpay_customer_id column to users table');
    
    // Update existing users that have subscriptions but no razorpayCustomerId
    await migrationClient`
      WITH subscription_data AS (
        SELECT DISTINCT 
          us.user_id, 
          pwe.raw_data->>'customer_id' as razorpay_customer_id
        FROM user_subscriptions us
        JOIN payment_webhook_events pwe ON 
          pwe.raw_data::text LIKE '%' || us.payment_reference || '%'
        WHERE 
          us.payment_gateway = 'RAZORPAY'
          AND pwe.raw_data->>'customer_id' IS NOT NULL
      )
      UPDATE users u
      SET razorpay_customer_id = sd.razorpay_customer_id
      FROM subscription_data sd
      WHERE 
        u.id = sd.user_id
        AND u.razorpay_customer_id IS NULL;
    `;
    
    console.log('Updated existing users with Razorpay customer IDs where possible');
    
    return { success: true };
  } catch (error) {
    console.error('Error in 0080_add_razorpay_customer_id migration:', error);
    return { success: false, error };
  } finally {
    await migrationClient.end();
  }
}

// Run the migration if this file is being executed directly (not imported)
// In ESM, we check if import.meta.url is the same as process.argv[1]
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then((result) => {
      if (result.success) {
        console.log('Migration completed successfully');
        process.exit(0);
      } else {
        console.error('Migration failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Error running migration:', error);
      process.exit(1);
    });
} 