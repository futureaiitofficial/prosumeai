import { sql } from "drizzle-orm";
import { db } from "../config/db";
import { fileURLToPath } from 'url';

/**
 * Migration to add metadata column to user_subscriptions table
 */
export async function runMigration() {
  console.log("Starting migration: add metadata column to user_subscriptions table");

  try {
    // Check if column already exists
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_subscriptions'
      AND column_name = 'metadata'
    `);

    if (result.length > 0) {
      console.log("Column 'metadata' already exists on user_subscriptions table. Skipping.");
      return;
    }

    // Add metadata column to user_subscriptions table
    await db.execute(sql`
      ALTER TABLE user_subscriptions
      ADD COLUMN metadata JSONB DEFAULT '{}' NOT NULL
    `);

    console.log("Successfully added metadata column to user_subscriptions table");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run if directly executed (ES module version)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runMigration()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
} 