import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import dotenv from 'dotenv';

// Extract Pool from pg
const { Pool } = pg;

// Load environment variables
dotenv.config();

const main = async () => {
  console.log('Migration started...');
  
  // Create a PostgreSQL connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Create Drizzle instance
  const db = drizzle(pool);

  // Run migrations
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  
  console.log('Migration completed successfully!');
  
  // Close the pool
  await pool.end();
};

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 