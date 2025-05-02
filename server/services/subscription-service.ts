import { db } from '../config/db';
import { userSubscriptions, subscriptionPlans, paymentTransactions, planPricing, featureUsage, planFeatures, userBillingDetails, PaymentGatewayEnum } from '@shared/schema';
import { eq, and, desc, gt, lt, isNotNull } from 'drizzle-orm';
import { getPaymentGatewayForUser, getPaymentGatewayByName } from './payment-gateways';

// Necessary to avoid type errors with targetRegion
type RegionType = 'INDIA' | 'GLOBAL';
type PaymentGatewayType = 'RAZORPAY' | 'NONE';

/**
 * SubscriptionService handles business logic for subscription management
 */
export const SubscriptionService = {
  /**
   * Get a user's active subscription
   */
  async getActiveSubscription(userId: number) {
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
          billingCycle: subscriptionPlans.billingCycle
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE')
        ));
      
      return subscriptions.length > 0 ? subscriptions[0] : null;
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
          billingCycle: subscriptionPlans.billingCycle
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
      
      // Check regional pricing to see if it's free in any region
      const pricing = await db.select().from(planPricing).where(eq(planPricing.planId, planId));
      
      // Double-check if it's actually a free plan by checking both plan and regional pricing
      const isFreePlan = plan[0].isFreemium || plan[0].price === '0.00' || plan[0].price === '0' || 
                         pricing.some(p => p.price === '0.00' || p.price === '0');
      if (!isFreePlan) {
        console.error(`Plan ${planId} is not a free plan - price is ${plan[0].price} and regional pricing does not include free options`);
        throw new Error('Plan not found or not a free plan');
      }
      
      // Check for existing subscription
      const existingSubscription = await db.select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.planId, planId),
          eq(userSubscriptions.status, 'ACTIVE')
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
            updatedAt: now
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
            autoRenew: false,
            paymentGateway: 'NONE',
            paymentReference: `free_${Date.now()}`,
            createdAt: now,
            updatedAt: now
          })
          .returning();
      }
      
      if (!subscription || subscription.length === 0) {
        throw new Error('Failed to create or update subscription');
      }
      
      console.log(`Free plan ${planId} activated for user ${userId} with subscription ID ${subscription[0].id}`);
      return subscription[0];
    } catch (error: any) {
      console.error(`Error activating free plan ${planId} for user ${userId}:`, error);
      throw new Error(`Failed to activate free plan: ${error.message}`);
    }
  },

  /**
   * Calculate prorated credit for upgrading/downgrading subscription
   */
  async calculateProration(userId: number, newPlanId: number) {
    try {
      const currentSubscription = await this.getActiveSubscription(userId);
      if (!currentSubscription) {
        return { 
          prorationAmount: 0, 
          prorationCredit: 0,
          requiresPayment: true,
          isUpgrade: true 
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

      // Get the latest payment transaction for current subscription
      const latestPayment = await db.select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.subscriptionId, currentSubscription.id))
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(1);

      if (!latestPayment.length) {
        // If no payment transaction found, no proration needed
        return { 
          prorationAmount: 0, 
          prorationCredit: 0,
          requiresPayment: true,
          isUpgrade: true 
        };
      }

      // Calculate remaining subscription time
      const now = new Date();
      const endDate = new Date(currentSubscription.endDate);
      const startDate = new Date(currentSubscription.startDate);
      const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const remainingDays = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      const remainingPercentage = remainingDays / totalDays;

      // Calculate value of remaining days in current subscription
      const amountPaid = Number(latestPayment[0].amount);
      const remainingValue = amountPaid * remainingPercentage;

      // Get pricing for current plan and new plan to determine if it's an upgrade or downgrade
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

      if (isUpgrade) {
        // If upgrading, calculate amount to pay (new price - remaining value of current plan)
        const prorationAmount = newPrice - remainingValue;
        return {
          prorationAmount: Math.max(prorationAmount, 0),
          prorationCredit: 0,
          requiresPayment: prorationAmount > 0,
          isUpgrade: true
        };
      } else {
        // If downgrading, calculate credit to apply to next billing cycle
        const prorationCredit = remainingValue - newPrice;
        return {
          prorationAmount: 0,
          prorationCredit: Math.max(prorationCredit, 0),
          requiresPayment: false,
          isUpgrade: false
        };
      }
    } catch (error) {
      console.error('Error calculating proration:', error);
      throw error;
    }
  },

  /**
   * Process upgrade to a paid plan
   */
  async upgradeToPaidPlan(userId: number, planId: number, paymentId: string, gateway: string, signature?: string, subscriptionId?: string) {
    try {
      console.log(`Processing paid plan upgrade - User: ${userId}, Plan: ${planId}, Payment: ${paymentId}, Gateway: ${gateway}`);
      
      // Input validation
      if (!userId || !planId || !paymentId || !gateway) {
        throw new Error('Missing required parameters for upgrading to paid plan');
      }
      
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

      // Get current subscription if any
      const currentSubscription = await this.getActiveSubscription(userId);
      let subscription;

      if (currentSubscription) {
        // Update existing subscription
        subscription = await db.update(userSubscriptions)
          .set({
            planId,
            startDate: now,
            endDate,
            status: 'ACTIVE',
            paymentGateway: 'RAZORPAY' as const,
            paymentReference: paymentId,
            previousPlanId: currentSubscription.planId,
            upgradeDate: now,
            autoRenew: true,
            updatedAt: now
          })
          .where(eq(userSubscriptions.id, currentSubscription.id))
          .returning();
          
        if (!subscription.length) {
          throw new Error('Failed to update subscription');
        }
      } else {
        // Create new subscription
        subscription = await db.insert(userSubscriptions)
          .values({
            userId,
            planId,
            startDate: now,
            endDate,
            status: 'ACTIVE',
            paymentGateway: 'RAZORPAY' as const,
            paymentReference: paymentId,
            autoRenew: true
          })
          .returning();
          
        if (!subscription.length) {
          throw new Error('Failed to create subscription');
        }
      }

      // Get pricing for the plan
      const pricing = await db.select()
        .from(planPricing)
        .where(eq(planPricing.planId, planId))
        .limit(1);

      // Record payment transaction
      const transaction = await db.insert(paymentTransactions)
        .values({
          userId,
          subscriptionId: subscription[0].id,
          amount: pricing.length ? pricing[0].price : '0.00',
          currency: pricing.length ? pricing[0].currency : 'USD',
          gateway: 'RAZORPAY' as const,
          gatewayTransactionId: paymentId,
          status: 'COMPLETED'
        })
        .returning();
        
      if (!transaction.length) {
        console.warn(`Failed to record payment transaction for subscription ${subscription[0].id}`);
      }
      
      console.log(`Subscription ${subscription[0].id} created/updated successfully`);

      return {
        subscription: subscription[0],
        transaction: transaction[0]
      };
    } catch (error) {
      console.error('Error upgrading to paid plan:', error);
      throw error;
    }
  },

  /**
   * Process downgrade with credit for next billing cycle
   */
  async downgradeWithCredit(userId: number, planId: number, creditAmount: number) {
    try {
      // Get current subscription
      const currentSubscription = await this.getActiveSubscription(userId);
      if (!currentSubscription) {
        throw new Error('No active subscription found');
      }

      // Get new plan details
      const newPlan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);
      
      if (!newPlan.length) {
        throw new Error('Plan not found');
      }

      const now = new Date();
      // Use the existing end date to keep the current billing cycle
      const endDate = new Date(currentSubscription.endDate);

      // Update subscription
      const updatedSubscription = await db.update(userSubscriptions)
        .set({
          planId,
          // Start date remains the same to keep track of the full billing cycle
          // but we set a downgrade date to track when it was changed
          previousPlanId: currentSubscription.planId,
          upgradeDate: now, // This is actually a downgrade date in this case
          updatedAt: now
        })
        .where(eq(userSubscriptions.id, currentSubscription.id))
        .returning();

      // Record the credit for use in next billing cycle if significant
      if (creditAmount > 0) {
        // Store credit information (this could be in a separate credits table in a real implementation)
        // For now, we'll record it as a special transaction type
        await db.insert(paymentTransactions)
          .values({
            userId,
            subscriptionId: currentSubscription.id,
            amount: creditAmount.toString(),
            currency: 'USD', // Assuming USD as default
            gateway: 'RAZORPAY' as any,
            status: 'COMPLETED',
            refundReason: 'Downgrade credit for next billing cycle'
          });
      }

      return updatedSubscription[0];
    } catch (error) {
      console.error('Error downgrading with credit:', error);
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
          await gateway.cancelSubscription(subscriptionRef);
        } catch (paymentError) {
          console.error('Error cancelling with payment gateway:', paymentError);
          // Continue with local cancellation despite payment gateway error
        }
      }

      // Update subscription status in database
      const updatedSubscription = await db.update(userSubscriptions)
        .set({
          status: 'CANCELLED',
          autoRenew: false,
          cancelDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, subscription[0].id))
        .returning();

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
          .from(planFeatures)
          .where(eq(planFeatures.featureId, usage.featureId))
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
      
      // Calculate new end date based on the billing cycle
      const now = new Date();
      const newEndDate = new Date();
      
      if (plan[0].billingCycle === 'YEARLY') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      } else {
        // Default to monthly
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      }
      
      // Create the renewal for free plan
      await db.update(userSubscriptions)
        .set({
          startDate: now,
          endDate: newEndDate,
          status: 'ACTIVE',
          updatedAt: now
        })
        .where(eq(userSubscriptions.id, subscription.id));
        
      // For free plans, record a zero-amount transaction with correct type casting
      await db.insert(paymentTransactions)
        .values({
          userId: subscription.userId,
          subscriptionId: subscription.id,
          amount: '0',
          currency: 'USD',
          gateway: PaymentGatewayEnum.enumValues[0], // RAZORPAY enum value
          gatewayTransactionId: `renewal_${Date.now()}`,
          status: 'COMPLETED'
        });
        
      const result = {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        renewed: true,
        newEndDate
      };
      
      console.log(`Renewed subscription ${subscription.id} - New end date: ${newEndDate.toISOString()}`);
      
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
      
      // Here you would integrate with your notification system
      // Example:
      // await notificationService.send({
      //   userId,
      //   type: `subscription_${type}`,
      //   data
      // });
      
      return { success: true };
    } catch (error) {
      console.error(`Error sending ${type} notification to user ${userId}:`, error);
      // We don't throw here as this is not critical to the subscription process
      return { success: false, error };
    }
  },

  /**
   * Process all subscription renewals, grace periods, and expirations
   * This should be called by a scheduled job
   */
  async processSubscriptionCycle() {
    try {
      const results = {
        renewals: { attempted: 0, succeeded: 0, failed: 0 },
        gracePeriods: { processed: 0 },
        expirations: { processed: 0 }
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
      
      return results;
    } catch (error) {
      console.error('Error processing subscription cycle:', error);
      throw error;
    }
  }
}; 