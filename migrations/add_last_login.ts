import { db } from "../server/config/db";
import { sql } from "drizzle-orm";

/**
 * Migration to add lastLogin column to users table
 */
export async function runMigration() {
  console.log("Running migration: Add lastLogin column to users table");
  
  try {
    // First check if we can connect to the database
    try {
      // Simple query to test connection
      await db.execute(sql`SELECT 1`);
    } catch (connErr) {
      console.error("Error connecting to database:", connErr.message);
      console.log("Migration skipped due to database connection error.");
      console.log("Please ensure your DATABASE_URL environment variable is correctly set.");
      
      // Return success to allow the installation to continue
      return { success: true, skipped: true };
    }
    
    // Check if column already exists to make the migration idempotent
    const columnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'last_login'
    `);
    
    // Check if the column exists by examining the query result
    const hasColumn = columnExists.length > 0;
    
    if (!hasColumn) {
      // Add the last_login column to the users table
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN last_login TIMESTAMP
      `);
      console.log("Successfully added last_login column to users table");
    } else {
      console.log("Column last_login already exists in users table, skipping");
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error adding last_login column:", error);
    
    // Don't fail the installation process because of migration issues
    // Just log the error and continue
    return { success: true, error };
  }
} 