import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name using ES module pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

export async function runMigration() {
  console.log('Starting migration: Adding pending plan change fields to user_subscriptions table');
  
  // Use environment variables or fallback to default values
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/prosume';
  
  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });
  
  try {
    // First, create the plan_change_type enum if it doesn't exist
    await client`
      DO $$ BEGIN
        CREATE TYPE plan_change_type AS ENUM ('UPGRADE', 'DOWNGRADE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    console.log('Created or verified plan_change_type enum');
    
    // Add the pending plan change fields to the user_subscriptions table
    // Check if the columns already exist before adding them
    const pendingPlanChangeToExists = await client`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'pending_plan_change_to'
      );
    `;
    
    if (!pendingPlanChangeToExists[0].exists) {
      await client`
        ALTER TABLE user_subscriptions 
        ADD COLUMN pending_plan_change_to INTEGER REFERENCES subscription_plans(id);
      `;
      console.log('Added pending_plan_change_to column');
    } else {
      console.log('Column pending_plan_change_to already exists, skipping');
    }
    
    const pendingPlanChangeDateExists = await client`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'pending_plan_change_date'
      );
    `;
    
    if (!pendingPlanChangeDateExists[0].exists) {
      await client`
        ALTER TABLE user_subscriptions 
        ADD COLUMN pending_plan_change_date TIMESTAMP;
      `;
      console.log('Added pending_plan_change_date column');
    } else {
      console.log('Column pending_plan_change_date already exists, skipping');
    }
    
    const pendingPlanChangeTypeExists = await client`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'pending_plan_change_type'
      );
    `;
    
    if (!pendingPlanChangeTypeExists[0].exists) {
      await client`
        ALTER TABLE user_subscriptions 
        ADD COLUMN pending_plan_change_type plan_change_type;
      `;
      console.log('Added pending_plan_change_type column');
    } else {
      console.log('Column pending_plan_change_type already exists, skipping');
    }
    
    console.log('Migration complete: Successfully added pending plan change fields to user_subscriptions table');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the postgres client
    await client.end();
  }
} 