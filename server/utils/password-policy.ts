import { db } from '../config/db';
import { appSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Cache the password policy to avoid frequent DB lookups
let cachedPasswordPolicy: PasswordPolicyConfig | null = null;
let policyLastFetched = 0;
const POLICY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  preventReuseCount: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Initialize password policy by loading it from the database
 */
export async function initializePasswordPolicy(): Promise<void> {
  try {
    await getPasswordPolicy(true);
    console.log('Password policy initialized');
  } catch (error) {
    console.error('Failed to initialize password policy:', error);
    throw new Error('Failed to initialize password policy');
  }
}

/**
 * Get the current password policy configuration
 * @param forceRefresh Force a refresh from the database
 */
export async function getPasswordPolicy(forceRefresh = false): Promise<PasswordPolicyConfig> {
  const now = Date.now();
  
  // Return cached policy if it's still valid
  if (!forceRefresh && cachedPasswordPolicy && (now - policyLastFetched) < POLICY_CACHE_TTL) {
    return cachedPasswordPolicy;
  }
  
  try {
    // Get policy from database
    const [settings] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'password_policy'))
      .limit(1);
    
    if (!settings) {
      throw new Error('Password policy not found in database');
    }
    
    cachedPasswordPolicy = settings.value as PasswordPolicyConfig;
    policyLastFetched = now;
    
    return cachedPasswordPolicy;
  } catch (error) {
    console.error('Failed to fetch password policy:', error);
    
    // Return default policy if we can't fetch from DB
    return {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      passwordExpiryDays: 90,
      preventReuseCount: 3,
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 30
    };
  }
}

/**
 * Update the password policy configuration
 * @param newPolicy The new password policy configuration
 */
export async function updatePasswordPolicy(newPolicy: PasswordPolicyConfig): Promise<void> {
  try {
    await db.update(appSettings)
      .set({
        value: newPolicy,
        updatedAt: new Date()
      })
      .where(eq(appSettings.key, 'password_policy'));
    
    // Update cache
    cachedPasswordPolicy = newPolicy;
    policyLastFetched = Date.now();
    
    console.log('Password policy updated');
  } catch (error) {
    console.error('Failed to update password policy:', error);
    throw new Error('Failed to update password policy');
  }
}

/**
 * Validate a password against the current password policy
 * @param password The password to validate
 */
export async function validatePassword(password: string): Promise<PasswordValidationResult> {
  const policy = await getPasswordPolicy();
  const errors: string[] = [];
  
  // Check length
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  
  // Check uppercase
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check lowercase
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check numbers
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check special characters
  if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate a password hint based on the current policy
 */
export async function getPasswordRequirementsText(): Promise<string> {
  const policy = await getPasswordPolicy();
  
  let hint = `Password must be at least ${policy.minLength} characters long`;
  
  if (policy.requireUppercase) {
    hint += ', contain at least one uppercase letter';
  }
  
  if (policy.requireLowercase) {
    hint += ', contain at least one lowercase letter';
  }
  
  if (policy.requireNumbers) {
    hint += ', contain at least one number';
  }
  
  if (policy.requireSpecialChars) {
    hint += ', contain at least one special character';
  }
  
  return hint + '.';
}

/**
 * Check if a user's password needs to be reset due to expiry
 * @param lastPasswordChange Date when the password was last changed
 */
export async function isPasswordExpired(lastPasswordChange: Date): Promise<boolean> {
  const policy = await getPasswordPolicy();
  
  // If expiry is disabled (0 days), never expire
  if (policy.passwordExpiryDays === 0) {
    return false;
  }
  
  const now = new Date();
  const expiryDate = new Date(lastPasswordChange);
  expiryDate.setDate(expiryDate.getDate() + policy.passwordExpiryDays);
  
  return now > expiryDate;
} 