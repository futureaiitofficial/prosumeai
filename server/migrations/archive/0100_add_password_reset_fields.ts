import { sql } from "drizzle-orm";
import { db } from "../config/db";

/**
 * Migration to add password reset fields to the users table
 */
export async function runMigration() {
  console.log("Starting migration: add password reset fields to users table");

  try {
    // Check if reset_password_token column already exists
    const tokenResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'reset_password_token'
    `);

    if (tokenResult.length === 0) {
      // Add reset_password_token column
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN reset_password_token TEXT
      `);
      console.log("Successfully added reset_password_token column to users table");
    } else {
      console.log("Column 'reset_password_token' already exists on users table. Skipping.");
    }

    // Check if reset_password_expiry column already exists
    const expiryResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'reset_password_expiry'
    `);

    if (expiryResult.length === 0) {
      // Add reset_password_expiry column
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN reset_password_expiry TIMESTAMP
      `);
      console.log("Successfully added reset_password_expiry column to users table");
    } else {
      console.log("Column 'reset_password_expiry' already exists on users table. Skipping.");
    }

    console.log("Migration for password reset fields completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
} 