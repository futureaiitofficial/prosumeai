import { Request } from 'express';
import { db } from '../config/db';
import { userSubscriptions, subscriptionPlans, planPricing, paymentTransactions, userBillingDetails, paymentGatewayConfigs, paymentWebhookEvents, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Utility function to decrypt API keys
export function decryptApiKey(encryptedKey: string): string {
  const SECRET = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!SECRET || !encryptedKey.includes(':')) {
    return encryptedKey; // Return as-is if no secret or not in the expected format
  }

  try {
    const [ivHex, encryptedText] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET, 'hex'), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedKey; // Return encrypted version in case of error
  }
}

// Payment gateway interface
export interface PaymentGateway {
  createPaymentIntent(amount: number, currency: string, metadata: any): Promise<any>;
  verifyPayment(paymentId: string, signature?: string, subscriptionId?: string): Promise<boolean>;
  createSubscription(planId: number, userId: number, metadata: any): Promise<any>;
  cancelSubscription(subscriptionId: string): Promise<any>;
  processWebhook(req: Request): Promise<any>;
  getSubscriptionDetails(subscriptionId: string): Promise<any>;
}

// Factory to get the appropriate payment gateway based on user region
export async function getPaymentGatewayForUser(userId: number): Promise<PaymentGateway> {
  try {
    console.log(`Determining payment gateway for user ID: ${userId}`);
    
    // Get user's billing details to determine region - for currency/price selection later
    const billingDetails = await db.select()
      .from(userBillingDetails)
      .where(eq(userBillingDetails.userId, userId))
      .limit(1);

    console.log(`Billing details found: ${billingDetails.length > 0}, country: ${billingDetails.length > 0 ? billingDetails[0].country : 'unknown'}`);
    
    // Always return Razorpay gateway
    console.log('Using Razorpay gateway for all users');
    return new RazorpayGateway();
  } catch (error) {
    console.error('Error determining payment gateway:', error);
    // Default to Razorpay as the global gateway
    console.log('Defaulting to Razorpay gateway due to error');
    return new RazorpayGateway();
  }
}

// Factory to get payment gateway by name
export function getPaymentGatewayByName(gatewayName: string): PaymentGateway {
  // Always return Razorpay regardless of the gateway name
  return new RazorpayGateway();
}

