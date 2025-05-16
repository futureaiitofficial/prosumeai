import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import crypto from 'crypto';
import { 
  encryptData, 
  decryptData, 
  safeEncrypt, 
  safeDecrypt, 
  isEncrypted 
} from '../utils/encryption';

// Mock the encryption key and IV for testing
// In a real application, these would be securely managed
beforeAll(() => {
  // Use TypeScript typecasting to access the private variables
  (global as any).encryptionKey = crypto.randomBytes(32);
  (global as any).encryptionIv = crypto.randomBytes(16);
  
  // Set the encryption module's internal variables (using a workaround for testing)
  const encryptionModule = require('../utils/encryption');
  (encryptionModule as any).encryptionKey = (global as any).encryptionKey;
  (encryptionModule as any).encryptionIv = (global as any).encryptionIv;
});

// Clean up after tests
afterAll(() => {
  const encryptionModule = require('../utils/encryption');
  (encryptionModule as any).encryptionKey = null;
  (encryptionModule as any).encryptionIv = null;
});

describe('Encryption Utilities', () => {
  it('should encrypt and decrypt a string correctly', () => {
    const originalData = 'test@example.com';
    const encrypted = encryptData(originalData);
    
    // Encrypted data should be different from original
    expect(encrypted).not.toEqual(originalData);
    
    // Encrypted data should have the correct format (salt:authTag:encrypted)
    expect(encrypted.split(':').length).toBe(3);
    
    // Should be able to decrypt back to original
    const decrypted = decryptData(encrypted);
    expect(decrypted).toEqual(originalData);
  });
  
  it('should encrypt and decrypt complex objects', () => {
    const originalData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Anytown',
        zip: '12345'
      },
      hobbies: ['reading', 'hiking', 'swimming']
    };
    
    const encrypted = encryptData(originalData);
    
    // Should be able to decrypt back to original object
    const decrypted = decryptData(encrypted);
    expect(decrypted).toEqual(originalData);
  });
  
  it('should correctly identify encrypted data', () => {
    const originalData = 'sensitive information';
    const encrypted = encryptData(originalData);
    
    // Should identify encrypted data
    expect(isEncrypted(encrypted)).toBe(true);
    
    // Should identify unencrypted data
    expect(isEncrypted('not encrypted')).toBe(false);
    expect(isEncrypted('abc:def:ghi')).toBe(false); // Wrong format
  });
  
  it('should safely encrypt already encrypted data', () => {
    const originalData = 'don\'t encrypt me twice';
    const encrypted = encryptData(originalData);
    
    // Safe encrypt should not double-encrypt
    const safeEncrypted = safeEncrypt(encrypted);
    expect(safeEncrypted).toEqual(encrypted);
    
    // Regular data should still be encrypted
    const normalEncrypted = safeEncrypt('regular data');
    expect(normalEncrypted).not.toEqual('regular data');
  });
  
  it('should safely decrypt data that might not be encrypted', () => {
    const encrypted = encryptData('encrypted data');
    const notEncrypted = 'not encrypted';
    
    // Should decrypt encrypted data
    expect(safeDecrypt(encrypted)).toEqual('encrypted data');
    
    // Should return unencrypted data as-is
    expect(safeDecrypt(notEncrypted)).toEqual(notEncrypted);
  });
  
  it('should maintain unique IVs for each encryption', () => {
    const data = 'same data, different encryption';
    
    // Encrypt the same data twice
    const encrypted1 = encryptData(data);
    const encrypted2 = encryptData(data);
    
    // The encrypted results should be different due to different IVs
    expect(encrypted1).not.toEqual(encrypted2);
    
    // But both should decrypt to the original data
    expect(decryptData(encrypted1)).toEqual(data);
    expect(decryptData(encrypted2)).toEqual(data);
  });
}); 