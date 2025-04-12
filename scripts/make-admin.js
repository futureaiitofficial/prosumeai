#!/usr/bin/env node

/**
 * This script makes a user an admin by username
 * Usage: node scripts/make-admin.js <username>
 */

// Import the required modules
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { eq } from 'drizzle-orm';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Get the username from command line arguments
const username = process.argv[2];

if (!username) {
  console.error('Please provide a username');
  console.error('Usage: node scripts/make-admin.js <username>');
  process.exit(1);
}

async function main() {
  try {
    // Create the database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log(`Making user "${username}" an admin...`);
    
    // Create the postgres client
    const client = postgres(connectionString);
    
    // Dynamically import the schema
    const schema = await import('../shared/schema.js');
    const { users } = schema;
    
    // Create the drizzle ORM instance
    const db = drizzle(client, { schema: { users } });
    
    // Check if the user exists
    const existingUsers = await db.select().from(users).where(eq(users.username, username));
    
    if (existingUsers.length === 0) {
      throw new Error(`User with username "${username}" not found`);
    }
    
    // Update the user to be an admin
    const [updatedUser] = await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.username, username))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`Failed to update user "${username}"`);
    }
    
    console.log(`User "${username}" is now an admin`);
    console.log('Admin status:', updatedUser.isAdmin);
    
    // Close the client connection
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main(); 