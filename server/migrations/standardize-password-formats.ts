import { db } from '../config/db.js';
import { users } from '@shared/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

/**
 * Standard password hashing function
 * @param password Password to hash
 * @returns Hashed password in standard format (hash.salt)
 */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Validates if a password hash is in the correct format
 * @param hash Password hash to validate
 * @returns True if the hash is in valid format
 */
function isValidPasswordHash(hash: string): boolean {
  if (!hash || !hash.includes('.')) {
    return false;
  }
  
  const [hashedPart, salt] = hash.split('.');
  
  // Check if both parts exist and are valid hex strings
  return !!(
    hashedPart && 
    salt && 
    /^[0-9a-f]+$/i.test(hashedPart) && 
    /^[0-9a-f]+$/i.test(salt) && 
    hashedPart.length === 128 && // 64 bytes as hex string
    salt.length === 32 // 16 bytes as hex string
  );
}

/**
 * Migration to standardize all password formats in the database
 * This ensures all passwords use the same hashing algorithm and format
 */
export async function runMigration() {
  try {
    console.log('Starting password format standardization migration...');
    
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to process.`);
    
    let updatedCount = 0;
    const defaultPassword = 'ChangeMe123!'; // Secure but forces users to change
    
    // Process each user
    for (const user of allUsers) {
      if (!user.password || !isValidPasswordHash(user.password)) {
        console.log(`User ${user.username} (ID: ${user.id}) has invalid password format, resetting...`);
        
        // Hash the default password
        const newPasswordHash = await hashPassword(defaultPassword);
        
        // Create password history
        const now = new Date();
        const passwordHistory = [{
          password: newPasswordHash,
          changedAt: now
        }];
        
        // Update the user with standardized password and set lastPasswordChange
        await db.update(users)
          .set({
            password: newPasswordHash,
            failedLoginAttempts: 0,
            lockoutUntil: null,
            lastPasswordChange: now,
            passwordHistory: passwordHistory,
            // Set a reset token so user is forced to change password
            resetPasswordToken: crypto.randomBytes(32).toString('hex'),
            resetPasswordExpiry: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          })
          .where(eq(users.id, user.id));
        
        updatedCount++;
        console.log(`Reset password for user ${user.username} (ID: ${user.id})`);
      } else {
        console.log(`User ${user.username} (ID: ${user.id}) already has valid password format.`);
        
        // Ensure user has lastPasswordChange set
        if (!user.lastPasswordChange) {
          await db.update(users)
            .set({
              lastPasswordChange: new Date()
            })
            .where(eq(users.id, user.id));
            
          console.log(`Updated lastPasswordChange for user ${user.username} (ID: ${user.id})`);
          updatedCount++;
        }
        
        // Ensure user has password history
        if (!user.passwordHistory || !Array.isArray(user.passwordHistory) || user.passwordHistory.length === 0) {
          const passwordHistory = [{
            password: user.password,
            changedAt: user.lastPasswordChange || new Date()
          }];
          
          await db.update(users)
            .set({
              passwordHistory: passwordHistory
            })
            .where(eq(users.id, user.id));
            
          console.log(`Updated password history for user ${user.username} (ID: ${user.id})`);
          updatedCount++;
        }
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} users.`);
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
} 