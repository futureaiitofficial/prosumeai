const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const dotenv = require('dotenv');
const { sql } = require('drizzle-orm');

// Load environment variables
dotenv.config();

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// For migrations and one-time script execution
const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient);

async function runMigration() {
  try {
    console.log('Starting blog media migration...');
    console.log('Using database connection from environment variables');

    // Create enum for media type
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('Created media_type enum');

    // Create blog_media table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_media" (
        "id" SERIAL PRIMARY KEY,
        "filename" TEXT NOT NULL,
        "original_name" TEXT NOT NULL,
        "mime_type" TEXT NOT NULL,
        "size" INTEGER NOT NULL,
        "width" INTEGER,
        "height" INTEGER,
        "url" TEXT NOT NULL,
        "alt" TEXT,
        "caption" TEXT,
        "type" media_type NOT NULL,
        "uploaded_by" INTEGER NOT NULL REFERENCES "users"("id"),
        "is_used" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created blog_media table');

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_media_type" ON "blog_media"("type");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_media_uploaded_by" ON "blog_media"("uploaded_by");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_media_is_used" ON "blog_media"("is_used");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_media_created_at" ON "blog_media"("created_at");
    `);

    console.log('Created indexes for blog_media table');

    console.log('Blog media migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await migrationClient.end();
  }
}

// Run the migration
runMigration(); 