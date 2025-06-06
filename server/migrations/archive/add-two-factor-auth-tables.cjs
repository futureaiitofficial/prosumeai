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
    console.log('Starting two factor authentication tables migration...');

    // Create 2FA methods enum
    console.log('Creating 2FA method enum...');
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "two_factor_method" AS ENUM ('EMAIL', 'AUTHENTICATOR_APP');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create user_two_factor table
    console.log('Creating user_two_factor table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_two_factor" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
        "preferred_method" "two_factor_method",
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id")
      );
    `);

    // Create two_factor_backup_codes table
    console.log('Creating two_factor_backup_codes table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "two_factor_backup_codes" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "code" TEXT NOT NULL,
        "used" BOOLEAN NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id", "code")
      );
    `);

    // Create two_factor_email table to store email-based 2FA settings and tokens
    console.log('Creating two_factor_email table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "two_factor_email" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "email" TEXT NOT NULL,
        "token" TEXT,
        "token_expires_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id")
      );
    `);

    // Create two_factor_authenticator table to store TOTP-based authenticator app settings
    console.log('Creating two_factor_authenticator table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "two_factor_authenticator" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "secret" TEXT NOT NULL,
        "recovery_codes" JSONB,
        "verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id")
      );
    `);

    // Add two_factor_policy table to handle admin-level 2FA settings
    console.log('Creating two_factor_policy table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "two_factor_policy" (
        "id" SERIAL PRIMARY KEY,
        "enforce_for_admins" BOOLEAN NOT NULL DEFAULT FALSE,
        "enforce_for_all_users" BOOLEAN NOT NULL DEFAULT FALSE,
        "allowed_methods" JSONB NOT NULL DEFAULT '["EMAIL", "AUTHENTICATOR_APP"]',
        "remember_device_days" INTEGER NOT NULL DEFAULT 30,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default two factor policy
    console.log('Inserting default two factor policy...');
    await db.execute(sql`
      INSERT INTO two_factor_policy (
        enforce_for_admins, 
        enforce_for_all_users, 
        allowed_methods, 
        remember_device_days
      ) VALUES (
        FALSE, 
        FALSE, 
        '["EMAIL", "AUTHENTICATOR_APP"]', 
        30
      )
      ON CONFLICT DO NOTHING;
    `);

    // Add remember_me token table
    console.log('Creating two_factor_remembered_devices table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "two_factor_remembered_devices" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "device_identifier" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id", "device_identifier")
      );
    `);

    console.log('Two factor authentication migration completed successfully!');
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