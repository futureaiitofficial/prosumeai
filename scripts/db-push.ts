import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from '../shared/schema';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Starting database schema update...");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Connection for migrations
  const migrationClient = postgres(connectionString, { max: 1 });
  
  const db = drizzle(migrationClient, { schema });
  
  // Create a manual SQL query to add the new columns if they don't exist
  try {
    console.log("Adding new columns if needed...");
    
    // Check if company_name column exists
    await migrationClient`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'resumes' AND column_name = 'company_name'
        ) THEN
          ALTER TABLE resumes ADD COLUMN company_name text;
        END IF;
      END $$;
    `;
    
    // Check if job_description column exists
    await migrationClient`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'resumes' AND column_name = 'job_description'
        ) THEN
          ALTER TABLE resumes ADD COLUMN job_description text;
        END IF;
      END $$;
    `;
    
    // Check if country column exists
    await migrationClient`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'resumes' AND column_name = 'country'
        ) THEN
          ALTER TABLE resumes ADD COLUMN country text;
        END IF;
      END $$;
    `;
    
    // Check if city column exists
    await migrationClient`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'resumes' AND column_name = 'city'
        ) THEN
          ALTER TABLE resumes ADD COLUMN city text;
        END IF;
      END $$;
    `;
    
    // Check if state column exists
    await migrationClient`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'resumes' AND column_name = 'state'
        ) THEN
          ALTER TABLE resumes ADD COLUMN state text;
        END IF;
      END $$;
    `;
    
    // Check if is_complete column exists
    await migrationClient`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'resumes' AND column_name = 'is_complete'
        ) THEN
          ALTER TABLE resumes ADD COLUMN is_complete boolean DEFAULT false;
        END IF;
      END $$;
    `;
    
    // Check if current_step column exists
    await migrationClient`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'resumes' AND column_name = 'current_step'
        ) THEN
          ALTER TABLE resumes ADD COLUMN current_step text DEFAULT 'details';
        END IF;
      END $$;
    `;
    
    // Check if use_skill_categories column exists
    await migrationClient`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'resumes' AND column_name = 'use_skill_categories'
        ) THEN
          ALTER TABLE resumes ADD COLUMN use_skill_categories boolean DEFAULT false;
        END IF;
      END $$;
    `;
    
    // Update existing columns to be nullable if not null
    await migrationClient`
      DO $$ 
      BEGIN 
        ALTER TABLE resumes ALTER COLUMN full_name DROP NOT NULL;
        EXCEPTION WHEN others THEN NULL;
      END $$;
    `;
    
    await migrationClient`
      DO $$ 
      BEGIN 
        ALTER TABLE resumes ALTER COLUMN email DROP NOT NULL;
        EXCEPTION WHEN others THEN NULL;
      END $$;
    `;
    
    console.log("Schema update completed successfully!");
  } catch (error) {
    console.error("Error updating schema:", error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

main().catch((err) => {
  console.error('Error during migration:', err);
  process.exit(1);
});