// Simple script to add password reset fields to users table
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting database schema update for password reset fields...');
  
  // Use default connection if DATABASE_URL is not set
  const connectionString = process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/prosumeai';
  
  console.log(`Connecting to database at ${connectionString.replace(/\/\/[^:]+:([^@]+)@/, '//***:***@')}`);
  
  // Create database connection
  const sql = postgres(connectionString);
  
  try {
    // Check if reset_password_token column already exists
    const tokenExists = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'reset_password_token'
      )
    `;
    
    if (!tokenExists[0].exists) {
      console.log('Adding reset_password_token column to users table...');
      await sql`ALTER TABLE users ADD COLUMN reset_password_token TEXT`;
      console.log('Successfully added reset_password_token column');
    } else {
      console.log('reset_password_token column already exists');
    }
    
    // Check if reset_password_expiry column already exists
    const expiryExists = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'reset_password_expiry'
      )
    `;
    
    if (!expiryExists[0].exists) {
      console.log('Adding reset_password_expiry column to users table...');
      await sql`ALTER TABLE users ADD COLUMN reset_password_expiry TIMESTAMP`;
      console.log('Successfully added reset_password_expiry column');
    } else {
      console.log('reset_password_expiry column already exists');
    }
    
    console.log('Database schema update completed successfully');
  } catch (error) {
    console.error('Schema update failed:', error);
  } finally {
    await sql.end();
  }
}

main().catch(console.error); 