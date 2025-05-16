import crypto from 'crypto';
import { db } from '../config/db';
import { eq } from 'drizzle-orm';
import { appSettings } from '@shared/schema';

// Encryption key management
let encryptionKey: Buffer | null = null;
let encryptionIv: Buffer | null = null;

/**
 * Initialize encryption with a given key or fetch from database
 * This should be called at app startup
 */
export async function initializeEncryption(): Promise<void> {
  try {
    // Try to get encryption key from settings
    const keySettings = await db.select().from(appSettings).where(eq(appSettings.key, 'encryption_key')).limit(1);
    
    if (keySettings.length === 0) {
      // Generate a new key if none exists
      encryptionKey = crypto.randomBytes(32); // 256 bits
      encryptionIv = crypto.randomBytes(16); // 128 bits for AES
      
      // Store the new key and IV in the database (as hex strings)
      await db.insert(appSettings).values({
        key: 'encryption_key',
        value: { key: encryptionKey.toString('hex'), iv: encryptionIv.toString('hex') },
        category: 'security',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Generated and stored new encryption key');
    } else {
      // Use existing key from database
      const keyData = keySettings[0].value as { key: string, iv: string };
      encryptionKey = Buffer.from(keyData.key, 'hex');
      encryptionIv = Buffer.from(keyData.iv, 'hex');
      console.log('Loaded existing encryption key');
    }
  } catch (error) {
    console.error('Failed to initialize encryption:', error);
    throw new Error('Failed to initialize encryption');
  }
}

/**
 * Rotate encryption keys and re-encrypt all sensitive data
 * This is a heavyweight operation and should be scheduled during low traffic
 */
export async function rotateEncryptionKeys(): Promise<void> {
  try {
    // Generate new encryption key and IV
    const newKey = crypto.randomBytes(32);
    const newIv = crypto.randomBytes(16);
    
    // Store old keys temporarily
    const oldKey = encryptionKey;
    const oldIv = encryptionIv;
    
    if (!oldKey || !oldIv) {
      throw new Error('No existing encryption keys found');
    }
    
    // Get the encryption configuration to know which models and fields to re-encrypt
    const encryptionConfigSettings = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'data_encryption_config'))
      .limit(1);
    
    if (encryptionConfigSettings.length === 0) {
      throw new Error('Encryption configuration not found');
    }
    
    const encryptionConfig = encryptionConfigSettings[0].value as Record<string, { fields: string[], enabled: boolean }>;
    
    // Get global encryption enabled setting
    const encryptionEnabledSettings = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'encryption_enabled'))
      .limit(1);
    
    const encryptionEnabled = encryptionEnabledSettings.length > 0 ? 
      encryptionEnabledSettings[0].value as boolean : false;
    
    // If encryption is not enabled globally, no need to re-encrypt
    if (!encryptionEnabled) {
      console.log('Encryption is disabled globally, skipping re-encryption');
      
      // Update the database with new keys
      await db.update(appSettings)
        .set({
          value: { key: newKey.toString('hex'), iv: newIv.toString('hex') },
          updatedAt: new Date()
        })
        .where(eq(appSettings.key, 'encryption_key'));
      
      // Set the new keys as active
      encryptionKey = newKey;
      encryptionIv = newIv;
      
      return;
    }
    
    // Create functions that can decrypt with old key and encrypt with new key
    const decryptWithOldKey = (data: string): any => {
      try {
        if (!isEncrypted(data)) return data;
        
        // Save current key and IV
        const currentKey = encryptionKey;
        const currentIv = encryptionIv;
        
        // Set old key for decryption
        encryptionKey = oldKey;
        encryptionIv = oldIv;
        
        // Decrypt with old key
        const decrypted = decryptData(data);
        
        // Restore current key
        encryptionKey = currentKey;
        encryptionIv = currentIv;
        
        return decrypted;
      } catch (error) {
        console.error('Error decrypting with old key:', error);
        return data; // Return original on error
      }
    };
    
    const encryptWithNewKey = (data: any): string => {
      try {
        // Save current key and IV
        const currentKey = encryptionKey;
        const currentIv = encryptionIv;
        
        // Set new key for encryption
        encryptionKey = newKey;
        encryptionIv = newIv;
        
        // Encrypt with new key
        const encrypted = encryptData(data);
        
        // Restore current key
        encryptionKey = currentKey;
        encryptionIv = currentIv;
        
        return encrypted;
      } catch (error) {
        console.error('Error encrypting with new key:', error);
        throw error;
      }
    };
    
    // Now process each model that has encryption enabled
    for (const [modelName, modelConfig] of Object.entries(encryptionConfig)) {
      if (!modelConfig.enabled || modelConfig.fields.length === 0) {
        console.log(`Skipping model ${modelName} - encryption not enabled`);
        continue;
      }
      
      console.log(`Re-encrypting data for model: ${modelName}`);
      
      try {
        // We need to handle each model specifically since we're using the ORM
        // This approach requires knowledge of the schema
        switch (modelName) {
          case 'users':
            await reEncryptUsersData(modelConfig.fields, decryptWithOldKey, encryptWithNewKey);
            break;
          case 'resumes':
            await reEncryptResumesData(modelConfig.fields, decryptWithOldKey, encryptWithNewKey);
            break;
          case 'coverLetters':
            await reEncryptCoverLettersData(modelConfig.fields, decryptWithOldKey, encryptWithNewKey);
            break;
          case 'jobApplications':
            await reEncryptJobApplicationsData(modelConfig.fields, decryptWithOldKey, encryptWithNewKey);
            break;
          case 'userBillingDetails':
            await reEncryptUserBillingDetailsData(modelConfig.fields, decryptWithOldKey, encryptWithNewKey);
            break;
          case 'paymentMethods':
            await reEncryptPaymentMethodsData(modelConfig.fields, decryptWithOldKey, encryptWithNewKey);
            break;
          default:
            console.warn(`Unknown model for re-encryption: ${modelName}`);
        }
      } catch (error) {
        console.error(`Error re-encrypting data for model ${modelName}:`, error);
        // Continue with other models even if one fails
      }
    }
    
    // Update the database with new keys only after all data is re-encrypted
    await db.update(appSettings)
      .set({
        value: { key: newKey.toString('hex'), iv: newIv.toString('hex') },
        updatedAt: new Date()
      })
      .where(eq(appSettings.key, 'encryption_key'));
    
    // Set the new keys as active
    encryptionKey = newKey;
    encryptionIv = newIv;
    
    console.log('Encryption keys rotated and data re-encrypted successfully');
  } catch (error) {
    console.error('Failed to rotate encryption keys:', error);
    throw new Error('Failed to rotate encryption keys');
  }
}

