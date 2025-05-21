import express from 'express';
import { requireUser, requireAdmin } from '../../middleware/auth';
import { db } from '../../config/db';
import { 
  subscriptionPlans, 
  planPricing, 
  planFeatures, 
  features as featuresTable,
  userSubscriptions,
  featureUsage,
  users,
  userBillingDetails,
  paymentTransactions,
  disputes,
  appSettings
} from '@shared/schema';
import { eq, and, gte, lte, desc, asc, isNull, inArray, isNotNull } from 'drizzle-orm';
import { SubscriptionService } from '../../services/subscription-service';
import { 
  trackUserDevice, 
  checkFreemiumEligibility, 
  updateFreemiumRestrictions 
} from '../../middleware/session-security';

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

      // Log the update data for debugging
      console.log('Updating plan', planId, 'with data:', updateData);
      
      // Extract pricing data if present
      const { usdPrice, inrPrice, ...planUpdateData } = updateData;
      
      // Update the base plan data
      const updatedPlan = await db.update(subscriptionPlans)
        .set(planUpdateData)
        .where(eq(subscriptionPlans.id, planId))
        .returning();
      
      if (!updatedPlan.length) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // Check if we need to update pricing
      if (usdPrice || inrPrice) {
        console.log('Updating pricing for plan', planId, '- USD:', usdPrice, 'INR:', inrPrice);
        
        // Get existing pricing records
        const existingPricing = await db.select()
          .from(planPricing)
          .where(eq(planPricing.planId, planId));
        
        // Update USD pricing if provided
        if (usdPrice) {
          const usdPricing = existingPricing.find(p => p.currency === 'USD' && p.targetRegion === 'GLOBAL');
          if (usdPricing) {
            await db.update(planPricing)
              .set({ price: usdPrice, updatedAt: new Date() })
              .where(eq(planPricing.id, usdPricing.id));
            console.log('Updated USD pricing record');
          } else {
            // Create new USD pricing if it doesn't exist
            await db.insert(planPricing).values({
              planId,
              targetRegion: 'GLOBAL',
              currency: 'USD',
              price: usdPrice
            });
            console.log('Created new USD pricing record');
          }
        }
        
        // Update INR pricing if provided
        if (inrPrice) {
          const inrPricing = existingPricing.find(p => p.currency === 'INR' && p.targetRegion === 'INDIA');
          if (inrPricing) {
            await db.update(planPricing)
              .set({ price: inrPrice, updatedAt: new Date() })
              .where(eq(planPricing.id, inrPricing.id));
            console.log('Updated INR pricing record');
          } else {
            // Create new INR pricing if it doesn't exist
            await db.insert(planPricing).values({
              planId,
              targetRegion: 'INDIA',
              currency: 'INR',
              price: inrPrice
            });
            console.log('Created new INR pricing record');
          }
        }
      }
      
      // Fetch the updated plan with pricing to return in the response
      const updatedPlanWithPricing = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);
      
      const updatedPricing = await db.select()
        .from(planPricing)
        .where(eq(planPricing.planId, planId));
      
      res.json({
        ...updatedPlanWithPricing[0],
        pricing: updatedPricing
      });
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
      const featureList = await db.select().from(featuresTable);
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
      const newFeature = await db.insert(featuresTable).values(featureDataWithoutId).returning();
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
      const featureId = parseInt(req.params.id, 10);
      if (isNaN(featureId)) {
        return res.status(400).json({ message: 'Invalid feature ID' });
      }
      const updateData = req.body;
      const updatedFeature = await db.update(featuresTable)
        .set(updateData)
        .where(eq(featuresTable.id, featureId))
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
      const featureId = parseInt(req.params.id, 10);
      if (isNaN(featureId)) {
        return res.status(400).json({ message: 'Invalid feature ID' });
      }
      const deleted = await db.delete(featuresTable)
        .where(eq(featuresTable.id, featureId));
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
          billingCycle: subscriptionPlans.billingCycle,
          isFreemium: subscriptionPlans.isFreemium
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE')
        ));
      
      // Hide billing cycle for freemium plans
      const subscriptionsWithHiddenFreemiumCycle = subscriptions.map(sub => {
        if (sub.isFreemium) {
          return {
            ...sub,
            billingCycle: null, // Hide billing cycle for freemium plans
            displayBillingCycle: false // Add flag to indicate billing cycle should be hidden
          };
        }
        return sub;
      });
      
      console.log(`Returning fresh subscription data for user ${userId}: ${JSON.stringify(subscriptionsWithHiddenFreemiumCycle)}`);
      
      // Return the active subscription or an empty array
      res.json(subscriptionsWithHiddenFreemiumCycle);
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
          featureName: featuresTable.name,
          featureCode: featuresTable.code,
          featureDescription: featuresTable.description,
          featureType: featuresTable.featureType,
          isTokenBased: featuresTable.isTokenBased
        })
        .from(planFeatures)
        .innerJoin(featuresTable, eq(planFeatures.featureId, featuresTable.id))
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
      
      // Check if plan is freemium
      const isFreemiumPlan = plan[0].isFreemium;
      
      // Fetch all features with explicit mapping in plan_features for the user's plan
      const planFeaturesData = await db
        .select({
          featureId: planFeatures.featureId,
          planId: planFeatures.planId,
          limitType: planFeatures.limitType,
          limitValue: planFeatures.limitValue,
          resetFrequency: planFeatures.resetFrequency,
          isEnabled: planFeatures.isEnabled,
          featureName: featuresTable.name,
          featureCode: featuresTable.code,
          featureType: featuresTable.featureType,
          isTokenBased: featuresTable.isTokenBased,
          featureDescription: featuresTable.description
        })
        .from(planFeatures)
        .innerJoin(featuresTable, eq(planFeatures.featureId, featuresTable.id))
        .where(eq(planFeatures.planId, planId));
      // Build the feature access list
      const featuresAccess = planFeaturesData.map(pf => {
        const usage = usageMap.get(pf.featureId);
        
        // Only check for reset if it's NOT a freemium plan
        const isResetNeeded = !isFreemiumPlan && usage && usage.resetDate && usage.resetDate < new Date();
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
          resetFrequency: isFreemiumPlan ? null : pf.resetFrequency, // No reset frequency for freemium
          resetDate: isFreemiumPlan ? null : (usage?.resetDate || null), // No reset date for freemium
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

  // New route - Get pending subscription change
  app.get('/api/user/subscription/pending-change', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      
      // Get user's active subscription with pending change details
      const subscription = await db
        .select({
          id: userSubscriptions.id,
          userId: userSubscriptions.userId,
          planId: userSubscriptions.planId,
          pendingPlanChangeTo: userSubscriptions.pendingPlanChangeTo,
          pendingPlanChangeDate: userSubscriptions.pendingPlanChangeDate,
          pendingPlanChangeType: userSubscriptions.pendingPlanChangeType,
          currentPlanName: subscriptionPlans.name,
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE'),
          isNotNull(userSubscriptions.pendingPlanChangeTo)
        ))
        .limit(1);
        
      if (!subscription.length) {
        return res.json({ hasPendingChange: false });
      }
      
      // Get the pending plan details
      const pendingPlanId = subscription[0].pendingPlanChangeTo;
      const pendingPlan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, pendingPlanId as number))
        .limit(1);
      
      return res.json({
        hasPendingChange: true,
        subscription: subscription[0],
        pendingPlan: pendingPlan.length ? pendingPlan[0] : null
      });
    } catch (error: any) {
      console.error('Error in GET /api/user/subscription/pending-change:', error);
      res.status(500).json({ 
        message: 'Failed to fetch pending subscription change', 
        error: error.message 
      });
    }
  });

  // Update route - Cancel pending subscription change
  app.post('/api/user/subscription/cancel-pending-change', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      
      // Get user's active subscription with pending change
      const subscription = await db
        .select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE'),
          isNotNull(userSubscriptions.pendingPlanChangeTo)
        ))
        .limit(1);
        
      if (!subscription.length) {
        return res.status(404).json({ message: 'No pending subscription change found' });
      }
      
      // Clear the pending change
      const updatedSubscription = await db.update(userSubscriptions)
        .set({
          pendingPlanChangeTo: null,
          pendingPlanChangeDate: null,
          pendingPlanChangeType: null,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, subscription[0].id))
        .returning();
        
      return res.json({
        message: 'Pending subscription change cancelled successfully',
        subscription: updatedSubscription[0]
      });
    } catch (error: any) {
      console.error('Error in POST /api/user/subscription/cancel-pending-change:', error);
      res.status(500).json({ 
        message: 'Failed to cancel pending subscription change', 
        error: error.message 
      });
    }
  });

  // Updated route - Using SubscriptionService for upgrade
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
      
      // Check if this is a new subscription or an upgrade
      const currentSubscription = await SubscriptionService.getActiveSubscription(userId);
      const isNewSubscription = !currentSubscription;
      
      console.log(`Processing subscription ${isNewSubscription ? 'creation' : 'upgrade'} - User: ${userId}, Plan ID: ${planId}`);
      
      // Check if plan exists and is active
      const plan = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.active, true))).limit(1);
      if (!plan.length) {
        console.error(`Plan ${planId} not found or not active`);
        return res.status(404).json({ message: 'Plan not found or not active' });
      }
      
      console.log(`Found active plan: ${plan[0].name}`);

      // Check if the plan is free (freemium)
      if (plan[0].isFreemium) {
        console.log(`Activating free plan subscription for user ${userId} to plan ${planId}`);
        const subscription = await SubscriptionService.activateFreePlan(userId, planId);
        return res.status(201).json({
          subscription,
          message: 'Free plan subscription activated successfully'
        });
      }
      
      // Check if user has an active subscription with a pending downgrade
      if (currentSubscription && 'pendingPlanChangeTo' in currentSubscription && currentSubscription.pendingPlanChangeTo) {
        // Clear the pending downgrade first
        await db.update(userSubscriptions)
          .set({
            pendingPlanChangeTo: null,
            pendingPlanChangeDate: null,
            pendingPlanChangeType: null,
            updatedAt: new Date()
          })
          .where(eq(userSubscriptions.id, currentSubscription.id));
          
        console.log(`Cleared pending downgrade for user ${userId} before processing upgrade`);
      }
      
      // Get user's region
      const billingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      // Determine region based on user's country
      const userRegion = billingDetails.length > 0 && billingDetails[0].country === 'IN' 
        ? 'INDIA' 
        : 'GLOBAL';
        
      console.log(`User region determined as: ${userRegion}`);
      
      // Calculate proration if the user is upgrading from an existing plan
      const proration = await SubscriptionService.calculateProration(userId, planId);
      console.log(`Proration calculation result:`, proration);

      // Verify this is actually an upgrade, not a downgrade
      if (!proration.isUpgrade) {
        return res.json({
          message: 'This change is a downgrade rather than an upgrade',
          redirectToDowngrade: true,
          downgradeUrl: `/api/user/subscription/downgrade`,
          planId
        });
      }
      
      // Get the pricing applicable for this user's region
      const pricing = await db.select()
        .from(planPricing)
        .where(and(
          eq(planPricing.planId, planId),
          eq(planPricing.targetRegion, userRegion as any)
        ))
        .limit(1);
      
      // If there's no specific pricing for this region, get the GLOBAL pricing
      let pricingInfo = null;
      if (!pricing.length) {
        console.log(`No specific pricing found for region ${userRegion}, falling back to GLOBAL`);
        const globalPricing = await db.select()
          .from(planPricing)
          .where(and(
            eq(planPricing.planId, planId),
            eq(planPricing.targetRegion, 'GLOBAL')
          ))
          .limit(1);
          
        if (globalPricing.length) {
          pricingInfo = globalPricing[0];
        } else {
          console.error(`No pricing information found for plan ${planId}`);
          return res.status(404).json({ message: 'No pricing information found for this plan' });
        }
      } else {
        pricingInfo = pricing[0];
      }
      
      // Construct the checkout URL with correct query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('planId', planId.toString());
      if (proration.prorationAmount > 0) {
        queryParams.append('prorationAmount', proration.prorationAmount.toString());
      }
      queryParams.append('upgradeFlow', 'true'); // Flag to indicate this is an upgrade flow
      
      const checkoutUrl = `/checkout?${queryParams.toString()}`;
      console.log(`Redirecting to checkout: ${checkoutUrl}`);
      
      return res.json({
        plan: plan[0],
        pricing: pricingInfo,
        proration,
        requiresPayment: proration.requiresPayment,
        redirectToPayment: proration.requiresPayment,
        paymentUrl: checkoutUrl,
        isUpgrade: true
      });
    } catch (error: any) {
      console.error('Error in POST /api/user/subscription/upgrade:', error);
      res.status(500).json({ 
        message: 'Failed to upgrade subscription', 
        error: error.message 
      });
    }
  });

  // Updated route - Downgrade subscription using scheduleDowngrade
  app.post('/api/user/subscription/downgrade', requireUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: 'Missing plan ID' });
      }
      
      console.log(`Processing subscription downgrade - User: ${userId}, Plan ID: ${planId}`);
      
      // Get the plan to check if it's free
      const plan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);
        
      if (!plan.length) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      // Get current subscription to determine end date
      const currentSubscription = await SubscriptionService.getActiveSubscription(userId);
      
      // If user doesn't have an active subscription, this is an upgrade, not a downgrade
      if (!currentSubscription) {
        console.log(`No active subscription found for user ${userId}, redirecting to upgrade flow`);
        return res.json({
          message: 'New subscription required - not a downgrade',
          redirectToUpgrade: true,
          upgradeUrl: `/api/user/subscription/upgrade`,
          planId
        });
      }
      
      // Calculate proration to determine if it's actually a downgrade
      const proration = await SubscriptionService.calculateProration(userId, planId);
      
      // If it's actually an upgrade, redirect to the upgrade flow
      if (proration.isUpgrade) {
        return res.json({
          message: 'This change is an upgrade rather than a downgrade',
          redirectToUpgrade: true,
          upgradeUrl: `/api/user/subscription/upgrade`,
          planId
        });
      }
      
      // Calculate the effective date (end of current billing cycle)
      const effectiveDate = new Date(currentSubscription.endDate);
      
      // Process the downgrade
      const result = await SubscriptionService.scheduleDowngrade(userId, planId);
      
      return res.status(200).json({
        success: true,
        message: result.message,
        subscription: result.subscription,
        isScheduledDowngrade: true,
        effectiveDate: effectiveDate.toISOString(),
        downgradeInfo: {
          currentPlanId: currentSubscription.planId,
          currentPlanName: currentSubscription.planName,
          newPlanId: planId,
          newPlanName: plan[0].name,
          effectiveDate: effectiveDate.toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error in POST /api/user/subscription/downgrade:', error);
      return res.status(500).json({
        message: `Failed to downgrade subscription: ${error.message}`
      });
    }
  });

  // Updated route - Using SubscriptionService for cancellation
  app.post('/api/user/subscription/cancel', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      
      const subscription = await SubscriptionService.cancelSubscription(userId);
      res.json({ 
        message: 'Your subscription has been cancelled. You can still use all features until the end of your current billing period.',
        subscription
      });
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
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.active, true));
      
      // Add pricing information for each plan
      const plansWithPricing = await Promise.all(plans.map(async (plan) => {
        const pricing = await db
          .select()
          .from(planPricing)
          .where(eq(planPricing.planId, plan.id));
        
        // Hide billing cycle for freemium plans
        const modifiedPlan = { 
          ...plan,
          pricing: pricing,
          // For freemium plans, don't show billing cycle
          billingCycle: plan.isFreemium ? null : plan.billingCycle,
          displayBillingCycle: !plan.isFreemium
        };
        
        return modifiedPlan;
      }));
      
      res.json(plansWithPricing);
    } catch (error: any) {
      console.error('Error in GET /api/public/subscription-plans:', error);
      res.status(500).json({
        message: 'Failed to fetch subscription plans',
        error: error.message
      });
    }
  });

  // Get a single subscription plan by ID
  app.get('/api/public/subscription-plans/:id', async (req, res) => {
    try {
      // Set cache control headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }
      
      // Get plan details
      const plan = await db.select().from(subscriptionPlans)
        .where(and(
          eq(subscriptionPlans.id, planId),
          eq(subscriptionPlans.active, true)
        ))
        .limit(1);
      
      if (!plan.length) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      // Get pricing for this plan
      const pricing = await db.select().from(planPricing)
        .where(eq(planPricing.planId, planId));
      
      // Return the plan with pricing information
      res.json({
        ...plan[0],
        pricing
      });
    } catch (error: any) {
      console.error(`Error in GET /api/public/subscription-plans/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to fetch subscription plan', 
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
          featureName: featuresTable.name,
          featureCode: featuresTable.code,
          description: featuresTable.description
        })
        .from(planFeatures)
        .innerJoin(featuresTable, eq(planFeatures.featureId, featuresTable.id));
      
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

  // Admin endpoint to configure freemium restrictions
  app.post('/api/admin/freemium-restrictions', requireAdmin, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const adminId = req.user.id;
      const adminEmail = req.user.email;
      const adminUsername = req.user.username;
      
      console.log(`Admin user ${adminUsername} (ID: ${adminId}, Email: ${adminEmail}) updating freemium restrictions`);
      
      // Validate the incoming settings
      const {
        enabled,
        maxAccountsPerIp,
        maxAccountsPerDevice,
        trackIpAddresses,
        trackDevices
      } = req.body;
      
      // Create settings object with only valid properties
      const newSettings: any = {};
      
      if (typeof enabled === 'boolean') {
        newSettings.enabled = enabled;
      }
      
      if (typeof maxAccountsPerIp === 'number' && maxAccountsPerIp >= 1) {
        newSettings.maxAccountsPerIp = maxAccountsPerIp;
      }
      
      if (typeof maxAccountsPerDevice === 'number' && maxAccountsPerDevice >= 1) {
        newSettings.maxAccountsPerDevice = maxAccountsPerDevice;
      }
      
      if (typeof trackIpAddresses === 'boolean') {
        newSettings.trackIpAddresses = trackIpAddresses;
      }
      
      if (typeof trackDevices === 'boolean') {
        newSettings.trackDevices = trackDevices;
      }
      
      // Only proceed if there are valid settings to update
      if (Object.keys(newSettings).length === 0) {
        return res.status(400).json({
          message: 'No valid settings provided',
          validProperties: [
            'enabled (boolean)',
            'maxAccountsPerIp (number >= 1)',
            'maxAccountsPerDevice (number >= 1)',
            'trackIpAddresses (boolean)',
            'trackDevices (boolean)'
          ]
        });
      }
      
      // Update the settings
      await updateFreemiumRestrictions(newSettings);
      
      // Return success
      res.status(200).json({
        message: 'Freemium restrictions updated successfully',
        updatedSettings: newSettings
      });
    } catch (error: any) {
      console.error('Error updating freemium restrictions:', error);
      res.status(500).json({
        message: 'Failed to update freemium restrictions',
        error: error.message
      });
    }
  });

  // Get user's region based on IP for pricing
  app.get('/api/user/region', async (req, res) => {
    try {
      // Get client IP address
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
      
      console.log(`Detecting region for IP: ${clientIp}`);
      
      // Skip geolocation for localhost/development
      if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.includes('192.168.') || clientIp.includes('10.0.')) {
        console.log('Development environment detected, returning GLOBAL as default');
        return res.json({ region: 'GLOBAL', currency: 'USD' });
      }
      
      // Special case handling for known PageKite IPs
      const knownPageKiteIPs = ['89.116.21.215'];
      if (knownPageKiteIPs.includes(clientIp)) {
        console.log(`Detected known PageKite IP: ${clientIp}, setting region to INDIA`);
        return res.json({ 
          region: 'INDIA', 
          currency: 'INR', 
          country: 'IN', 
          countryName: 'India',
          source: 'manual-override'
        });
      }
      
      // Cache key for IP address
      const cacheKey = `ip-region-${clientIp}`;
      
      // Try to get cached result first
      try {
        const cachedResult = await db.select()
          .from(appSettings)
          .where(eq(appSettings.key, cacheKey))
          .limit(1);
        
        if (cachedResult.length > 0 && cachedResult[0].value) {
          console.log(`Using cached geolocation for IP: ${clientIp}`);
          const regionData = cachedResult[0].value as any;
          return res.json(regionData);
        }
      } catch (cacheError) {
        console.warn('Error checking cache for IP region:', cacheError);
        // Continue to API call if cache fails
      }
      
      try {
        // Call IP geolocation API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch(`https://ipapi.co/${clientIp}/json/`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        console.log('IP Geolocation response:', data);
        
        if (data.error) {
          // Handle rate limiting specifically
          if (data.reason === 'RateLimited') {
            console.warn('IP geolocation rate limited, trying alternative service');
            // Try alternative service or fallback mechanism
            return await tryAlternativeGeolocation(clientIp, res, cacheKey);
          }
          throw new Error(`Geolocation API error: ${data.reason}`);
        }
        
        // Determine region based on country code
        const country = data.country_code;
        const countryName = data.country_name;
        
        // Create result - India gets its own region, all others are GLOBAL
        // You can expand this list to support more regional pricing as needed
        let regionResult = { region: 'GLOBAL', currency: 'USD', country, countryName, source: 'ipapi' };
        
        if (country === 'IN') {
          regionResult = { region: 'INDIA', currency: 'INR', country, countryName, source: 'ipapi' };
        }
        
        // Cache the result for future use
        try {
          // Store or update cache
          await db.insert(appSettings)
            .values({
              key: cacheKey,
              value: regionResult,
              category: 'ip-geolocation',
            })
            .onConflictDoUpdate({
              target: appSettings.key,
              set: { value: regionResult, updatedAt: new Date() }
            });
            
          console.log(`Cached geolocation data for IP: ${clientIp}`);
        } catch (cacheError) {
          console.error('Failed to cache IP geolocation:', cacheError);
          // Continue even if caching fails
        }
        
        return res.json(regionResult);
      } catch (geoError) {
        console.error('Error with primary geolocation service:', geoError);
        return await tryAlternativeGeolocation(clientIp, res, cacheKey);
      }
    } catch (error: any) {
      console.error('Error in GET /api/user/region:', error);
      // Default to GLOBAL in case of any error
      res.json({ region: 'GLOBAL', currency: 'USD', error: error.message });
    }
  });
  
  // Alternative geolocation function to handle rate limiting
  async function tryAlternativeGeolocation(clientIp: string, res: express.Response, cacheKey: string) {
    try {
      // Try GeoJS as an alternative (no API key required)
      const response = await fetch(`https://get.geojs.io/v1/ip/country/${clientIp}.json`);
      const data = await response.json();
      
      console.log('Alternative geolocation response:', data);
      
      if (data.country) {
        const country = data.country;
        const countryName = data.name || country;
        
        let regionResult = { region: 'GLOBAL', currency: 'USD', country, countryName, source: 'geojs' };
        
        // Create result - India gets INR, all others get USD
        if (country === 'IN') {
          regionResult = { region: 'INDIA', currency: 'INR', country, countryName, source: 'geojs' };
        }
        
        // Cache the result
        try {
          await db.insert(appSettings)
            .values({
              key: cacheKey,
              value: regionResult,
              category: 'ip-geolocation',
            })
            .onConflictDoUpdate({
              target: appSettings.key,
              set: { value: regionResult, updatedAt: new Date() }
            });
        } catch (cacheError) {
          console.warn('Failed to cache alternative geolocation data:', cacheError);
        }
        
        return res.json(regionResult);
      }
      
      throw new Error('Failed to get country data from alternative service');
    } catch (error) {
      console.error('Error with alternative geolocation service:', error);
      // If all else fails, return GLOBAL
      return res.json({ 
        region: 'GLOBAL', 
        currency: 'USD', 
        error: 'All geolocation services failed',
        source: 'fallback'
      });
    }
  }

  // Process upgrade payment
  app.post('/api/user/subscription/upgrade/verify', requireUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { paymentId, signature, planId, subscriptionId } = req.body;
      
      if (!paymentId || !signature || !planId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      console.log(`Processing subscription upgrade payment verification - User: ${userId}, Plan ID: ${planId}, Payment ID: ${paymentId}`);
      
      // Check if user has an active subscription with a pending downgrade
      const activeSubscription = await SubscriptionService.getActiveSubscription(userId);
      if (activeSubscription && activeSubscription.pendingPlanChangeTo && activeSubscription.pendingPlanChangeType === 'DOWNGRADE') {
        // Clear the pending downgrade first
        try {
          // Update the subscription to remove the pending change
          await db.update(userSubscriptions)
            .set({
              pendingPlanChangeTo: null,
              pendingPlanChangeDate: null,
              pendingPlanChangeType: null,
              updatedAt: new Date()
            })
            .where(eq(userSubscriptions.id, activeSubscription.id));
            
          console.log(`Cleared pending downgrade for user ${userId} before processing upgrade`);
        } catch (error) {
          console.error('Error clearing pending downgrade:', error);
          // Continue anyway - we'll override the subscription
        }
      }
      
      // Process the upgrade with the verified payment
      const result = await SubscriptionService.processUpgrade(
        userId,
        planId,
        paymentId,
        'razorpay',
        signature,
        subscriptionId,
        { isUpgrade: true }
      );
      
      return res.status(200).json({
        success: true,
        message: result.message || 'Subscription upgraded successfully',
        subscription: result.subscription
      });
    } catch (error: any) {
      console.error('Error in POST /api/user/subscription/upgrade/verify:', error);
      return res.status(500).json({
        message: `Failed to verify upgrade payment: ${error.message}`
      });
    }
  });

  // Dedicated endpoint for activating freemium plans
  app.post('/api/subscriptions/activate-freemium', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = req.user.id;
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ 
          message: 'Bad Request',
          error: 'Plan ID is required' 
        });
      }

      console.log(`API request to activate freemium plan ${planId} for user ${userId}`);
      
      // Get plan details first to verify it's truly freemium
      const plan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);
        
      if (!plan.length) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      // Verify this is a free plan before proceeding
      if (!plan[0].isFreemium) {
        const pricing = await db.select()
          .from(planPricing)
          .where(eq(planPricing.planId, planId));
          
        const hasFreePrice = pricing.some(p => p.price === '0.00' || p.price === '0');
        
        if (!hasFreePrice) {
          return res.status(400).json({
            message: 'Bad Request',
            error: 'Cannot activate non-free plan using this endpoint'
          });
        }
      }

      // Check if user has an active subscription
      const existingSubscription = await SubscriptionService.getActiveSubscription(userId);
      
      // If user already has this exact plan active, just return success
      if (existingSubscription && existingSubscription.planId === planId) {
        return res.status(200).json({
          success: true,
          message: 'User already has this freemium plan active',
          subscription: existingSubscription,
          planName: plan[0].name
        });
      }
      
      // If user has a different plan, provide detailed response about what will happen
      if (existingSubscription) {
        const existingPlan = await db.select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, existingSubscription.planId))
          .limit(1);
          
        const existingPlanName = existingPlan.length ? existingPlan[0].name : 'Unknown Plan';
        
        // If current plan is paid and new plan is free, this would be a downgrade
        if (!existingPlan[0]?.isFreemium && plan[0].isFreemium) {
          return res.status(200).json({
            success: false,
            requiresDowngrade: true,
            message: `User already has an active ${existingPlanName} plan. Use the downgrade endpoint to switch to a freemium plan.`,
            currentSubscription: {
              id: existingSubscription.id,
              planId: existingSubscription.planId,
              planName: existingPlanName
            },
            targetPlan: {
              id: planId,
              name: plan[0].name
            }
          });
        }
      }
      
      // Check if the user is eligible for freemium plan based on IP/device tracking
      const eligibility = await checkFreemiumEligibility(req, userId);
      if (!eligibility.eligible) {
        return res.status(403).json({
          success: false,
          message: 'You are not eligible for another freemium plan',
          reason: eligibility.reason || 'Multiple accounts detected',
          error: 'Freemium plan limit reached'
        });
      }
      
      // Track the user's device and IP for future freemium eligibility checks
      await trackUserDevice(req, userId);
      
      // Activate the free plan
      const subscription = await SubscriptionService.activateFreePlan(userId, planId);
      
      // Get available features for this plan
      const planFeaturesList = await db.select({
        id: planFeatures.id,
        featureId: planFeatures.featureId,
        limitType: planFeatures.limitType,
        limitValue: planFeatures.limitValue,
        isEnabled: planFeatures.isEnabled,
        resetFrequency: planFeatures.resetFrequency
      })
      .from(planFeatures)
      .where(and(
        eq(planFeatures.planId, planId),
        eq(planFeatures.isEnabled, true)
      ));
      
      return res.status(200).json({
        success: true,
        message: `Successfully activated ${plan[0].name} freemium plan`,
        subscription,
        planName: plan[0].name,
        features: planFeaturesList
      });
    } catch (error: any) {
      console.error('Error activating freemium plan:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to activate freemium plan',
        error: error.message
      });
    }
  });

  // Dedicated endpoint for requesting downgrade to freemium
  app.post('/api/subscriptions/downgrade-to-freemium', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = req.user.id;
      const { freemiumPlanId } = req.body;
      
      if (!freemiumPlanId) {
        return res.status(400).json({ 
          message: 'Bad Request',
          error: 'Freemium plan ID is required' 
        });
      }

      console.log(`API request to downgrade to freemium plan ${freemiumPlanId} for user ${userId}`);
      
      // Get plan details first to verify it's truly freemium
      const plan = await db.select()
        .from(subscriptionPlans)
        .where(and(
          eq(subscriptionPlans.id, freemiumPlanId),
          eq(subscriptionPlans.active, true)
        ))
        .limit(1);
        
      if (!plan.length) {
        return res.status(404).json({ message: 'Freemium plan not found or not active' });
      }
      
      // Verify this is a free plan before proceeding
      if (!plan[0].isFreemium) {
        const pricing = await db.select()
          .from(planPricing)
          .where(eq(planPricing.planId, freemiumPlanId));
          
        const hasFreePrice = pricing.some(p => p.price === '0.00' || p.price === '0');
        
        if (!hasFreePrice) {
          return res.status(400).json({
            message: 'Bad Request',
            error: 'Cannot downgrade to a non-free plan using this endpoint'
          });
        }
      }

      // Check if the user is eligible for freemium plan based on IP/device tracking
      const eligibility = await checkFreemiumEligibility(req, userId);
      if (!eligibility.eligible) {
        return res.status(403).json({
          success: false,
          message: 'You are not eligible for another freemium plan',
          reason: eligibility.reason || 'Multiple accounts detected',
          error: 'Freemium plan limit reached'
        });
      }
      
      // Track the user's device and IP for future freemium eligibility checks
      await trackUserDevice(req, userId);

      // Get active subscription
      const existingSubscription = await SubscriptionService.getActiveSubscription(userId);
      
      if (!existingSubscription) {
        // If no active subscription, just activate the freemium plan directly
        const subscription = await SubscriptionService.activateFreePlan(userId, freemiumPlanId);
        
        // Get available features for this plan
        const planFeaturesList = await db.select({
          id: planFeatures.id,
          featureId: planFeatures.featureId,
          limitType: planFeatures.limitType,
          limitValue: planFeatures.limitValue,
          isEnabled: planFeatures.isEnabled,
          resetFrequency: planFeatures.resetFrequency
        })
        .from(planFeatures)
        .where(and(
          eq(planFeatures.planId, freemiumPlanId),
          eq(planFeatures.isEnabled, true)
        ));
        
        return res.status(200).json({
          success: true,
          message: `Activated ${plan[0].name} freemium plan`,
          subscription,
          planName: plan[0].name,
          features: planFeaturesList
        });
      }
      
      // Schedule the downgrade
      const result = await SubscriptionService.scheduleDowngrade(userId, freemiumPlanId);
      
      // Get the effective date from the existing subscription and format it
      const effectiveDate = new Date(existingSubscription.endDate);
      const displayOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      const displayDate = effectiveDate.toLocaleDateString('en-US', displayOptions);
      
      // Get available features for this plan
      const futureFeaturesAvailable = await db.select({
        id: planFeatures.id,
        featureId: planFeatures.featureId,
        limitType: planFeatures.limitType,
        limitValue: planFeatures.limitValue,
        isEnabled: planFeatures.isEnabled,
        resetFrequency: planFeatures.resetFrequency
      })
      .from(planFeatures)
      .where(and(
        eq(planFeatures.planId, freemiumPlanId),
        eq(planFeatures.isEnabled, true)
      ));
      
      // Return a more detailed response with feature information
      return res.status(200).json({
        success: true,
        message: result.message,
        downgradeScheduled: true,
        currentSubscription: {
          id: existingSubscription.id,
          planId: existingSubscription.planId
        },
        freemiumPlan: {
          id: freemiumPlanId,
          name: plan[0].name
        },
        effectiveDate: displayDate,
        futureFeaturesAvailable
      });
    } catch (error: any) {
      console.error('Error scheduling downgrade to freemium:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to schedule downgrade to freemium plan',
        error: error.message
      });
    }
  });
} 