import { db } from '../config/db';
import { userSubscriptions, subscriptionPlans, paymentTransactions, planPricing, featureUsage, planFeatures as planFeaturesTable, userBillingDetails, PaymentGatewayEnum, planChangeTypeEnum, paymentGatewayConfigs, appSettings } from '@shared/schema';
import { eq, and, desc, gt, lt, isNotNull, isNull, lte } from 'drizzle-orm';
import { getPaymentGatewayForUser, getPaymentGatewayByName } from './payment-gateways';
import { NotificationService } from './notification-service';
import { adminNotificationService } from './admin-notification-service';
import { storage } from '../config/storage';

// Initialize notification service
const notificationService = new NotificationService();

// Necessary to avoid type errors with targetRegion
type RegionType = 'INDIA' | 'GLOBAL';
type PaymentGatewayType = 'RAZORPAY' | 'NONE';
type PlanChangeType = 'UPGRADE' | 'DOWNGRADE';

// Extended subscription type including metadata
interface ExtendedSubscription {
  id: number;
  userId: number;
  planId: number;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'CANCELLED';
  autoRenew: boolean;
  planName: string | null;
  planDescription: string | null;
  billingCycle: 'MONTHLY' | 'YEARLY' | null;
  paymentGateway: PaymentGatewayType | null;
  paymentReference: string | null;
  pendingPlanChangeTo: number | null;
  pendingPlanChangeDate: Date | null;
  pendingPlanChangeType: PlanChangeType | null;
  metadata?: Record<string, any>;
}

/**
 * SubscriptionService handles business logic for subscription management
 */
