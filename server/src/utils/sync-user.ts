// Script to manually synchronize a user's subscription with their user record
// Usage: npx tsx utils/sync-user.ts <userId>

import { checkAndFixUserSubscription } from './subscription-sync';
import { storage } from '../storage';
import { db } from '../../config/db';
import { eq } from 'drizzle-orm';
import { users, subscriptions } from '@shared/schema';

const userId = process.argv[2] ? parseInt(process.argv[2]) : 5; // Default to user ID 5

async function syncUser() {
  try {
    console.log(`Checking subscription for user ID ${userId}...`);
    
    // Get current user data before sync
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return;
    }
    
    console.log(`Current user data:`, {
      id: user.id,
      username: user.username,
      subscriptionPlanId: user.subscriptionPlanId,
      subscriptionStatus: user.subscriptionStatus
    });
    
    // Get user's active subscription
    const activeSubscription = await storage.getUserSubscription(userId);
    console.log(`Current subscription:`, activeSubscription);
    
    // Run the synchronization
    console.log(`Running subscription synchronization...`);
    const updated = await checkAndFixUserSubscription(userId);
    
    if (updated) {
      console.log(`User subscription was updated by synchronization`);
      
      // Get user data after sync
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        console.error(`User ${userId} not found after synchronization`);
        return;
      }
      
      console.log(`Updated user data:`, {
        id: updatedUser.id,
        username: updatedUser.username,
        subscriptionPlanId: updatedUser.subscriptionPlanId,
        subscriptionStatus: updatedUser.subscriptionStatus
      });
      
      // Manually force update if needed
      if (activeSubscription && (updatedUser.subscriptionPlanId !== activeSubscription.planId || updatedUser.subscriptionStatus !== 'active')) {
        console.log(`Forcing manual update of user record...`);
        await db
          .update(users)
          .set({
            subscriptionStatus: 'active',
            subscriptionPlanId: activeSubscription.planId,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
        
        const forcedUser = await storage.getUser(userId);
        if (forcedUser) {
          console.log(`Forced user data:`, {
            id: forcedUser.id,
            username: forcedUser.username,
            subscriptionPlanId: forcedUser.subscriptionPlanId,
            subscriptionStatus: forcedUser.subscriptionStatus
          });
        }
      } else if (!activeSubscription && (updatedUser.subscriptionStatus !== 'none' || updatedUser.subscriptionPlanId !== null)) {
        console.log(`Forcing manual update to free plan...`);
        await db
          .update(users)
          .set({
            subscriptionStatus: 'none',
            subscriptionPlanId: null,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
        
        const forcedUser = await storage.getUser(userId);
        if (forcedUser) {
          console.log(`Forced user data:`, {
            id: forcedUser.id,
            username: forcedUser.username,
            subscriptionPlanId: forcedUser.subscriptionPlanId,
            subscriptionStatus: forcedUser.subscriptionStatus
          });
        }
      }
    } else {
      console.log(`No synchronization needed, user record matches subscription`);
    }
    
    // Verify access to features after sync
    const hasAccessPremium = await storage.userHasFeatureAccess(userId, "resume_templates_premium");
    console.log(`User has access to premium templates: ${hasAccessPremium}`);
    
    const hasAccessAts = await storage.userHasFeatureAccess(userId, "ats_score");
    console.log(`User has access to ATS score: ${hasAccessAts}`);
    
    console.log(`Done! User subscription synchronization complete.`);
  } catch (error) {
    console.error(`Error synchronizing user subscription:`, error);
  } finally {
    process.exit(0);
  }
}

syncUser(); 