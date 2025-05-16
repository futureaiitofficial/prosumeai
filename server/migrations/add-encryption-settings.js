import { db } from '../config/db.js';
import { appSettings } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Migration script to add encryption settings to the database
 * This creates the necessary app settings for encryption functionality
 */
async function main() {
  console.log('Starting encryption settings migration...');
  
  try {
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
  } catch (error) {
    console.error('Error in encryption settings migration:', error);
    throw error;
  }
}

// Run the migration
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 