import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the .env file at the project root
config({ path: resolve(process.cwd(), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('Starting migration: Adding fullName column to user_billing_details table');
  
  // Get the database URL from environment variables with fallback
  const dbUrl = process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/ATScribe';
  
  console.log('Using database connection:', dbUrl.replace(/:[^:]*@/, ':****@')); // Hide password in logs
  
  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });
  
  try {
    // Read the SQL file
    const sqlFilePath = join(__dirname, '021_update_user_billing_details_table.sql');
    const sql = readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL migration...');
    
    // Execute the SQL
    await client.unsafe(sql);
    
    console.log('Migration complete: fullName column added to user_billing_details table');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the postgres client
    await client.end();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 