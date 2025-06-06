import { db } from '../config/db.js';
import { users } from '@shared/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Migration script to reset user authentication fields
 * - Reset failed login attempts to 0
 * - Set lastPasswordChange to current date if not set
 * - Reset lockoutUntil to null
 */
export async function runMigration() {
  try {
    console.log('Starting user authentication fields migration...');
    
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to process.`);
    
    let updatedCount = 0;
    
    for (const user of allUsers) {
      const updates: Record<string, any> = {};
      let needsUpdate = false;
      
      // Reset failed login attempts if not 0
      if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
        updates.failedLoginAttempts = 0;
        needsUpdate = true;
      }
      
      // Reset lockoutUntil if set
      if (user.lockoutUntil) {
        updates.lockoutUntil = null;
        needsUpdate = true;
      }
      
      // Set lastPasswordChange if not set
      if (!user.lastPasswordChange) {
        updates.lastPasswordChange = new Date();
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await db.update(users)
          .set(updates)
          .where(eq(users.id, user.id));
        updatedCount++;
        console.log(`Updated user ${user.username} (ID: ${user.id})`);
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} users.`);
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// If this file is run directly, execute the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
} 