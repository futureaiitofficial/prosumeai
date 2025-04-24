import express from 'express';
import { requireUser, requireAdmin } from '../../middleware/auth';
import { db } from '../../config/db';
import { subscriptionPlans, features, planFeatures, userSubscriptions, featureUsage, paymentTransactions, disputes, planPricing, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Register subscription routes
 */
export function registerSubscriptionRoutes(app: express.Express) {
  // Subscription Plans Management (Admin Only)
  app.get('/api/admin/subscription-plans', requireAdmin, async (req, res) => {
    try {
      const plans = await db.select().from(subscriptionPlans);
      const pricing = await db.select().from(planPricing);
      const plansWithPricing = plans.map(plan => {
        const planPricingData = pricing.filter(price => price.planId === plan.id);
        return { ...plan, pricing: planPricingData };
      });
      res.json(plansWithPricing);
    } catch (error: any) {
      console.error('Error in GET /api/admin/subscription-plans:', error);
      res.status(500).json({ 
        message: 'Failed to fetch subscription plans', 
        error: error.message 
      });
    }
  });

  app.post('/api/admin/subscription-plans', requireAdmin, async (req, res) => {
    try {
      const planData = req.body;
      // Explicitly define fields to insert to avoid any outdated schema issues
      const sanitizedPlanData = {
        name: planData.name,
        description: planData.description,
        price: '0.00',
        billingCycle: planData.billingCycle,
        isFeatured: planData.isFeatured || false,
        isFreemium: planData.isFreemium || false,
        active: planData.active || false
      };
      const newPlan = await db.insert(subscriptionPlans).values(sanitizedPlanData).returning();
      const planId = newPlan[0].id;
      
      // Add pricing for Global (USD) if provided
      if (planData.usdPrice) {
        await db.insert(planPricing).values({
          planId: planId,
          targetRegion: 'GLOBAL',
          currency: 'USD',
          price: planData.usdPrice
        });
      }
      
      // Add pricing for India (INR) if provided
      if (planData.inrPrice) {
        await db.insert(planPricing).values({
          planId: planId,
          targetRegion: 'INDIA',
          currency: 'INR',
          price: planData.inrPrice
        });
      }
      
      // Fetch the updated plan with pricing
      const updatedPlan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
      const pricing = await db.select().from(planPricing).where(eq(planPricing.planId, planId));
      res.status(201).json({ ...updatedPlan[0], pricing });
    } catch (error: any) {
      console.error('Error in POST /api/admin/subscription-plans:', error);
      res.status(500).json({ 
        message: 'Failed to create subscription plan', 
        error: error.message 
      });
    }
  });

  app.post('/api/admin/plan-pricing', requireAdmin, async (req, res) => {
    try {
      const pricingData = req.body;
      // Check if a pricing record already exists for this plan and region
      const existingPricing = await db.select().from(planPricing)
        .where(and(eq(planPricing.planId, pricingData.planId), eq(planPricing.targetRegion, pricingData.targetRegion)))
        .limit(1);
      if (existingPricing.length > 0) {
        return res.status(400).json({ message: 'Pricing for this region already exists for the selected plan' });
      }
      const newPricing = await db.insert(planPricing).values(pricingData).returning();
      res.status(201).json(newPricing);
    } catch (error: any) {
      console.error('Error in POST /api/admin/plan-pricing:', error);
      res.status(500).json({ 
        message: 'Failed to create plan pricing', 
        error: error.message 
      });
    }
  });

  app.patch('/api/admin/subscription-plans/:id', requireAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }
      const updateData = req.body;
      const updatedPlan = await db.update(subscriptionPlans)
        .set(updateData)
        .where(eq(subscriptionPlans.id, planId))
        .returning();
      if (!updatedPlan.length) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      res.json(updatedPlan[0]);
    } catch (error: any) {
      console.error(`Error in PATCH /api/admin/subscription-plans/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to update subscription plan', 
        error: error.message 
      });
    }
  });

  app.delete('/api/admin/subscription-plans/:id', requireAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }
      console.log(`Deleting related records for plan ID: ${planId}`);
      // First delete related records in plan_pricing
      const pricingDeleted = await db.delete(planPricing).where(eq(planPricing.planId, planId));
      console.log(`Deleted plan_pricing records for plan ID: ${planId}`);
      // Then delete related records in plan_features
      const featuresDeleted = await db.delete(planFeatures).where(eq(planFeatures.planId, planId));
      console.log(`Deleted plan_features records for plan ID: ${planId}`);
      // Check for any user subscriptions referencing this plan
      const subscriptions = await db.select().from(userSubscriptions).where(eq(userSubscriptions.planId, planId));
      if (subscriptions.length > 0) {
        return res.status(400).json({ message: 'Cannot delete plan with active user subscriptions' });
      }
      console.log(`No active subscriptions found for plan ID: ${planId}, proceeding with deletion`);
      // Finally delete the plan
      const deleted = await db.delete(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
      console.log(`Deleted plan ID: ${planId}`);
      res.json({ message: 'Plan deleted successfully', id: planId });
    } catch (error: any) {
      console.error(`Error in DELETE /api/admin/subscription-plans/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to delete subscription plan', 
        error: error.message 
      });
    }
  });

  // Features Management (Admin Only)
  app.get('/api/admin/features', requireAdmin, async (req, res) => {
    try {
      const featureList = await db.select().from(features);
      res.json(featureList);
    } catch (error: any) {
      console.error('Error in GET /api/admin/features:', error);
      res.status(500).json({ 
        message: 'Failed to fetch features', 
        error: error.message 
      });
    }
  });

  app.post('/api/admin/features', requireAdmin, async (req, res) => {
    try {
      const featureData = req.body;
      // Omit id from the data to let the database assign an auto-incremented value
      const { id, ...featureDataWithoutId } = featureData;
      // Ensure isTokenBased is set to false if not provided
      featureDataWithoutId.isTokenBased = featureDataWithoutId.isTokenBased || false;
      const newFeature = await db.insert(features).values(featureDataWithoutId).returning();
      res.status(201).json(newFeature);
    } catch (error: any) {
      console.error('Error in POST /api/admin/features:', error);
      res.status(500).json({ 
        message: 'Failed to create feature', 
        error: error.message 
      });
    }
  });

  app.patch('/api/admin/features/:id', requireAdmin, async (req, res) => {
    try {
      const featureId = parseInt(req.params.id);
      if (isNaN(featureId)) {
        return res.status(400).json({ message: 'Invalid feature ID' });
      }
      const updateData = req.body;
      const updatedFeature = await db.update(features)
        .set(updateData)
        .where(eq(features.id, featureId))
        .returning();
      if (!updatedFeature.length) {
        return res.status(404).json({ message: 'Feature not found' });
      }
      res.json(updatedFeature[0]);
    } catch (error: any) {
      console.error(`Error in PATCH /api/admin/features/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to update feature', 
        error: error.message 
      });
    }
  });

  app.delete('/api/admin/features/:id', requireAdmin, async (req, res) => {
    try {
      const featureId = parseInt(req.params.id);
      if (isNaN(featureId)) {
        return res.status(400).json({ message: 'Invalid feature ID' });
      }
      const deleted = await db.delete(features)
        .where(eq(features.id, featureId));
      res.json({ message: 'Feature deleted successfully', id: featureId });
    } catch (error: any) {
      console.error(`Error in DELETE /api/admin/features/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to delete feature', 
        error: error.message 
      });
    }
  });

  // Plan Features Management (Admin Only)
  app.get('/api/admin/plan-features', requireAdmin, async (req, res) => {
    try {
      const planFeatureList = await db.select().from(planFeatures);
      res.json(planFeatureList);
    } catch (error: any) {
      console.error('Error in GET /api/admin/plan-features:', error);
      res.status(500).json({ 
        message: 'Failed to fetch plan features', 
        error: error.message 
      });
    }
  });

  app.post('/api/admin/plan-features', requireAdmin, async (req, res) => {
    try {
      const planFeatureData = req.body;
      const newPlanFeature = await db.insert(planFeatures).values(planFeatureData).returning();
      res.status(201).json(newPlanFeature);
    } catch (error: any) {
      console.error('Error in POST /api/admin/plan-features:', error);
      res.status(500).json({ 
        message: 'Failed to create plan feature', 
        error: error.message 
      });
    }
  });

  app.patch('/api/admin/plan-features/:id', requireAdmin, async (req, res) => {
    try {
      const planFeatureId = parseInt(req.params.id);
      if (isNaN(planFeatureId)) {
        return res.status(400).json({ message: 'Invalid plan feature ID' });
      }
      const updateData = req.body;
      const updatedPlanFeature = await db.update(planFeatures)
        .set(updateData)
        .where(eq(planFeatures.id, planFeatureId))
        .returning();
      if (!updatedPlanFeature.length) {
        return res.status(404).json({ message: 'Plan feature not found' });
      }
      res.json(updatedPlanFeature[0]);
    } catch (error: any) {
      console.error(`Error in PATCH /api/admin/plan-features/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to update plan feature', 
        error: error.message 
      });
    }
  });

  app.delete('/api/admin/plan-features/:id', requireAdmin, async (req, res) => {
    try {
      const planFeatureId = parseInt(req.params.id);
      if (isNaN(planFeatureId)) {
        return res.status(400).json({ message: 'Invalid plan feature ID' });
      }
      const deleted = await db.delete(planFeatures)
        .where(eq(planFeatures.id, planFeatureId));
      res.json({ message: 'Plan feature deleted successfully', id: planFeatureId });
    } catch (error: any) {
      console.error(`Error in DELETE /api/admin/plan-features/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to delete plan feature', 
        error: error.message 
      });
    }
  });

  // User Subscriptions Management (Admin and User)
  app.get('/api/user/subscription', requireUser, async (req, res) => {
    try {
      // Set cache control headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      
      // Get user's active subscription with plan details
      const subscriptions = await db
        .select({
          id: userSubscriptions.id,
          userId: userSubscriptions.userId,
          planId: userSubscriptions.planId,
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate,
          status: userSubscriptions.status,
          autoRenew: userSubscriptions.autoRenew,
          planName: subscriptionPlans.name,
          planDescription: subscriptionPlans.description,
          billingCycle: subscriptionPlans.billingCycle
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE')
        ));
      
      console.log(`Returning fresh subscription data for user ${userId}: ${JSON.stringify(subscriptions)}`);
      
      // Return the active subscription or an empty array
      res.json(subscriptions);
    } catch (error: any) {
      console.error('Error in GET /api/user/subscription:', error);
      res.status(500).json({ 
        message: 'Failed to fetch user subscription', 
        error: error.message 
      });
    }
  });

  // Get all subscriptions for a user (for debugging)
  app.get('/api/user/all-subscriptions', requireUser, async (req, res) => {
    try {
      // Set cache control headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      
      // Get all user's subscriptions with plan details
      const subscriptions = await db
        .select({
          id: userSubscriptions.id,
          userId: userSubscriptions.userId,
          planId: userSubscriptions.planId,
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate,
          status: userSubscriptions.status,
          autoRenew: userSubscriptions.autoRenew,
          createdAt: userSubscriptions.createdAt,
          updatedAt: userSubscriptions.updatedAt,
          planName: subscriptionPlans.name,
          planDescription: subscriptionPlans.description,
          billingCycle: subscriptionPlans.billingCycle
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userSubscriptions.userId, userId))
        .orderBy(userSubscriptions.createdAt);
      
      console.log(`Found ${subscriptions.length} total subscriptions for user ${userId}`);
      
      res.json(subscriptions);
    } catch (error: any) {
      console.error('Error in GET /api/user/all-subscriptions:', error);
      res.status(500).json({ 
        message: 'Failed to fetch user subscriptions', 
        error: error.message 
      });
    }
  });
  
  // Debugging route to check plan features directly
  app.get('/api/debug/plan-features/:planId', async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }
      
      // Get plan details
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
      if (!plan.length) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      // Get all features for this plan
      const planFeaturesData = await db
        .select({
          id: planFeatures.id,
          planId: planFeatures.planId,
          featureId: planFeatures.featureId,
          limitType: planFeatures.limitType,
          limitValue: planFeatures.limitValue,
          resetFrequency: planFeatures.resetFrequency,
          isEnabled: planFeatures.isEnabled,
          featureName: features.name,
          featureCode: features.code,
          featureDescription: features.description,
          featureType: features.featureType,
          isTokenBased: features.isTokenBased
        })
        .from(planFeatures)
        .innerJoin(features, eq(planFeatures.featureId, features.id))
        .where(eq(planFeatures.planId, planId));
        
      console.log(`Found ${planFeaturesData.length} features for plan ${planId} (${plan[0].name})`);
      
      // Return all the data
      res.json({
        plan: plan[0],
        features: planFeaturesData,
        featureCount: planFeaturesData.length
      });
    } catch (error: any) {
      console.error(`Error in GET /api/debug/plan-features/${req.params.planId}:`, error);
      res.status(500).json({ 
        message: 'Failed to fetch plan features', 
        error: error.message 
      });
    }
  });

  // Get accessible features for a user's subscription plan
  app.get('/api/user/features', requireUser, async (req, res) => {
    try {
      // Set cache-control headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      // Get user's active subscription
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(and(eq(userSubscriptions.userId, userId), eq(userSubscriptions.status, 'ACTIVE')))
        .limit(1);
      if (!userSubscription.length) {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      const planId = userSubscription[0].planId;
      // Get the plan details to determine tier
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
      if (!plan.length) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }
      const planName = plan[0].name.toLowerCase();
      // Determine plan tier based on name or other criteria
      let planTier = 'basic';
      if (planName.includes('pro') || planName.includes('advanced')) {
        planTier = 'pro';
      } else if (planName.includes('professional') || planName.includes('enterprise')) {
        planTier = 'professional';
      }
      // Fetch feature usage for the user
      const usageData = await db
        .select({
          featureId: featureUsage.featureId,
          usageCount: featureUsage.usageCount,
          aiTokenCount: featureUsage.aiTokenCount,
          resetDate: featureUsage.resetDate
        })
        .from(featureUsage)
        .where(eq(featureUsage.userId, userId));
      const usageMap = new Map<number, { usageCount: number; aiTokenCount: number; resetDate: Date | null }>();
      usageData.forEach(usage => {
        usageMap.set(usage.featureId, {
          usageCount: usage.usageCount,
          aiTokenCount: usage.aiTokenCount || 0,
          resetDate: usage.resetDate
        });
      });
      // Fetch all features with explicit mapping in plan_features for the user's plan
      const planFeaturesData = await db
        .select({
          featureId: planFeatures.featureId,
          planId: planFeatures.planId,
          limitType: planFeatures.limitType,
          limitValue: planFeatures.limitValue,
          resetFrequency: planFeatures.resetFrequency,
          isEnabled: planFeatures.isEnabled,
          featureName: features.name,
          featureCode: features.code,
          featureType: features.featureType,
          isTokenBased: features.isTokenBased,
          featureDescription: features.description
        })
        .from(planFeatures)
        .innerJoin(features, eq(planFeatures.featureId, features.id))
        .where(eq(planFeatures.planId, planId));
      // Build the feature access list
      const featuresAccess = planFeaturesData.map(pf => {
        const usage = usageMap.get(pf.featureId);
        const isResetNeeded = usage && usage.resetDate && usage.resetDate < new Date();
        const currentUsage = isResetNeeded ? 0 : (usage?.usageCount || 0);
        const currentTokenUsage = isResetNeeded ? 0 : (usage?.aiTokenCount || 0);
        let hasAccess = false;
        if (pf.limitType === 'BOOLEAN') {
          hasAccess = pf.isEnabled;
        } else if (pf.limitType === 'UNLIMITED') {
          hasAccess = true;
        } else if (pf.limitType === 'COUNT') {
          if (pf.isTokenBased) {
            hasAccess = pf.limitValue !== null && currentTokenUsage < (pf.limitValue || 0);
          } else {
            hasAccess = pf.limitValue !== null && currentUsage < (pf.limitValue || 0);
          }
        }
        return {
          featureId: pf.featureId,
          featureName: pf.featureName,
          featureCode: pf.featureCode,
          featureType: pf.featureType,
          description: pf.featureDescription || '',
          hasAccess,
          limitType: pf.limitType,
          limitValue: pf.limitValue,
          isEnabled: pf.isEnabled,
          currentUsage: pf.isTokenBased ? currentTokenUsage : currentUsage,
          resetFrequency: pf.resetFrequency,
          resetDate: usage?.resetDate || null,
          isTokenBased: pf.isTokenBased || false,
          aiTokenCount: currentTokenUsage
        };
      });
      // Do not include additional features that are not explicitly mapped to the plan
      const allAccessibleFeatures = [...featuresAccess];
      res.json(allAccessibleFeatures);
    } catch (error: any) {
      console.error('Error in GET /api/user/features:', error);
      res.status(500).json({ 
        message: 'Failed to fetch user features', 
        error: error.message 
      });
    }
  });

  app.get('/api/admin/user-subscriptions', requireAdmin, async (req, res) => {
    try {
      // Join with users and subscription plans to get more complete data
      const subscriptions = await db
        .select({
          id: userSubscriptions.id,
          userId: userSubscriptions.userId,
          planId: userSubscriptions.planId,
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate,
          status: userSubscriptions.status,
          autoRenew: userSubscriptions.autoRenew,
          paymentGateway: userSubscriptions.paymentGateway,
          paymentReference: userSubscriptions.paymentReference,
          createdAt: userSubscriptions.createdAt,
          updatedAt: userSubscriptions.updatedAt,
          userName: users.username,
          userEmail: users.email,
          planName: subscriptionPlans.name,
          planActive: subscriptionPlans.active,
          planFreemium: subscriptionPlans.isFreemium
        })
        .from(userSubscriptions)
        .leftJoin(users, eq(userSubscriptions.userId, users.id))
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id));
        
      res.json(subscriptions);
    } catch (error: any) {
      console.error('Error in GET /api/admin/user-subscriptions:', error);
      res.status(500).json({ 
        message: 'Failed to fetch user subscriptions', 
        error: error.message 
      });
    }
  });

  app.post('/api/admin/user-subscriptions', requireAdmin, async (req, res) => {
    try {
      const subscriptionData = req.body;
      const newSubscription = await db.insert(userSubscriptions).values(subscriptionData).returning();
      res.status(201).json(newSubscription);
    } catch (error: any) {
      console.error('Error in POST /api/admin/user-subscriptions:', error);
      res.status(500).json({ 
        message: 'Failed to create user subscription', 
        error: error.message 
      });
    }
  });

  app.patch('/api/admin/user-subscriptions/:id', requireAdmin, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ message: 'Invalid subscription ID' });
      }
      const updateData = req.body;
      const updatedSubscription = await db.update(userSubscriptions)
        .set(updateData)
        .where(eq(userSubscriptions.id, subscriptionId))
        .returning();
      if (!updatedSubscription.length) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      res.json(updatedSubscription[0]);
    } catch (error: any) {
      console.error(`Error in PATCH /api/admin/user-subscriptions/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to update user subscription', 
        error: error.message 
      });
    }
  });

  // Feature Usage (Admin and User)
  app.get('/api/user/feature-usage', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      const usage = await db.select().from(featureUsage).where(eq(featureUsage.userId, userId));
      res.json(usage);
    } catch (error: any) {
      console.error('Error in GET /api/user/feature-usage:', error);
      res.status(500).json({ 
        message: 'Failed to fetch feature usage', 
        error: error.message 
      });
    }
  });

  app.get('/api/admin/feature-usage', requireAdmin, async (req, res) => {
    try {
      const usage = await db.select().from(featureUsage);
      res.json(usage);
    } catch (error: any) {
      console.error('Error in GET /api/admin/feature-usage:', error);
      res.status(500).json({ 
        message: 'Failed to fetch feature usage', 
        error: error.message 
      });
    }
  });

  // Payment Transactions (Admin and User)
  app.get('/api/user/payment-transactions', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      const transactions = await db.select().from(paymentTransactions).where(eq(paymentTransactions.userId, userId));
      res.json(transactions);
    } catch (error: any) {
      console.error('Error in GET /api/user/payment-transactions:', error);
      res.status(500).json({ 
        message: 'Failed to fetch payment transactions', 
        error: error.message 
      });
    }
  });

  app.get('/api/admin/payment-transactions', requireAdmin, async (req, res) => {
    try {
      const transactions = await db.select().from(paymentTransactions);
      res.json(transactions);
    } catch (error: any) {
      console.error('Error in GET /api/admin/payment-transactions:', error);
      res.status(500).json({ 
        message: 'Failed to fetch payment transactions', 
        error: error.message 
      });
    }
  });

  app.post('/api/admin/payment-transactions', requireAdmin, async (req, res) => {
    try {
      const transactionData = req.body;
      const newTransaction = await db.insert(paymentTransactions).values(transactionData).returning();
      res.status(201).json(newTransaction);
    } catch (error: any) {
      console.error('Error in POST /api/admin/payment-transactions:', error);
      res.status(500).json({ 
        message: 'Failed to create payment transaction', 
        error: error.message 
      });
    }
  });

  // Disputes (Admin and User)
  app.get('/api/user/disputes', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      const userDisputes = await db.select().from(disputes).where(eq(disputes.userId, userId));
      res.json(userDisputes);
    } catch (error: any) {
      console.error('Error in GET /api/user/disputes:', error);
      res.status(500).json({ 
        message: 'Failed to fetch disputes', 
        error: error.message 
      });
    }
  });

  app.get('/api/admin/disputes', requireAdmin, async (req, res) => {
    try {
      const allDisputes = await db.select().from(disputes);
      res.json(allDisputes);
    } catch (error: any) {
      console.error('Error in GET /api/admin/disputes:', error);
      res.status(500).json({ 
        message: 'Failed to fetch disputes', 
        error: error.message 
      });
    }
  });

  app.post('/api/user/disputes', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const disputeData = { ...req.body, userId: req.user.id };
      const newDispute = await db.insert(disputes).values(disputeData).returning();
      res.status(201).json(newDispute);
    } catch (error: any) {
      console.error('Error in POST /api/user/disputes:', error);
      res.status(500).json({ 
        message: 'Failed to create dispute', 
        error: error.message 
      });
    }
  });

  app.patch('/api/admin/disputes/:id', requireAdmin, async (req, res) => {
    try {
      const disputeId = parseInt(req.params.id);
      if (isNaN(disputeId)) {
        return res.status(400).json({ message: 'Invalid dispute ID' });
      }
      const updateData = req.body;
      const updatedDispute = await db.update(disputes)
        .set(updateData)
        .where(eq(disputes.id, disputeId))
        .returning();
      if (!updatedDispute.length) {
        return res.status(404).json({ message: 'Dispute not found' });
      }
      res.json(updatedDispute[0]);
    } catch (error: any) {
      console.error(`Error in PATCH /api/admin/disputes/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to update dispute', 
        error: error.message 
      });
    }
  });

  app.post('/api/user/subscription/upgrade', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      const { planId } = req.body;
      if (!planId || isNaN(planId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }
      // Check if plan exists and is active
      const plan = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.active, true))).limit(1);
      if (!plan.length) {
        return res.status(404).json({ message: 'Plan not found or not active' });
      }
      // Check current subscription
      const currentSubscription = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);
      let newSubscription;
      const now = new Date();
      const endDate = new Date(now);
      
      // Set end date based on billing cycle
      if (plan[0].billingCycle === 'YEARLY') {
        // For yearly plans, add 1 year
        endDate.setFullYear(now.getFullYear() + 1);
      } else if (plan[0].billingCycle === 'MONTHLY') {
        // For monthly plans, add 1 month
        endDate.setMonth(now.getMonth() + 1);
      } else if (plan[0].billingCycle === 'WEEKLY') {
        // For weekly plans, add 7 days
        endDate.setDate(now.getDate() + 7);
      } else if (plan[0].billingCycle === 'DAILY') {
        // For daily plans, add 1 day
        endDate.setDate(now.getDate() + 1);
      }
      
      console.log(`Creating subscription with billing cycle ${plan[0].billingCycle}:`, {
        startDate: now.toISOString(),
        endDate: endDate.toISOString()
      });

      if (currentSubscription.length) {
        // Update existing subscription
        newSubscription = await db.update(userSubscriptions)
          .set({
            planId,
            startDate: now,
            endDate: endDate,
            status: 'ACTIVE',
            previousPlanId: currentSubscription[0].planId
          })
          .where(eq(userSubscriptions.id, currentSubscription[0].id))
          .returning();
      } else {
        // Create new subscription
        newSubscription = await db.insert(userSubscriptions)
          .values([{
            userId,
            planId,
            startDate: now,
            endDate: endDate,
            status: 'ACTIVE',
            paymentGateway: 'STRIPE',
            autoRenew: false
          }])
          .returning();
      }
      res.status(201).json(newSubscription[0]);
    } catch (error: any) {
      console.error('Error in POST /api/user/subscription/upgrade:', error);
      res.status(500).json({ 
        message: 'Failed to upgrade subscription', 
        error: error.message 
      });
    }
  });

  app.post('/api/user/subscription/cancel', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      const currentSubscription = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);
      if (!currentSubscription.length) {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      if (currentSubscription[0].status === 'CANCELLED') {
        return res.status(400).json({ message: 'Subscription already cancelled' });
      }
      await db.update(userSubscriptions)
        .set({ status: 'CANCELLED' })
        .where(eq(userSubscriptions.id, currentSubscription[0].id));
      res.json({ message: 'Subscription cancelled successfully' });
    } catch (error: any) {
      console.error('Error in POST /api/user/subscription/cancel:', error);
      res.status(500).json({ 
        message: 'Failed to cancel subscription', 
        error: error.message 
      });
    }
  });

  // User endpoint to fix their own subscription end date
  app.post('/api/user/subscription/fix-dates', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      
      // Get the user's active subscription with plan details
      const subscriptionData = await db
        .select({
          id: userSubscriptions.id,
          planId: userSubscriptions.planId,
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate,
          status: userSubscriptions.status,
          billingCycle: subscriptionPlans.billingCycle
        })
        .from(userSubscriptions)
        .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE')
        ))
        .limit(1);
      
      if (!subscriptionData.length) {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      
      const subscription = subscriptionData[0];
      
      // Only proceed if it's a monthly subscription
      if (subscription.billingCycle !== 'MONTHLY') {
        return res.status(400).json({ 
          message: 'This operation is only available for monthly subscriptions',
          billingCycle: subscription.billingCycle
        });
      }
      
      const startDate = new Date(subscription.startDate);
      const endDate = new Date(subscription.endDate);
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If the end date is more than 60 days away from start date for a monthly subscription, it's incorrect
      if (daysDiff <= 60) {
        return res.status(200).json({ 
          message: 'Your subscription dates are already correct',
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          billingCycle: subscription.billingCycle
        });
      }
      
      // Calculate the correct end date (1 month from start date)
      const correctEndDate = new Date(startDate);
      correctEndDate.setMonth(startDate.getMonth() + 1);
      
      // Update the subscription
      const updated = await db
        .update(userSubscriptions)
        .set({ endDate: correctEndDate })
        .where(eq(userSubscriptions.id, subscription.id))
        .returning();
      
      if (updated.length > 0) {
        return res.json({
          message: 'Subscription dates corrected successfully',
          oldEndDate: subscription.endDate,
          newEndDate: correctEndDate.toISOString(),
          startDate: subscription.startDate,
          billingCycle: subscription.billingCycle
        });
      } else {
        return res.status(500).json({ message: 'Failed to update subscription dates' });
      }
    } catch (error: any) {
      console.error('Error in POST /api/user/subscription/fix-dates:', error);
      res.status(500).json({ 
        message: 'Failed to fix subscription dates', 
        error: error.message 
      });
    }
  });

  app.get('/api/public/subscription-plans', async (req, res) => {
    try {
      // Set cache control headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.active, true));
      // Fetch pricing data for each plan
      const pricing = await db.select().from(planPricing);
      
      // Combine plans with their pricing information
      const plansWithPricing = plans.map(plan => {
        const planPricingData = pricing.filter(price => price.planId === plan.id);
        return { 
          ...plan,
          pricing: planPricingData 
        };
      });
      
      res.json(plansWithPricing);
    } catch (error: any) {
      console.error('Error in GET /api/public/subscription-plans:', error);
      res.status(500).json({ 
        message: 'Failed to fetch subscription plans', 
        error: error.message 
      });
    }
  });

  // Public plan features endpoint - List all plan features
  app.get('/api/public/plan-features', async (req, res) => {
    try {
      // Set cache control headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      // Fetch all features with explicit mapping in plan_features
      const planFeaturesData = await db
        .select({
          id: planFeatures.id,
          planId: planFeatures.planId,
          featureId: planFeatures.featureId,
          limitType: planFeatures.limitType,
          limitValue: planFeatures.limitValue,
          resetFrequency: planFeatures.resetFrequency,
          isEnabled: planFeatures.isEnabled,
          featureName: features.name,
          featureCode: features.code,
          description: features.description
        })
        .from(planFeatures)
        .innerJoin(features, eq(planFeatures.featureId, features.id));
      
      res.json(planFeaturesData);
    } catch (error: any) {
      console.error('Error in GET /api/public/plan-features:', error);
      res.status(500).json({ 
        message: 'Failed to fetch plan features', 
        error: error.message 
      });
    }
  });

  // Admin endpoint to fix subscription end dates
  app.post('/api/admin/fix-subscription-dates', requireAdmin, async (req, res) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const adminId = req.user.id;
    const adminEmail = req.user.email;
    const adminUsername = req.user.username;
    
    try {
      console.log(`Admin user ${adminUsername} (ID: ${adminId}, Email: ${adminEmail}) initiated subscription date fixes`);
      
      // Determine if we're targeting a specific user
      const targetUserId = req.body.userId ? parseInt(req.body.userId) : null;
      if (targetUserId) {
        console.log(`Targeting specific user ID: ${targetUserId}`);
      }
      
      // Create conditions array
      const conditions = [eq(userSubscriptions.status, 'ACTIVE')];
      if (targetUserId) {
        conditions.push(eq(userSubscriptions.userId, targetUserId));
      }
      
      // Execute query with all conditions
      const allSubscriptions = await db
        .select({
          id: userSubscriptions.id,
          userId: userSubscriptions.userId,
          email: users.email,
          username: users.username,
          planId: userSubscriptions.planId,
          planName: subscriptionPlans.name, 
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate,
          status: userSubscriptions.status,
          billingCycle: subscriptionPlans.billingCycle
        })
        .from(userSubscriptions)
        .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .innerJoin(users, eq(userSubscriptions.userId, users.id))
        .where(and(...conditions));
      
      console.log(`Found ${allSubscriptions.length} active subscriptions to process`);
      
      const updatedSubscriptions = [];
      const auditLog = [];
      
      // Process each subscription
      for (const subscription of allSubscriptions) {
        // Skip if not MONTHLY
        if (subscription.billingCycle !== 'MONTHLY') {
          console.log(`Skipping subscription ID ${subscription.id} for user ${subscription.username} (${subscription.email}) - not a monthly plan`);
          continue;
        }
        
        const startDate = new Date(subscription.startDate);
        const endDate = new Date(subscription.endDate);
        const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Log details for audit
        console.log(`Checking subscription ID ${subscription.id} for user ${subscription.username} (${subscription.email}): Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}, Days: ${daysDiff}`);
        
        // If the end date is more than 60 days away from start date for a monthly subscription, it's incorrect
        if (daysDiff > 60) {
          console.log(`Found incorrect subscription dates for user ${subscription.username} (ID: ${subscription.userId}): ${daysDiff} days for a monthly plan`);
          
          // Calculate the correct end date (1 month from start date)
          const correctEndDate = new Date(startDate);
          correctEndDate.setMonth(startDate.getMonth() + 1);
          
          console.log(`Correcting end date from ${endDate.toISOString()} to ${correctEndDate.toISOString()} for subscription ID ${subscription.id}`);
          
          try {
            // Update the subscription
            const updated = await db
              .update(userSubscriptions)
              .set({ 
                endDate: correctEndDate,
                updatedAt: new Date() // Update the timestamp
              })
              .where(eq(userSubscriptions.id, subscription.id))
              .returning();
            
            if (updated.length > 0) {
              const logEntry = {
                timestamp: new Date().toISOString(),
                adminId,
                adminUsername,
                subscriptionId: subscription.id,
                userId: subscription.userId,
                username: subscription.username,
                planId: subscription.planId,
                planName: subscription.planName,
                oldEndDate: endDate.toISOString(),
                newEndDate: correctEndDate.toISOString(),
                daysDifference: daysDiff
              };
              
              auditLog.push(logEntry);
              console.log(`Successfully updated subscription ID ${subscription.id}`, logEntry);
              
              updatedSubscriptions.push({
                id: subscription.id,
                userId: subscription.userId,
                username: subscription.username,
                email: subscription.email,
                planName: subscription.planName,
                oldEndDate: endDate.toISOString(),
                newEndDate: correctEndDate.toISOString()
              });
            }
          } catch (updateError) {
            console.error(`Error updating subscription ID ${subscription.id}:`, updateError);
          }
        }
      }
      
      // Log overall results
      console.log(`Subscription date fix operation complete. Fixed ${updatedSubscriptions.length} subscriptions.`);
      console.log('Audit log:', JSON.stringify(auditLog));
      
      res.json({
        message: `Fixed ${updatedSubscriptions.length} subscription end dates`,
        updatedSubscriptions,
        auditLog
      });
    } catch (error: any) {
      console.error(`Error in POST /api/admin/fix-subscription-dates by admin ${adminUsername} (${adminId}):`, error);
      res.status(500).json({ 
        message: 'Failed to fix subscription dates', 
        error: error.message 
      });
    }
  });
} 