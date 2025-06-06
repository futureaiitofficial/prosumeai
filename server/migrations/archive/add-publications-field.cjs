const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const dotenv = require('dotenv');
const { sql } = require('drizzle-orm');

// Load environment variables
dotenv.config();

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// For migrations and one-time script execution
const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient);

async function runMigration() {
  try {
    console.log('Starting publications field migration...');

    // Check if publications column exists in resumes table
    const columnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resumes'
        AND column_name = 'publications'
      );
    `);
    
    if (!columnExists[0].exists) {
      console.log('Adding publications column to resumes table...');
      
      // Add the publications column to the resumes table
      await db.execute(sql`
        ALTER TABLE resumes
        ADD COLUMN publications JSONB;
      `);
      
      console.log('Publications column added successfully to resumes table!');
    } else {
      console.log('Publications column already exists in resumes table, skipping creation.');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await migrationClient.end();
  }
}

// Run the migration
runMigration(); 