import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from '@shared/schema';

// Create the database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

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