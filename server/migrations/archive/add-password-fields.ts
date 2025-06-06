import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration script to add password policy fields to the users table
 */
async function main() {
  console.log('Starting password policy fields migration...');
  
  try {
    // Get database connection string from environment
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('Connecting to database...');
    
    // Create a database connection
    const client = postgres(connectionString);
    const db = drizzle(client);

    // Check if the columns already exist
    const checkColumnQuery = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'last_password_change'
    `);
    
    // If the column doesn't exist, add all the new columns
    if (!checkColumnQuery || checkColumnQuery.length === 0) {
      console.log('Adding password policy fields to users table...');
      
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP,
        ADD COLUMN IF NOT EXISTS password_history JSONB,
        ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP
      `);
      
      console.log('Password policy fields added successfully');
    } else {
      console.log('Password policy fields already exist, skipping');
    }
    
    console.log('Password policy fields migration completed successfully');
    
    // Close the database connection
    await client.end();
  } catch (error) {
    console.error('Error in password policy fields migration:', error);
    throw error;
  }
}

// Run the migration
main()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 