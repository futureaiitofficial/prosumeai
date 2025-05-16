export async function up(db) {
  // Add metadata jsonb column to payment_transactions table
  await db.query(`
    ALTER TABLE payment_transactions 
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
  `);
  
  console.log('Added metadata column to payment_transactions table');
}

export async function down(db) {
  // Remove metadata column if needed to rollback
  await db.query(`
    ALTER TABLE payment_transactions 
    DROP COLUMN IF EXISTS metadata;
  `);
  
  console.log('Removed metadata column from payment_transactions table');
} 