/**
 * Re-encrypt user data
 */
async function reEncryptUsersData(
  fields: string[], 
  decryptFn: (data: string) => any,
  encryptFn: (data: any) => string
) {
  // Import user schema to avoid circular dependencies
  const { users } = await import('@shared/schema');
  
  // Get all users
  const allUsers = await db.select().from(users);
  console.log(`Processing ${allUsers.length} user records`);
  
  for (const user of allUsers) {
    let updated = false;
    const updates: Record<string, any> = {};
    
    // Process each field that may be encrypted
    for (const field of fields) {
      if (user[field as keyof typeof user] && typeof user[field as keyof typeof user] === 'string') {
        const fieldValue = user[field as keyof typeof user] as string;
        
        // Decrypt with old key and re-encrypt with new key if it's encrypted
        if (isEncrypted(fieldValue)) {
          const decrypted = decryptFn(fieldValue);
          updates[field] = encryptFn(decrypted);
          updated = true;
        }
      }
    }
    
    // Update if any fields were modified
    if (updated) {
      await db.update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }
  }
}

/**
 * Re-encrypt resumes data
 */
async function reEncryptResumesData(
  fields: string[], 
  decryptFn: (data: string) => any,
  encryptFn: (data: any) => string
) {
  // Import schema to avoid circular dependencies
  const { resumes } = await import('@shared/schema');
  
  // Get all resumes
  const allResumes = await db.select().from(resumes);
  console.log(`Processing ${allResumes.length} resume records`);
  
  for (const resume of allResumes) {
    let updated = false;
    const updates: Record<string, any> = {};
    
    // Process each field that may be encrypted
    for (const field of fields) {
      // Handle workExperience field specially as it's a JSONB field that might contain encrypted data
      if (field === 'workExperience' && resume.workExperience) {
        try {
          const workExpData = typeof resume.workExperience === 'string' 
            ? JSON.parse(resume.workExperience) 
            : resume.workExperience;
            
          if (Array.isArray(workExpData)) {
            let workExpUpdated = false;
            
            // Process each work experience item
            for (let i = 0; i < workExpData.length; i++) {
              const item = workExpData[i];
              
              // Check if any fields in work experience items are encrypted
              for (const workField of ['description', 'responsibilities']) {
                if (item[workField] && typeof item[workField] === 'string' && isEncrypted(item[workField])) {
                  const decrypted = decryptFn(item[workField]);
                  workExpData[i][workField] = encryptFn(decrypted);
                  workExpUpdated = true;
                }
              }
            }
            
            if (workExpUpdated) {
              updates.workExperience = workExpData;
              updated = true;
            }
          }
        } catch (error) {
          console.error('Error processing workExperience:', error);
        }
      } else if (resume[field as keyof typeof resume] && typeof resume[field as keyof typeof resume] === 'string') {
        const fieldValue = resume[field as keyof typeof resume] as string;
        
        // Decrypt with old key and re-encrypt with new key if it's encrypted
        if (isEncrypted(fieldValue)) {
          const decrypted = decryptFn(fieldValue);
          updates[field] = encryptFn(decrypted);
          updated = true;
        }
      }
    }
    
    // Update if any fields were modified
    if (updated) {
      await db.update(resumes)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(resumes.id, resume.id));
    }
  }
}

