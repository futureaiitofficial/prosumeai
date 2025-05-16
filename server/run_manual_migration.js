import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connection details from environment variable or hardcoded for development
const connectionString = process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/prosumeai';

// Create a new pool instance
const pool = new Pool({
  connectionString,
});

async function runMigration() {
  try {
    console.log('Running migration: Add metadata to payment_transactions table');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', '0100_add_metadata_to_payment_transactions.sql');
    console.log(`Reading SQL file: ${sqlFilePath}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('SQL to execute:');
    console.log(sql);
    
    // Connect to the database
    const client = await pool.connect();
    try {
      // Execute the SQL
      await client.query(sql);
      console.log('Successfully added metadata column to payment_transactions table');
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // End the pool
    await pool.end();
  }
}

// Run the migration
runMigration(); 