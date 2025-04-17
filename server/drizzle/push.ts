import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import * as schema from '../../shared/schema';

// Extract Pool from pg
const { Pool } = pg;

// Load environment variables
dotenv.config();

const main = async () => {
  console.log('Schema push started...');
  
  // Create a PostgreSQL connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Create Drizzle instance
  const db = drizzle(pool);

  // Create the enum type first
  try {
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_application_status') THEN
          CREATE TYPE job_application_status AS ENUM ('applied', 'screening', 'interview', 'assessment', 'offer', 'rejected', 'accepted');
        END IF;
      END $$;
    `);
    console.log('Enum type created or already exists');
    
    // Check if the job_applications table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'job_applications'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('Converting status column from text to enum type...');
      
      // Force conversion regardless of current type
      try {
        // Temporarily allow NULL to facilitate the conversion
        await db.execute(sql`ALTER TABLE job_applications ALTER COLUMN status DROP NOT NULL;`);
        console.log('NOT NULL constraint removed temporarily');
        
        // Convert column type
        await db.execute(sql`
          ALTER TABLE job_applications 
          ALTER COLUMN status TYPE job_application_status 
          USING status::job_application_status;
        `);
        console.log('Column type converted to enum');
        
        // Restore NOT NULL constraint
        await db.execute(sql`ALTER TABLE job_applications ALTER COLUMN status SET NOT NULL;`);
        console.log('NOT NULL constraint restored');
        
        // Set default value
        await db.execute(sql`ALTER TABLE job_applications ALTER COLUMN status SET DEFAULT 'applied';`);
        console.log('Default value set to "applied"');
      } catch (error) {
        console.error('Error during column conversion:', error);
        
        // If conversion failed, check for invalid values
        const invalidValues = await db.execute(sql`
          SELECT DISTINCT status FROM job_applications 
          WHERE status NOT IN ('applied', 'screening', 'interview', 'assessment', 'offer', 'rejected', 'accepted');
        `);
        
        if (invalidValues.rows.length > 0) {
          console.error('Found invalid status values:', invalidValues.rows);
          console.log('Attempting to correct invalid values...');
          
          // Update invalid values to 'applied'
          await db.execute(sql`
            UPDATE job_applications 
            SET status = 'applied' 
            WHERE status NOT IN ('applied', 'screening', 'interview', 'assessment', 'offer', 'rejected', 'accepted');
          `);
          
          console.log('Invalid values corrected, attempting conversion again...');
          
          // Try conversion again
          await db.execute(sql`
            ALTER TABLE job_applications 
            ALTER COLUMN status TYPE job_application_status 
            USING status::job_application_status;
          `);
          
          // Restore NOT NULL constraint
          await db.execute(sql`ALTER TABLE job_applications ALTER COLUMN status SET NOT NULL;`);
          
          // Set default value
          await db.execute(sql`ALTER TABLE job_applications ALTER COLUMN status SET DEFAULT 'applied';`);
          
          console.log('Column conversion completed after fixing invalid values');
        } else {
          throw error; // Re-throw if no invalid values found
        }
      }
    } else {
      console.log('Job applications table does not exist yet, no conversion needed');
    }
  } catch (error) {
    console.error('Error during schema update:', error);
    throw error;
  }
  
  console.log('Schema push completed successfully!');
  
  // Close the pool
  await pool.end();
};

main().catch((error) => {
  console.error('Schema push failed:', error);
  process.exit(1);
}); 