/**
 * Re-encrypt cover letters data
 */
async function reEncryptCoverLettersData(
  fields: string[], 
  decryptFn: (data: string) => any,
  encryptFn: (data: any) => string
) {
  // Import schema to avoid circular dependencies
  const { coverLetters } = await import('@shared/schema');
  
  // Get all cover letters
  const allCoverLetters = await db.select().from(coverLetters);
  console.log(`Processing ${allCoverLetters.length} cover letter records`);
  
  for (const coverLetter of allCoverLetters) {
    let updated = false;
    const updates: Record<string, any> = {};
    
    // Process each field that may be encrypted
    for (const field of fields) {
      if (coverLetter[field as keyof typeof coverLetter] && 
          typeof coverLetter[field as keyof typeof coverLetter] === 'string') {
        const fieldValue = coverLetter[field as keyof typeof coverLetter] as string;
        
        // Decrypt with old key and re-encrypt with new key if it's encrypted
        if (isEncrypted(fieldValue)) {
          const decrypted = decryptFn(fieldValue);
          updates[field] = encryptFn(decrypted);
          updated = true;
        }
      }
    }
    
    // Update if any fields were modified
    if (updated) {
      await db.update(coverLetters)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(coverLetters.id, coverLetter.id));
    }
  }
}

/**
 * Re-encrypt job applications data
 */
async function reEncryptJobApplicationsData(
  fields: string[], 
  decryptFn: (data: string) => any,
  encryptFn: (data: any) => string
) {
  // Import schema to avoid circular dependencies
  const { jobApplications } = await import('@shared/schema');
  
  // Get all job applications
  const allJobApplications = await db.select().from(jobApplications);
  console.log(`Processing ${allJobApplications.length} job application records`);
  
  for (const jobApp of allJobApplications) {
    let updated = false;
    const updates: Record<string, any> = {};
    
    // Process each field that may be encrypted
    for (const field of fields) {
      if (jobApp[field as keyof typeof jobApp] && 
          typeof jobApp[field as keyof typeof jobApp] === 'string') {
        const fieldValue = jobApp[field as keyof typeof jobApp] as string;
        
        // Decrypt with old key and re-encrypt with new key if it's encrypted
        if (isEncrypted(fieldValue)) {
          const decrypted = decryptFn(fieldValue);
          updates[field] = encryptFn(decrypted);
          updated = true;
        }
      }
    }
    
    // Update if any fields were modified
    if (updated) {
      await db.update(jobApplications)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(jobApplications.id, jobApp.id));
    }
  }
}

/**
 * Re-encrypt user billing details data
 */
async function reEncryptUserBillingDetailsData(
  fields: string[], 
  decryptFn: (data: string) => any,
  encryptFn: (data: any) => string
) {
  // Import schema to avoid circular dependencies
  const { userBillingDetails } = await import('@shared/schema');
  
  // Get all user billing details
  const allBillingDetails = await db.select().from(userBillingDetails);
  console.log(`Processing ${allBillingDetails.length} billing detail records`);
  
  for (const billingDetail of allBillingDetails) {
    let updated = false;
    const updates: Record<string, any> = {};
    
    // Process each field that may be encrypted
    for (const field of fields) {
      if (billingDetail[field as keyof typeof billingDetail] && 
          typeof billingDetail[field as keyof typeof billingDetail] === 'string') {
        const fieldValue = billingDetail[field as keyof typeof billingDetail] as string;
        
        // Decrypt with old key and re-encrypt with new key if it's encrypted
        if (isEncrypted(fieldValue)) {
          const decrypted = decryptFn(fieldValue);
          updates[field] = encryptFn(decrypted);
          updated = true;
        }
      }
    }
    
    // Update if any fields were modified
    if (updated) {
      await db.update(userBillingDetails)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userBillingDetails.id, billingDetail.id));
    }
  }
}

/**
 * Re-encrypt payment methods data
 */
