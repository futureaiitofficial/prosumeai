import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigration() {
  console.log('Running migration: Add metadata to payment_transactions table');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '0100_add_metadata_to_payment_transactions.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await db.execute(sql);
    
    console.log('Successfully added metadata column to payment_transactions table');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
} 