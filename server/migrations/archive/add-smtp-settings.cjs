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
    console.log('Starting SMTP settings table migration...');
    console.log('Using database connection from environment variables');

    // Check if smtp_settings table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'smtp_settings'
      );
    `);
    
    if (!tableExists[0].exists) {
      console.log('Creating smtp_settings table...');
      
      // Create the smtp_settings table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "smtp_settings" (
          "id" SERIAL PRIMARY KEY,
          "host" TEXT NOT NULL,
          "port" TEXT NOT NULL DEFAULT '587',
          "username" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "encryption" TEXT NOT NULL DEFAULT 'tls',
          "sender_name" TEXT NOT NULL DEFAULT 'atScribe',
          "sender_email" TEXT NOT NULL DEFAULT 'no-reply@atscribe.com',
          "enabled" BOOLEAN NOT NULL DEFAULT true,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('SMTP settings table created successfully');
      
      // Insert default empty values to ensure there's a record
      await db.execute(sql`
        INSERT INTO "smtp_settings" (
          "host", 
          "port", 
          "username", 
          "password", 
          "encryption", 
          "sender_name", 
          "sender_email", 
          "enabled"
        ) VALUES (
          '', 
          '587', 
          '', 
          '', 
          'tls', 
          'atScribe', 
          'no-reply@atscribe.com', 
          false
        );
      `);
      
      console.log('SMTP settings table initialized with default values');
      console.log('SMTP settings table created and initialized successfully!');
    } else {
      console.log('SMTP settings table already exists, checking for name/email updates...');
      
      // Update the sender name and email if they still have ProsumeAI values
      const result = await db.execute(sql`
        UPDATE "smtp_settings"
        SET 
          "sender_name" = 'atScribe',
          "sender_email" = 'no-reply@atscribe.com'
        WHERE 
          "sender_name" = 'ProsumeAI' AND
          "sender_email" = 'no-reply@prosumeai.com';
      `);
      
      console.log('SMTP settings updated if needed');
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