async function reEncryptPaymentMethodsData(
  fields: string[], 
  decryptFn: (data: string) => any,
  encryptFn: (data: any) => string
) {
  // Import schema to avoid circular dependencies
  const { paymentMethods } = await import('@shared/schema');
  
  // Get all payment methods
  const allPaymentMethods = await db.select().from(paymentMethods);
  console.log(`Processing ${allPaymentMethods.length} payment method records`);
  
  for (const paymentMethod of allPaymentMethods) {
    let updated = false;
    const updates: Record<string, any> = {};
    
    // Process each field that may be encrypted
    for (const field of fields) {
      if (paymentMethod[field as keyof typeof paymentMethod] && 
          typeof paymentMethod[field as keyof typeof paymentMethod] === 'string') {
        const fieldValue = paymentMethod[field as keyof typeof paymentMethod] as string;
        
        // Decrypt with old key and re-encrypt with new key if it's encrypted
        if (isEncrypted(fieldValue)) {
          const decrypted = decryptFn(fieldValue);
          updates[field] = encryptFn(decrypted);
          updated = true;
        }
      }
    }
    
    // Update if any fields were modified
    if (updated) {
      await db.update(paymentMethods)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(paymentMethods.id, paymentMethod.id));
    }
  }
}

/**
 * Encrypt data using AES-256-GCM
 * @param data The data to encrypt (object or string)
 * @returns The encrypted data as a string
 */
export function encryptData(data: any): string {
  try {
    if (!encryptionKey || !encryptionIv) {
      throw new Error('Encryption not initialized');
    }
    
    // Convert data to string if it's an object
    const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // Use a unique IV for each encryption by combining the base IV with a random salt
    const salt = crypto.randomBytes(8);
    const uniqueIv = Buffer.concat([encryptionIv.slice(0, 8), salt], 16);
    
    // Create cipher with key and IV
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, uniqueIv);
    
    // Encrypt the data
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag (for GCM mode)
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Combine salt, auth tag, and encrypted data, separated by colons
    return `${salt.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData The encrypted data string
 * @returns The decrypted data (parsed as JSON if it was an object)
 */
export function decryptData(encryptedData: string): any {
  try {
    if (!encryptionKey || !encryptionIv) {
      throw new Error('Encryption not initialized');
    }
    
    // Split the data into salt, auth tag, and encrypted parts
    const [saltHex, authTagHex, encryptedText] = encryptedData.split(':');
    
    if (!saltHex || !authTagHex || !encryptedText) {
      throw new Error('Invalid encrypted data format');
    }
    
    // Reconstruct the unique IV used during encryption
    const salt = Buffer.from(saltHex, 'hex');
    const uniqueIv = Buffer.concat([encryptionIv.slice(0, 8), salt], 16);
    
    // Create decipher with key and IV
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, uniqueIv);
    
    // Set auth tag
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Try to parse as JSON if it looks like JSON
    try {
      if (decrypted.startsWith('{') || decrypted.startsWith('[')) {
        return JSON.parse(decrypted);
      }
    } catch (e) {
      // If parsing fails, return as is
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a string is already encrypted
 * @param str The string to check
 * @returns True if the string appears to be encrypted
 */
export function isEncrypted(str: string): boolean {
  // Check if the string matches our encryption format (salt:authTag:encryptedData)
  const parts = str.split(':');
  if (parts.length !== 3) return false;
  
  // Check if each part is a valid hex string of appropriate length
  const [saltHex, authTagHex, encryptedText] = parts;
  
  // Salt is 16 hex chars (8 bytes)
  if (saltHex.length !== 16 || !/^[0-9a-f]+$/i.test(saltHex)) return false;
  
  // Auth tag is 32 hex chars (16 bytes) 
  if (authTagHex.length !== 32 || !/^[0-9a-f]+$/i.test(authTagHex)) return false;
  
  // Encrypted text should be a hex string
  if (!/^[0-9a-f]+$/i.test(encryptedText)) return false;
  
  return true;
}

/**
 * Safely encrypt data, checking if it's already encrypted
 * @param data The data to encrypt
 * @returns The encrypted data
 */
export function safeEncrypt(data: any): string {
  if (typeof data === 'string' && isEncrypted(data)) {
    return data; // Already encrypted
  }
  return encryptData(data);
}

/**
 * Safely decrypt data, checking if it's actually encrypted
 * @param data The data to decrypt
 * @returns The decrypted data
 */
export function safeDecrypt(data: any): any {
  if (typeof data === 'string' && isEncrypted(data)) {
    return decryptData(data);
  }
  return data; // Not encrypted
} 