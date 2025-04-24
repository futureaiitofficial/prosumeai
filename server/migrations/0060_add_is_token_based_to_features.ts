import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  console.log('Starting migration: Adding isTokenBased to features.');

  // Use environment variables or fallback to default values
  const dbUrl = process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/prosumeai';

  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });

  try {
    // Add isTokenBased column to features
    await client`ALTER TABLE features ADD COLUMN IF NOT EXISTS is_token_based BOOLEAN DEFAULT FALSE NOT NULL;`;    
    console.log('Added isTokenBased column to features.');

    console.log('Migration complete: isTokenBased added to features.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the postgres client
    await client.end();
  }
}

migrate(); 