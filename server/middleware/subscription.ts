import { NextFunction, Request, Response } from 'express';
import { db } from '../config/db';
import { eq, and, lt, gte } from 'drizzle-orm';
import { 
  featureUsage, 
  subscriptionPlans, 
  userSubscriptions, 
  tokenUsage
} from '@shared/schema';

// Feature keys
export enum FeatureKey {
  RESUMES = 'resumes',
  COVER_LETTERS = 'cover_letters',
  JOB_APPLICATIONS = 'job_applications',
  AI_TOKENS = 'ai_tokens',
  RESUME_AI = 'resume_ai',
  COVER_LETTER_AI = 'cover_letter_ai',
  JOB_DESCRIPTION_AI = 'job_description_ai',
  EXPORT_PDF = 'export_pdf',
  EXPORT_DOCX = 'export_docx',
  CUSTOM_TEMPLATES = 'custom_templates',
  ADVANCED_AI = 'advanced_ai'
}

/**
 * Get the current subscription plan for a user
 */
export async function getUserSubscription(userId: number) {
  // Check if user has an active subscription
  const subscription = await db.query.userSubscriptions.findFirst({
    where: and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, 'active')
    ),
    with: {
      plan: true
    }
  });

  // If no subscription, return the free tier plan
  if (!subscription) {
    const freePlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, 'Free')
    });
    
    if (!freePlan) {
      throw new Error('Free plan not found in database');
    }
    
    return {
      subscription: null,
      plan: freePlan
    };
  }
  
  return {
    subscription,
    plan: subscription.plan
  };
}

/**
 * Check if user has reached the limit for a specific feature
 */
export async function hasReachedLimit(userId: number, featureKey: FeatureKey): Promise<boolean> {
  try {
    const { plan } = await getUserSubscription(userId);
    
    if (!plan) {
      return true; // No plan means no access
    }
    
    // Get feature limits from the plan
    const limits = plan.features as Record<string, any>;
    
    // Check if feature is unlimited in this plan
    if (limits[featureKey] === -1) {
      return false; // Unlimited access
    }
    
    // Get current usage for this feature
    const usage = await db.query.featureUsage.findFirst({
      where: and(
        eq(featureUsage.userId, userId),
        eq(featureUsage.featureKey, featureKey),
        lt(featureUsage.billingCycleEnd, new Date())
      )
    });
    
    if (!usage) {
      return false; // No usage record yet, so limit not reached
    }
    
    // Check if usage is below the limit
    return usage.usageCount >= limits[featureKey];
  } catch (error) {
    console.error('Error checking feature limit:', error);
    return true; // On error, restrict access to be safe
  }
}

/**
 * Track the usage of a feature
 */
export async function trackFeatureUsage(userId: number, featureKey: FeatureKey) {
  try {
    const { subscription } = await getUserSubscription(userId);
    
    let billingCycleStart = new Date();
    let billingCycleEnd = new Date();
    
    // If user has a subscription, use its billing cycle
    if (subscription) {
      billingCycleStart = subscription.currentPeriodStart;
      billingCycleEnd = subscription.currentPeriodEnd;
    } else {
      // For free users, set a monthly cycle from today
      billingCycleEnd.setMonth(billingCycleEnd.getMonth() + 1);
    }
    
    // Check if there's already a usage record for this billing cycle
    const existingUsage = await db.query.featureUsage.findFirst({
      where: and(
        eq(featureUsage.userId, userId),
        eq(featureUsage.featureKey, featureKey),
        gte(featureUsage.billingCycleEnd, new Date())
      )
    });
    
    if (existingUsage) {
      // Update existing record
      await db.update(featureUsage)
        .set({
          usageCount: existingUsage.usageCount + 1,
          lastUsedAt: new Date()
        })
        .where(eq(featureUsage.id, existingUsage.id));
    } else {
      // Create new usage record
      await db.insert(featureUsage).values({
        userId,
        featureKey,
        usageCount: 1,
        lastUsedAt: new Date(),
        billingCycleStart,
        billingCycleEnd,
        resetAt: billingCycleEnd
      });
    }
  } catch (error) {
    console.error('Error tracking feature usage:', error);
  }
}

/**
 * Track token usage for AI features
 */
export async function trackTokenUsage(userId: number, featureKey: FeatureKey, tokensUsed: number, model: string) {
  try {
    await db.insert(tokenUsage).values({
      userId,
      featureKey,
      tokensUsed,
      model,
      timestamp: new Date()
    });
    
    // Also update the general AI tokens feature usage
    await trackFeatureUsage(userId, FeatureKey.AI_TOKENS);
  } catch (error) {
    console.error('Error tracking token usage:', error);
  }
}

/**
 * Check if user has access to a feature and hasn't reached limits
 */
export function checkFeatureAccess(featureKey: FeatureKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      
      // Get user subscription
      const { plan } = await getUserSubscription(userId);
      
      if (!plan) {
        return res.status(403).json({
          message: "No active subscription",
          code: "NO_SUBSCRIPTION"
        });
      }
      
      // Get feature limits from the plan
      const features = plan.features as Record<string, any>;
      
      // Check if this feature is included in the plan
      if (!(featureKey in features) || features[featureKey] === 0) {
        return res.status(403).json({
          message: `Feature not available in your plan`,
          code: "FEATURE_NOT_AVAILABLE",
          upgrade: true,
          feature: featureKey
        });
      }
      
      // Check if user has reached the limit
      const hasLimit = await hasReachedLimit(userId, featureKey);
      
      if (hasLimit) {
        return res.status(403).json({
          message: `You have reached the limit for this feature in your current plan`,
          code: "LIMIT_REACHED",
          upgrade: true,
          feature: featureKey
        });
      }
      
      // Track feature usage (for non-query operations)
      if (!req.method.toLowerCase().includes('get')) {
        await trackFeatureUsage(userId, featureKey);
      }
      
      next();
    } catch (error) {
      console.error('Error in checkFeatureAccess middleware:', error);
      return res.status(500).json({
        message: "Failed to check feature access",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
}

/**
 * Middleware factory for checking feature access in routes
 */
export function requireFeature(featureKey: FeatureKey) {
  return checkFeatureAccess(featureKey);
} 