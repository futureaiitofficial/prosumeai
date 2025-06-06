import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('Starting migration: Adding payment gateway tables');
  
  // Use environment variables or fallback to default values
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ATScribe';
  
  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });
  
  try {
    // Read the SQL file
    const sqlFilePath = join(__dirname, '013_create_payment_gateway_tables.sql');
    const sql = readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await client.unsafe(sql);
    
    console.log('Migration complete: Payment gateway tables created successfully');
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