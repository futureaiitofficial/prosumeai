import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * This script adds a job_description column to the cover_letters table.
 * Run this script to add the column without causing data loss.
 */
async function main() {
  try {
    console.log("Adding job_description column to cover_letters table...");
    
    // Execute ALTER TABLE command to add the job_description column
    await db.execute(sql`
      ALTER TABLE cover_letters 
      ADD COLUMN IF NOT EXISTS job_description TEXT;
    `);
    
    console.log("Successfully added job_description column to cover_letters table");
  } catch (error) {
    console.error("Error adding job_description column:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();