import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from '@shared/schema';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Create the database connection
let connectionString = process.env.DATABASE_URL;

// Check if connection string exists
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  connectionString = 'postgres://raja:raja@localhost:5432/prosumeai'; // Default fallback for development
  console.log('Using default development database connection');
} else {
  // Log the connection string (with password masked)
  console.log('Using database connection:', connectionString.replace(/\/\/[^:]+:([^@]+)@/, '//***:***@'));

  // Make sure we're connecting to the correct database
  // If the connection string doesn't already specify prosumeai, ensure we use it
  if (!connectionString.endsWith('/prosumeai')) {
    // Extract the base connection without db name (if any)
    const baseConnectionParts = connectionString.split('/');
    baseConnectionParts.pop(); // Remove the last part (current db name)
    const baseConnection = baseConnectionParts.join('/');
    connectionString = `${baseConnection}/prosumeai`;
    console.log('Corrected connection to use prosumeai database');
  }
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Export the client for use in other modules (like rate limiter)
export const pool = client;

// For safety, add a sync function that performs schema validation
export async function validateSchema() {
  try {
    // Test query to check schema integrity
    const result = await db.query.users.findFirst();
    console.log("Database schema validated successfully");
    return true;
  } catch (error) {
    console.error("Database schema validation error:", error);
    return false;
  }
}

// Call this at startup to ensure schema is valid
validateSchema().catch(err => {
  console.error("Schema validation failed:", err);
});