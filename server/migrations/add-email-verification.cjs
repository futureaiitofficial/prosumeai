/**
 * Migration to add email verification fields to the users table
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
};

async function migrate() {
  // Connect to database
  const pool = new Pool(dbConfig);
  let client;

  try {
    client = await pool.connect();
    console.log('Connected to database, starting migration...');

    // Start a transaction
    await client.query('BEGIN');

    // Check if the email_verified column already exists
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'email_verified'
      );
    `);

    if (!columnExists.rows[0].exists) {
      console.log('Adding email verification columns to users table...');

      // Add email_verified column
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN email_verified BOOLEAN DEFAULT false;
      `);

      // Add email_verification_token column
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN email_verification_token TEXT;
      `);

      // Add email_verification_expiry column
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN email_verification_expiry TIMESTAMP;
      `);

      console.log('Email verification columns added successfully');
    } else {
      console.log('Email verification columns already exist');
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error during migration:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run migration
migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 