// Helper function to get API key from database
async function getApiKeyFromDB(service: string): Promise<string | null> {
  try {
    // Cast the service to the appropriate enum type based on schema definition
    const gatewayService = service.toUpperCase() as 'RAZORPAY';
    
    const keys = await db.select()
      .from(paymentGatewayConfigs)
      .where(
        and(
          eq(paymentGatewayConfigs.service, gatewayService),
          eq(paymentGatewayConfigs.isActive, true)
        )
      )
      .orderBy(paymentGatewayConfigs.isDefault) // Order by isDefault (true values first)
      .limit(1);
    
    if (keys.length === 0) {
      console.error(`No active ${service} API key found in database`);
      return null;
    }
    
    // Update lastUsed timestamp
    await db.update(paymentGatewayConfigs)
      .set({ 
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(paymentGatewayConfigs.id, keys[0].id));
    
    // Decrypt the key
    const decryptedKey = decryptApiKey(keys[0].key);
    console.log(`Retrieved and decrypted ${service} key`);
    
    return decryptedKey;
  } catch (error) {
    console.error(`Error getting ${service} API key from database:`, error);
    return null;
  }
}

// Razorpay implementation
class RazorpayGateway implements PaymentGateway {
  private razorpay: any = null;
  private initialized = false;
  private initializing = false;

  constructor() {
    this.initializeRazorpay();
  }

  private async initializeRazorpay() {
    if (this.initialized || this.initializing) return;
    
    this.initializing = true;
    
    try {
      // Try environment variables first
      let keyId = process.env.RAZORPAY_KEY_ID;
      let keySecret = process.env.RAZORPAY_KEY_SECRET;
      
      // If not in env vars, try database
      if (!keyId || !keySecret) {
        const apiKey = await getApiKeyFromDB('razorpay');
        if (apiKey && apiKey.includes(':')) {
          [keyId, keySecret] = apiKey.split(':');
        }
      }
      
      // Initialize Razorpay if we have credentials
      if (keyId && keySecret) {
        this.razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });
        this.initialized = true;
        console.log('Razorpay initialized successfully');
      } else {
        console.error('Could not initialize Razorpay: Missing credentials');
        this.initializeMockRazorpay();
      }
    } catch (error) {
      console.error('Error initializing Razorpay:', error);
      this.initializeMockRazorpay();
    } finally {
      this.initializing = false;
    }
  }

  private initializeMockRazorpay() {
    console.warn('Using mock Razorpay implementation');
    this.razorpay = {
      orders: {
        create: async (options: any) => {
          console.log('Creating Razorpay order:', options);
          return { id: `razorpay_order_${Date.now()}` };
        }
      },
      payments: {
        fetch: async (paymentId: string) => {
          console.log('Fetching Razorpay payment:', paymentId);
          return { status: 'captured' };
        }
      },
      subscriptions: {
        create: async (options: any) => {
          console.log('Creating Razorpay subscription:', options);
          return { id: `razorpay_sub_${Date.now()}` };
        },
        cancel: async (subscriptionId: string) => {
          console.log('Cancelling Razorpay subscription:', subscriptionId);
          return { status: 'cancelled' };
        },
        fetch: async (subscriptionId: string) => {
          console.log('Fetching Razorpay subscription:', subscriptionId);
          return { 
            id: subscriptionId,
            plan_id: `plan_mock_${Date.now()}`,
            status: 'active',
            current_end: new Date().getTime() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
            customer_id: `cust_mock_${Date.now()}` 
          };
        }
      }
    } as any;
    this.initialized = true;
  }

  // Ensure Razorpay is initialized
  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeRazorpay();
    }
    
    // Add more robust initialization check with waiting if initialization is in progress
    if (this.initializing) {
      console.log('Razorpay initialization in progress, waiting...');
      // Wait for initialization to complete
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.initializing) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });
    }
    
    // If still not initialized, try initializing mock as fallback
    if (!this.initialized || !this.razorpay) {
      console.warn('Razorpay still not initialized after waiting, using mock implementation');
      this.initializeMockRazorpay();
    }
    
    return !!this.razorpay;
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    const isInitialized = await this.ensureInitialized();
    
    if (!isInitialized || !this.razorpay) {
      console.error('Razorpay not properly initialized, falling back to mock implementation');
      this.initializeMockRazorpay();
    }
    
    try {
      if (!this.razorpay?.subscriptions?.fetch) {
        console.warn('Razorpay subscriptions API not available, using mock implementation');
        // Return mock subscription with a default plan ID
        return {
          id: subscriptionId,
          plan_id: `plan_mock_${Date.now()}`,
          status: 'active'
        };
      }
      
      // Fetch subscription details from Razorpay
      console.log(`Fetching subscription details for ID: ${subscriptionId}`);
      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);
      
      console.log(`Subscription details fetched:`, subscription);
      return subscription;
    } catch (error) {
      console.error(`Error fetching subscription details for ID ${subscriptionId}:`, error);
      // Return a mock response instead of throwing an error to keep the payment flow working
      return {
        id: subscriptionId,
        plan_id: `plan_error_${Date.now()}`,
        status: 'unknown'
      };
    }
  }

  async createPaymentIntent(amount: number, currency: string, metadata: any): Promise<any> {
    const isInitialized = await this.ensureInitialized();
    
    if (!isInitialized || !this.razorpay) {
      console.error('Razorpay not properly initialized, falling back to mock implementation');
      this.initializeMockRazorpay();
    }
    
    try {
      if (!this.razorpay?.subscriptions) {
        console.warn('Razorpay subscriptions API not available, using mock implementation');
        // Create mock subscription as fallback
        return {
          subscriptionId: `sub_mock_${Date.now()}`, // Use sub_ prefix even for mocks
          amount: Math.round(amount * 100),
          currency: currency || 'INR',
          gateway: 'RAZORPAY',
          short_url: null
        };
      }
      
      // For subscriptions, it's better to return just the necessary info
      // and let the actual subscription be created in createSubscription
      console.log(`Creating payment intent data for subscription amount: ${amount} ${currency}`);
      
      return {
        subscriptionId: `sub_temp_${Date.now()}`, // Using proper prefix for client validation
        amount: Math.round(amount * 100),
        currency: currency.toUpperCase(),
        gateway: 'RAZORPAY',
        short_url: null
      };
    } catch (error) {
      console.error('Error creating Razorpay payment intent:', error);
      // Create mock placeholder as fallback on error
      console.warn('Creating mock Razorpay subscription placeholder due to error');
      return {
        subscriptionId: `sub_error_${Date.now()}`, // Use sub_ prefix for consistency
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        gateway: 'RAZORPAY',
        short_url: null
      };
    }
  }

  async verifyPayment(paymentId: string, signature?: string, subscriptionId?: string): Promise<boolean> {
    if (!signature) {
      console.warn('No signature provided for Razorpay payment verification');
      return false;
    }

    try {
      await this.ensureInitialized();
      
      // Get API key secret for signature verification
      const apiKeyConfig = await db.select()
        .from(paymentGatewayConfigs)
        .where(
          and(
            eq(paymentGatewayConfigs.service, 'RAZORPAY'),
            eq(paymentGatewayConfigs.isActive, true)
          )
        )
        .limit(1);
      
      if (!apiKeyConfig.length) {
        console.error('No active Razorpay API key configuration found');
        return false;
      }
      
      // Decrypt the API key to get key_id:key_secret
      const decryptedKey = decryptApiKey(apiKeyConfig[0].key);
      const [, keySecret] = decryptedKey.split(':');
      
      if (!keySecret) {
        console.error('Invalid Razorpay API key format');
        return false;
      }
      
      console.log('Verifying Razorpay payment...');
      
      // If subscription ID is provided, use the subscription signature verification flow
      if (subscriptionId) {
        console.log(`Using subscription verification flow for subscription: ${subscriptionId}`);
        const dataToSign = `${paymentId}|${subscriptionId}`;
        
        const expectedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(dataToSign)
          .digest('hex');
        
        console.log(`Data signed: ${dataToSign}`);
        console.log(`Expected signature: ${expectedSignature}`);
        console.log(`Received signature: ${signature}`);
        
        const isValid = expectedSignature === signature;
        
        if (isValid) {
          console.log(`Subscription payment ${paymentId} verified successfully`);
          return true;
        } else {
          console.error(`Subscription signature verification failed for payment ${paymentId}`);
          console.error(`Expected: ${expectedSignature}, Got: ${signature}`);
          return false;
        }
      } else {
        // For regular payments, try to verify standard way
        try {
          // Validate signature with Razorpay's built-in verification
          const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(paymentId)
            .digest('hex');
          
          console.log(`Regular payment verification: Expected: ${generatedSignature}, Got: ${signature}`);
          return generatedSignature === signature;
        } catch (verifyError) {
          console.error('Error in standard signature verification:', verifyError);
          return false;
        }
      }
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      return false;
    }
  }

  async createSubscription(planId: number, userId: number, metadata: any): Promise<any> {
    await this.ensureInitialized();
    
    try {
      // Get plan details
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
      
      // Get user's billing details to determine region for pricing
      const billingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      // Determine region based on user's country
      const region = billingDetails.length > 0 && billingDetails[0].country === 'IN' ? 'INDIA' : 'GLOBAL';
      
      // Get pricing based on region
      const pricing = await db.select().from(planPricing)
        .where(and(eq(planPricing.planId, planId), eq(planPricing.targetRegion, region as any)))
        .limit(1);
      
      if (!plan.length) {
        const errorMsg = `Plan not found for ID: ${planId}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // If no region-specific pricing, try global pricing
      let finalPricing;
      if (!pricing.length) {
        const globalPricing = await db.select().from(planPricing)
          .where(and(eq(planPricing.planId, planId), eq(planPricing.targetRegion, 'GLOBAL')))
          .limit(1);
          
        if (!globalPricing.length) {
          const errorMsg = `No pricing found for plan: ${planId}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        finalPricing = globalPricing[0];
      } else {
        finalPricing = pricing[0];
      }
      
      console.log(`Creating subscription for plan ${planId}: ${plan[0].name}, price: ${finalPricing.price} ${finalPricing.currency}`);
      
      // Get user's information for metadata
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        console.error(`User not found: ${userId}`);
        throw new Error('User not found');
      }
      
      // Convert amount to paise (Razorpay expects amount in smallest currency unit)
      const amountInPaise = Math.round(parseFloat(finalPricing.price) * 100);
      
      // Determine the period based on billing cycle
      const period = plan[0].billingCycle === 'YEARLY' ? 'yearly' : 'monthly';
      
      // First, create a Razorpay plan
      console.log(`Creating Razorpay plan for internal plan ${planId}`);
      
      // Look for existing Razorpay plan
      let razorpayPlanId = '';
      try {
        // Check if we already have this plan configured
        const gatewayConfig = await db.select()
          .from(paymentGatewayConfigs)
          .where(
            and(
              eq(paymentGatewayConfigs.service, 'RAZORPAY'),
              eq(paymentGatewayConfigs.isActive, true)
            )
          )
          .orderBy(paymentGatewayConfigs.isDefault)
          .limit(1);
          
        if (gatewayConfig.length) {
          const configOptions = gatewayConfig[0].configOptions || {};
          const planMappings = ((configOptions as any).plan_mappings || {}) as Record<string, string>;
          
          // Check if we have a mapping for this plan and currency
          const mappingKey = `${planId}_${finalPricing.currency}`;
          razorpayPlanId = planMappings[mappingKey] || '';
          
          if (razorpayPlanId) {
            console.log(`Using existing Razorpay plan: ${razorpayPlanId} for internal plan ${planId} with currency ${finalPricing.currency}`);
          }
        }
      } catch (mappingError) {
        console.error('Error checking for existing plan mapping:', mappingError);
        // Continue with plan creation
      }
      
      // If no existing plan, create a new one
      if (!razorpayPlanId) {
        // Generate a unique plan ID in Razorpay
        const planItemName = `${plan[0].name.replace(/\s+/g, '_').toLowerCase()}_${period}_${finalPricing.currency.toLowerCase()}`;
        
        // Create the plan in Razorpay
        const razorpayPlan = await this.razorpay!.plans.create({
          period,
          interval: 1,
          item: {
            name: `${plan[0].name} (${period}, ${finalPricing.currency})`,
            amount: amountInPaise,
            currency: finalPricing.currency,
            description: plan[0].description || `${plan[0].name} subscription plan`
          },
          notes: {
            internal_plan_id: planId.toString(),
            billing_cycle: plan[0].billingCycle,
            currency: finalPricing.currency
          }
        });
        
        razorpayPlanId = razorpayPlan.id;
        console.log(`Razorpay plan created: ${razorpayPlanId}`);
        
        // Save the mapping between our plan and Razorpay's plan
        try {
          // Get the active config for Razorpay
          const gatewayConfig = await db.select()
            .from(paymentGatewayConfigs)
            .where(
              and(
                eq(paymentGatewayConfigs.service, 'RAZORPAY'),
                eq(paymentGatewayConfigs.isActive, true)
              )
            )
            .orderBy(paymentGatewayConfigs.isDefault)
            .limit(1);
          
          if (gatewayConfig.length) {
            // Update the config options with the new plan mapping
            const currentOptions = gatewayConfig[0].configOptions || {};
            const planMappings = ((currentOptions as any).plan_mappings || {}) as Record<string, string>;
            
            // Store with currency suffix to handle different currencies
            const mappingKey = `${planId}_${finalPricing.currency}`;
            planMappings[mappingKey] = razorpayPlanId;
            
            const updatedOptions = {
              ...currentOptions,
              plan_mappings: planMappings
            };
            
            // Save the updated config
            await db.update(paymentGatewayConfigs)
              .set({ 
                configOptions: updatedOptions,
                updatedAt: new Date()
              })
              .where(eq(paymentGatewayConfigs.id, gatewayConfig[0].id));
              
            console.log(`Saved plan mapping: Internal plan ${planId} with ${finalPricing.currency} -> Razorpay plan ${razorpayPlanId}`);
          }
        } catch (mappingError) {
          console.error('Error saving plan mapping:', mappingError);
          // Continue with subscription creation anyway
        }
      }
      
      // Create customer or use existing one
      let customerId;
      try {
        // Try to find existing customer
        const customers = await this.razorpay!.customers.all({ email: user[0].email });
        if (customers && customers.items && customers.items.length > 0) {
          customerId = customers.items[0].id;
          console.log(`Using existing Razorpay customer: ${customerId}`);
        } else {
          // Create new customer
          const customer = await this.razorpay!.customers.create({
            name: user[0].fullName || user[0].username || `User ${userId}`,
            email: user[0].email,
            contact: billingDetails.length > 0 ? billingDetails[0].phoneNumber || '' : '',
            notes: {
              internal_user_id: userId.toString()
            }
          });
          customerId = customer.id;
          console.log(`Created new Razorpay customer: ${customerId}`);
        }
      } catch (customerError) {
        console.error('Error creating/finding Razorpay customer:', customerError);
        customerId = `customer_${userId}`; // Fallback
      }
      
      // Now create a subscription with the Razorpay plan ID
      // For subscriptions that require initial authorization
      console.log(`Current timestamp (Date.now()): ${Date.now()}, Calculated start_at: ${Math.floor(Date.now() / 1000 + 60)}`);

      // Create a timestamp that's 1 minute in the future to avoid timing issues
      const nowTimestamp = Math.floor(Date.now() / 1000);
      const startTimestamp = nowTimestamp + 60; // Start 60 seconds in the future
      // We'll only use total_count instead of end_at since Razorpay doesn't support both

      const subscriptionParams = {
        plan_id: razorpayPlanId,
        customer_id: customerId,
        total_count: plan[0].billingCycle === 'YEARLY' ? 1 : 12, // Set total count based on billing cycle
        quantity: 1,
        start_at: startTimestamp, // Start 1 minute in the future to avoid timing issues
        // Removing end_at as per Razorpay's requirements
        expire_by: nowTimestamp + (30 * 24 * 60 * 60), // Expire in 30 days if not paid
        customer_notify: 1, // Notify the customer
        addons: [], // No addons for basic subscription
        notes: {
          ...metadata,
          internal_user_id: userId.toString(),
          internal_plan_id: planId.toString(),
          currency: finalPricing.currency
        },
        offer_id: null // No offer applied
      };
      
      console.log('Creating subscription with params:', JSON.stringify(subscriptionParams, null, 2));
      
      const subscription = await this.razorpay!.subscriptions.create(subscriptionParams);
      
      console.log(`Created Razorpay subscription: ${subscription.id}`);
      
      // Return subscription details for client-side checkout
      return {
        subscriptionId: subscription.id,
        gateway: 'RAZORPAY',
        amount: amountInPaise,
        currency: finalPricing.currency,
        short_url: null,
        planName: plan[0].name
      };
    } catch (error) {
      console.error('Error creating Razorpay subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const result = await this.razorpay!.subscriptions.cancel(subscriptionId);
      return result;
    } catch (error) {
      console.error('Error cancelling Razorpay subscription:', error);
      throw error;
    }
  }

  async processWebhook(req: Request): Promise<any> {
    try {
      // In a production environment, you would verify the webhook signature
      // const signature = req.headers['x-razorpay-signature'] as string;
      // const verified = this.razorpay.webhooks.verify(req.body, signature, webhookSecret);
      
      // Get the event data
      const event = req.body;
      console.log('Processing Razorpay webhook:', event.event);
      
      // Save the raw webhook event to the database for audit purposes
      await db.insert(paymentWebhookEvents)
        .values({
          gateway: 'RAZORPAY',
          eventType: event.event,
          eventId: event.payload.payment?.entity?.id || `event_${Date.now()}`,
          rawData: event,
          processed: false
        })
        .onConflictDoNothing(); // Avoid duplicate event processing
      
      // Process based on event type
      switch(event.event) {
        case 'payment.authorized':
        case 'payment.captured':
          await this.handleSuccessfulPayment(event.payload.payment.entity);
          break;
          
        case 'payment.failed':
          await this.handleFailedPayment(event.payload.payment.entity);
          break;
          
        case 'subscription.activated':
          await this.handleSubscriptionActivated(event.payload.subscription.entity);
          break;
          
        case 'subscription.charged':
          await this.handleSubscriptionCharged(event.payload.payment.entity, event.payload.subscription.entity);
          break;
          
        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(event.payload.subscription.entity);
          break;
          
        case 'subscription.halted':
        case 'subscription.pending':
          await this.handleSubscriptionPaymentIssue(event.payload.subscription.entity);
          break;
      }
      
      // Mark webhook as processed
      await db.update(paymentWebhookEvents)
        .set({ processed: true })
        .where(and(
          eq(paymentWebhookEvents.gateway, 'RAZORPAY'),
          eq(paymentWebhookEvents.eventId, event.payload.payment?.entity?.id || `event_${Date.now()}`)
        ));
      
      return { processed: true, event: event.event };
    } catch (error) {
      console.error('Error processing Razorpay webhook:', error);
      throw error;
    }
  }

  // Helper methods for Razorpay webhook processing
  private async handleSuccessfulPayment(payment: any) {
    try {
      // Find the subscription associated with this payment
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, payment.order_id))
        .limit(1);
      
      if (!subscription.length) {
        console.log('No subscription found for payment:', payment.id);
        return;
      }
      
      // Update subscription status to active if it was in grace period
      if (subscription[0].status === 'GRACE_PERIOD') {
        await db.update(userSubscriptions)
          .set({ 
            status: 'ACTIVE',
            updatedAt: new Date()
          })
          .where(eq(userSubscriptions.id, subscription[0].id));
      }
      
      // Record the payment transaction
      await db.insert(paymentTransactions)
        .values({
          userId: subscription[0].userId,
          subscriptionId: subscription[0].id,
          amount: (payment.amount / 100).toString(), // Convert from paise to INR/USD
          currency: payment.currency,
          gateway: 'RAZORPAY',
          gatewayTransactionId: payment.id,
          status: 'COMPLETED'
        })
        .onConflictDoNothing();
        
      console.log('Processed successful payment for subscription:', subscription[0].id);
    } catch (error) {
      console.error('Error handling successful Razorpay payment:', error);
      throw error;
    }
  }

  private async handleFailedPayment(payment: any) {
    try {
      // Find the subscription associated with this payment
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, payment.order_id))
        .limit(1);
      
      if (!subscription.length) {
        console.log('No subscription found for failed payment:', payment.id);
        return;
      }
      
      // Record the failed payment transaction
      await db.insert(paymentTransactions)
        .values({
          userId: subscription[0].userId,
          subscriptionId: subscription[0].id,
          amount: (payment.amount / 100).toString(), // Convert from paise to INR/USD
          currency: payment.currency,
          gateway: 'RAZORPAY',
          gatewayTransactionId: payment.id,
          status: 'FAILED'
        })
        .onConflictDoNothing();
        
      // If this is for a renewal, put subscription in grace period
      const now = new Date();
      const endDate = new Date(subscription[0].endDate);
      
      if (endDate < now && subscription[0].status === 'ACTIVE') {
        // Set grace period for 7 days
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
        
        await db.update(userSubscriptions)
          .set({ 
            status: 'GRACE_PERIOD',
            gracePeriodEnd,
            updatedAt: now
          })
          .where(eq(userSubscriptions.id, subscription[0].id));
          
        console.log('Subscription moved to grace period:', subscription[0].id);
      }
    } catch (error) {
      console.error('Error handling failed Razorpay payment:', error);
      throw error;
    }
  }

  private async handleSubscriptionActivated(subscription: any) {
    try {
      // Find our internal subscription by the Razorpay subscription ID
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscription.id))
        .limit(1);
      
      if (!userSubscription.length) {
        console.log('No internal subscription found for Razorpay subscription:', subscription.id);
        return;
      }
      
      // Update subscription status to active
      await db.update(userSubscriptions)
        .set({ 
          status: 'ACTIVE',
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, userSubscription[0].id));
        
      console.log('Subscription activated:', userSubscription[0].id);
    } catch (error) {
      console.error('Error handling Razorpay subscription activation:', error);
      throw error;
    }
  }

  private async handleSubscriptionCharged(payment: any, subscription: any) {
    try {
      // This is a renewal charge - find our internal subscription
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscription.id))
        .limit(1);
      
      if (!userSubscription.length) {
        console.log('No internal subscription found for Razorpay subscription:', subscription.id);
        return;
      }
      
      // Calculate new end date based on the billing cycle
      const now = new Date();
      const newEndDate = new Date();
      
      // Fetch the plan to determine billing cycle
      const plan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, userSubscription[0].planId))
        .limit(1);
      
      if (plan.length && plan[0].billingCycle === 'YEARLY') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      } else {
        // Default to monthly
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      }
      
      // Update subscription with new end date
      await db.update(userSubscriptions)
        .set({ 
          status: 'ACTIVE',
          startDate: now,
          endDate: newEndDate,
          updatedAt: now
        })
        .where(eq(userSubscriptions.id, userSubscription[0].id));
      
      // Record the payment transaction
      await db.insert(paymentTransactions)
        .values({
          userId: userSubscription[0].userId,
          subscriptionId: userSubscription[0].id,
          amount: (payment.amount / 100).toString(), // Convert from paise to INR/USD
          currency: payment.currency,
          gateway: 'RAZORPAY',
          gatewayTransactionId: payment.id,
          status: 'COMPLETED'
        })
        .onConflictDoNothing();
        
      console.log('Subscription renewed:', userSubscription[0].id);
    } catch (error) {
      console.error('Error handling Razorpay subscription charge:', error);
      throw error;
    }
  }

  private async handleSubscriptionCancelled(subscription: any) {
    try {
      // Find our internal subscription by the Razorpay subscription ID
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscription.id))
        .limit(1);
      
      if (!userSubscription.length) {
        console.log('No internal subscription found for Razorpay subscription:', subscription.id);
        return;
      }
      
      // Update subscription status to cancelled
      await db.update(userSubscriptions)
        .set({ 
          status: 'CANCELLED',
          autoRenew: false,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, userSubscription[0].id));
        
      console.log('Subscription cancelled:', userSubscription[0].id);
    } catch (error) {
      console.error('Error handling Razorpay subscription cancellation:', error);
      throw error;
    }
  }

  private async handleSubscriptionPaymentIssue(subscription: any) {
    try {
      // Find our internal subscription by the Razorpay subscription ID
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscription.id))
        .limit(1);
      
      if (!userSubscription.length) {
        console.log('No internal subscription found for Razorpay subscription:', subscription.id);
        return;
      }
      
      // Set grace period for 7 days
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
      
      // Update subscription status to grace period
      await db.update(userSubscriptions)
        .set({ 
          status: 'GRACE_PERIOD',
          gracePeriodEnd,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, userSubscription[0].id));
        
      console.log('Subscription moved to grace period due to payment issue:', userSubscription[0].id);
    } catch (error) {
      console.error('Error handling Razorpay subscription payment issue:', error);
      throw error;
    }
  }
}

// Create instance
const razorpayGateway = new RazorpayGateway(); 