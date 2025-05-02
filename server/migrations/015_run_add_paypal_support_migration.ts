import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export async function runMigration(): Promise<void> {
  console.log('Starting migration: Adding PayPal support');
  
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ATScribe';
  const client = postgres(dbUrl, { max: 1 });
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '015_add_paypal_support.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await client.unsafe(sql);
    
    console.log('Migration complete: PayPal support added successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the postgres client
    await client.end();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} 