export const SubscriptionService = {
  /**
   * Get a user's active subscription
   */
  async getActiveSubscription(userId: number): Promise<ExtendedSubscription | null> {
    try {
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
          paymentGateway: userSubscriptions.paymentGateway,
          paymentReference: userSubscriptions.paymentReference,
          pendingPlanChangeTo: userSubscriptions.pendingPlanChangeTo,
          pendingPlanChangeDate: userSubscriptions.pendingPlanChangeDate,
          pendingPlanChangeType: userSubscriptions.pendingPlanChangeType,
          metadata: userSubscriptions.metadata
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE')
        ));
      
      return subscriptions.length > 0 ? subscriptions[0] as ExtendedSubscription : null;
    } catch (error) {
      console.error('Error getting active subscription:', error);
      throw error;
    }
  },

  /**
   * Get all subscriptions for a user
   */
  async getAllSubscriptions(userId: number) {
    try {
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
          billingCycle: subscriptionPlans.billingCycle,
          metadata: userSubscriptions.metadata
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userSubscriptions.userId, userId))
        .orderBy(userSubscriptions.createdAt);
      
      return subscriptions;
    } catch (error) {
      console.error('Error getting all subscriptions:', error);
      throw error;
    }
  },

  /**
   * Associate a user with a subscription plan
   * This is used during registration when a user selects a plan
   */
  async associateUserWithPlan(userId: number, planId: number) {
    try {
      console.log(`Associating user ${userId} with plan ${planId}`);
      
      // Get plan details to determine if it's a free or paid plan
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
      
      if (plan.length === 0) {
        throw new Error('Plan not found');
      }
      
      // Check if it's a free plan
      const isFreePlan = plan[0].isFreemium;
      
      if (isFreePlan) {
        // For free plans, activate immediately
        return await this.activateFreePlan(userId, planId);
      } else {
        // For paid plans, we'll just record that the user selected this plan
        // The actual payment and subscription creation will happen in the payment flow
        try {
          await db.insert(appSettings)
            .values({
              key: `user_plan_selection_${userId}`,
              value: {
                userId,
                planId,
                timestamp: new Date().toISOString(),
                status: 'pending_payment'
              },
              category: 'subscription_onboarding'
            })
            .onConflictDoNothing();
          
          console.log(`Recorded plan selection ${planId} for user ${userId}. Payment required.`);
          return { userId, planId, status: 'pending_payment' };
        } catch (error) {
          console.error('Error recording user plan selection:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error(`Error associating user ${userId} with plan ${planId}:`, error);
      throw error;
    }
  },

  /**
   * Activate a free plan subscription for a user
   */
  async activateFreePlan(userId: number, planId: number) {
    try {
      console.log(`Activating free plan ${planId} for user ${userId}`);
      
      // Get plan details to confirm it's free
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
      
      if (plan.length === 0) {
        throw new Error('Plan not found');
      }
      
      // Enhanced validation: Check if the plan is truly free
      if (!plan[0].isFreemium) {
        // Double-check regional pricing to see if it's free in any region
        const pricing = await db.select().from(planPricing).where(eq(planPricing.planId, planId));
        
        const isFreePlan = plan[0].price === '0.00' || plan[0].price === '0' || 
                           pricing.some(p => p.price === '0.00' || p.price === '0');
        
        if (!isFreePlan) {
          console.error(`Cannot activate non-free plan ${planId} using the free plan activation flow. Price is ${plan[0].price}`);
          throw new Error('Plan is not marked as freemium and does not have a free price tier');
        } else {
          console.warn(`Plan ${planId} is not marked as freemium but has a free price tier. Proceeding with activation.`);
        }
      }
      
      // Check for existing active subscription for this user (any plan)
      const existingActiveSubscription = await db.select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE')
        ))
        .limit(1);
      
      if (existingActiveSubscription.length > 0 && existingActiveSubscription[0].planId !== planId) {
        console.log(`User ${userId} already has an active subscription to plan ${existingActiveSubscription[0].planId}`);
        
        // Record this attempt as a potential metric for analytics
        try {
          await db.insert(appSettings)
            .values({
              key: `freemium_activate_attempt_${userId}_${Date.now()}`,
              value: {
                userId,
                attemptedPlanId: planId,
                existingPlanId: existingActiveSubscription[0].planId,
                timestamp: new Date().toISOString()
              },
              category: 'subscription_analytics'
            })
            .onConflictDoNothing();
        } catch (analyticsError) {
          console.error('Error recording freemium activation attempt:', analyticsError);
          // Non-critical, continue with the subscription process
        }
      }
      
      // Check for existing subscription to this specific plan
      const existingSubscription = await db.select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.planId, planId)
        ))
        .limit(1);
      
      const now = new Date();
      let subscription;
      
      // Calculate end date based on billing cycle
      const endDate = new Date();
      if (plan[0].billingCycle === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      if (existingSubscription.length > 0) {
        console.log(`Existing subscription found for user ${userId} on plan ${planId}, updating status`);
        // Update existing subscription
        subscription = await db.update(userSubscriptions)
          .set({
            status: 'ACTIVE',
            startDate: now,
            endDate: endDate,
            updatedAt: now,
            paymentGateway: 'NONE',
            autoRenew: true, // Set autoRenew to true for freemium plans to ensure automatic renewal
            metadata: {
              ...((existingSubscription[0] as any).metadata || {}),
              freemiumReactivation: {
                date: now.toISOString(),
                previousStatus: existingSubscription[0].status
              }
            }
          })
          .where(eq(userSubscriptions.id, existingSubscription[0].id))
          .returning();
      } else {
        console.log(`Creating new subscription for user ${userId} on free plan ${planId}`);
        // Create new subscription
        subscription = await db.insert(userSubscriptions)
          .values({
            userId,
            planId,
            startDate: now,
            endDate: endDate,
            status: 'ACTIVE',
            autoRenew: true, // Set autoRenew to true for freemium plans to ensure automatic renewal
            paymentGateway: 'NONE',
            paymentReference: `free_${Date.now()}`,
            createdAt: now,
            updatedAt: now,
            metadata: {
              freemiumActivation: {
                date: now.toISOString(),
                activationType: 'new_subscription'
              }
            }
          })
          .returning();
      }
      
      if (!subscription || subscription.length === 0) {
        throw new Error('Failed to create or update subscription');
      }
      
      // Initialize feature usage records for all features associated with this plan
      try {
        // Get all features for this plan
        const planFeatures = await db.select()
          .from(planFeaturesTable)
          .where(eq(planFeaturesTable.planId, planId));
        
        // For each feature, initialize a usage record if it's a countable feature
        for (const feature of planFeatures) {
          // Only create usage records for countable features with a limit
          if (feature.limitType === 'COUNT' && feature.limitValue !== null) {
            // Check if usage record already exists
            const existingUsage = await db.select()
              .from(featureUsage)
              .where(and(
                eq(featureUsage.userId, userId),
                eq(featureUsage.featureId, feature.featureId)
              ))
              .limit(1);
            
            if (existingUsage.length === 0) {
              // Calculate reset date based on feature reset frequency
              let resetDate = null;
              if (feature.resetFrequency !== 'NEVER') {
                resetDate = new Date();
                switch (feature.resetFrequency) {
                  case 'DAILY':
                    resetDate.setDate(resetDate.getDate() + 1);
                    break;
                  case 'WEEKLY':
                    resetDate.setDate(resetDate.getDate() + 7);
                    break;
                  case 'MONTHLY':
                    resetDate.setMonth(resetDate.getMonth() + 1);
                    break;
                  case 'YEARLY':
                    resetDate.setFullYear(resetDate.getFullYear() + 1);
                    break;
                }
              }
              
              // Create usage record with zero initial usage
              await db.insert(featureUsage)
                .values({
                  userId,
                  featureId: feature.featureId,
                  usageCount: 0,
                  aiTokenCount: 0,
                  resetDate,
                  createdAt: now,
                  updatedAt: now
                });
              
              console.log(`Initialized usage record for feature ${feature.featureId} for user ${userId}`);
            }
          }
        }
      } catch (featureError) {
        console.error(`Error initializing feature usage for freemium plan ${planId}:`, featureError);
        // Non-critical, continue with the subscription activation
      }
      
      // Record a zero-amount transaction for analytics purposes
      try {
        await db.insert(paymentTransactions)
          .values({
            userId,
            subscriptionId: subscription[0].id,
            amount: '0.00',
            currency: 'USD',
            gateway: 'NONE',
            gatewayTransactionId: `freemium_${Date.now()}`,
            status: 'COMPLETED',
            createdAt: now,
            updatedAt: now,
            metadata: {
              freemiumActivation: true,
              planName: plan[0].name,
              planId: planId
            }
          });
        
        console.log(`Recorded zero-amount transaction for freemium plan ${planId} activation`);
      } catch (transactionError) {
        console.error(`Error recording transaction for freemium plan ${planId}:`, transactionError);
        // Non-critical, continue with the subscription activation
      }
      
      console.log(`Free plan ${planId} activated for user ${userId} with subscription ID ${subscription[0].id}`);
      
      // Create notification for free plan activation
      try {
        await notificationService.createNotification({
          recipientId: userId,
          type: 'subscription_activated',
          category: 'subscription',
          data: { 
            planName: plan[0].name,
            planId: planId,
            subscriptionId: subscription[0].id,
            planType: 'free',
            activationType: 'freemium_activation'
          }
        });
      } catch (notificationError) {
        console.error('Failed to create free plan activation notification:', notificationError);
        // Don't fail the request if notification fails
      }
      
      return subscription[0];
    } catch (error: any) {
      console.error(`Error activating free plan ${planId} for user ${userId}:`, error);
      throw new Error(`Failed to activate free plan: ${error.message}`);
    }
  },

  /**
   * Calculate plan change information without proration credits
   * This is a simplified version that charges full price for new plans with no credits
   */
  async calculateProration(userId: number, newPlanId: number) {
    try {
      const currentSubscription = await this.getActiveSubscription(userId);
      if (!currentSubscription) {
        return { 
          prorationAmount: 0, 
          prorationCredit: 0,
          requiresPayment: true,
          isUpgrade: true,
          // Add extra diagnostic info
          diagnosticInfo: {
            reason: 'no_current_subscription',
            userHasNoActiveSubscription: true
          }
        };
      }

      // Get current plan details
      const currentPlan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, currentSubscription.planId))
        .limit(1);

      // Get new plan details
      const newPlan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, newPlanId))
        .limit(1);

      if (!currentPlan.length || !newPlan.length) {
        throw new Error('Plan not found');
      }

      // Get user's region to determine correct currency
      const billingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      // Determine region based on user's country
      const userRegion = billingDetails.length > 0 && billingDetails[0].country === 'IN' 
        ? 'INDIA' 
        : 'GLOBAL';

      // Get pricing for current plan and new plan in the user's region
      const currentPricing = await db.select()
        .from(planPricing)
        .where(and(
          eq(planPricing.planId, currentSubscription.planId),
          eq(planPricing.targetRegion, userRegion as any)
        ))
        .limit(1);

      // If no regional pricing found, fall back to GLOBAL
      if (!currentPricing.length) {
        const globalPricing = await db.select()
          .from(planPricing)
          .where(and(
            eq(planPricing.planId, currentSubscription.planId),
            eq(planPricing.targetRegion, 'GLOBAL')
          ))
          .limit(1);
        
        if (globalPricing.length) {
          console.log(`Using GLOBAL pricing for current plan (${currentSubscription.planId})`);
        } else {
          throw new Error(`No pricing found for current plan ${currentSubscription.planId}`);
        }
      }

      // Get pricing for new plan
      const newPricing = await db.select()
        .from(planPricing)
        .where(and(
          eq(planPricing.planId, newPlanId),
          eq(planPricing.targetRegion, userRegion as any)
        ))
        .limit(1);

      // If no regional pricing found, fall back to GLOBAL
      if (!newPricing.length) {
        const globalPricing = await db.select()
          .from(planPricing)
          .where(and(
            eq(planPricing.planId, newPlanId),
            eq(planPricing.targetRegion, 'GLOBAL')
          ))
          .limit(1);
        
        if (globalPricing.length) {
          console.log(`Using GLOBAL pricing for new plan (${newPlanId})`);
        } else {
          throw new Error(`No pricing found for new plan ${newPlanId}`);
        }
      }
      
      // Get effective pricing information
      const effectiveCurrentPricing = currentPricing.length ? currentPricing : 
                                    await db.select().from(planPricing).where(eq(planPricing.planId, currentSubscription.planId)).limit(1);
                                     
      const effectiveNewPricing = newPricing.length ? newPricing : 
                                await db.select().from(planPricing).where(eq(planPricing.planId, newPlanId)).limit(1);
      
      if (!effectiveCurrentPricing.length || !effectiveNewPricing.length) {
        throw new Error('Pricing information not found');
      }

      const currentPrice = Number(effectiveCurrentPricing[0].price);
      const newPrice = Number(effectiveNewPricing[0].price);
      const isUpgrade = newPrice > currentPrice;
      const currency = effectiveNewPricing[0].currency;

      // Simple diagnostic info with no proration calculations
      const diagnosticInfo = {
        currentPlanId: currentSubscription.planId,
        newPlanId: newPlanId,
        currentPlanName: currentPlan[0].name,
        newPlanName: newPlan[0].name,
        currentPrice: currentPrice,
        newPrice: newPrice,
        currency: currency,
        userRegion: userRegion,
        // Note: we're charging full price with no credits
        noProrationPolicy: true
      };

      console.log('Plan change info:', JSON.stringify(diagnosticInfo, null, 2));

      // Always charge full price for new plan regardless of upgrade or downgrade
      return {
        prorationAmount: newPrice, // Full price of new plan
        prorationCredit: 0, // No credits
        requiresPayment: newPrice > 0,
        isUpgrade: isUpgrade,
        originalPlanPrice: currentPrice,
        newPlanPrice: newPrice,
        remainingValue: 0, // No remaining value considered
        currency: diagnosticInfo.currency,
        noProrationPolicy: true, // Indicate we're not doing proration
        diagnosticInfo: diagnosticInfo
      };
    } catch (error) {
      console.error('Error calculating plan change info:', error);
      throw error;
    }
  },

  /**
   * Process immediate upgrade to a different plan
   * - Cancels current subscription completely in payment gateway
   * - Creates a new subscription at full price
   */
  async processUpgrade(
    userId: number, 
    newPlanId: number, 
    paymentId: string, 
    gateway: string, 
    signature?: string, 
    subscriptionId?: string,
    options?: { isUpgrade?: boolean }
  ): Promise<{ subscription: any; transaction: any; message: string }> {
    try {
      console.log(`Processing plan change - User: ${userId}, New Plan: ${newPlanId}, Payment: ${paymentId}`);
      
      // Get current subscription
      const currentSubscription = await this.getActiveSubscription(userId);
      if (!currentSubscription) {
        console.log(`No active subscription found for user ${userId}. Redirecting to first-time subscription flow.`);
        // If no active subscription exists, use the regular subscription creation flow instead
        return await this.upgradeToPaidPlan(userId, newPlanId, paymentId, gateway, signature, subscriptionId, { isUpgrade: false });
      }
      
      // Get current plan details
      const currentPlan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, currentSubscription.planId))
        .limit(1);
      
      if (!currentPlan.length) {
        throw new Error('Current plan not found');
      }
      
      // Get new plan details
      const newPlan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, newPlanId))
        .limit(1);
      
      if (!newPlan.length) {
        throw new Error('New plan not found');
      }
      
      // Determine if this is an upgrade or downgrade
      const currentPricing = await db.select()
        .from(planPricing)
        .where(eq(planPricing.planId, currentSubscription.planId))
        .limit(1);

      const newPricing = await db.select()
        .from(planPricing)
        .where(eq(planPricing.planId, newPlanId))
        .limit(1);

      if (!currentPricing.length || !newPricing.length) {
        throw new Error('Pricing information not found');
      }

      const currentPrice = Number(currentPricing[0].price);
      const newPrice = Number(newPricing[0].price);
      const isUpgrade = newPrice > currentPrice;
      const planChangeType = isUpgrade ? 'upgraded to' : 'downgraded to';
      
      // Check if this is a freemium-to-paid conversion
      const isFreemiumConversion = currentPlan[0].isFreemium === true && 
                                  !newPlan[0].isFreemium && 
                                  newPrice > 0;
      
      // Record this upgrade for analytics
      try {
        await db.insert(appSettings)
          .values({
            key: `subscription_upgrade_${userId}_${Date.now()}`,
            value: {
              userId,
              fromPlanId: currentSubscription.planId,
              toPlanId: newPlanId,
              isFreemiumConversion,
              fromPrice: currentPrice,
              toPrice: newPrice,
              timestamp: new Date().toISOString()
            },
            category: 'subscription_events'
          })
          .onConflictDoNothing();
          
        // Record special freemium conversion event if applicable
        if (isFreemiumConversion) {
          console.log(`User ${userId} is converting from freemium plan ${currentSubscription.planId} to paid plan ${newPlanId}`);
          
          // Store additional metrics about the conversion
          const subscriptionAgeMs = new Date().getTime() - new Date(currentSubscription.startDate).getTime();
          const subscriptionAgeDays = Math.floor(subscriptionAgeMs / (1000 * 60 * 60 * 24));
          
          await db.insert(appSettings)
            .values({
              key: `freemium_conversion_${userId}_${Date.now()}`,
              value: {
                userId,
                fromPlanId: currentSubscription.planId,
                fromPlanName: currentPlan[0].name,
                toPlanId: newPlanId,
                toPlanName: newPlan[0].name,
                conversionPrice: newPrice,
                freemiumPeriodDays: subscriptionAgeDays,
                startedAt: currentSubscription.startDate,
                convertedAt: new Date().toISOString()
              },
              category: 'conversion_metrics'
            })
            .onConflictDoNothing();
        }
      } catch (analyticsError) {
        console.error('Error recording subscription upgrade analytics:', analyticsError);
        // Non-critical, continue with the upgrade
      }
      
      // Verify payment first
      const paymentGateway = getPaymentGatewayByName(gateway.toLowerCase());
      if (!paymentGateway) {
        throw new Error(`Could not initialize payment gateway: ${gateway}`);
      }
      
      const verified = await paymentGateway.verifyPayment(paymentId, signature, subscriptionId);
      if (!verified) {
        throw new Error('Payment verification failed');
      }
      
      // Cancel the existing subscription completely before creating a new one
      if (currentSubscription.paymentGateway === 'RAZORPAY' && currentSubscription.paymentReference) {
        try {
          console.log(`Cancelling current subscription ${currentSubscription.paymentReference} due to plan change`);
          // Use immediate cancellation (cancel_at_cycle_end: 0) since we're creating a new subscription
          await paymentGateway.cancelSubscription(currentSubscription.paymentReference, { cancel_at_cycle_end: 0 });
          console.log(`Successfully cancelled previous subscription: ${currentSubscription.paymentReference}`);
        } catch (cancelError) {
          console.error('Error cancelling existing subscription:', cancelError);
          // Continue with creating the new subscription even if cancellation fails
        }
      }
      
      // Calculate start and end dates for the new subscription
      const now = new Date();
      const endDate = new Date(now);
      
      // Set end date based on billing cycle
      if (newPlan[0].billingCycle === 'YEARLY') {
        endDate.setFullYear(now.getFullYear() + 1);
      } else if (newPlan[0].billingCycle === 'MONTHLY') {
        endDate.setMonth(now.getMonth() + 1);
      } else {
        throw new Error(`Unsupported billing cycle: ${newPlan[0].billingCycle}`);
      }
      
      // Add enhanced metadata based on the type of upgrade
      const metadata: Record<string, any> = {
        planChangeHistory: {
          date: now.toISOString(),
          previousPlanId: currentSubscription.planId,
          previousPlanName: currentPlan[0].name,
          newPlanId: newPlanId,
          newPlanName: newPlan[0].name,
          paymentId: paymentId,
          noProrationPolicy: true,
          fullPriceCharged: true
        }
      };
      
      // Add freemium conversion information if applicable
      if (isFreemiumConversion) {
        metadata.freemiumConversion = {
          convertedAt: now.toISOString(),
          freemiumPlanId: currentSubscription.planId,
          freemiumPlanName: currentPlan[0].name,
          freemiumStartDate: currentSubscription.startDate,
          freemiumDurationDays: Math.floor(
            (now.getTime() - new Date(currentSubscription.startDate).getTime()) / 
            (1000 * 60 * 60 * 24)
          )
        };
      }
      
      // Create a new subscription record
      const subscription = await db.insert(userSubscriptions)
        .values({
          userId,
          planId: newPlanId,
          startDate: now,
          endDate,
          status: 'ACTIVE',
          paymentGateway: 'RAZORPAY' as const,
          paymentReference: subscriptionId || paymentId, // Use subscription ID if provided
          previousPlanId: currentSubscription.planId,
          upgradeDate: now,
          autoRenew: true,
          metadata
        })
        .returning();
        
      if (!subscription.length) {
        throw new Error('Failed to create new subscription');
      }
      
      // Update the old subscription to be cancelled
      await db.update(userSubscriptions)
        .set({
          status: 'CANCELLED',
          autoRenew: false,
          cancelDate: now,
          updatedAt: now,
          metadata: {
            ...(currentSubscription as ExtendedSubscription).metadata || {},
            cancellationReason: `Cancelled due to plan change to ${newPlan[0].name}`,
            replacedBy: subscription[0].id,
            wasFreemium: currentPlan[0].isFreemium === true,
            convertedToPaid: isFreemiumConversion
          }
        })
        .where(eq(userSubscriptions.id, currentSubscription.id));
      
      // Record payment transaction for the new plan
      const transaction = await db.insert(paymentTransactions)
        .values({
          userId,
          subscriptionId: subscription[0].id,
          amount: String(newPrice), // Full price of the new plan
          currency: newPricing[0].currency,
          gateway: 'RAZORPAY' as const,
          gatewayTransactionId: paymentId,
          status: 'COMPLETED',
          refundReason: `New subscription payment. Full price for ${newPlan[0].name} plan (no proration).`,
          metadata: {
            isFreemiumConversion,
            previousPlanId: currentSubscription.planId,
            previousPlanName: currentPlan[0].name,
            newPlanId: newPlanId,
            newPlanName: newPlan[0].name
          }
        })
        .returning();
        
      if (!transaction.length) {
        console.warn(`Failed to record payment transaction for subscription ${subscription[0].id}`);
      }
      
      // Enhanced message for freemium conversions
      let actionMessage = `Your plan has been ${planChangeType} ${newPlan[0].name}. Your previous plan has been cancelled.`;
      
      if (isFreemiumConversion) {
        actionMessage = `Congratulations! You've upgraded from the free ${currentPlan[0].name} plan to the premium ${newPlan[0].name} plan. You now have access to all premium features.`;
      }
      
      console.log(`Plan change processed successfully for user ${userId} to ${newPlan[0].name}`);
      
      return {
        subscription: subscription[0],
        transaction: transaction[0],
        message: actionMessage
      };
    } catch (error) {
      console.error('Error processing plan change:', error);
      throw error;
    }
  },

  /**
   * Handle downgrades by scheduling the change for the end of the current billing cycle
   * The current subscription continues until the end of the paid period
   */
  async scheduleDowngrade(userId: number, newPlanId: number): Promise<{ subscription: any; message: string }> {
    try {
      console.log(`Processing downgrade - User: ${userId}, New Plan: ${newPlanId}`);
      
      // Get current subscription
      const currentSubscription = await this.getActiveSubscription(userId);
      if (!currentSubscription) {
        throw new Error('No active subscription found to downgrade');
      }
      
      // Get current plan details
      const currentPlan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, currentSubscription.planId))
        .limit(1);
      
      if (!currentPlan.length) {
        throw new Error('Current plan not found');
      }
      
      // Get new plan details
      const newPlan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, newPlanId))
        .limit(1);
      
      if (!newPlan.length) {
        throw new Error('New plan not found');
      }
      
      // Enhanced validation: Verify new plan is actually a downgrade (lower price)
      const currentPricing = await db.select()
        .from(planPricing)
        .where(eq(planPricing.planId, currentSubscription.planId))
        .limit(1);

      const newPricing = await db.select()
        .from(planPricing)
        .where(eq(planPricing.planId, newPlanId))
        .limit(1);

      if (!currentPricing.length || !newPricing.length) {
        throw new Error('Pricing information not found');
      }

      const currentPrice = Number(currentPricing[0].price);
      const newPrice = Number(newPricing[0].price);
      const isDowngrade = newPrice < currentPrice;
      
      // Record downgrade attempt for analytics
      try {
        await db.insert(appSettings)
          .values({
            key: `subscription_downgrade_${userId}_${Date.now()}`,
            value: {
              userId,
              fromPlanId: currentSubscription.planId, 
              toPlanId: newPlanId,
              isActualDowngrade: isDowngrade,
              isFreemiumDowngrade: newPlan[0].isFreemium,
              currentPrice: currentPrice,
              newPrice: newPrice,
              timestamp: new Date().toISOString()
            },
            category: 'subscription_events'
          })
          .onConflictDoNothing();
      } catch (analyticsError) {
        console.error('Error recording downgrade attempt:', analyticsError);
        // Non-critical, continue with downgrade process
      }

      // If it's not a downgrade and not freemium, block the operation
      if (!isDowngrade && !newPlan[0].isFreemium) {
        throw new Error('Cannot process downgrade for a higher or equal price plan');
      }
      
      const now = new Date();
      
      // Special handling for freemium downgrades - better messaging and future enforcement
      if (newPlan[0].isFreemium) {
        console.log(`User ${userId} is downgrading to freemium plan ${newPlanId} (${newPlan[0].name})`);
        
        // For payment gateway subscriptions, schedule cancellation at the end of the cycle
        if (currentSubscription.paymentGateway === 'RAZORPAY' && currentSubscription.paymentReference) {
          try {
            console.log(`Scheduling cancellation of current subscription ${currentSubscription.paymentReference} at end of billing cycle`);
            const gateway = getPaymentGatewayByName('razorpay');
            // Use cycle end cancellation (cancel_at_cycle_end: 1) to honor the paid period
            await gateway.cancelSubscription(currentSubscription.paymentReference, { cancel_at_cycle_end: 1 });
            console.log(`Successfully scheduled cancellation for subscription: ${currentSubscription.paymentReference}`);
          } catch (cancelError) {
            console.error('Error scheduling subscription cancellation in payment gateway:', cancelError);
            // Continue despite gateway error
          }
        }
        
        // Update the current subscription with pending change information
        await db.update(userSubscriptions)
          .set({
            pendingPlanChangeTo: newPlanId,
            pendingPlanChangeDate: currentSubscription.endDate,
            pendingPlanChangeType: 'DOWNGRADE' as const,
            updatedAt: now,
            metadata: {
              ...(currentSubscription as ExtendedSubscription).metadata || {},
              pendingDowngrade: {
                date: now.toISOString(),
                previousPlanId: currentSubscription.planId,
                previousPlanName: currentPlan[0].name,
                newPlanId: newPlanId,
                newPlanName: newPlan[0].name,
                effectiveDate: currentSubscription.endDate.toISOString(),
                isFreemiumDowngrade: true,
                downgradingFromPrice: currentPrice,
                willLoseFeatures: true // User will likely lose access to paid features
              }
            }
          })
          .where(eq(userSubscriptions.id, currentSubscription.id));
        
        // Calculate date in user-friendly format
        const effectiveDate = new Date(currentSubscription.endDate);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = effectiveDate.toLocaleDateString('en-US', options);
        
        console.log(`Downgrade to free plan (${newPlan[0].name}) scheduled for user ${userId} effective ${currentSubscription.endDate.toISOString()}`);
        
        // Enhanced message for freemium downgrades with feature warning
        const message = `Your subscription will be downgraded to the free ${newPlan[0].name} plan on ${formattedDate}. ` +
                       `You will continue to have access to all features of your current plan until then. ` +
                       `Note: After downgrading, you will lose access to premium features included in your current ${currentPlan[0].name} plan.`;
        
        return {
          subscription: currentSubscription,
          message
        };
      }
      
      // For paid plans, we need to schedule the downgrade for the end of the current billing cycle
      if (currentSubscription.paymentGateway === 'RAZORPAY' && currentSubscription.paymentReference) {
        try {
          console.log(`Scheduling cancellation of current subscription ${currentSubscription.paymentReference} at end of billing cycle`);
          const gateway = getPaymentGatewayByName('razorpay');
          // Use cycle end cancellation (cancel_at_cycle_end: 1) to honor the paid period
          await gateway.cancelSubscription(currentSubscription.paymentReference, { cancel_at_cycle_end: 1 });
          console.log(`Successfully scheduled cancellation for subscription: ${currentSubscription.paymentReference}`);
        } catch (cancelError) {
          console.error('Error scheduling subscription cancellation in payment gateway:', cancelError);
          // Continue despite gateway error
        }
      }
      
      // Update the current subscription with pending change information
      await db.update(userSubscriptions)
        .set({
          pendingPlanChangeTo: newPlanId,
          pendingPlanChangeDate: currentSubscription.endDate,
          pendingPlanChangeType: 'DOWNGRADE' as const,
          updatedAt: now,
          metadata: {
            ...(currentSubscription as ExtendedSubscription).metadata || {},
            pendingDowngrade: {
              date: now.toISOString(),
              previousPlanId: currentSubscription.planId,
              previousPlanName: currentPlan[0].name,
              newPlanId: newPlanId,
              newPlanName: newPlan[0].name,
              effectiveDate: currentSubscription.endDate.toISOString(),
              isFreemiumDowngrade: false,
              downgradingFromPrice: currentPrice,
              downgradingToPrice: newPrice
            }
          }
        })
        .where(eq(userSubscriptions.id, currentSubscription.id));
      
      // Calculate date in user-friendly format
      const effectiveDate = new Date(currentSubscription.endDate);
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = effectiveDate.toLocaleDateString('en-US', options);
      
      console.log(`Downgrade to ${newPlan[0].name} scheduled for user ${userId} effective ${currentSubscription.endDate.toISOString()}`);
      
      const message = `Your subscription will be downgraded to the ${newPlan[0].name} plan on ${formattedDate}. You will continue to have access to all features of your current plan until then.`;
      
      return {
        subscription: currentSubscription,
        message
      };
    } catch (error) {
      console.error('Error processing downgrade:', error);
      throw error;
    }
  },

  /**
   * Process all scheduled plan changes that are due
   */
  async processScheduledChanges() {
    try {
      const now = new Date();
      
      // Find subscriptions with pending changes that are due
      const pendingChanges = await db.select()
        .from(userSubscriptions)
        .where(and(
          isNotNull(userSubscriptions.pendingPlanChangeTo),
          isNotNull(userSubscriptions.pendingPlanChangeDate),
          isNotNull(userSubscriptions.pendingPlanChangeType),
          lte(userSubscriptions.pendingPlanChangeDate, now)
        ));
        
      console.log(`Found ${pendingChanges.length} pending subscription changes to process`);
      
      const results = {
        upgrades: { processed: 0, failed: 0 },
        downgrades: { processed: 0, failed: 0 },
        freemiumDowngrades: { processed: 0, failed: 0 }
      };
      
      // Process each change
      for (const subscription of pendingChanges) {
        try {
          const currentPlanId = subscription.planId;
          const newPlanId = subscription.pendingPlanChangeTo as number;
          const changeType = subscription.pendingPlanChangeType as PlanChangeType;
          
          // Get metadata for better tracking
          const metadata = (subscription as any).metadata || {};
          const isFreemiumDowngrade = metadata?.pendingDowngrade?.isFreemiumDowngrade === true;
          
          // Get plans to determine if this is a freemium change
          const newPlan = await db.select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, newPlanId))
            .limit(1);
            
          if (!newPlan.length) {
            throw new Error(`Plan ${newPlanId} not found for scheduled change`);
          }
          
          // Track analytics for scheduled changes
          try {
            await db.insert(appSettings)
              .values({
                key: `subscription_scheduled_change_executed_${subscription.id}_${Date.now()}`,
                value: {
                  subscriptionId: subscription.id,
                  userId: subscription.userId,
                  fromPlanId: currentPlanId,
                  toPlanId: newPlanId,
                  changeType: changeType,
                  isFreemiumDowngrade: isFreemiumDowngrade || newPlan[0].isFreemium,
                  executedAt: now.toISOString(),
                  scheduledFor: subscription.pendingPlanChangeDate
                },
                category: 'subscription_events'
              })
              .onConflictDoNothing();
          } catch (analyticsError) {
            console.error('Error recording scheduled change analytics:', analyticsError);
            // Non-critical, continue with the change
          }
          
          if (changeType === 'DOWNGRADE') {
            // For downgrades, we need to:
            // 1. Verify the current subscription is expired/cancelled in payment gateway
            // 2. Create a new subscription with the downgraded plan
            
            // Check if the subscription is expired (billing period has ended)
            const currentDate = new Date();
            const endDate = new Date(subscription.endDate);
            
            if (currentDate < endDate) {
              console.log(`Subscription ${subscription.id} end date (${endDate.toISOString()}) is in the future, 
                          not processing downgrade yet. Will adjust pendingPlanChangeDate.`);
              
              // Update the pendingPlanChangeDate to match the endDate
              await db.update(userSubscriptions)
                .set({
                  pendingPlanChangeDate: endDate,
                  updatedAt: now
                })
                .where(eq(userSubscriptions.id, subscription.id));
                
              continue; // Skip this subscription for now
            }
            
            // Calculate new dates
            const startDate = new Date(subscription.pendingPlanChangeDate!);
            const newEndDate = new Date(startDate);
            
            if (newPlan[0].billingCycle === 'YEARLY') {
              newEndDate.setFullYear(startDate.getFullYear() + 1);
            } else if (newPlan[0].billingCycle === 'MONTHLY') {
              newEndDate.setMonth(startDate.getMonth() + 1);
            }
            
            const isToFreemiumPlan = newPlan[0].isFreemium === true;
            
            let newPaymentReference = null;
            let newPaymentGateway = isToFreemiumPlan ? 'NONE' as const : 'RAZORPAY' as const;
            let autoRenew = isToFreemiumPlan ? true : false; // Auto renew for freemium
            
            // If this is a paid plan, prepare to set up a new Razorpay subscription
            if (!isToFreemiumPlan) {
              try {
                // Set up Razorpay for the new plan if needed
                // In a real implementation, we would initiate a new Razorpay subscription here
                // For now, we'll just create a placeholder reference
                newPaymentReference = `scheduled_downgrade_${Date.now()}`;
                
                console.log(`Note: In production, we would create a new Razorpay subscription for plan ${newPlanId}. 
                          For now using a placeholder reference.`);
              } catch (error) {
                console.error('Error setting up payment gateway for downgraded plan:', error);
              }
            } else {
              // For free plans, use a simple reference
              newPaymentReference = `free_plan_${Date.now()}`;
            }
            
            // Update the current subscription status to CANCELLED
            await db.update(userSubscriptions)
              .set({
                status: 'CANCELLED',
                autoRenew: false,
                cancelDate: now,
                updatedAt: now,
                pendingPlanChangeTo: null,
                pendingPlanChangeDate: null,
                pendingPlanChangeType: null,
                metadata: {
                  ...((subscription as any).metadata || {}),
                  cancellationReason: `Cancelled due to scheduled downgrade to ${newPlan[0].name}`,
                  downgradedToFreemium: isToFreemiumPlan
                }
              })
              .where(eq(userSubscriptions.id, subscription.id));
              
            // Create a new subscription for the downgraded plan
            const subscriptionData = {
              userId: subscription.userId,
              planId: newPlanId,
              startDate,
              endDate: newEndDate,
              status: 'ACTIVE' as const,
              autoRenew: autoRenew,
              paymentGateway: newPaymentGateway,
              paymentReference: newPaymentReference,
              previousPlanId: currentPlanId,
              upgradeDate: now, // Actually a downgrade but we use the same field
              metadata: {
                planChangeHistory: {
                  date: now.toISOString(),
                  type: 'DOWNGRADE',
                  previousPlanId: currentPlanId,
                  previousSubscriptionId: subscription.id,
                  scheduledDowngrade: true,
                  isFreemiumDowngrade: isToFreemiumPlan
                }
              }
            };
            
            const newSubscription = await db.insert(userSubscriptions)
              .values(subscriptionData)
              .returning();
              
            if (!newSubscription.length) {
              throw new Error(`Failed to create new subscription for scheduled downgrade for user ${subscription.userId}`);
            }
            
            if (isToFreemiumPlan) {
              results.freemiumDowngrades.processed++;
              console.log(`Processed scheduled FREEMIUM downgrade for user ${subscription.userId} from plan ${currentPlanId} to ${newPlanId}`);
              
              // Initialize feature usage records for freemium plan
              try {
                // Get all features for this plan
                const planFeaturesList = await db.select()
                  .from(planFeaturesTable)
                  .where(eq(planFeaturesTable.planId, newPlanId));
                
                // For each feature, initialize a usage record if it's a countable feature
                for (const feature of planFeaturesList) {
                  // Only create usage records for countable features with a limit
                  if (feature.limitType === 'COUNT' && feature.limitValue !== null) {
                    // Check if usage record already exists
                    const existingUsage = await db.select()
                      .from(featureUsage)
                      .where(and(
                        eq(featureUsage.userId, subscription.userId),
                        eq(featureUsage.featureId, feature.featureId)
                      ))
                      .limit(1);
                    
                    if (existingUsage.length === 0) {
                      // Calculate reset date based on feature reset frequency
                      let resetDate = null;
                      if (feature.resetFrequency !== 'NEVER') {
                        resetDate = new Date();
                        switch (feature.resetFrequency) {
                          case 'DAILY':
                            resetDate.setDate(resetDate.getDate() + 1);
                            break;
                          case 'WEEKLY':
                            resetDate.setDate(resetDate.getDate() + 7);
                            break;
                          case 'MONTHLY':
                            resetDate.setMonth(resetDate.getMonth() + 1);
                            break;
                          case 'YEARLY':
                            resetDate.setFullYear(resetDate.getFullYear() + 1);
                            break;
                        }
                      }
                      
                      // Create usage record with zero initial usage
                      await db.insert(featureUsage)
                        .values({
                          userId: subscription.userId,
                          featureId: feature.featureId,
                          usageCount: 0,
                          aiTokenCount: 0,
                          resetDate,
                          createdAt: now,
                          updatedAt: now
                        });
                      
                      console.log(`Initialized usage record for feature ${feature.featureId} for user ${subscription.userId} on freemium downgrade`);
                    }
                  }
                }
              } catch (featureError) {
                console.error(`Error initializing feature usage for freemium downgrade ${newPlanId}:`, featureError);
                // Non-critical, continue with the subscription activation
              }
              
              // Record a zero-amount transaction for analytics purposes
              try {
                await db.insert(paymentTransactions)
                  .values({
                    userId: subscription.userId,
                    subscriptionId: newSubscription[0].id,
                    amount: '0.00',
                    currency: 'USD',
                    gateway: 'NONE',
                    gatewayTransactionId: `freemium_downgrade_${Date.now()}`,
                    status: 'COMPLETED',
                    createdAt: now,
                    updatedAt: now,
                    metadata: {
                      freemiumDowngrade: true,
                      previousPlanId: currentPlanId,
                      newPlanId: newPlanId,
                      newPlanName: newPlan[0].name
                    }
                  });
                
                console.log(`Recorded zero-amount transaction for freemium downgrade to plan ${newPlanId}`);
              } catch (transactionError) {
                console.error(`Error recording transaction for freemium downgrade to plan ${newPlanId}:`, transactionError);
                // Non-critical, continue with the subscription activation
              }
            } else {
              results.downgrades.processed++;
              console.log(`Processed scheduled paid plan downgrade for user ${subscription.userId} from plan ${currentPlanId} to ${newPlanId}`);
            }
            
            // For a complete implementation, we would need to set up a renewal payment method
            // for the new subscription, potentially requiring user action
          } else if (changeType === 'UPGRADE') {
            // Upgrades shouldn't generally be scheduled, but handle them just in case
            // Most upgrades should be processed immediately via processUpgrade
            console.warn(`Found a scheduled upgrade for subscription ${subscription.id} - this is unusual`);
            
            // Clear the pending change since it should have been processed immediately
            await db.update(userSubscriptions)
              .set({
                pendingPlanChangeTo: null,
                pendingPlanChangeDate: null,
                pendingPlanChangeType: null,
                updatedAt: now
              })
              .where(eq(userSubscriptions.id, subscription.id));
              
            results.upgrades.processed++;
          }
        } catch (error) {
          console.error(`Error processing change for subscription ${subscription.id}:`, error);
          if (subscription.pendingPlanChangeType === 'UPGRADE') {
            results.upgrades.failed++;
          } else {
            // Check if it's a freemium downgrade
            const metadata = (subscription as any).metadata || {};
            const isFreemiumDowngrade = metadata?.pendingDowngrade?.isFreemiumDowngrade === true;
            
            if (isFreemiumDowngrade) {
              results.freemiumDowngrades.failed++;
            } else {
              results.downgrades.failed++;
            }
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error processing scheduled plan changes:', error);
      throw error;
    }
  },

  /**
   * Process upgrade to a paid plan - updated to use the new processUpgrade method
   */
  async upgradeToPaidPlan(
    userId: number, 
    planId: number, 
    paymentId: string, 
    gateway: string, 
    signature?: string, 
    subscriptionId?: string, 
    options?: { isUpgrade?: boolean }
  ): Promise<{ subscription: any; transaction: any; message: string }> {
    try {
      console.log(`Processing paid plan upgrade/subscription - User: ${userId}, Plan: ${planId}, Payment: ${paymentId}, Gateway: ${gateway}, isUpgrade: ${options?.isUpgrade}`);
      
      // Input validation
      if (!userId || !planId || !paymentId || !gateway) {
        throw new Error('Missing required parameters for upgrading to paid plan');
      }
      
      // Check if user has an active subscription
      const currentSubscription = await this.getActiveSubscription(userId);
      
      // Force isUpgrade to false if no current subscription exists
      const isActuallyUpgrade = currentSubscription !== null && (options?.isUpgrade !== false);
      
      if (isActuallyUpgrade) {
        console.log(`User ${userId} has an active subscription. Processing as upgrade.`);
        // If they have a subscription, use the new processUpgrade method
        return await this.processUpgrade(userId, planId, paymentId, gateway, signature, subscriptionId, options);
      } else {
        // If this is their first subscription, use the original implementation
        console.log(`User ${userId} has no active subscription or isUpgrade=false. Processing as new subscription.`);
        // Normalize gateway name
        const gatewayName = gateway.toLowerCase();
        
        // Validate gateway - only allow supported values from PaymentGatewayEnum
        if (gatewayName !== 'razorpay') {
          throw new Error(`Invalid payment gateway: ${gateway}. Only 'razorpay' is currently supported.`);
        }
        
        // Verify payment
        const paymentGateway = getPaymentGatewayByName(gatewayName);
        if (!paymentGateway) {
          throw new Error(`Could not initialize payment gateway: ${gateway}`);
        }
        
        // Pass signature and subscriptionId to verifyPayment if available
        const verified = await paymentGateway.verifyPayment(paymentId, signature, subscriptionId);
        
        if (!verified) {
          throw new Error('Payment verification failed');
        }
        
        console.log(`Payment verified successfully: ${paymentId}`);

        // Get plan details
        const plan = await db.select()
          .from(subscriptionPlans)
          .where(and(
            eq(subscriptionPlans.id, planId),
            eq(subscriptionPlans.active, true)
          ))
          .limit(1);
        
        if (!plan.length) {
          throw new Error('Plan not found or not active');
        }
        
        if (plan[0].isFreemium) {
          throw new Error('Cannot process payment for a free plan');
        }

        // Calculate start and end dates
        const now = new Date();
        const endDate = new Date(now);
        
        // Set end date based on billing cycle
        if (plan[0].billingCycle === 'YEARLY') {
          endDate.setFullYear(now.getFullYear() + 1);
        } else if (plan[0].billingCycle === 'MONTHLY') {
          endDate.setMonth(now.getMonth() + 1);
        } else {
          throw new Error(`Unsupported billing cycle: ${plan[0].billingCycle}`);
        }

        // Create new subscription
        const subscription = await db.insert(userSubscriptions)
          .values({
            userId,
            planId,
            startDate: now,
            endDate,
            status: 'ACTIVE',
            paymentGateway: 'RAZORPAY' as const,
            paymentReference: subscriptionId || paymentId, // Use subscription ID if provided
            autoRenew: true,
            metadata: {
              initialActivation: {
                date: now.toISOString(),
                planId: planId,
                planName: plan[0].name,
                paymentId: paymentId
              }
            }
          })
          .returning();
          
        if (!subscription.length) {
          throw new Error('Failed to create subscription');
        }

        // Get pricing for the plan
        const pricing = await db.select()
          .from(planPricing)
          .where(eq(planPricing.planId, planId))
          .limit(1);

        // Get user's billing region to determine correct currency for this transaction
        const userBillingInfo = await db.select()
          .from(userBillingDetails)
          .where(eq(userBillingDetails.userId, userId))
          .limit(1);
        
        // Determine expected currency based on user's region
        const expectedCurrency = userBillingInfo.length > 0 && userBillingInfo[0].country === 'IN' ? 'INR' : 'USD';
        const actualCurrency = pricing.length ? pricing[0].currency : 'USD';
        const hasCurrencyMismatch = expectedCurrency !== actualCurrency;
        
        // Get the appropriate price for the user's region
        const finalPricingData = await db.select()
          .from(planPricing)
          .where(and(
            eq(planPricing.planId, planId),
            eq(planPricing.currency, expectedCurrency)
          ))
          .limit(1);
        
        const correctPlanPrice = finalPricingData.length > 0 ? finalPricingData[0].price : pricing.length ? pricing[0].price : '0.00';
        const correctPlanCurrency = finalPricingData.length > 0 ? finalPricingData[0].currency : expectedCurrency;

        // Check if a transaction already exists with this payment ID
        const existingTransaction = await db.select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.gatewayTransactionId, paymentId))
          .execute();
          
        if (existingTransaction.length > 0) {
          console.log(`Transaction for payment ${paymentId} already exists (${existingTransaction.length} records), skipping creation`);
        }

        // Record payment transaction with rich metadata like the script does
        const transaction = await db.insert(paymentTransactions)
          .values({
            userId,
            subscriptionId: subscription[0].id,
            amount: pricing.length ? pricing[0].price : '0.00',
            currency: actualCurrency,
            gateway: 'RAZORPAY' as const,
            gatewayTransactionId: paymentId,
            status: 'COMPLETED',
            refundReason: `Initial subscription payment for ${plan[0].name} plan`,
            metadata: {
              // Store rich metadata for better admin UI display
              planDetails: {
                id: planId,
                name: plan[0].name,
                cycle: plan[0].billingCycle
              },
              paymentDetails: {
                expectedCurrency: expectedCurrency,
                actualCurrency: actualCurrency,
                hasCurrencyMismatch: hasCurrencyMismatch,
                correctPlanPrice: correctPlanPrice,
                correctPlanCurrency: correctPlanCurrency
              },
              userRegion: userBillingInfo.length > 0 ? (userBillingInfo[0].country === 'IN' ? 'INDIA' : 'GLOBAL') : 'GLOBAL',
              userCountry: userBillingInfo.length > 0 ? userBillingInfo[0].country : null,
              isUpgrade: false
            }
          })
          .onConflictDoNothing() // Extra safeguard against duplicates
          .returning();
        
        if (!transaction.length) {
          console.warn(`Failed to record payment transaction for subscription ${subscription[0].id}`);
        }
        
        console.log(`Subscription ${subscription[0].id} created successfully`);

        const message = `Your subscription to the ${plan[0].name} plan has been activated successfully.`;
        
        // Create notification for paid plan activation
        try {
          // Get user data for admin notification
          const userData = await storage.getUser(userId);
          
          await notificationService.createNotification({
            recipientId: userId,
            type: 'subscription_activated',
            category: 'subscription',
            data: { 
              planName: plan[0].name,
              planId: planId,
              subscriptionId: subscription[0].id,
              planType: 'paid',
              activationType: 'paid_activation',
              amount: pricing.length ? pricing[0].price : '0.00',
              currency: actualCurrency
            }
          });
          
          // Notify admins about new subscription
          await adminNotificationService.notifyNewSubscription({
            userId: userId,
            userName: userData?.fullName || userData?.username || 'Unknown User',
            planName: plan[0].name,
            amount: pricing.length ? pricing[0].price : '0.00',
            currency: actualCurrency,
            subscriptionId: subscription[0].id
          });
        } catch (notificationError) {
          console.error('Failed to create paid plan activation notification:', notificationError);
          // Don't fail the request if notification fails
        }
        
        return {
          subscription: subscription[0],
          transaction: transaction[0],
          message: message
        };
      }
    } catch (error) {
      console.error('Error upgrading to paid plan:', error);
      throw error;
    }
  },

  /**
   * Process downgrade - updated to use the new scheduleDowngrade method
   */
  async downgradeWithCredit(userId: number, planId: number, creditAmount: number) {
    try {
      // Use the new scheduleDowngrade method
      return await this.scheduleDowngrade(userId, planId);
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      throw error;
    }
  },

  /**
   * Cancel a user's subscription
   */
  async cancelSubscription(userId: number) {
    try {
      // Find the user's active subscription
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE')
        ))
        .limit(1);

      if (!subscription.length) {
        throw new Error('No active subscription found');
      }

      // Get the subscription reference (Razorpay subscription ID)
      const subscriptionRef = subscription[0].paymentReference;
      
      // Only attempt to cancel with payment gateway if it's not a free plan and has a reference
      if (subscription[0].paymentGateway !== 'NONE' && subscriptionRef) {
        try {
          // Always use Razorpay gateway
          const gateway = getPaymentGatewayByName('razorpay');
          
          // Check subscription start date to avoid cancellation errors for future-dated subscriptions
          const startDate = new Date(subscription[0].startDate);
          const now = new Date();
          if (startDate > now) {
            console.log(`Subscription ${subscriptionRef} starts in the future (${startDate.toISOString()}). Marking as cancelled locally without calling Razorpay.`);
          } else {
            // Cancel subscription at the end of the billing period by setting cancel_at_cycle_end to 1
            await gateway.cancelSubscription(subscriptionRef, { cancel_at_cycle_end: 1 });
            console.log(`Subscription ${subscriptionRef} scheduled to cancel at end of billing period`);
          }
        } catch (paymentError: any) {
          console.error('Error cancelling with payment gateway:', paymentError);
          // Check if the error is specifically about no billing cycle being active
          if (paymentError?.error?.description?.includes('no billing cycle is going on')) {
            console.log(`Razorpay error: no billing cycle active for subscription ${subscriptionRef}. Marking as cancelled locally despite this error.`);
          } else {
            // For other errors, continue with local cancellation but log the issue
            console.log(`Other Razorpay error for subscription ${subscriptionRef}. Proceeding with local cancellation.`);
          }
          // Continue with local cancellation despite payment gateway error
        }
      }

      // Update subscription status in database 
      // Note: We still mark it as ACTIVE but set autoRenew to false
      // The status will change to CANCELLED at the end of billing period
      const updatedSubscription = await db.update(userSubscriptions)
        .set({
          autoRenew: false,
          cancelDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, subscription[0].id))
        .returning();

      // Create notification for subscription cancellation
      try {
        await notificationService.createNotification({
          recipientId: userId,
          type: 'subscription_cancelled',
          category: 'subscription',
          data: { 
            subscriptionId: subscription[0].id,
            planId: subscription[0].planId,
            cancelDate: new Date().toISOString(),
            willEndAt: subscription[0].endDate
          }
        });
      } catch (notificationError) {
        console.error('Failed to create subscription cancellation notification:', notificationError);
        // Don't fail the request if notification fails
      }

      return updatedSubscription[0];
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  },

  /**
   * Reset usage for eligible features (based on their reset frequency)
   */
  async resetFeatureUsage() {
    try {
      const now = new Date();
      
      // Find all usage records
      const allUsage = await db.select()
        .from(featureUsage);
      
      // Filter for those with reset dates before now
      const usageToReset = allUsage.filter(usage => 
        usage.resetDate && new Date(usage.resetDate) < now
      );
      
      // Reset each eligible usage record
      for (const usage of usageToReset) {
        // Get the feature to determine reset frequency
        const feature = await db.select()
          .from(planFeaturesTable)
          .where(eq(planFeaturesTable.featureId, usage.featureId))
          .limit(1);
        
        const resetFrequency = feature.length > 0 ? feature[0].resetFrequency : null;
        
        // Reset the usage count and update the next reset date
        await db.update(featureUsage)
          .set({
            usageCount: 0,
            aiTokenCount: 0,
            resetDate: this.calculateNextResetDate(usage.resetDate, resetFrequency),
            updatedAt: now
          })
          .where(eq(featureUsage.id, usage.id));
      }
      
      return usageToReset.length;
    } catch (error) {
      console.error('Error resetting feature usage:', error);
      throw error;
    }
  },

  /**
   * Calculate next reset date based on current date and frequency
   */
  calculateNextResetDate(currentResetDate: Date | null, frequency: string | null) {
    if (!currentResetDate || !frequency) {
      return null;
    }
    
    const nextReset = new Date(currentResetDate);
    
    switch (frequency) {
      case 'DAILY':
        nextReset.setDate(nextReset.getDate() + 1);
        break;
      case 'WEEKLY':
        nextReset.setDate(nextReset.getDate() + 7);
        break;
      case 'MONTHLY':
        nextReset.setMonth(nextReset.getMonth() + 1);
        break;
      case 'YEARLY':
        nextReset.setFullYear(nextReset.getFullYear() + 1);
        break;
      default:
        return null; // No reset for unknown frequencies
    }
    
    return nextReset;
  },

  /**
   * Find subscriptions that need to be renewed
   */
  async findSubscriptionsToRenew() {
    try {
      const now = new Date();
      
      // Find active subscriptions with auto-renew enabled that are expiring soon (within 24 hours)
      const expiringIn24Hours = new Date(now);
      expiringIn24Hours.setDate(now.getDate() + 1);
      
      const expiringSubscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.status, 'ACTIVE'),
          eq(userSubscriptions.autoRenew, true),
          // Use SQL expressions for date comparisons
          gt(userSubscriptions.endDate, now),
          lt(userSubscriptions.endDate, expiringIn24Hours)
        ));
      
      return expiringSubscriptions;
    } catch (error) {
      console.error('Error finding subscriptions to renew:', error);
      throw error;
    }
  },

  /**
   * Process subscription renewal - only for free plans
   * Paid plans are handled by Razorpay webhooks
   */
  async processSubscriptionRenewal(subscription: any) {
    try {
      // For Razorpay subscriptions, renewal is handled automatically through webhooks
      // We only need to process renewal for 'NONE' payment gateway (free plans)
      if (subscription.paymentGateway !== 'NONE') {
        console.log(`Skipping renewal processing for subscription ${subscription.id} with payment gateway ${subscription.paymentGateway}`);
        return {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          renewed: false,
          message: 'Handled by payment gateway'
        };
      }

      // Get the plan being renewed
      const plan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription.planId))
        .limit(1);
        
      if (!plan.length) {
        throw new Error(`Plan not found for subscription ${subscription.id}`);
      }
      
      // Verify that this is actually a freemium plan before auto-renewing
      const isFreemiumPlan = plan[0].isFreemium || plan[0].price === '0.00' || plan[0].price === '0';
      
      if (!isFreemiumPlan) {
        console.error(`Attempted to auto-renew non-freemium plan ${subscription.planId} with NONE payment gateway. This should not happen.`);
        // Record this anomaly for investigation
        await db.insert(appSettings)
          .values({
            key: `freemium_renewal_anomaly_${subscription.id}_${Date.now()}`,
            value: {
              subscriptionId: subscription.id,
              userId: subscription.userId,
              planId: subscription.planId,
              planName: plan[0].name,
              timestamp: new Date().toISOString()
            },
            category: 'subscription_anomalies'
          })
          .onConflictDoNothing();
          
        return {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          renewed: false,
          error: true,
          message: 'Cannot auto-renew non-freemium plan with NONE payment gateway'
        };
      }
      
      // Calculate new end date based on the billing cycle
      const now = new Date();
      const newEndDate = new Date();
      
      if (plan[0].billingCycle === 'YEARLY') {
        newEndDate.setFullYear(now.getFullYear() + 1);
      } else {
        // Default to monthly
        newEndDate.setMonth(now.getMonth() + 1);
      }
      
      // Create the renewal for free plan
      await db.update(userSubscriptions)
        .set({
          startDate: now,
          endDate: newEndDate,
          status: 'ACTIVE',
          updatedAt: now,
          metadata: {
            ...((subscription as any).metadata || {}),
            freemiumRenewals: [
              ...((subscription as any).metadata?.freemiumRenewals || []),
              {
                date: now.toISOString(),
                previousEndDate: subscription.endDate,
                newEndDate: newEndDate.toISOString()
              }
            ]
          }
        })
        .where(eq(userSubscriptions.id, subscription.id));
        
      // For free plans, record a zero-amount transaction with correct type casting
      await db.insert(paymentTransactions)
        .values({
          userId: subscription.userId,
          subscriptionId: subscription.id,
          amount: '0',
          currency: 'USD',
          gateway: 'NONE',
          gatewayTransactionId: `freemium_renewal_${Date.now()}`,
          status: 'COMPLETED',
          metadata: {
            renewalType: 'freemium_auto_renewal',
            planName: plan[0].name,
            planId: subscription.planId,
            billingCycle: plan[0].billingCycle
          }
        });
        
      // Reset feature usage if needed
      try {
        // Get all features for this plan
        const planFeaturesList = await db.select()
          .from(planFeaturesTable)
          .where(eq(planFeaturesTable.planId, subscription.planId));
          
        // For each feature, reset usage counts if feature has a reset frequency
        for (const feature of planFeaturesList) {
          if (feature.resetFrequency !== 'NEVER' && feature.limitType === 'COUNT') {
            // Find existing usage record
            const usageRecord = await db.select()
              .from(featureUsage)
              .where(and(
                eq(featureUsage.userId, subscription.userId),
                eq(featureUsage.featureId, feature.featureId)
              ))
              .limit(1);
              
            if (usageRecord.length > 0) {
              // Calculate next reset date
              const resetDate = this.calculateNextResetDate(now, feature.resetFrequency);
              
              // Reset usage count
              await db.update(featureUsage)
                .set({
                  usageCount: 0,
                  aiTokenCount: 0,
                  resetDate,
                  updatedAt: now
                })
                .where(eq(featureUsage.id, usageRecord[0].id));
                
              console.log(`Reset usage for feature ${feature.featureId} for user ${subscription.userId} on freemium renewal`);
            }
          }
        }
      } catch (featureError) {
        console.error(`Error resetting feature usage during freemium renewal for subscription ${subscription.id}:`, featureError);
        // Non-critical, continue with renewal
      }
        
      const result = {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        renewed: true,
        newEndDate,
        isFreemium: true
      };
      
      console.log(`Renewed freemium subscription ${subscription.id} - New end date: ${newEndDate.toISOString()}`);
      
      return result;
    } catch (error) {
      console.error('Error processing subscription renewal:', error);
      throw error;
    }
  },

  /**
   * Find subscriptions that have entered grace period
   */
  async findExpiredSubscriptions() {
    try {
      const now = new Date();
      
      // Find active subscriptions that have passed their end date
      const expiredSubscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.status, 'ACTIVE'),
          lt(userSubscriptions.endDate, now)
        ));
      
      return expiredSubscriptions;
    } catch (error) {
      console.error('Error finding expired subscriptions:', error);
      throw error;
    }
  },

  /**
   * Move subscription to grace period
   */
  async moveToGracePeriod(subscriptionId: number, gracePeriodDays: number = 7) {
    try {
      const now = new Date();
      const gracePeriodEnd = new Date(now);
      gracePeriodEnd.setDate(now.getDate() + gracePeriodDays);
      
      await db.update(userSubscriptions)
        .set({
          status: 'GRACE_PERIOD',
          gracePeriodEnd,
          updatedAt: now
        })
        .where(eq(userSubscriptions.id, subscriptionId));
      
      return { success: true, gracePeriodEnd };
    } catch (error) {
      console.error(`Error moving subscription ${subscriptionId} to grace period:`, error);
      throw error;
    }
  },

  /**
   * Find subscriptions that have exceeded grace period and should be expired
   */
  async findGracePeriodsToExpire() {
    try {
      const now = new Date();
      
      // Find grace period subscriptions that have passed their grace period end date
      const expiredGracePeriods = await db
        .select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.status, 'GRACE_PERIOD'),
          isNotNull(userSubscriptions.gracePeriodEnd),
          lt(userSubscriptions.gracePeriodEnd, now)
        ));
      
      return expiredGracePeriods;
    } catch (error) {
      console.error('Error finding grace periods to expire:', error);
      throw error;
    }
  },

  /**
   * Expire a subscription that has exceeded its grace period
   */
  async expireSubscription(subscriptionId: number) {
    try {
      await db.update(userSubscriptions)
        .set({
          status: 'EXPIRED',
          autoRenew: false,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, subscriptionId));
      
      return { success: true };
    } catch (error) {
      console.error(`Error expiring subscription ${subscriptionId}:`, error);
      throw error;
    }
  },

  /**
   * Notify user about subscription status
   * (This would integrate with your notification system)
   */
  async sendSubscriptionNotification(userId: number, type: 'renewal' | 'grace_period' | 'expiration', data: any) {
    try {
      console.log(`Sending ${type} notification to user ${userId}:`, data);
      
      // Create notification using the notification service
      let notificationType: string;
      let title: string;
      let message: string;
      
      switch (type) {
        case 'renewal':
          notificationType = 'subscription_renewed';
          title = 'Subscription Renewed';
          message = `Your subscription has been renewed successfully.`;
          break;
        case 'grace_period':
          notificationType = 'subscription_grace_period';
          title = 'Subscription Grace Period';
          message = `Your subscription has expired but you have ${data.gracePeriodDays || 7} days of grace period.`;
          break;
        case 'expiration':
          notificationType = 'subscription_expired';
          title = 'Subscription Expired';
          message = `Your subscription has expired. Please renew to continue using premium features.`;
          break;
        default:
          notificationType = 'custom_notification';
          title = 'Subscription Update';
          message = `Your subscription status has been updated.`;
      }
      
      await notificationService.createNotification({
        recipientId: userId,
        type: notificationType as any,
        category: 'subscription',
        title,
        message,
        data: {
          subscriptionId: data.subscriptionId,
          planId: data.planId,
          notificationType: type,
          ...data
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error(`Error sending ${type} notification to user ${userId}:`, error);
      // We don't throw here as this is not critical to the subscription process
      return { success: false, error };
    }
  },

  /**
   * Process all subscription renewals, grace periods, and expirations
   * Also process any scheduled plan changes
   * This should be called by a scheduled job
   */
  async processSubscriptionCycle() {
    try {
      const results = {
        renewals: { attempted: 0, succeeded: 0, failed: 0 },
        gracePeriods: { processed: 0 },
        expirations: { processed: 0 },
        planChanges: { 
          upgrades: { processed: 0, failed: 0 },
          downgrades: { processed: 0, failed: 0 }
        }
      };
      
      // Step 1: Process renewals for subscriptions about to expire
      const subscriptionsToRenew = await this.findSubscriptionsToRenew();
      
      for (const subscription of subscriptionsToRenew) {
        results.renewals.attempted++;
        
        try {
          await this.processSubscriptionRenewal(subscription);
          results.renewals.succeeded++;
          
          // Notify user about upcoming renewal
          await this.sendSubscriptionNotification(subscription.userId, 'renewal', {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            endDate: subscription.endDate
          });
        } catch (error) {
          results.renewals.failed++;
          console.error(`Failed to renew subscription ${subscription.id}:`, error);
        }
      }
      
      // Step 2: Move expired subscriptions to grace period
      const expiredSubscriptions = await this.findExpiredSubscriptions();
      
      for (const subscription of expiredSubscriptions) {
        try {
          await this.moveToGracePeriod(subscription.id);
          results.gracePeriods.processed++;
          
          // Notify user about grace period
          await this.sendSubscriptionNotification(subscription.userId, 'grace_period', {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            gracePeriodDays: 7
          });
        } catch (error) {
          console.error(`Failed to move subscription ${subscription.id} to grace period:`, error);
        }
      }
      
      // Step 3: Expire subscriptions that have exceeded grace period
      const gracePeriodSubscriptions = await this.findGracePeriodsToExpire();
      
      for (const subscription of gracePeriodSubscriptions) {
        try {
          await this.expireSubscription(subscription.id);
          results.expirations.processed++;
          
          // Notify user about expiration
          await this.sendSubscriptionNotification(subscription.userId, 'expiration', {
            subscriptionId: subscription.id,
            planId: subscription.planId
          });
        } catch (error) {
          console.error(`Failed to expire subscription ${subscription.id}:`, error);
        }
      }
      
      // Step 4: Process scheduled plan changes
      try {
        const planChangeResults = await this.processScheduledChanges();
        
        results.planChanges.upgrades.processed = planChangeResults.upgrades.processed;
        results.planChanges.upgrades.failed = planChangeResults.upgrades.failed;
        results.planChanges.downgrades.processed = planChangeResults.downgrades.processed;
        results.planChanges.downgrades.failed = planChangeResults.downgrades.failed;
      } catch (error) {
        console.error('Error processing scheduled plan changes:', error);
      }
      
      return results;
    } catch (error) {
      console.error('Error processing subscription cycle:', error);
      throw error;
    }
  }
}; 