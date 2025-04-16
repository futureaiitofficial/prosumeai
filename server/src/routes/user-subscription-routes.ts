import express from 'express';
import { db } from '../../config/db';
import { requireUser } from '../../middleware/auth';
import { 
  subscriptionPlans, 
  userSubscriptions,
  featureUsage
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getUserSubscription, FeatureKey } from '../../middleware/subscription';

/**
 * Register user subscription routes
 */
export function registerUserSubscriptionRoutes(app: express.Express) {
  // Get current user's subscription
  app.get('/api/user/subscription', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      
      // Get user's active subscription with plan details
      const subscription = await db.select({
        id: userSubscriptions.id,
        userId: userSubscriptions.userId,
        planId: userSubscriptions.planId,
        planName: subscriptionPlans.name,
        planFeatures: subscriptionPlans.features,
        status: userSubscriptions.status,
        currentPeriodStart: userSubscriptions.currentPeriodStart,
        currentPeriodEnd: userSubscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: userSubscriptions.cancelAtPeriodEnd,
        createdAt: userSubscriptions.createdAt
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active')
        )
      );
      
      if (!subscription || subscription.length === 0) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      res.json(subscription[0]);
    } catch (error: any) {
      console.error('Error getting user subscription:', error);
      res.status(500).json({ 
        message: "Failed to get subscription information", 
        error: error.message 
      });
    }
  });
  
  // Get feature usage
  app.get('/api/user/feature-usage', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      
      // Get user's subscription to determine limits
      const { plan, subscription } = await getUserSubscription(userId);
      
      if (!plan) {
        return res.status(404).json({ message: "No subscription plan found" });
      }
      
      // Get feature limits from plan
      const limits = plan.features as Record<string, any>;
      
      // Get current usage for main features
      const usageRecords = await db.select()
        .from(featureUsage)
        .where(eq(featureUsage.userId, userId));
      
      // Map usage records to a more user-friendly format
      const mappedUsage = Object.values(FeatureKey)
        .filter(key => key !== FeatureKey.EXPORT_PDF && key !== FeatureKey.EXPORT_DOCX)
        .map(featureKey => {
          const record = usageRecords.find(r => r.featureKey === featureKey);
          
          return {
            feature: featureKey,
            used: record?.usageCount || 0,
            limit: limits[featureKey] || 0,
            resetDate: record?.resetAt || (
              subscription ? subscription.currentPeriodEnd : new Date()
            )
          };
        })
        .filter(item => item.limit !== 0); // Only include features the user has access to
      
      res.json(mappedUsage);
    } catch (error: any) {
      console.error('Error getting feature usage:', error);
      res.status(500).json({ 
        message: "Failed to get feature usage information", 
        error: error.message 
      });
    }
  });
  
  // Cancel subscription
  app.post('/api/user/cancel-subscription', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      
      // Find active subscription
      const existingSubscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active')
        )
      });
      
      if (!existingSubscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      // Mark subscription to cancel at period end
      const [updatedSubscription] = await db.update(userSubscriptions)
        .set({
          cancelAtPeriodEnd: true,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, existingSubscription.id))
        .returning();
      
      res.json({
        message: "Subscription will be cancelled at the end of the billing period",
        subscription: updatedSubscription
      });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ 
        message: "Failed to cancel subscription", 
        error: error.message 
      });
    }
  });
  
  // Change subscription plan
  app.post('/api/user/change-plan', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      // Check if plan exists
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId)
      });
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Check if user has an active subscription
      const existingSubscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active')
        )
      });
      
      if (existingSubscription) {
        // If already subscribed to this plan, just return success
        if (existingSubscription.planId === planId) {
          return res.json({
            message: "Already subscribed to this plan",
            subscription: existingSubscription
          });
        }
        
        // Update existing subscription
        const [updatedSubscription] = await db.update(userSubscriptions)
          .set({
            planId,
            cancelAtPeriodEnd: false, // Reset in case they were cancelling
            updatedAt: new Date()
          })
          .where(eq(userSubscriptions.id, existingSubscription.id))
          .returning();
        
        return res.json({
          message: "Subscription plan updated successfully",
          subscription: updatedSubscription
        });
      } else {
        // Create new subscription
        // Calculate period dates
        const now = new Date();
        let periodEnd = new Date();
        
        if (plan.interval === 'monthly') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else if (plan.interval === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }
        
        // In a real implementation, you would integrate with a payment processor here
        
        const [newSubscription] = await db.insert(userSubscriptions)
          .values({
            userId,
            planId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            paymentProcessor: 'demo', // This would be your payment processor in production
            paymentProcessorId: 'demo-' + Date.now(), // This would be the payment ID from your processor
          })
          .returning();
        
        return res.json({
          message: "Subscription created successfully",
          subscription: newSubscription
        });
      }
    } catch (error: any) {
      console.error('Error changing subscription plan:', error);
      res.status(500).json({ 
        message: "Failed to change subscription plan", 
        error: error.message 
      });
    }
  });
  
  // Get available subscription plans
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const plans = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true));
      
      res.json(plans);
    } catch (error: any) {
      console.error('Error getting subscription plans:', error);
      res.status(500).json({ 
        message: "Failed to get subscription plans", 
        error: error.message 
      });
    }
  });
} 