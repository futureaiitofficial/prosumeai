import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// Use DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL!;

async function main() {
  console.log("Starting migration to add deadline_date column...");
  
  // Create postgres client
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_applications' AND column_name = 'deadline_date'
    `);
    
    if (result.length === 0) {
      console.log("Column deadline_date does not exist, adding it now...");
      
      // Add the deadline_date column to the job_applications table
      await db.execute(sql`
        ALTER TABLE job_applications 
        ADD COLUMN deadline_date TIMESTAMP
      `);
      
      console.log("Migration completed successfully. deadline_date column has been added.");
    } else {
      console.log("Column deadline_date already exists, no migration needed.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    // Close the client connection
    await client.end();
  }
}

main();