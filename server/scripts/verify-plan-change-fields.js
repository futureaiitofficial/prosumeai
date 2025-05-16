import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name using ES module pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function verifyPlanChangeFields() {
  console.log('Verifying pending plan change fields in user_subscriptions table');
  
  // Use environment variables or fallback to default values
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/prosume';
  
  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });
  
  try {
    // Check if enum type exists
    const enumExists = await client`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'plan_change_type'
      );
    `;
    
    console.log(`Plan change type enum exists: ${enumExists[0].exists}`);
    
    // Check enum values
    if (enumExists[0].exists) {
      const enumValues = await client`
        SELECT e.enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'plan_change_type'
        ORDER BY e.enumsortorder;
      `;
      
      console.log('Plan change type enum values:');
      enumValues.forEach(val => console.log(`- ${val.enumlabel}`));
    }
    
    // Check if columns exist in user_subscriptions table - individually
    const pendingPlanChangeToExists = await client`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'pending_plan_change_to'
      );
    `;
    
    const pendingPlanChangeDateExists = await client`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'pending_plan_change_date'
      );
    `;
    
    const pendingPlanChangeTypeExists = await client`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'pending_plan_change_type'
      );
    `;
    
    console.log('\nColumn existence in user_subscriptions table:');
    console.log(`- pending_plan_change_to column exists: ${pendingPlanChangeToExists[0].exists}`);
    console.log(`- pending_plan_change_date column exists: ${pendingPlanChangeDateExists[0].exists}`);
    console.log(`- pending_plan_change_type column exists: ${pendingPlanChangeTypeExists[0].exists}`);
    
    // Check column data types
    const columnTypes = await client`
      SELECT 
        column_name, 
        data_type, 
        udt_name
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
      AND column_name IN ('pending_plan_change_to', 'pending_plan_change_date', 'pending_plan_change_type');
    `;
    
    console.log('\nColumn data types in user_subscriptions table:');
    columnTypes.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    });
    
    console.log('\nVerification complete!');
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  } finally {
    // Close the postgres client
    await client.end();
  }
}

// Run the verification
verifyPlanChangeFields().catch(error => {
  console.error('Fatal error during verification:', error);
  process.exit(1);
}); 