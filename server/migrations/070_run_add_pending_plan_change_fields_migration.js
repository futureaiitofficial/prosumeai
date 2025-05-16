import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name using ES module pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const migrationName = '0070_add_pending_plan_change_fields.sql';

async function runMigration() {
  console.log(`Starting migration: ${migrationName}`);
  
  // Use environment variables or fallback to default values
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/prosume';
  
  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });
  
  try {
    // Read the SQL file
    const sqlFilePath = join(__dirname, migrationName);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await client.unsafe(sql);
    
    console.log(`Migration complete: ${migrationName}`);
  } catch (error) {
    console.error(`Migration failed: ${migrationName}`, error);
    throw error;
  } finally {
    // Close the postgres client
    await client.end();
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Fatal error in migration script:', error);
  process.exit(1);
}); 