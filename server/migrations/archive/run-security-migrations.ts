import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

/**
 * Run all security-related migrations in sequence
 */
async function runSecurityMigrations() {
  console.log('=== RUNNING SECURITY MIGRATIONS ===');
  
  try {
    // Get database connection string from environment
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // Try to read from .env file directly
      try {
        const dotenvResult = require('dotenv').config();
        connectionString = dotenvResult.parsed?.DATABASE_URL;
      } catch (err) {
        // Ignore errors, we'll handle the missing connection string below
      }
      
      // If still not found, use a default for development
      if (!connectionString) {
        connectionString = 'postgres://raja:raja@localhost:5432/prosumeai';
        console.log('DATABASE_URL not found in environment, using default development connection');
      }
    }

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
    
    console.log('Connecting to database...');
    
    // Create a database connection
    const client = postgres(connectionString);
    const db = drizzle(client);

    // Import the schema directly for migration
    // We need to do this dynamically to avoid circular dependencies
    const { appSettings } = await import('@shared/schema');
    
    // 1. Encryption Settings Migration
    console.log('\n--- ENCRYPTION SETTINGS MIGRATION ---');
    
    // Check if encryption key setting already exists
    const existingKeySetting = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'encryption_key'))
      .limit(1);
    
    if (existingKeySetting.length === 0) {
      console.log('Creating encryption key setting...');
      
      // Generate a new key and IV
      const encryptionKey = crypto.randomBytes(32); // 256 bits
      const encryptionIv = crypto.randomBytes(16); // 128 bits for AES
      
      // Store the new key and IV in the database
      await db.insert(appSettings).values({
        key: 'encryption_key',
        value: { key: encryptionKey.toString('hex'), iv: encryptionIv.toString('hex') },
        category: 'security',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Encryption key setting created successfully');
    } else {
      console.log('Encryption key setting already exists, skipping');
    }
    
    // Check if encryption config setting already exists
    const existingConfigSetting = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'data_encryption_config'))
      .limit(1);
    
    if (existingConfigSetting.length === 0) {
      console.log('Creating data encryption config setting...');
      
      // Create default encryption config
      const encryptionConfig = {
        users: {
          fields: ['email', 'fullName'],
          enabled: false
        },
        resumes: {
          fields: ['fullName', 'email', 'phone', 'summary', 'workExperience'],
          enabled: false
        },
        coverLetters: {
          fields: ['fullName', 'email', 'phone', 'content'],
          enabled: false
        },
        jobApplications: {
          fields: ['contactName', 'contactEmail', 'contactPhone', 'notes', 'interviewNotes'],
          enabled: false
        },
        userBillingDetails: {
          fields: ['fullName', 'addressLine1', 'addressLine2', 'phoneNumber', 'taxId'],
          enabled: false
        },
        paymentMethods: {
          fields: ['lastFour', 'gatewayPaymentMethodId'],
          enabled: false
        }
      };
      
      await db.insert(appSettings).values({
        key: 'data_encryption_config',
        value: encryptionConfig,
        category: 'security',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Data encryption config setting created successfully');
    } else {
      console.log('Data encryption config setting already exists, skipping');
    }
    
    // Check if encryption enabled setting already exists
    const existingEnabledSetting = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'encryption_enabled'))
      .limit(1);
    
    if (existingEnabledSetting.length === 0) {
      console.log('Creating encryption enabled setting...');
      
      await db.insert(appSettings).values({
        key: 'encryption_enabled',
        value: false,
        category: 'security',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Encryption enabled setting created successfully');
    } else {
      console.log('Encryption enabled setting already exists, skipping');
    }
    
    // Add security settings for password policies
    const existingPasswordPolicySetting = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'password_policy'))
      .limit(1);
    
    if (existingPasswordPolicySetting.length === 0) {
      console.log('Creating password policy setting...');
      
      const passwordPolicy = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiryDays: 90, // 0 means never expires
        preventReuseCount: 3,    // How many previous passwords to remember
        maxFailedAttempts: 5,    // Number of failed attempts before account lockout
        lockoutDurationMinutes: 30 // How long the account lockout lasts
      };
      
      await db.insert(appSettings).values({
        key: 'password_policy',
        value: passwordPolicy,
        category: 'security',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Password policy setting created successfully');
    } else {
      console.log('Password policy setting already exists, skipping');
    }
    
    // Add security setting for session configuration
    const existingSessionConfigSetting = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'session_config'))
      .limit(1);
    
    if (existingSessionConfigSetting.length === 0) {
      console.log('Creating session configuration setting...');
      
      const sessionConfig = {
        maxAge: 86400000, // 1 day in milliseconds
        inactivityTimeout: 1800000, // 30 minutes in milliseconds
        absoluteTimeout: 86400000, // 1 day in milliseconds
        singleSession: false, // Whether to allow only one active session per user
        regenerateAfterLogin: true, // Whether to regenerate session ID after login
        rotateSecretInterval: 86400000 // How often to rotate session secret (1 day)
      };
      
      await db.insert(appSettings).values({
        key: 'session_config',
        value: sessionConfig,
        category: 'security',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Session configuration setting created successfully');
    } else {
      console.log('Session configuration setting already exists, skipping');
    }
    
    console.log('Encryption settings migration completed successfully');
    
    // 2. Password Fields Migration
    console.log('\n--- PASSWORD FIELDS MIGRATION ---');
    
    // Check if the columns already exist
    const checkColumnQuery = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'last_password_change'
    `);
    
    // If the column doesn't exist, add all the new columns
    if (!checkColumnQuery || checkColumnQuery.length === 0) {
      console.log('Adding password policy fields to users table...');
      
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP,
        ADD COLUMN IF NOT EXISTS password_history JSONB,
        ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP
      `);
      
      console.log('Password policy fields added successfully');
    } else {
      console.log('Password policy fields already exist, skipping');
    }
    
    console.log('Password policy fields migration completed successfully');
    
    // Close the database connection
    await client.end();
    
    console.log('\n=== ALL SECURITY MIGRATIONS COMPLETED SUCCESSFULLY ===');
    return true;
  } catch (error) {
    console.error('Error in security migrations:', error);
    throw error;
  }
}

// Run the migrations
runSecurityMigrations()
  .then(() => {
    console.log('Migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migrations failed:', error);
    process.exit(1);
  }); 