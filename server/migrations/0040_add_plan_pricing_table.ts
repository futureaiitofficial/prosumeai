import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Migration to add plan_pricing table and update subscription_plans
export async function runMigration() {
  console.log('Starting migration: Adding plan_pricing table and updating subscription_plans');
  
  // Use environment variables or fallback to default values
  const dbUrl = process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/ATScribe';
  
  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });
  
  try {
    // Create plan_pricing table
    await client`
      CREATE TABLE IF NOT EXISTS plan_pricing (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        target_region target_region NOT NULL,
        currency currency NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(plan_id, target_region)
      );
    `;
    console.log('plan_pricing table created successfully.');
    
    // Check if currency column exists in subscription_plans
    const currencyCheck = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscription_plans' AND column_name = 'currency';
    `;
    if (currencyCheck.length > 0) {
      await client`
        ALTER TABLE subscription_plans DROP COLUMN currency;
      `;
      console.log('Dropped currency column from subscription_plans.');
    } else {
      console.log('Currency column already dropped from subscription_plans.');
    }
    
    // Check if target_region column exists in subscription_plans
    const regionCheck = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscription_plans' AND column_name = 'target_region';
    `;
    if (regionCheck.length > 0) {
      await client`
        ALTER TABLE subscription_plans DROP COLUMN target_region;
      `;
      console.log('Dropped target_region column from subscription_plans.');
    } else {
      console.log('Target_region column already dropped from subscription_plans.');
    }
    
    console.log('Migration complete: plan_pricing table added and subscription_plans updated.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the postgres client
    await client.end();
  }
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
}); 