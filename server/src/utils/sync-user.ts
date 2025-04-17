// Script to manually synchronize a user with their user record
// Usage: npx tsx utils/sync-user.ts <userId>

import { db } from '../../config/db';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';

const userId = process.argv[2] ? parseInt(process.argv[2]) : 5; // Default to user ID 5

async function syncUser() {
  try {
    console.log(`Checking user data for ID ${userId}...`);
    
    // Get current user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
      
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return;
    }
    
    console.log(`Current user data:`, {
      id: user.id,
      username: user.username
    });
    
    // Update user record with basic fields only (subscriptions removed)
    await db
      .update(users)
      .set({
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
      
    if (updatedUser) {
      console.log(`Updated user data:`, {
        id: updatedUser.id,
        username: updatedUser.username
      });
    }
    
    console.log(`Done! User data update complete.`);
  } catch (error) {
    console.error(`Error updating user:`, error);
  } finally {
    process.exit(0);
  }
}

syncUser(); 