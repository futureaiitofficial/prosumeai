import { db } from "../server/config/db";
import { sql } from "drizzle-orm";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting migrations...');
  
  try {
    // Run the SQL migration directly
    await db.execute(sql`
      DROP TABLE IF EXISTS subscription_plans;
      ALTER TABLE cover_letter_templates DROP COLUMN IF EXISTS plan_required;
      ALTER TABLE resume_templates DROP COLUMN IF EXISTS plan_required;
    `);
    
    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this is the main module
if (import.meta.url.endsWith(process.argv[1])) {
  main();
}

export { main as runMigrations }; 