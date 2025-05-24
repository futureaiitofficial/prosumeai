import { db } from '../config/db';
import { randomBytes, createHmac } from 'crypto';
import { 
  userTwoFactor, 
  twoFactorEmail, 
  twoFactorAuthenticator, 
  twoFactorBackupCodes,
  twoFactorPolicy,
  twoFactorRememberedDevices,
  users
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { EmailService } from './email-service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

/**
 * Service for managing two-factor authentication
 */
export class TwoFactorService {
  
  /**
   * Check if 2FA is enabled for a user
   * @param userId User ID
   * @returns Boolean indicating if 2FA is enabled
   */
  public static async isEnabled(userId: number): Promise<boolean> {
    try {
      const result = await db.select({
        enabled: userTwoFactor.enabled
      })
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, userId))
      .limit(1);
      
      return result.length > 0 && result[0].enabled;
    } catch (error) {
      console.error('Error checking if 2FA is enabled:', error);
      return false;
    }
  }
  
  /**
   * Get the 2FA policy
   * @returns The 2FA policy
   */
  public static async getPolicy(): Promise<any> {
    try {
      const policy = await db.select()
        .from(twoFactorPolicy)
        .limit(1);
      
      if (policy.length === 0) {
        // Insert default policy if none exists
        const newPolicy = await db.insert(twoFactorPolicy)
          .values({
            enforceForAdmins: false,
            enforceForAllUsers: false,
            allowedMethods: ["EMAIL", "AUTHENTICATOR_APP"],
            rememberDeviceDays: 30
          })
          .returning();
        
        return newPolicy[0];
      }
      
      return policy[0];
    } catch (error) {
      console.error('Error getting 2FA policy:', error);
      throw error;
    }
  }
  
  /**
   * Update the 2FA policy
   * @param policyData Updated policy data
   * @returns The updated policy
   */
  public static async updatePolicy(policyData: any): Promise<any> {
    try {
      const policy = await db.select()
        .from(twoFactorPolicy)
        .limit(1);
      
      if (policy.length === 0) {
        // Insert new policy if none exists
        return await db.insert(twoFactorPolicy)
          .values({
            enforceForAdmins: policyData.enforceForAdmins,
            enforceForAllUsers: policyData.enforceForAllUsers,
            allowedMethods: policyData.allowedMethods,
            rememberDeviceDays: policyData.rememberDeviceDays
          })
          .returning();
      } else {
        // Update existing policy
        return await db.update(twoFactorPolicy)
          .set({
            enforceForAdmins: policyData.enforceForAdmins,
            enforceForAllUsers: policyData.enforceForAllUsers,
            allowedMethods: policyData.allowedMethods,
            rememberDeviceDays: policyData.rememberDeviceDays,
            updatedAt: new Date()
          })
          .where(eq(twoFactorPolicy.id, policy[0].id))
          .returning();
      }
    } catch (error) {
      console.error('Error updating 2FA policy:', error);
      throw error;
    }
  }
  
  /**
   * Enable or update email-based 2FA for a user
   * @param userId User ID
   * @param email Email to use for 2FA
   * @returns Result of the operation
   */
  public static async setupEmailTwoFactor(userId: number, email: string): Promise<any> {
    try {
      // Check if email 2FA already exists for this user
      const existingSetup = await db.select()
        .from(twoFactorEmail)
        .where(eq(twoFactorEmail.userId, userId))
        .limit(1);
      
      if (existingSetup.length > 0) {
        // Update existing setup
        await db.update(twoFactorEmail)
          .set({
            email,
            updatedAt: new Date()
          })
          .where(eq(twoFactorEmail.userId, userId));
      } else {
        // Create new setup
        await db.insert(twoFactorEmail)
          .values({
            userId,
            email
          });
      }
      
      // Update user's 2FA preference if needed
      await this.updateUserTwoFactorPreference(userId, 'EMAIL');
      
      return { success: true, message: 'Email 2FA setup successfully' };
    } catch (error) {
      console.error('Error setting up email 2FA:', error);
      throw error;
    }
  }
  
  /**
   * Generate and send a verification code for email-based 2FA
   * @param userId User ID
   * @param email Optional email override
   * @returns Result of the operation
   */
  public static async generateAndSendEmailVerificationCode(userId: number, email?: string | null): Promise<any> {
    try {
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiry time to 10 minutes from now
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 10);
      
      // Log the provided email for debugging
      console.log(`Generating 2FA email code for user ${userId}, email parameter: ${email || 'not provided'}`);
      
      // Get the user's email 2FA setup
      const emailSetup = await db.select()
        .from(twoFactorEmail)
        .where(eq(twoFactorEmail.userId, userId))
        .limit(1);
      
      // Get user's email and name for sending the email
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          username: true,
          email: true
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      console.log(`Retrieved user ${user.username} (${user.email}) for 2FA email`);
      
      // Determine the target email, with better validation
      let targetEmail: string | null = null;
      
      // First try the provided email
      if (email && typeof email === 'string' && email.includes('@')) {
        targetEmail = email;
      } 
      // Then try the email from 2FA setup
      else if (emailSetup.length > 0 && emailSetup[0]?.email && emailSetup[0].email.includes('@')) {
        targetEmail = emailSetup[0].email;
      } 
      // Finally use the user's email
      else if (user.email && user.email.includes('@')) {
        targetEmail = user.email;
      }
      
      // Validate that we have a valid email address
      if (!targetEmail) {
        throw new Error('No valid email address found for 2FA setup');
      }
      
      console.log(`Using email ${targetEmail} for 2FA verification code`);
      
      // Update the token
      if (emailSetup.length > 0) {
        await db.update(twoFactorEmail)
          .set({
            token: code,
            tokenExpiresAt: expiryTime,
            email: targetEmail, // Ensure we update with a valid email
            updatedAt: new Date()
          })
          .where(eq(twoFactorEmail.userId, userId));
      } else {
        // Create new setup with the validated email
        await db.insert(twoFactorEmail)
          .values({
            userId,
            email: targetEmail,
            token: code,
            tokenExpiresAt: expiryTime
          });
      }
      
      // Send the email with the verification code
      const emailResult = await EmailService.sendTwoFactorCodeEmail(
        targetEmail,
        user.username,
        code,
        10
      );
      
      if (!emailResult) {
        throw new Error(`Failed to send verification email to ${targetEmail}`);
      }
      
      return { 
        success: true, 
        message: 'Verification code sent', 
        email: targetEmail 
      };
    } catch (error) {
      console.error('Error generating and sending email verification code:', error);
      throw error;
    }
  }
  
  /**
   * Verify an email-based 2FA code
   * @param userId User ID
   * @param code The verification code
   * @returns Result of the verification
   */
  public static async verifyEmailCode(userId: number, code: string): Promise<boolean> {
    try {
      const emailSetup = await db.select()
        .from(twoFactorEmail)
        .where(eq(twoFactorEmail.userId, userId))
        .limit(1);
      
      if (emailSetup.length === 0) {
        return false;
      }
      
      const { token, tokenExpiresAt } = emailSetup[0];
      
      // Check if token has expired
      if (!tokenExpiresAt || new Date() > new Date(tokenExpiresAt)) {
        return false;
      }
      
      // Check if the code matches
      if (token !== code) {
        return false;
      }
      
      // Clear the token after successful verification
      await db.update(twoFactorEmail)
        .set({
          token: null,
          tokenExpiresAt: null,
          updatedAt: new Date()
        })
        .where(eq(twoFactorEmail.userId, userId));
      
      // Enable 2FA for the user if not already enabled
      await this.enableTwoFactor(userId);
      
      return true;
    } catch (error) {
      console.error('Error verifying email code:', error);
      return false;
    }
  }
  
  /**
   * Set up authenticator app-based 2FA
   * @param userId User ID
   * @param appName App name to display in authenticator apps
   * @returns Setup information including secret and QR code
   */
  public static async setupAuthenticatorTwoFactor(userId: number, appName: string = 'ProsumeAI'): Promise<any> {
    try {
      // Generate a new secret
      const secret = speakeasy.generateSecret({
        length: 20,
        name: `${appName} (${userId})`
      });
      
      // Check if authenticator 2FA already exists for this user
      const existingSetup = await db.select()
        .from(twoFactorAuthenticator)
        .where(eq(twoFactorAuthenticator.userId, userId))
        .limit(1);
      
      if (existingSetup.length > 0) {
        // Update existing setup
        await db.update(twoFactorAuthenticator)
          .set({
            secret: secret.base32,
            verified: false,
            updatedAt: new Date()
          })
          .where(eq(twoFactorAuthenticator.userId, userId));
      } else {
        // Create new setup
        await db.insert(twoFactorAuthenticator)
          .values({
            userId,
            secret: secret.base32,
            verified: false
          });
      }
      
      // Generate QR code (add null check for otpauth_url)
      const otpauthUrl = secret.otpauth_url || `otpauth://totp/${encodeURIComponent(appName)}:${userId}?secret=${secret.base32}&issuer=${encodeURIComponent(appName)}`;
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
      
      return {
        success: true,
        secret: secret.base32,
        qrCode: qrCodeUrl
      };
    } catch (error) {
      console.error('Error setting up authenticator 2FA:', error);
      throw error;
    }
  }
  
  /**
   * Verify an authenticator app-based 2FA code to complete setup
   * @param userId User ID
   * @param token The token from the authenticator app
   * @returns Result of the verification
   */
  public static async verifyAndEnableAuthenticator(userId: number, token: string): Promise<boolean> {
    try {
      const authenticatorSetup = await db.select()
        .from(twoFactorAuthenticator)
        .where(eq(twoFactorAuthenticator.userId, userId))
        .limit(1);
      
      if (authenticatorSetup.length === 0) {
        return false;
      }
      
      const { secret, verified } = authenticatorSetup[0];
      
      // Verify the token
      const tokenValidates = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1 // Allow a small window for time drift
      });
      
      if (!tokenValidates) {
        return false;
      }
      
      // Generate recovery codes if this is the first verification
      if (!verified) {
        const recoveryCodes = this.generateRecoveryCodes();
        
        // Update the authenticator setting as verified
        await db.update(twoFactorAuthenticator)
          .set({
            verified: true,
            recoveryCodes,
            updatedAt: new Date()
          })
          .where(eq(twoFactorAuthenticator.userId, userId));
        
        // Save backup codes
        await this.saveBackupCodes(userId, recoveryCodes);
      }
      
      // Update user's 2FA preference
      await this.updateUserTwoFactorPreference(userId, 'AUTHENTICATOR_APP');
      
      // Enable 2FA for the user
      await this.enableTwoFactor(userId);
      
      return true;
    } catch (error) {
      console.error('Error verifying authenticator token:', error);
      return false;
    }
  }
  
  /**
   * Verify a token from an authenticator app for login
   * @param userId User ID
   * @param token The token from the authenticator app
   * @returns Result of the verification
   */
  public static async verifyAuthenticatorToken(userId: number, token: string): Promise<boolean> {
    try {
      const authenticatorSetup = await db.select()
        .from(twoFactorAuthenticator)
        .where(eq(twoFactorAuthenticator.userId, userId))
        .limit(1);
      
      if (authenticatorSetup.length === 0 || !authenticatorSetup[0].verified) {
        return false;
      }
      
      const { secret } = authenticatorSetup[0];
      
      // Verify the token
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1 // Allow a small window for time drift
      });
    } catch (error) {
      console.error('Error verifying authenticator token:', error);
      return false;
    }
  }
  
  /**
   * Generate recovery codes for a user
   * @returns Array of recovery codes
   */
  private static generateRecoveryCodes(count: number = 10): string[] {
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      // Generate a random code like XXXX-XXXX-XXXX where X is alphanumeric
      const part1 = randomBytes(2).toString('hex').toUpperCase();
      const part2 = randomBytes(2).toString('hex').toUpperCase();
      const part3 = randomBytes(2).toString('hex').toUpperCase();
      
      codes.push(`${part1}-${part2}-${part3}`);
    }
    
    return codes;
  }
  
  /**
   * Save backup codes for a user
   * @param userId User ID
   * @param codes Array of backup codes
   */
  private static async saveBackupCodes(userId: number, codes: string[]): Promise<void> {
    try {
      // Delete any existing backup codes
      await db.delete(twoFactorBackupCodes)
        .where(eq(twoFactorBackupCodes.userId, userId));
      
      // Insert new backup codes
      const values = codes.map(code => ({
        userId,
        code,
        used: false
      }));
      
      await db.insert(twoFactorBackupCodes)
        .values(values);
    } catch (error) {
      console.error('Error saving backup codes:', error);
      throw error;
    }
  }
  
  /**
   * Verify a backup code
   * @param userId User ID
   * @param code The backup code
   * @returns Result of the verification
   */
  public static async verifyBackupCode(userId: number, code: string): Promise<boolean> {
    try {
      // Normalize the code format (uppercase, no spaces)
      const normalizedCode = code.trim().toUpperCase().replace(/\s/g, '');
      
      const backupCode = await db.select()
        .from(twoFactorBackupCodes)
        .where(
          and(
            eq(twoFactorBackupCodes.userId, userId),
            eq(twoFactorBackupCodes.code, normalizedCode),
            eq(twoFactorBackupCodes.used, false)
          )
        )
        .limit(1);
      
      if (backupCode.length === 0) {
        return false;
      }
      
      // Mark the code as used
      await db.update(twoFactorBackupCodes)
        .set({ used: true })
        .where(eq(twoFactorBackupCodes.id, backupCode[0].id));
      
      return true;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return false;
    }
  }
  
  /**
   * Get backup codes for a user
   * @param userId User ID
   * @returns List of backup codes
   */
  public static async getBackupCodes(userId: number): Promise<any[]> {
    try {
      return await db.select({
        code: twoFactorBackupCodes.code,
        used: twoFactorBackupCodes.used,
        createdAt: twoFactorBackupCodes.createdAt
      })
      .from(twoFactorBackupCodes)
      .where(eq(twoFactorBackupCodes.userId, userId))
      .orderBy(twoFactorBackupCodes.used, twoFactorBackupCodes.createdAt);
    } catch (error) {
      console.error('Error getting backup codes:', error);
      throw error;
    }
  }
  
  /**
   * Enable 2FA for a user
   * @param userId User ID
   */
  public static async enableTwoFactor(userId: number): Promise<void> {
    try {
      const existingSetup = await db.select()
        .from(userTwoFactor)
        .where(eq(userTwoFactor.userId, userId))
        .limit(1);
      
      if (existingSetup.length > 0) {
        // Update existing setup
        await db.update(userTwoFactor)
          .set({
            enabled: true,
            updatedAt: new Date()
          })
          .where(eq(userTwoFactor.userId, userId));
      } else {
        // Create new setup
        await db.insert(userTwoFactor)
          .values({
            userId,
            enabled: true
          });
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  }
  
  /**
   * Disable 2FA for a user
   * @param userId User ID
   */
  public static async disableTwoFactor(userId: number): Promise<void> {
    try {
      // Update user 2FA status
      await db.update(userTwoFactor)
        .set({
          enabled: false,
          updatedAt: new Date()
        })
        .where(eq(userTwoFactor.userId, userId));
      
      // Optionally, clear all 2FA settings (email, authenticator, backup codes)
      /*
      await db.delete(twoFactorEmail)
        .where(eq(twoFactorEmail.userId, userId));
      
      await db.delete(twoFactorAuthenticator)
        .where(eq(twoFactorAuthenticator.userId, userId));
      
      await db.delete(twoFactorBackupCodes)
        .where(eq(twoFactorBackupCodes.userId, userId));
      */
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }
  
  /**
   * Update a user's preferred 2FA method
   * @param userId User ID
   * @param method The preferred method ('EMAIL' or 'AUTHENTICATOR_APP')
   */
  private static async updateUserTwoFactorPreference(userId: number, method: 'EMAIL' | 'AUTHENTICATOR_APP'): Promise<void> {
    try {
      const existingSetup = await db.select()
        .from(userTwoFactor)
        .where(eq(userTwoFactor.userId, userId))
        .limit(1);
      
      if (existingSetup.length > 0) {
        // Update existing setup
        await db.update(userTwoFactor)
          .set({
            preferredMethod: method,
            updatedAt: new Date()
          })
          .where(eq(userTwoFactor.userId, userId));
      } else {
        // Create new setup
        await db.insert(userTwoFactor)
          .values({
            userId,
            preferredMethod: method,
            enabled: false
          });
      }
    } catch (error) {
      console.error('Error updating 2FA preference:', error);
      throw error;
    }
  }
  
  /**
   * Get the 2FA configuration for a user
   * @param userId User ID
   * @returns 2FA configuration
   */
  public static async getUserTwoFactorConfig(userId: number): Promise<any> {
    try {
      // Get basic 2FA setup
      const basicSetup = await db.select()
        .from(userTwoFactor)
        .where(eq(userTwoFactor.userId, userId))
        .limit(1);
      
      // Get email 2FA setup
      const emailSetup = await db.select({
        email: twoFactorEmail.email,
        updatedAt: twoFactorEmail.updatedAt
      })
      .from(twoFactorEmail)
      .where(eq(twoFactorEmail.userId, userId))
      .limit(1);
      
      // Get authenticator 2FA setup
      const authenticatorSetup = await db.select({
        verified: twoFactorAuthenticator.verified,
        updatedAt: twoFactorAuthenticator.updatedAt
      })
      .from(twoFactorAuthenticator)
      .where(eq(twoFactorAuthenticator.userId, userId))
      .limit(1);
      
      // Count unused backup codes using SQL count rather than db.fn.count()
      const backupCodeCount = await db.select({
        count: sql`COUNT(*)`
      })
      .from(twoFactorBackupCodes)
      .where(
        and(
          eq(twoFactorBackupCodes.userId, userId),
          eq(twoFactorBackupCodes.used, false)
        )
      );
      
      // Safe parsing of count value with type assertion
      const backupCount = backupCodeCount[0]?.count ? 
        parseInt(String(backupCodeCount[0].count)) : 0;
      
      return {
        enabled: basicSetup.length > 0 ? basicSetup[0].enabled : false,
        preferredMethod: basicSetup.length > 0 ? basicSetup[0].preferredMethod : null,
        methods: {
          email: {
            configured: emailSetup.length > 0,
            email: emailSetup.length > 0 ? emailSetup[0].email : null,
            lastUpdated: emailSetup.length > 0 ? emailSetup[0].updatedAt : null
          },
          authenticator: {
            configured: authenticatorSetup.length > 0,
            verified: authenticatorSetup.length > 0 ? authenticatorSetup[0].verified : false,
            lastUpdated: authenticatorSetup.length > 0 ? authenticatorSetup[0].updatedAt : null
          }
        },
        backupCodes: {
          count: backupCount
        }
      };
    } catch (error) {
      console.error('Error getting user 2FA config:', error);
      throw error;
    }
  }
  
  /**
   * Remember a device to skip 2FA for a period
   * @param userId User ID
   * @param deviceIdentifier Unique device identifier
   * @returns The remember token
   */
  public static async rememberDevice(userId: number, deviceIdentifier: string): Promise<string> {
    try {
      // Get policy for remember duration
      const policy = await this.getPolicy();
      const rememberDays = policy.rememberDeviceDays || 30;
      
      // Generate a unique token
      const token = randomBytes(32).toString('hex');
      
      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + rememberDays);
      
      // Check if device is already remembered
      const existingDevice = await db.select()
        .from(twoFactorRememberedDevices)
        .where(
          and(
            eq(twoFactorRememberedDevices.userId, userId),
            eq(twoFactorRememberedDevices.deviceIdentifier, deviceIdentifier)
          )
        )
        .limit(1);
      
      if (existingDevice.length > 0) {
        // Update existing device
        await db.update(twoFactorRememberedDevices)
          .set({
            token,
            expiresAt,
            createdAt: new Date()
          })
          .where(eq(twoFactorRememberedDevices.id, existingDevice[0].id));
      } else {
        // Create new remembered device
        await db.insert(twoFactorRememberedDevices)
          .values({
            userId,
            deviceIdentifier,
            token,
            expiresAt
          });
      }
      
      return token;
    } catch (error) {
      console.error('Error remembering device:', error);
      throw error;
    }
  }
  
  /**
   * Verify if a device is remembered and 2FA can be skipped
   * @param userId User ID
   * @param deviceIdentifier Device identifier
   * @param token Remember token
   * @returns Boolean indicating if the device is remembered
   */
  public static async isDeviceRemembered(userId: number, deviceIdentifier: string, token: string): Promise<boolean> {
    try {
      const rememberedDevice = await db.select()
        .from(twoFactorRememberedDevices)
        .where(
          and(
            eq(twoFactorRememberedDevices.userId, userId),
            eq(twoFactorRememberedDevices.deviceIdentifier, deviceIdentifier),
            eq(twoFactorRememberedDevices.token, token)
          )
        )
        .limit(1);
      
      if (rememberedDevice.length === 0) {
        return false;
      }
      
      // Check if token has expired
      const expiresAt = new Date(rememberedDevice[0].expiresAt);
      if (new Date() > expiresAt) {
        // Delete expired token
        await db.delete(twoFactorRememberedDevices)
          .where(eq(twoFactorRememberedDevices.id, rememberedDevice[0].id));
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking if device is remembered:', error);
      return false;
    }
  }
  
  /**
   * Get the preferred 2FA method for a user
   * @param userId User ID
   * @returns The preferred method or null
   */
  public static async getPreferredMethod(userId: number): Promise<'EMAIL' | 'AUTHENTICATOR_APP' | null> {
    try {
      const userConfig = await db.select({
        preferredMethod: userTwoFactor.preferredMethod
      })
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, userId))
      .limit(1);
      
      if (userConfig.length === 0 || !userConfig[0].preferredMethod) {
        // If no preference, check what methods are configured
        const config = await this.getUserTwoFactorConfig(userId);
        
        if (config.methods.authenticator.configured && config.methods.authenticator.verified) {
          return 'AUTHENTICATOR_APP';
        } else if (config.methods.email.configured) {
          return 'EMAIL';
        }
        
        return null;
      }
      
      return userConfig[0].preferredMethod;
    } catch (error) {
      console.error('Error getting preferred 2FA method:', error);
      return null;
    }
  }
  
  /**
   * Check if a user needs to set up 2FA based on policy
   * @param userId User ID
   * @param isAdmin Whether the user is an admin
   * @returns Boolean indicating if 2FA setup is required
   */
  public static async isTwoFactorRequired(userId: number, isAdmin: boolean): Promise<boolean> {
    try {
      // Check if user already has 2FA enabled
      const isEnabled = await this.isEnabled(userId);
      if (isEnabled) {
        return false; // Already set up, no need to enforce
      }
      
      // Get policy
      const policy = await this.getPolicy();
      
      // Check if 2FA is enforced for this user
      if (policy.enforceForAllUsers) {
        return true;
      }
      
      if (isAdmin && policy.enforceForAdmins) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if 2FA is required:', error);
      return false;
    }
  }
}

export default TwoFactorService; 