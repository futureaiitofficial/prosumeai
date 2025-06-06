import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { SQL, sql } from 'drizzle-orm';

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
    console.log('Starting branding settings table migration...');

    // Check if branding_settings table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'branding_settings'
      );
    `);
    
    if (!tableExists[0].exists) {
      console.log('Creating branding_settings table...');
      
      // Create the branding_settings table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "branding_settings" (
          "id" SERIAL PRIMARY KEY,
          "app_name" TEXT NOT NULL DEFAULT 'ProsumeAI',
          "app_tagline" TEXT DEFAULT 'AI-powered resume and career tools',
          "logo_url" TEXT DEFAULT '/logo.png',
          "favicon_url" TEXT DEFAULT '/favicon.ico',
          "enable_dark_mode" BOOLEAN NOT NULL DEFAULT true,
          "primary_color" TEXT NOT NULL DEFAULT '#4f46e5',
          "secondary_color" TEXT NOT NULL DEFAULT '#10b981',
          "accent_color" TEXT NOT NULL DEFAULT '#f97316',
          "footer_text" TEXT DEFAULT '© 2023 ProsumeAI. All rights reserved.',
          "custom_css" TEXT,
          "custom_js" TEXT,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Insert default values
      await db.execute(sql`
        INSERT INTO "branding_settings" (
          "app_name", 
          "app_tagline", 
          "logo_url", 
          "favicon_url", 
          "enable_dark_mode", 
          "primary_color", 
          "secondary_color", 
          "accent_color", 
          "footer_text"
        ) VALUES (
          'ProsumeAI', 
          'AI-powered resume and career tools', 
          '/logo.png', 
          '/favicon.ico', 
          true, 
          '#4f46e5', 
          '#10b981', 
          '#f97316', 
          '© 2023 ProsumeAI. All rights reserved.'
        );
      `);
      
      console.log('Branding settings table created and initialized successfully!');
    } else {
      console.log('Branding settings table already exists, skipping creation.');
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