import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  console.log('Starting migration: Adding isEnabled to plan_features and making resetFrequency nullable.');

  // Use environment variables or fallback to default values
  const dbUrl = process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/ATScribe';

  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });

  try {
    // Add isEnabled column to plan_features
    await client`ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT FALSE NOT NULL;`;
    console.log('Added isEnabled column to plan_features.');

    // Make resetFrequency nullable
    await client`ALTER TABLE plan_features ALTER COLUMN reset_frequency DROP NOT NULL;`;
    console.log('Made resetFrequency nullable in plan_features.');

    console.log('Migration complete: isEnabled added and resetFrequency made nullable in plan_features.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the postgres client
    await client.end();
  }
}

migrate(); 