import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../../shared/schema';
import dotenv from 'dotenv';

dotenv.config();

export async function runMigration() {
  console.log('Starting migration: Adding API keys table');
  
  // Use environment variables or fallback to default values
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ATScribe';
  
  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });
  
  // Create a drizzle instance
  const db = drizzle(client, { schema });
  
  try {
    // Create the api_keys table if it doesn't exist
    await client`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        service TEXT NOT NULL DEFAULT 'openai',
        key TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_used TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    console.log('Migration complete: API keys table created successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the postgres client
    await client.end();
  }
} 