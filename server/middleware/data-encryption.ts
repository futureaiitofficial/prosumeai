import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { eq } from 'drizzle-orm';
import { appSettings } from '@shared/schema';
import { safeEncrypt, safeDecrypt, isEncrypted } from '../utils/encryption';

// Types of data that should be encrypted
type EncryptionFieldConfig = {
  [model: string]: {
    fields: string[];
    enabled: boolean;
  }
};

// Cache of encryption configuration to avoid frequent DB lookups
let encryptionConfig: EncryptionFieldConfig | null = null;
let encryptionEnabled = false;

/**
 * Initialize the data encryption service
 * This should be called at app startup
 */
export async function initializeDataEncryption(): Promise<void> {
  try {
    // Get encryption settings from the database
    const [settings] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'data_encryption_config'))
      .limit(1);

    if (settings) {
      encryptionConfig = settings.value as EncryptionFieldConfig;
      console.log('Loaded data encryption configuration');
    } else {
      // Create default encryption config if none exists
      encryptionConfig = {
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

      // Save the default config
      await db.insert(appSettings).values({
        key: 'data_encryption_config',
        value: encryptionConfig,
        category: 'security',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Created default data encryption configuration');
    }

    // Get global encryption setting
    const [globalSettings] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'encryption_enabled'))
      .limit(1);

    if (globalSettings) {
      encryptionEnabled = globalSettings.value as boolean;
    } else {
      // Default to disabled
      encryptionEnabled = false;
      
      // Save the default setting
      await db.insert(appSettings).values({
        key: 'encryption_enabled',
        value: false,
        category: 'security',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log(`Data encryption is ${encryptionEnabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Failed to initialize data encryption:', error);
    throw new Error('Failed to initialize data encryption');
  }
}

/**
 * Update encryption configuration
 * @param config The new encryption configuration
 */
export async function updateEncryptionConfig(config: EncryptionFieldConfig): Promise<void> {
  try {
    // Update the database
    await db.update(appSettings)
      .set({
        value: config,
        updatedAt: new Date()
      })
      .where(eq(appSettings.key, 'data_encryption_config'));

    // Update the in-memory config
    encryptionConfig = config;
    
    console.log('Updated data encryption configuration');
  } catch (error) {
    console.error('Failed to update encryption configuration:', error);
    throw new Error('Failed to update encryption configuration');
  }
}

/**
 * Enable or disable encryption globally
 * @param enabled Whether encryption should be enabled
 */
export async function setEncryptionEnabled(enabled: boolean): Promise<void> {
  try {
    // Update the database
    await db.update(appSettings)
      .set({
        value: enabled,
        updatedAt: new Date()
      })
      .where(eq(appSettings.key, 'encryption_enabled'));

    // Update the in-memory setting
    encryptionEnabled = enabled;
    
    console.log(`Data encryption ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Failed to update encryption setting:', error);
    throw new Error('Failed to update encryption setting');
  }
}

/**
 * Encrypt data in an object based on the configuration
 * @param data The data object to encrypt
 * @param modelName The name of the model this data belongs to
 * @returns The object with encrypted data
 */
export function encryptModelData(data: any, modelName: string): any {
  // Skip if encryption is not enabled or no config exists
  if (!encryptionEnabled || !encryptionConfig) {
    return data;
  }

  // Get model config
  const modelConfig = encryptionConfig[modelName];
  if (!modelConfig || !modelConfig.enabled || !modelConfig.fields.length) {
    return data;
  }

  // Clone the data to avoid modifying the original
  const encryptedData = { ...data };

  // Encrypt each field
  for (const field of modelConfig.fields) {
    // Only encrypt if the field has an actual value (not empty strings, null, or undefined)
    if (encryptedData[field] !== undefined && encryptedData[field] !== null && encryptedData[field] !== '') {
      encryptedData[field] = safeEncrypt(encryptedData[field]);
    }
  }

  return encryptedData;
}

/**
 * Decrypt data in an object based on the configuration
 * @param data The data object to decrypt
 * @param modelName The name of the model this data belongs to
 * @returns The object with decrypted data
 */
export function decryptModelData(data: any, modelName: string): any {
  // If encryption is not enabled, just return the data
  if (!encryptionConfig) {
    return data;
  }

  // Get model config
  const modelConfig = encryptionConfig[modelName];
  if (!modelConfig || !modelConfig.fields.length) {
    return data;
  }

  // Clone the data to avoid modifying the original
  const decryptedData = { ...data };

  // Decrypt each field
  for (const field of modelConfig.fields) {
    if (decryptedData[field] !== undefined && decryptedData[field] !== null) {
      // Only decrypt if the field is actually encrypted
      if (typeof decryptedData[field] === 'string' && isEncrypted(decryptedData[field])) {
        try {
          // Decrypt the value
          const decryptedValue = safeDecrypt(decryptedData[field]);
          
          // Handle cases where empty values were encrypted
          if (decryptedValue === '' || decryptedValue === null || decryptedValue === undefined) {
            decryptedData[field] = '';
          } else {
            decryptedData[field] = decryptedValue;
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${field} in ${modelName}:`, error);
          // Keep the encrypted value if decryption fails
        }
      }
    }
  }

  return decryptedData;
}

/**
 * Middleware to encrypt request body data before processing
 * @param modelName The name of the model this data belongs to
 */
export function encryptRequestData(modelName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body) {
        req.body = encryptModelData(req.body, modelName);
      }
      next();
    } catch (error) {
      console.error('Error in encryptRequestData middleware:', error);
      next(error);
    }
  };
}

/**
 * Middleware to decrypt response data after processing
 * @param modelName The name of the model this data belongs to
 */
export function decryptResponseData(modelName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Save the original json method
      const originalJson = res.json;
      
      // Override the json method to decrypt data before sending
      res.json = function(body?: any): Response {
        if (body) {
          // Handle both single objects and arrays
          if (Array.isArray(body)) {
            body = body.map(item => decryptModelData(item, modelName));
          } else {
            body = decryptModelData(body, modelName);
          }
        }
        
        // Call the original json method with the decrypted data
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('Error in decryptResponseData middleware:', error);
      next(error);
    }
  };
}

/**
 * Get the current encryption configuration
 * Used by admin routes to display/edit configuration
 */
export function getEncryptionConfig(): { config: EncryptionFieldConfig, enabled: boolean } {
  return {
    config: encryptionConfig || {},
    enabled: encryptionEnabled
  };
}

/**
 * Helper function to apply encryption middleware to a route
 * This adds both encryption for request and decryption for response
 * @param modelName The name of the model to encrypt/decrypt
 */
export function withEncryption(modelName: string) {
  return [encryptRequestData(modelName), decryptResponseData(modelName)];
}

/**
 * Sanitize billing data to ensure empty fields are not encrypted
 * @param data The billing data to sanitize
 * @returns The sanitized data
 */
export function sanitizeBillingData(data: any): any {
  if (!data) return data;
  
  // Create a copy to avoid modifying the original
  const sanitized = { ...data };
  
  // Optional fields that should be empty if not provided
  const optionalFields = ['phoneNumber', 'addressLine2', 'taxId', 'companyName'];
  
  // Sanitize each optional field
  for (const field of optionalFields) {
    if (sanitized[field] === undefined || sanitized[field] === null || sanitized[field] === '') {
      sanitized[field] = '';
    }
  }
  
  return sanitized;
}

/**
 * Debug middleware to log encryption status
 */
export function logEncryptionStatus(req: Request, res: Response, next: NextFunction) {
  console.log(`Encryption enabled: ${encryptionEnabled}`);
  console.log(`Encryption config: ${JSON.stringify(encryptionConfig)}`);
  next();
} 