import express from 'express';
import { db } from '../config/db';
import { userSubscriptions, planFeatures, features, featureUsage } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Middleware to check if user has access to a specific feature
 * @param featureCode The code of the feature to check access for
 */
export const requireFeatureAccess = (featureCode: string) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;

      // Get feature details
      const feature = await db.select()
        .from(features)
        .where(eq(features.code, featureCode))
        .limit(1);

      if (!feature.length) {
        return res.status(404).json({ message: 'Feature not found' });
      }

      // Get user's active subscription
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE')
        ))
        .limit(1);

      if (!subscription.length) {
        return res.status(403).json({ message: 'No active subscription found' });
      }

      // Get plan features for the user's subscription plan
      const planFeature = await db.select()
        .from(planFeatures)
        .where(and(
          eq(planFeatures.planId, subscription[0].planId),
          eq(planFeatures.featureId, feature[0].id)
        ))
        .limit(1);

      if (!planFeature.length) {
        // Check if this is an essential feature that should be available to all plans
        if (feature[0].featureType === 'ESSENTIAL') {
          next();
          return;
        }
        return res.status(403).json({ message: 'Feature not available in your subscription plan' });
      }

      // Handle different limit types
      if (planFeature[0].limitType === 'UNLIMITED') {
        // User has unlimited access to this feature
        next();
        return;
      } else if (planFeature[0].limitType === 'BOOLEAN') {
        // For boolean features, check if the feature is enabled
        if (!planFeature[0].isEnabled) {
          return res.status(403).json({ message: 'Feature is not enabled in your subscription plan' });
        }
        next();
        return;
      } else if (planFeature[0].limitType === 'COUNT') {
        // For countable features, check usage limits
        const usage = await db.select()
          .from(featureUsage)
          .where(and(
            eq(featureUsage.userId, userId),
            eq(featureUsage.featureId, feature[0].id)
          ))
          .limit(1);

        if (usage.length && planFeature[0].limitValue !== null) {
          // Check if we need to reset usage based on reset frequency
          const shouldReset = needsReset(usage[0].resetDate, planFeature[0].resetFrequency);
          
          if (shouldReset) {
            // Reset usage count
            await db.update(featureUsage)
              .set({ 
                usageCount: 0, 
                aiTokenCount: 0,
                resetDate: new Date() 
              })
              .where(eq(featureUsage.id, usage[0].id));
            
            // Allow access after reset
            next();
            return;
          }

          // Check if token-based or count-based feature
          if (feature[0].isTokenBased) {
            // Token-based feature (AI features)
            if (planFeature[0].limitValue !== null && 
                usage[0].aiTokenCount !== null && 
                usage[0].aiTokenCount !== undefined && 
                usage[0].aiTokenCount >= (planFeature[0].limitValue || 0)) {
              return res.status(403).json({ 
                message: 'Token usage limit exceeded',
                limit: planFeature[0].limitValue,
                current: usage[0].aiTokenCount,
                resetFrequency: planFeature[0].resetFrequency
              });
            }
          } else {
            // Regular count-based feature
            if (planFeature[0].limitValue !== null && usage[0].usageCount >= planFeature[0].limitValue) {
              return res.status(403).json({ 
                message: 'Feature usage limit exceeded',
                limit: planFeature[0].limitValue,
                current: usage[0].usageCount,
                resetFrequency: planFeature[0].resetFrequency
              });
            }
          }
        }
      }

      // If all checks pass, allow access
      next();
    } catch (error: any) {
      console.error(`Error in feature access middleware for feature ${featureCode}:`, error);
      res.status(500).json({ 
        message: 'Error checking feature access', 
        error: error.message 
      });
    }
  };
};

/**
 * Middleware to track feature usage
 * @param featureCode The code of the feature to track usage for
 */
export const trackFeatureUsage = (featureCode: string) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      if (!req.user) {
        return next();
      }
      const userId = req.user.id;

      // Get feature
      const feature = await db.select()
        .from(features)
        .where(eq(features.code, featureCode))
        .limit(1);

      if (!feature.length) {
        console.error(`Feature ${featureCode} not found for usage tracking`);
        return next();
      }

      // Only track if feature is countable and not token-based
      // Token-based features are tracked separately in the AI routes
      if (feature[0].isCountable && !feature[0].isTokenBased) {
        const now = new Date();
        const usage = await db.select()
          .from(featureUsage)
          .where(and(
            eq(featureUsage.userId, userId),
            eq(featureUsage.featureId, feature[0].id)
          ))
          .limit(1);

        if (usage.length) {
          // Update existing usage record
          await db.update(featureUsage)
            .set({
              usageCount: usage[0].usageCount + 1,
              lastUsed: now
            })
            .where(eq(featureUsage.id, usage[0].id));
        } else {
          // Create new usage record
          await db.insert(featureUsage)
            .values({
              userId: userId,
              featureId: feature[0].id,
              usageCount: 1,
              aiTokenCount: 0,
              lastUsed: now
            });
        }
      }

      next();
    } catch (error: any) {
      console.error(`Error in feature usage tracking for feature ${featureCode}:`, error);
      next();
    }
  };
};

/**
 * Check if usage needs to be reset based on reset frequency
 * @param resetDate The last reset date
 * @param resetFrequency The reset frequency
 */
function needsReset(resetDate: Date | null, resetFrequency: string | null): boolean {
  if (!resetDate || !resetFrequency || resetFrequency === 'NEVER') {
    return false;
  }

  const now = new Date();
  const lastReset = new Date(resetDate);

  switch (resetFrequency) {
    case 'DAILY':
      // Reset if it's a different day
      return now.getDate() !== lastReset.getDate() || 
             now.getMonth() !== lastReset.getMonth() || 
             now.getFullYear() !== lastReset.getFullYear();
    
    case 'WEEKLY':
      // Reset if it's been a week
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      return now.getTime() - lastReset.getTime() >= oneWeek;
    
    case 'MONTHLY':
      // Reset if it's a different month
      return now.getMonth() !== lastReset.getMonth() || 
             now.getFullYear() !== lastReset.getFullYear();
    
    case 'YEARLY':
      // Reset if it's a different year
      return now.getFullYear() !== lastReset.getFullYear();
    
    default:
      return false;
  }
} 