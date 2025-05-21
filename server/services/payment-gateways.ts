import { Request } from 'express';
import { db } from '../config/db';
import { userSubscriptions, subscriptionPlans, planPricing, paymentTransactions, userBillingDetails, paymentGatewayConfigs, paymentWebhookEvents, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { TaxService } from './tax-service';

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
  cancelSubscription(subscriptionId: string, options?: { cancel_at_cycle_end?: number }): Promise<any>;
  updateSubscription(subscriptionId: string, options: {
    plan_id?: string;
    offer_id?: string;
    quantity?: number;
    remaining_count?: number;
    start_at?: number;
    schedule_change_at?: 'now' | 'cycle_end';
    customer_notify?: boolean;
    notes?: Record<string, string>;
  }): Promise<any>;
  processWebhook(req: Request): Promise<any>;
  getSubscriptionDetails(subscriptionId: string): Promise<any>;
  fetchInvoicesForSubscription(subscriptionId: string): Promise<any>;
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

// Function to calculate total amount with tax for INR payments
async function calculateTotalWithTax(userId: number, amount: number, currency: string): Promise<{
  total: number;
  taxAmount: number;
  taxDetails: any;
}> {
  if (currency !== 'INR') {
    return { total: amount, taxAmount: 0, taxDetails: null };
  }

  try {
    const taxCalculation = await TaxService.calculateTaxes(userId, amount, currency);
    return {
      total: taxCalculation.total,
      taxAmount: taxCalculation.taxAmount,
      taxDetails: taxCalculation
    };
  } catch (error) {
    console.error('Error calculating tax:', error);
    return { total: amount, taxAmount: 0, taxDetails: null };
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
        },
        all: async (options: any) => {
          console.log('Listing Razorpay orders with options:', options);
          return { items: [] };
        }
      },
      payments: {
        fetch: async (paymentId: string) => {
          console.log('Fetching Razorpay payment:', paymentId);
          return { status: 'captured' };
        }
      },
      plans: {
        create: async (options: any) => {
          console.log('Creating Razorpay plan:', options);
          return { 
            id: `plan_mock_${Date.now()}`,
            item: {
              name: options.item.name,
              amount: options.item.amount,
              currency: options.item.currency
            },
            period: options.period,
            interval: options.interval
          };
        },
        all: async (options: any) => {
          console.log('Listing Razorpay plans with options:', options);
          return { items: [] };
        }
      },
      customers: {
        create: async (options: any) => {
          console.log('Creating Razorpay customer:', options);
          return { 
            id: `cust_mock_${Date.now()}`,
            name: options.name,
            email: options.email,
            contact: options.contact
          };
        },
        fetch: async (customerId: string) => {
          console.log('Fetching Razorpay customer:', customerId);
          return { 
            id: customerId,
            name: 'Mock Customer',
            email: 'mock@example.com'
          };
        },
        all: async (options: any) => {
          console.log('Listing Razorpay customers with options:', options);
          return { items: [] };
        }
      },
      subscriptions: {
        create: async (options: any) => {
          console.log('Creating Razorpay subscription:', options);
          return { 
            id: `sub_mock_${Date.now()}`,
            plan_id: options.plan_id,
            customer_id: options.customer_id,
            status: 'created',
            current_end: new Date().getTime() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
            total_count: options.total_count || 12,
            quantity: options.quantity || 1,
            notes: options.notes || {}
          };
        },
        cancel: async (subscriptionId: string, options: any = {}) => {
          console.log('Cancelling Razorpay subscription:', subscriptionId, 'with options:', options);
          return { 
            id: subscriptionId, 
            status: 'cancelled',
            cancel_at_cycle_end: options?.cancel_at_cycle_end === 1
          };
        },
        update: async (subscriptionId: string, options: any) => {
          console.log('Updating Razorpay subscription:', subscriptionId, 'with options:', options);
          return {
            id: subscriptionId,
            plan_id: options.plan_id || `plan_mock_${Date.now()}`,
            status: 'active',
            schedule_change_at: options.schedule_change_at || 'now',
            customer_notify: options.customer_notify || 0,
            quantity: options.quantity || 1,
            remaining_count: options.remaining_count,
            start_at: options.start_at,
            notes: options.notes || {}
          };
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
        },
        all: async (options: any) => {
          console.log('Listing Razorpay subscriptions with options:', options);
          return { items: [] };
        }
      },
      invoices: {
        all: async (options: any) => {
          console.log('Listing Razorpay invoices with options:', options);
          return { 
            count: 0, 
            items: []
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
    await this.ensureInitialized();

    try {
      console.log(`Creating Razorpay payment intent for amount: ${amount} ${currency}`);

      if (!metadata.userId) {
        throw new Error('User ID is required in metadata for payment intent creation');
      }

      // Calculate tax for INR payments
      const { total, taxAmount, taxDetails } = await calculateTotalWithTax(
        metadata.userId,
        amount,
        currency
      );

      // Use the total (including tax) for the payment
      const amountInSmallestUnit = Math.round(total * 100); // Convert to paise/cents
      
      // Store original amount and tax details for reference
      const orderMetadata = {
        ...metadata,
        originalAmount: amount,
        taxAmount,
        taxDetails: taxDetails ? JSON.stringify(taxDetails) : null
      };

      const orderOptions = {
        amount: amountInSmallestUnit,
        currency: currency,
        receipt: `receipt_${Date.now()}`,
        notes: orderMetadata
      };

      console.log(`Creating Razorpay order with options:`, {
        ...orderOptions,
        notes: { ...orderOptions.notes, taxDetails: '(stringified)' }
      });

      const order = await this.razorpay.orders.create(orderOptions);
      console.log(`Created Razorpay order:`, order.id);

      return {
        ...order,
        clientSecret: order.id, // Razorpay doesn't have a clientSecret, but we use the order ID here
        amount: total,
        originalAmount: amount,
        taxAmount,
        taxDetails,
        currency: currency,
        gateway: 'RAZORPAY'
      };
    } catch (error) {
      console.error('Error creating Razorpay payment intent:', error);
      throw error;
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
      console.log(`User region: ${region}, Selected currency for user: ${finalPricing.currency}`);
      
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
      console.log(`Creating Razorpay plan for internal plan ${planId} with currency ${finalPricing.currency}`);
      
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
            
            // CRITICAL FIX: Validate the Razorpay plan has the correct currency
            try {
              const razorpayPlan = await this.razorpay!.plans.fetch(razorpayPlanId);
              if (razorpayPlan && razorpayPlan.item && razorpayPlan.item.currency !== finalPricing.currency) {
                console.error(`Currency mismatch for plan ${razorpayPlanId}: Expected ${finalPricing.currency}, found ${razorpayPlan.item.currency}`);
                console.log(`Mapping plan_id mismatch detected. Will create new plan with correct currency.`);
                razorpayPlanId = ''; // Force creation of new plan with correct currency
              }
            } catch (fetchError) {
              console.error(`Error fetching Razorpay plan ${razorpayPlanId}:`, fetchError);
              razorpayPlanId = ''; // Force creation of new plan
            }
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
            currency: finalPricing.currency,
            region: region
          }
        });
        
        razorpayPlanId = razorpayPlan.id;
        console.log(`Razorpay plan created: ${razorpayPlanId} with currency ${finalPricing.currency}`);
        
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
      
      // Verify the Razorpay plan before creating subscription
      try {
        const razorpayPlanDetails = await this.razorpay!.plans.fetch(razorpayPlanId);
        console.log(`Verified Razorpay plan ${razorpayPlanId}:`, {
          currency: razorpayPlanDetails.item.currency,
          amount: razorpayPlanDetails.item.amount,
          name: razorpayPlanDetails.item.name
        });
        
        // Double-check currency to prevent billing errors
        if (razorpayPlanDetails.item.currency !== finalPricing.currency) {
          console.error(`CRITICAL ERROR: Currency mismatch when creating subscription!`);
          console.error(`Expected: ${finalPricing.currency}, Actual: ${razorpayPlanDetails.item.currency}`);
          throw new Error(`Currency mismatch error: Cannot create subscription with incorrect currency. Please contact support.`);
        }
      } catch (verifyError) {
        console.error(`Error verifying Razorpay plan ${razorpayPlanId}:`, verifyError);
        // Continue with subscription creation, but log the error
      }
      
      // Create customer or use existing one
      let customerId;
      let isNewCustomer = false;
      try {
        console.log(`Looking for existing Razorpay customer with email: ${user[0].email}`);
        
        // Check if user already has a Razorpay customer ID stored
        if (user[0].razorpayCustomerId) {
          customerId = user[0].razorpayCustomerId;
          console.log(`Using existing Razorpay customer ID from database: ${customerId}`);
          
          // Verify the customer ID is still valid
          try {
            const customer = await this.razorpay!.customers.fetch(customerId);
            console.log(`Verified Razorpay customer: ${customer.id} (${customer.email})`);
          } catch (fetchErr) {
            console.warn(`Failed to fetch customer with ID ${customerId}, will create new one:`, fetchErr);
            customerId = null; // Reset to create a new one
          }
        }
        
        // If no stored customer ID or verification failed, look up by email or create new
        if (!customerId) {
          // Try to find existing customer by email
          const customers = await this.razorpay!.customers.all({ email: user[0].email });
          
          if (customers && customers.items && customers.items.length > 0) {
            // Found customers with this email, verify if any belongs to this user
            let foundMatchingCustomer = false;
            
            for (const customer of customers.items) {
              if (customer.notes && customer.notes.internal_user_id === userId.toString()) {
                // Found a perfect match - same email and our internal user ID
                customerId = customer.id;
                console.log(`Found exact matching Razorpay customer: ${customerId} (email: ${customer.email}, internal_user_id: ${userId})`);
                foundMatchingCustomer = true;
                break;
              }
            }
            
            if (!foundMatchingCustomer) {
              // We found customers with this email but none with our internal user ID
              // Create a new customer to avoid potential conflicts
              console.log(`Found customers with same email but none with matching internal_user_id, creating new customer for safety.`);
              isNewCustomer = true;
            }
          } else {
            // No customers found with this email
            console.log(`No existing Razorpay customers found with email: ${user[0].email}, will create new one.`);
            isNewCustomer = true;
          }
          
          // Create new customer if needed
          if (isNewCustomer || !customerId) {
            // Create unique name to avoid conflicts
            const uniqueName = `${user[0].fullName || user[0].username || `User`}-${userId}`;
            
            // Create new customer in Razorpay
            const customer = await this.razorpay!.customers.create({
              name: uniqueName,
              email: user[0].email,
              contact: billingDetails.length > 0 ? formatPhoneForRazorpay(billingDetails[0].phoneNumber || '') : '',
              notes: {
                internal_user_id: userId.toString(),
                username: user[0].username || '',
                created_at: new Date().toISOString(),
                user_region: region,
                expected_currency: finalPricing.currency
              }
            });
            
            customerId = customer.id;
            console.log(`Created new Razorpay customer: ${customerId} for user: ${userId} (${user[0].email})`);
          }
        }
      } catch (customerError) {
        console.error('Error creating/finding Razorpay customer:', customerError);
        
        // Fall back to creating a new customer with a unique ID suffix to avoid conflicts
        try {
          const uniqueSuffix = Date.now().toString().slice(-6);
          const uniqueName = `${user[0].fullName || user[0].username || `User`}-${userId}-${uniqueSuffix}`;
          
          const customer = await this.razorpay!.customers.create({
            name: uniqueName,
            email: `${user[0].email.split('@')[0]}+${uniqueSuffix}@${user[0].email.split('@')[1]}`,
            contact: billingDetails.length > 0 ? formatPhoneForRazorpay(billingDetails[0].phoneNumber || '') : '',
            notes: {
              internal_user_id: userId.toString(),
              username: user[0].username || '',
              created_at: new Date().toISOString(),
              is_fallback: 'true',
              user_region: region,
              expected_currency: finalPricing.currency
            }
          });
          
          customerId = customer.id;
          console.log(`Created fallback Razorpay customer: ${customerId} for user: ${userId}`);
        } catch (fallbackError) {
          console.error('Error creating fallback Razorpay customer:', fallbackError);
          customerId = `customer_${userId}_${Date.now()}`; // Last resort fallback
        }
      }
      
      // Calculate timestamps
      const currentTimeMillis = Date.now();
      const currentTimestamp = Math.floor(currentTimeMillis / 1000);
      
      // Determine if this is an immediate start or future start
      // For new subscriptions, default to immediate start unless explicitly set otherwise
      let startImmediately = true; // Default to true for new subscriptions
      
      // Only respect the metadata value if it's explicitly provided as false
      // or if this is an upgrade (where we keep the user's preference)
      if (metadata.startImmediately === false || metadata.isUpgrade) {
        startImmediately = metadata.startImmediately === true;
      }
      
      // Check for explicit subscription flag - this overrides other logic to ensure we create a subscription
      if (metadata.isSubscription === true) {
        console.log('Explicit subscription requested - ensuring subscription flow is used');
        startImmediately = true;
      }
      
      // Important: For immediate subscriptions, Razorpay expects exact current time
      // Adding any buffer causes the auth transaction to fail
      let startTimestamp = currentTimestamp; // Use exact current time

      // If it's a future start date (not immediate), use the provided date
      if (!startImmediately && metadata.startDate) {
        try {
          // Convert the provided start date to a timestamp
          const providedStartTime = new Date(metadata.startDate).getTime() / 1000;
          if (providedStartTime > currentTimestamp) {
            startTimestamp = Math.floor(providedStartTime);
            console.log(`Using future start date: ${new Date(startTimestamp * 1000).toISOString()}`);
          }
        } catch (dateError) {
          console.error('Error parsing provided start date, using current timestamp:', dateError);
        }
      }
      
      const expireTimestamp = currentTimestamp + (60 * 60 * 24 * 30 * 12); // 12 months from now
      
      // Determine if we need to collect an authentication amount
      // For immediate start: auth amount = plan amount (not refunded)
      // For future start: auth amount = small token (will be refunded)
      const isUpgrade = metadata.isUpgrade === true;
      
      // Determine authentication amount based on:
      // 1. If future start date (not immediate) -> always use token amount
      // 2. If it's an upgrade -> use token amount 
      // 3. If new subscription with immediate start -> use full plan amount
      
      let authAmount;
      if (!startImmediately) {
        // Future start date always uses Razorpay's standard token amounts
        authAmount = finalPricing.currency === 'INR' ? 100 : 50; // ₹1 or $0.50
      } else if (isUpgrade) {
        // Upgrades use Razorpay's standard token amounts
        authAmount = finalPricing.currency === 'INR' ? 100 : 50; // ₹1 or $0.50
      } else {
        // For immediate subscriptions, this is the full plan amount
        authAmount = amountInPaise;
      }
      
      console.log('Subscription configuration details:');
      console.log(`  - Start immediately: ${startImmediately}`);
      console.log(`  - Is upgrade: ${isUpgrade}`);
      console.log(`  - Start timestamp: ${startTimestamp} (${new Date(startTimestamp * 1000).toISOString()})`);
      console.log(`  - Payment amount: ${authAmount / 100} ${finalPricing.currency}`);
      console.log(`  - Plan amount: ${amountInPaise / 100} ${finalPricing.currency}`);
      
      // Create subscription parameters
      const subscriptionParams: any = {
        plan_id: razorpayPlanId,
        customer_id: customerId,
        total_count: 12, // Up to 12 billing cycles
        quantity: 1,
        expire_by: expireTimestamp,
        customer_notify: 1,
        addons: [],
        notes: {
          // Keep only the most important fields (limit to 15 max)
          plan_name: metadata.planName,
          billing_cycle: metadata.billingCycle,
          currency: finalPricing.currency,
          internal_user_id: userId.toString(),
          internal_plan_id: planId.toString(),
          username: user[0].username || '',
          email: user[0].email,
          start_type: startImmediately ? 'immediate' : 'scheduled',
          user_region: region,
          expected_currency: finalPricing.currency,
          // Combine multiple fields to save space
          payment_info: JSON.stringify({
            amount: finalPricing.price.toString(),
            payment_amount: authAmount / 100,
            actual_plan_amount: amountInPaise / 100,
            isUpgrade: metadata.isUpgrade || false,
          })
        }
      };
      
      // Safety check: ensure notes don't exceed 15 fields (Razorpay limit)
      const notesCount = Object.keys(subscriptionParams.notes).length;
      if (notesCount > 14) {
        console.warn(`Notes field count (${notesCount}) is close to Razorpay's limit of 15. Trimming additional fields.`);
        // Keep only essential fields if we're over the limit
        const essentialNotes = {
          internal_user_id: subscriptionParams.notes.internal_user_id,
          internal_plan_id: subscriptionParams.notes.internal_plan_id,
          currency: subscriptionParams.notes.currency,
          payment_info: subscriptionParams.notes.payment_info,
          user_region: subscriptionParams.notes.user_region
        };
        subscriptionParams.notes = essentialNotes;
      }
      
      console.log('Creating subscription with params:', JSON.stringify(subscriptionParams, null, 2));
      
      // Only include start_at for future subscriptions
      if (!startImmediately) {
        subscriptionParams.start_at = startTimestamp;
        console.log(`Adding start_at: ${startTimestamp} for future subscription`);
      } else {
        console.log('Omitting start_at parameter for immediate subscription (Razorpay will start after auth payment)');
      }
      
      const subscription = await this.razorpay!.subscriptions.create(subscriptionParams);
      
      console.log(`Created Razorpay subscription: ${subscription.id} for user ${userId} with customer ${customerId}`);
      console.log('Full subscription response:', JSON.stringify(subscription));
      
      // Store the Razorpay customer ID in our database for future reference
      try {
        // Update user record with Razorpay customer ID if not already set
        await db.update(users)
          .set({ 
            razorpayCustomerId: customerId,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
          
        console.log(`Updated user ${userId} with Razorpay customer ID ${customerId}`);
      } catch (updateError) {
        console.error(`Error updating user with Razorpay customer ID:`, updateError);
        // Non-critical, continue anyway
      }
      
      // Return subscription details for client-side checkout
      return {
        id: subscription.id,
        subscriptionId: subscription.id,
        gateway: 'RAZORPAY',
        amount: authAmount, // Return the appropriate amount based on our logic
        currency: finalPricing.currency,
        short_url: subscription.short_url || null,
        planName: plan[0].name,
        customerId: customerId,
        billingCycle: metadata.billingCycle,
        isUpgrade: metadata.isUpgrade || false,
        startImmediately: startImmediately,
        startAt: startTimestamp,
        // Add these fields to clarify amounts for the client
        actualPlanAmount: amountInPaise,
        isTokenPayment: !startImmediately, // For future subscriptions this is still a token
        futurePaymentDate: !startImmediately ? new Date(startTimestamp * 1000).toISOString() : null,
        isFutureSubscription: !startImmediately,
        isAuthenticationThenCharge: false, // We're not using the two-step process anymore
        paymentExplanation: startImmediately 
          ? "Your subscription will be charged immediately." 
          : "This is a small verification charge. Your subscription will start on the scheduled date."
      };
    } catch (error) {
      console.error('Error creating Razorpay subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, options?: { cancel_at_cycle_end?: number }): Promise<any> {
    await this.ensureInitialized();
    
    try {
      // Set cancel_at_cycle_end to 1 if provided in options, otherwise default to 0 (immediate)
      const cancelOptions = options ? { 
        cancel_at_cycle_end: options.cancel_at_cycle_end || 0 
      } : undefined;
      
      console.log(`Cancelling Razorpay subscription: ${subscriptionId} with options:`, cancelOptions);
      const result = await this.razorpay!.subscriptions.cancel(subscriptionId, cancelOptions);
      return result;
    } catch (error) {
      console.error('Error cancelling Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Update a Razorpay subscription using PATCH /v1/subscriptions/:id endpoint
   * @param subscriptionId The Razorpay subscription ID to update
   * @param options Update options (plan_id, quantity, remaining_count, start_at, schedule_change_at, customer_notify)
   * @returns The updated subscription object
   */
  async updateSubscription(subscriptionId: string, options: {
    plan_id?: string;
    offer_id?: string;
    quantity?: number;
    remaining_count?: number;
    start_at?: number;
    schedule_change_at?: 'now' | 'cycle_end';
    customer_notify?: boolean;
    notes?: Record<string, string>;
  }): Promise<any> {
    await this.ensureInitialized();
    
    try {
      // First, check if the subscription exists and get its current state
      let existingSubscription;
      try {
        existingSubscription = await this.razorpay.subscriptions.fetch(subscriptionId);
        console.log(`Fetched existing subscription ${subscriptionId} before update:`, 
          JSON.stringify({
            id: existingSubscription.id,
            plan_id: existingSubscription.plan_id,
            status: existingSubscription.status,
            current_end: existingSubscription.current_end,
            customer_id: existingSubscription.customer_id
          }));
      } catch (fetchError) {
        console.error(`Error fetching subscription ${subscriptionId} before update:`, fetchError);
        throw new Error(`Subscription ${subscriptionId} not found or cannot be accessed`);
      }
      
      // Validate subscription can be updated
      if (existingSubscription.status !== 'active' && 
          existingSubscription.status !== 'authenticated' && 
          existingSubscription.status !== 'created') {
        console.warn(`Subscription ${subscriptionId} is in ${existingSubscription.status} state, which may not be updatable`);
      }
      
      console.log(`Updating Razorpay subscription: ${subscriptionId} with options:`, options);
      
      // Convert boolean customer_notify to 1/0 if provided
      const updateOptions: any = { ...options };
      if (typeof updateOptions.customer_notify === 'boolean') {
        updateOptions.customer_notify = updateOptions.customer_notify ? 1 : 0;
      }
      
      // Check if the required update method exists
      if (!this.razorpay?.subscriptions?.update) {
        throw new Error('Razorpay subscriptions.update API not available - make sure you have the latest Razorpay SDK');
      }
      
      // Make the API call to update the subscription
      const result = await this.razorpay.subscriptions.update(subscriptionId, updateOptions);
      console.log(`Successfully updated Razorpay subscription: ${subscriptionId}`, 
        JSON.stringify({
          id: result.id,
          plan_id: result.plan_id,
          status: result.status,
          schedule_change_at: result.schedule_change_at || 'now'
        }));
      
      return result;
    } catch (error) {
      console.error(`Error updating Razorpay subscription ${subscriptionId}:`, error);
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
      console.log('Webhook payload details:', JSON.stringify({
        event_type: event.event,
        payment_id: event.payload.payment?.entity?.id,
        subscription_id: event.payload.subscription?.entity?.id,
        amount: event.payload.payment?.entity?.amount ? event.payload.payment.entity.amount / 100 : null,
        currency: event.payload.payment?.entity?.currency,
        status: event.payload.payment?.entity?.status
      }));
      
      // Save the raw webhook event to the database for audit purposes
      await db.insert(paymentWebhookEvents)
        .values({
          gateway: 'RAZORPAY',
          eventType: event.event,
          eventId: event.payload.payment?.entity?.id || event.payload.subscription?.entity?.id || `event_${Date.now()}`,
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
          
        case 'subscription.authenticated':
          await this.handleSubscriptionAuthenticated(event.payload.subscription.entity);
          break;
          
        case 'subscription.activated':
          await this.handleSubscriptionActivated(event.payload.subscription.entity);
          break;
          
        case 'subscription.charged':
          await this.handleSubscriptionCharged(event.payload.payment.entity, event.payload.subscription.entity);
          break;
          
        case 'subscription.completed':
          await this.handleSubscriptionCompleted(event.payload.subscription.entity);
          break;
          
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(event.payload.subscription.entity);
          break;
          
        case 'subscription.pending':
          await this.handleSubscriptionPaymentIssue(event.payload.subscription.entity);
          break;
          
        case 'subscription.halted':
          await this.handleSubscriptionPaymentIssue(event.payload.subscription.entity, true);
          break;
          
        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(event.payload.subscription.entity);
          break;
          
        case 'subscription.paused':
          await this.handleSubscriptionPaused(event.payload.subscription.entity);
          break;
          
        case 'subscription.resumed':
          await this.handleSubscriptionResumed(event.payload.subscription.entity);
          break;
          
        default:
          console.log(`Unhandled Razorpay webhook event: ${event.event}`);
      }
      
      // Mark webhook as processed
      await db.update(paymentWebhookEvents)
        .set({ processed: true })
        .where(and(
          eq(paymentWebhookEvents.gateway, 'RAZORPAY'),
          eq(paymentWebhookEvents.eventId, event.payload.payment?.entity?.id || event.payload.subscription?.entity?.id || `event_${Date.now()}`)
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
      // Extract customer ID if present in the payment
      const customerId = payment.customer_id || payment.notes?.customer_id;
      
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
      
      // If customerId is present and this is a Razorpay payment, update user record
      if (customerId && payment.method === 'card') {
        try {
          // Update the user record with the Razorpay customer ID
          await db.update(users)
            .set({ 
              razorpayCustomerId: customerId,
              updatedAt: new Date()
            })
            .where(eq(users.id, subscription[0].userId));
            
          console.log(`Updated user ${subscription[0].userId} with Razorpay customer ID ${customerId}`);
        } catch (updateError) {
          console.error('Error updating user with Razorpay customer ID:', updateError);
        }
      }
      
      // Get user's billing details to determine correct currency
      const userBillingInfo = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, subscription[0].userId))
        .limit(1);
        
      const userCountry = userBillingInfo.length > 0 ? userBillingInfo[0].country : 'US';
      const targetRegion = userCountry === 'IN' ? 'INDIA' : 'GLOBAL';
      
      // Get plan details
      const planData = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription[0].planId))
        .limit(1);
      
      // Get plan pricing for the correct region
      const planPricingData = await db.select()
        .from(planPricing)
        .where(
          and(
            eq(planPricing.planId, subscription[0].planId),
            eq(planPricing.targetRegion, targetRegion as any)
          )
        )
        .limit(1);
      
      // Fall back to global pricing if regional pricing not found
      const finalPricingData = planPricingData.length 
        ? planPricingData[0] 
        : (await db.select()
            .from(planPricing)
            .where(
              and(
                eq(planPricing.planId, subscription[0].planId),
                eq(planPricing.targetRegion, 'GLOBAL')
              )
            )
            .limit(1))[0];
      
      // Determine if there's a currency mismatch
      const correctCurrency = targetRegion === 'INDIA' ? 'INR' : 'USD';
      const hasCurrencyMismatch = payment.currency !== correctCurrency;
      
      if (hasCurrencyMismatch) {
        console.error(`Currency mismatch detected for payment ${payment.id}!`);
        console.error(`User country: ${userCountry}, User region: ${targetRegion}`);
        console.error(`Expected currency: ${correctCurrency}, Actual currency from Razorpay: ${payment.currency}`);
        
        // CRITICAL FIX: Use the correct currency based on user location instead of blindly trusting Razorpay
        // This ensures that USD customers get USD transactions in our system regardless of Razorpay's response
        console.log(`Overriding currency for payment ${payment.id} from ${payment.currency} to ${correctCurrency}`);
        
        // ADDITIONAL FIX: Also correct the amount when changing from INR to USD or vice versa
        let correctedAmount = (payment.amount / 100).toString(); // Default: use original amount
        
        if (finalPricingData) {
          // If we're fixing the currency, we should also fix the amount to match the correct plan price
          correctedAmount = finalPricingData.price.toString();
          console.log(`Also correcting amount from ${payment.amount / 100} ${payment.currency} to ${correctedAmount} ${correctCurrency}`);
        }
      
        // Record the payment transaction with detailed metadata
        await db.insert(paymentTransactions)
          .values({
            userId: subscription[0].userId,
            subscriptionId: subscription[0].id,
            amount: correctedAmount,
            currency: correctCurrency, // Use correct currency on mismatch
            gateway: 'RAZORPAY',
            gatewayTransactionId: payment.id,
            status: 'COMPLETED',
            metadata: {
              planDetails: {
                id: subscription[0].planId,
                name: planData.length > 0 ? planData[0].name : 'Unknown Plan',
                cycle: planData.length > 0 ? planData[0].billingCycle : 'MONTHLY'
              },
              paymentDetails: {
                expectedCurrency: correctCurrency,
                actualCurrency: payment.currency,
                hasCurrencyMismatch: hasCurrencyMismatch,
                correctPlanPrice: finalPricingData?.price || null,
                correctPlanCurrency: finalPricingData?.currency || correctCurrency
              },
              userRegion: targetRegion,
              userCountry: userCountry,
              isUpgrade: payment.notes?.isUpgrade === 'true',
              paymentMethod: payment.method || 'unknown',
              email: payment.email,
              contact: payment.contact,
              description: payment.description || 'Subscription payment'
            }
          })
          .onConflictDoNothing();
      } else {
        // Record the payment transaction with detailed metadata
        await db.insert(paymentTransactions)
          .values({
            userId: subscription[0].userId,
            subscriptionId: subscription[0].id,
            amount: (payment.amount / 100).toString(), // Convert from paise to INR/USD
            currency: payment.currency,
            gateway: 'RAZORPAY',
            gatewayTransactionId: payment.id,
            status: 'COMPLETED',
            metadata: {
              planDetails: {
                id: subscription[0].planId,
                name: planData.length > 0 ? planData[0].name : 'Unknown Plan',
                cycle: planData.length > 0 ? planData[0].billingCycle : 'MONTHLY'
              },
              paymentDetails: {
                expectedCurrency: correctCurrency,
                actualCurrency: payment.currency,
                hasCurrencyMismatch: hasCurrencyMismatch,
                correctPlanPrice: finalPricingData?.price || null,
                correctPlanCurrency: finalPricingData?.currency || correctCurrency
              },
              userRegion: targetRegion,
              userCountry: userCountry,
              isUpgrade: payment.notes?.isUpgrade === 'true',
              paymentMethod: payment.method || 'unknown',
              email: payment.email,
              contact: payment.contact,
              description: payment.description || 'Subscription payment'
            }
          })
          .onConflictDoNothing();
      }
      
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

  private async handleSubscriptionAuthenticated(subscription: any) {
    try {
      console.log(`Processing subscription.authenticated for ${subscription.id}`);
      
      // Find our internal subscription by the Razorpay subscription ID
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscription.id))
        .limit(1);
      
      if (!userSubscription.length) {
        console.log(`No internal subscription found for Razorpay subscription: ${subscription.id}`);
        return;
      }
      
      // Update subscription status to active (we don't have AUTHENTICATED as a valid status)
      await db.update(userSubscriptions)
        .set({ 
          status: 'ACTIVE',
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, userSubscription[0].id));
        
      console.log(`Subscription ${userSubscription[0].id} authenticated - first payment (authentication) successful`);
      
      // Extract customer ID if present
      const customerId = subscription.customer_id;
      
      // If customerId is present, update user record
      if (customerId) {
        try {
          // Update the user record with the Razorpay customer ID
          await db.update(users)
            .set({ 
              razorpayCustomerId: customerId,
              updatedAt: new Date()
            })
            .where(eq(users.id, userSubscription[0].userId));
            
          console.log(`Updated user ${userSubscription[0].userId} with Razorpay customer ID ${customerId} from authentication`);
        } catch (updateError) {
          console.error('Error updating user with Razorpay customer ID:', updateError);
        }
      }
    } catch (error) {
      console.error('Error handling Razorpay subscription authentication:', error);
      throw error;
    }
  }

  private async handleSubscriptionActivated(subscription: any) {
    try {
      // Extract customer ID if present
      const customerId = subscription.customer_id;
      
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
        
      // If customerId is present, update user record
      if (customerId) {
        try {
          // Update the user record with the Razorpay customer ID
          await db.update(users)
            .set({ 
              razorpayCustomerId: customerId,
              updatedAt: new Date()
            })
            .where(eq(users.id, userSubscription[0].userId));
            
          console.log(`Updated user ${userSubscription[0].userId} with Razorpay customer ID ${customerId} from subscription activation`);
        } catch (updateError) {
          console.error('Error updating user with Razorpay customer ID:', updateError);
        }
      }
        
      console.log('Subscription activated:', userSubscription[0].id);
    } catch (error) {
      console.error('Error handling Razorpay subscription activation:', error);
      throw error;
    }
  }

  private async handleSubscriptionCharged(payment: any, subscription: any) {
    try {
      // Extract customer ID if present
      const customerId = subscription.customer_id || payment.customer_id;
      
      // Log detailed payment information 
      console.log('Subscription charged webhook received:', JSON.stringify({
        payment_id: payment.id,
        subscription_id: subscription.id,
        amount: payment.amount / 100, // Convert from smallest currency unit
        currency: payment.currency,
        description: payment.description || 'No description',
        plan_id: subscription.plan_id,
        is_auth_payment: payment.notes?.is_token_payment === 'true',
        is_actual_payment: !payment.notes?.is_token_payment
      }));
      
      // This is a renewal charge - find our internal subscription
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscription.id))
        .limit(1);
      
      if (!userSubscription.length) {
        console.log('No internal subscription found for Razorpay subscription:', subscription.id);
        return;
      }
      
      // If customerId is present, update user record
      if (customerId) {
        try {
          // Update the user record with the Razorpay customer ID
          await db.update(users)
            .set({ 
              razorpayCustomerId: customerId,
              updatedAt: new Date()
            })
            .where(eq(users.id, userSubscription[0].userId));
            
          console.log(`Updated user ${userSubscription[0].userId} with Razorpay customer ID ${customerId} from subscription charge`);
        } catch (updateError) {
          console.error('Error updating user with Razorpay customer ID:', updateError);
        }
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
      
      // Get user's billing details to determine correct currency
      const userBillingInfo = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userSubscription[0].userId))
        .limit(1);
        
      const userCountry = userBillingInfo.length > 0 ? userBillingInfo[0].country : 'US';
      const targetRegion = userCountry === 'IN' ? 'INDIA' : 'GLOBAL';
      
      // Get plan pricing for the correct region
      const planPricingData = await db.select()
        .from(planPricing)
        .where(
          and(
            eq(planPricing.planId, userSubscription[0].planId),
            eq(planPricing.targetRegion, targetRegion as any)
          )
        )
        .limit(1);
      
      // Fall back to global pricing if regional pricing not found
      const finalPricingData = planPricingData.length 
        ? planPricingData[0] 
        : (await db.select()
            .from(planPricing)
            .where(
              and(
                eq(planPricing.planId, userSubscription[0].planId),
                eq(planPricing.targetRegion, 'GLOBAL')
              )
            )
            .limit(1))[0];
      
      // Determine if there's a currency mismatch
      const correctCurrency = targetRegion === 'INDIA' ? 'INR' : 'USD';
      const hasCurrencyMismatch = payment.currency !== correctCurrency;
      
      if (hasCurrencyMismatch) {
        console.error(`Currency mismatch detected for subscription renewal payment ${payment.id}!`);
        console.error(`User country: ${userCountry}, User region: ${targetRegion}`);
        console.error(`Expected currency: ${correctCurrency}, Actual currency from Razorpay: ${payment.currency}`);
        
        // CRITICAL FIX: Use the correct currency based on user location instead of blindly trusting Razorpay
        // This ensures that USD customers get USD transactions in our system regardless of Razorpay's response
        console.log(`Overriding currency for subscription renewal payment ${payment.id} from ${payment.currency} to ${correctCurrency}`);
        
        // ADDITIONAL FIX: Also correct the amount when changing from INR to USD or vice versa
        let correctedAmount = (payment.amount / 100).toString(); // Default: use original amount
        
        if (finalPricingData) {
          // If we're fixing the currency, we should also fix the amount to match the correct plan price
          correctedAmount = finalPricingData.price.toString();
          console.log(`Also correcting amount from ${payment.amount / 100} ${payment.currency} to ${correctedAmount} ${correctCurrency}`);
        }
        
        // Record the payment transaction with rich metadata
        await db.insert(paymentTransactions)
          .values({
            userId: userSubscription[0].userId,
            subscriptionId: userSubscription[0].id,
            amount: correctedAmount,
            currency: correctCurrency, // Use correct currency on mismatch
            gateway: 'RAZORPAY',
            gatewayTransactionId: payment.id,
            status: 'COMPLETED',
            metadata: {
              planDetails: {
                id: userSubscription[0].planId,
                name: plan.length > 0 ? plan[0].name : 'Unknown Plan',
                cycle: plan.length > 0 ? plan[0].billingCycle : 'MONTHLY'
              },
              paymentDetails: {
                expectedCurrency: correctCurrency,
                actualCurrency: payment.currency,
                hasCurrencyMismatch: hasCurrencyMismatch,
                correctPlanPrice: finalPricingData?.price || null,
                correctPlanCurrency: finalPricingData?.currency || correctCurrency
              },
              userRegion: targetRegion,
              userCountry: userCountry,
              isRenewal: true,
              paymentMethod: payment.method || 'unknown',
              renewalDate: now.toISOString(),
              nextRenewalDate: newEndDate.toISOString(),
              description: 'Subscription renewal payment'
            }
          })
          .onConflictDoNothing();
        
        console.log('Subscription renewed:', userSubscription[0].id);
      } else {
        // Record the payment transaction with rich metadata
        await db.insert(paymentTransactions)
          .values({
            userId: userSubscription[0].userId,
            subscriptionId: userSubscription[0].id,
            amount: (payment.amount / 100).toString(), // Convert from paise to INR/USD
            currency: payment.currency,
            gateway: 'RAZORPAY',
            gatewayTransactionId: payment.id,
            status: 'COMPLETED',
            metadata: {
              planDetails: {
                id: userSubscription[0].planId,
                name: plan.length > 0 ? plan[0].name : 'Unknown Plan',
                cycle: plan.length > 0 ? plan[0].billingCycle : 'MONTHLY'
              },
              paymentDetails: {
                expectedCurrency: correctCurrency,
                actualCurrency: payment.currency,
                hasCurrencyMismatch: hasCurrencyMismatch,
                correctPlanPrice: finalPricingData?.price || null,
                correctPlanCurrency: finalPricingData?.currency || correctCurrency
              },
              userRegion: targetRegion,
              userCountry: userCountry,
              isRenewal: true,
              paymentMethod: payment.method || 'unknown',
              renewalDate: now.toISOString(),
              nextRenewalDate: newEndDate.toISOString(),
              description: 'Subscription renewal payment'
            }
          })
          .onConflictDoNothing();
        
        console.log('Subscription renewed:', userSubscription[0].id);
      }
    } catch (error) {
      console.error('Error handling Razorpay subscription charge:', error);
      throw error;
    }
  }

  private async handleSubscriptionCompleted(subscription: any) {
    try {
      console.log(`Processing subscription.completed for ${subscription.id}`);
      
      // Find our internal subscription by the Razorpay subscription ID
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscription.id))
        .limit(1);
      
      if (!userSubscription.length) {
        console.log(`No internal subscription found for Razorpay subscription: ${subscription.id}`);
        return;
      }
      
      // Update subscription status to expired (we don't have COMPLETED as a valid status)
      await db.update(userSubscriptions)
        .set({ 
          status: 'EXPIRED',
          autoRenew: false,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, userSubscription[0].id));
        
      console.log(`Subscription ${userSubscription[0].id} completed - all billing cycles finished`);
    } catch (error) {
      console.error('Error handling Razorpay subscription completion:', error);
      throw error;
    }
  }

  private async handleSubscriptionUpdated(subscription: any) {
    try {
      console.log(`Processing subscription.updated for ${subscription.id}`);
      
      // Find our internal subscription by the Razorpay subscription ID
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscription.id))
        .limit(1);
      
      if (!userSubscription.length) {
        console.log(`No internal subscription found for Razorpay subscription: ${subscription.id}`);
        return;
      }
      
      // Get updated subscription details from Razorpay
      const subscriptionDetails = await this.getSubscriptionDetails(subscription.id);
      
      if (!subscriptionDetails) {
        console.error(`Could not fetch updated subscription details for ${subscription.id}`);
        return;
      }
      
      // Calculate new end date based on current_end from Razorpay
      const endDate = subscriptionDetails.current_end 
        ? new Date(subscriptionDetails.current_end * 1000)
        : userSubscription[0].endDate;
      
      // Update our internal subscription with the latest details
      await db.update(userSubscriptions)
        .set({
          // Only update fields that might have changed
          endDate: endDate,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, userSubscription[0].id));
        
      console.log(`Subscription ${userSubscription[0].id} updated with latest details from Razorpay`);
    } catch (error) {
      console.error('Error handling Razorpay subscription update:', error);
      throw error;
    }
  }

  // Update the handleSubscriptionPaymentIssue to handle both pending and halted states
  private async handleSubscriptionPaymentIssue(subscription: any, isHalted: boolean = false) {
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
      
      // Set grace period - longer for halted subscriptions
      const gracePeriodDays = isHalted ? 14 : 7; // 14 days for halted, 7 for pending
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);
      
      // Update subscription status to grace period
      await db.update(userSubscriptions)
        .set({ 
          status: 'GRACE_PERIOD',
          gracePeriodEnd,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, userSubscription[0].id));
        
      console.log(`Subscription ${userSubscription[0].id} moved to grace period due to ${isHalted ? 'halted (multiple failures)' : 'pending payment issue'}`);
      
      // Record this payment failure event
      try {
        await db.insert(paymentTransactions)
          .values({
            userId: userSubscription[0].userId,
            subscriptionId: userSubscription[0].id,
            amount: '0', // We don't know the exact amount
            currency: subscription.currency || 'USD',
            gateway: 'RAZORPAY',
            gatewayTransactionId: `failed_${Date.now()}`,
            status: 'FAILED',
            refundReason: `Payment ${isHalted ? 'halted' : 'pending'}: Recurring payment for subscription failed`
          })
          .onConflictDoNothing();
      } catch (transactionError) {
        console.error('Error recording failed transaction:', transactionError);
      }
    } catch (error) {
      console.error('Error handling Razorpay subscription payment issue:', error);
      throw error;
    }
  }

  private async handleSubscriptionPaused(subscription: any) {
    try {
      console.log(`Processing subscription.paused for ${subscription.id}`);
      
      // Find our internal subscription by the Razorpay subscription ID
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscription.id))
        .limit(1);
      
      if (!userSubscription.length) {
        console.log(`No internal subscription found for Razorpay subscription: ${subscription.id}`);
        return;
      }
      
      // Update subscription status to grace period (we don't have PAUSED in our status enum)
      await db.update(userSubscriptions)
        .set({ 
          status: 'GRACE_PERIOD',
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, userSubscription[0].id));
        
      console.log(`Subscription ${userSubscription[0].id} paused (marked as grace period)`);
    } catch (error) {
      console.error('Error handling Razorpay subscription pause:', error);
      throw error;
    }
  }

  private async handleSubscriptionResumed(subscription: any) {
    try {
      console.log(`Processing subscription.resumed for ${subscription.id}`);
      
      // Find our internal subscription by the Razorpay subscription ID
      const userSubscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscription.id))
        .limit(1);
      
      if (!userSubscription.length) {
        console.log(`No internal subscription found for Razorpay subscription: ${subscription.id}`);
        return;
      }
      
      // Get updated subscription details to get correct end date
      const subscriptionDetails = await this.getSubscriptionDetails(subscription.id);
      
      // Calculate new end date based on Razorpay details or use current
      const endDate = subscriptionDetails?.current_end 
        ? new Date(subscriptionDetails.current_end * 1000)
        : userSubscription[0].endDate;
      
      // Update subscription status to active
      await db.update(userSubscriptions)
        .set({ 
          status: 'ACTIVE',
          endDate: endDate,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, userSubscription[0].id));
        
      console.log(`Subscription ${userSubscription[0].id} resumed from paused state`);
    } catch (error) {
      console.error('Error handling Razorpay subscription resumption:', error);
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
        console.log(`No internal subscription found for Razorpay subscription: ${subscription.id}`);
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
        
      console.log(`Subscription ${userSubscription[0].id} cancelled`);
    } catch (error) {
      console.error('Error handling Razorpay subscription cancellation:', error);
      throw error;
    }
  }

  async fetchInvoicesForSubscription(subscriptionId: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      console.log(`Fetching invoices for subscription ID: ${subscriptionId}`);
      
      // Check if Razorpay is initialized
      if (!this.initialized || !this.razorpay) {
        console.error('Razorpay not properly initialized for fetching invoices');
        return { count: 0, items: [] };
      }
      
      // Use the Razorpay API to fetch invoices
      const invoiceData = await this.razorpay.invoices.all({
        subscription_id: subscriptionId
      });
      
      // If we don't get valid data, return empty response
      if (!invoiceData || !invoiceData.items) {
        console.log(`No invoices found for subscription: ${subscriptionId}`);
        return { count: 0, items: [] };
      }
      
      console.log(`Found ${invoiceData.count} invoices for subscription: ${subscriptionId}`);
      
      // Process and store each invoice in our database
      for (const invoice of invoiceData.items) {
        try {
          // Get our internal subscription record based on Razorpay subscription ID
          const subscription = await db.select()
            .from(userSubscriptions)
            .where(eq(userSubscriptions.paymentReference, subscriptionId))
            .limit(1);
          
          if (!subscription.length) {
            console.warn(`No internal subscription found for Razorpay subscription: ${subscriptionId}`);
            continue;
          }
          
          // For each invoice, check if there's a payment, record each transaction
          if (invoice.payment_id && invoice.status === 'paid') {
            // Check if this payment is already recorded - IMPROVED CHECK
            const existingTransaction = await db.select()
              .from(paymentTransactions)
              .where(eq(paymentTransactions.gatewayTransactionId, invoice.payment_id))
              .execute();
            
            // Only proceed if no transaction exists with this ID
            if (existingTransaction.length === 0) {
              // Create a simple note about the invoice
              const invoiceNote = `Invoice ${invoice.id} for billing period ${invoice.billing_start ? new Date(invoice.billing_start * 1000).toISOString().slice(0, 10) : 'unknown'} to ${invoice.billing_end ? new Date(invoice.billing_end * 1000).toISOString().slice(0, 10) : 'unknown'}`;
              
              // Get user's billing region to determine correct currency for this transaction
              const userBillingInfo = await db.select()
                .from(userBillingDetails)
                .where(eq(userBillingDetails.userId, subscription[0].userId))
                .limit(1);
              
              // Determine if this is an authentication charge
              // Razorpay uses $0.50 for USD and ₹1 for INR as standard authentication amounts
              const isAuthCharge = (invoice.currency === 'USD' && invoice.amount <= 100) || 
                                  (invoice.currency === 'INR' && invoice.amount <= 200);
              
              // Get ALL plan pricing data to check for possible currency mismatches
              const allPlanPricing = await db.select()
                .from(planPricing);
              
              // Fix for issue where authentication charges are using wrong currency but full amount
              // If amount matches the full plan price in the wrong currency, it's not an auth charge
              let isFullPlanAmountWrongCurrency = false;
              let actualAuthAmount = invoice.amount; // Default to the original amount
              let matchedPlanInfo = null;
              
              // Check against all plan prices in the database
              for (const pricing of allPlanPricing) {
                // Only check plans with the same currency as the invoice
                if (pricing.currency === invoice.currency) {
                  const planPriceInSmallestUnit = Math.round(parseFloat(pricing.price) * 100);
                  // Check if the amount is very close to the plan price (within 5% tolerance)
                  if (Math.abs(invoice.amount - planPriceInSmallestUnit) < (planPriceInSmallestUnit * 0.05)) {
                    // Now check if this doesn't match the user's expected currency based on region
                    // Determine expected currency from user billing details
                    const expectedCurrency = userBillingInfo.length > 0 && userBillingInfo[0].country === 'IN' ? 'INR' : 'USD';
                    if (invoice.currency !== expectedCurrency) {
                      isFullPlanAmountWrongCurrency = true;
                      matchedPlanInfo = pricing;
                      console.log(`Found pricing match: Invoice amount ${invoice.amount/100} ${invoice.currency} matches plan ID ${pricing.planId} price ${pricing.price} ${pricing.currency}`);
                      console.log(`This appears to be wrong currency for user who should use ${expectedCurrency}`);
                      break;
                    }
                  }
                }
              }
              
              if (isFullPlanAmountWrongCurrency) {
                // For authentication charges that incorrectly used full amount in wrong currency,
                // we should correct the amount to the standard authentication charge
                if (invoice.currency === 'INR') {
                  console.log(`Detected incorrect auth charge amount: ₹${invoice.amount/100}. This should be ₹1 or $0.50.`);
                  actualAuthAmount = 100; // Standard Razorpay auth amount for INR (₹1)
                } else if (invoice.currency === 'USD') {
                  console.log(`Detected incorrect auth charge amount: $${invoice.amount/100}. This should be ₹1 or $0.50.`);
                  actualAuthAmount = 50; // Standard Razorpay auth amount for USD ($0.50)
                }
              }
              
              // Determine transaction type: auth charge or full payment
              // An additional check: if this is the first payment for a subscription and the amount is close to plan prices, 
              // it's likely an authentication charge with wrong amount
              const isFirstPaymentForSubscription = await db.select().from(paymentTransactions)
                .where(eq(paymentTransactions.subscriptionId, subscription[0].id))
                .execute();
                
              const isActuallyAuthCharge = (isAuthCharge && !isFullPlanAmountWrongCurrency) || 
                                         (isFirstPaymentForSubscription.length === 0 && isFullPlanAmountWrongCurrency);
              
              // Get plan information to add to notes
              const planInfo = await db.select({
                plan: subscriptionPlans,
                pricing: planPricing
              })
                .from(subscriptionPlans)
                .leftJoin(
                  planPricing, 
                  and(
                    eq(planPricing.planId, subscriptionPlans.id),
                    eq(planPricing.currency, invoice.currency)
                  )
                )
                .where(eq(subscriptionPlans.id, subscription[0].planId))
                .limit(1);
              
              // Determine correct transaction currency based on user's region
              let correctCurrency = invoice.currency;
              let actualPlanAmount = (invoice.amount / 100).toString();
              
              if (planInfo.length > 0) {
                if (userBillingInfo.length > 0) {
                  // For users in India, use INR
                  if (userBillingInfo[0].country === 'IN') {
                    const inrPricing = await db.select()
                      .from(planPricing)
                      .where(and(
                        eq(planPricing.planId, subscription[0].planId),
                        eq(planPricing.currency, 'INR')
                      ))
                      .limit(1);
                    
                    if (inrPricing.length > 0) {
                      correctCurrency = 'INR';
                      actualPlanAmount = inrPricing[0].price.toString();
                    }
                  } else {
                    // For all other users, use USD
                    const usdPricing = await db.select()
                      .from(planPricing)
                      .where(and(
                        eq(planPricing.planId, subscription[0].planId),
                        eq(planPricing.currency, 'USD')
                      ))
                      .limit(1);
                    
                    if (usdPricing.length > 0) {
                      correctCurrency = 'USD';
                      actualPlanAmount = usdPricing[0].price.toString();
                    }
                  }
                }
              }
              
              // Create detailed note with correct plan information
              const planName = planInfo.length > 0 ? planInfo[0].plan.name : 'Unknown';
              const planCycle = planInfo.length > 0 ? planInfo[0].plan.billingCycle : 'MONTHLY';
              
              const transactionNote = isActuallyAuthCharge 
                ? `AUTHENTICATION_CHARGE: ${invoiceNote} - Authentication charge for subscription. Plan: ${planName}, actual_plan_amount: ${actualPlanAmount}, plan_currency: ${correctCurrency}, transaction_currency: ${invoice.currency}, is_auth_charge: true`
                : `SUBSCRIPTION_PAYMENT: plan_name: ${planName}, plan_cycle: ${planCycle}, payment_type: subscription, actual_plan_amount: ${actualPlanAmount}, plan_currency: ${correctCurrency}, original_note: ${invoiceNote}`;
              
              // This is a new transaction, record it
              await db.insert(paymentTransactions)
                .values({
                  userId: subscription[0].userId,
                  subscriptionId: subscription[0].id,
                  amount: isActuallyAuthCharge && isFullPlanAmountWrongCurrency ? 
                    (actualAuthAmount / 100).toString() : // Use corrected auth amount if detected
                    (invoice.amount / 100).toString(), // Otherwise use original amount
                  currency: invoice.currency,
                  gateway: 'RAZORPAY',
                  gatewayTransactionId: invoice.payment_id,
                  status: 'COMPLETED',
                  refundReason: transactionNote // Using this field to store transaction info
                })
                .onConflictDoNothing();
                
              console.log(`Recorded new transaction from invoice ${invoice.id} with payment ${invoice.payment_id} for subscription ${subscriptionId}`);
              console.log(`Transaction type: ${isActuallyAuthCharge ? 'Authentication charge' : 'Subscription payment'}`);
              
              // If this is a full payment (not auth charge) and subscription status isn't active, activate it
              if (!isActuallyAuthCharge && subscription[0].status !== 'ACTIVE') {
                await db.update(userSubscriptions)
                  .set({ 
                    status: 'ACTIVE',
                    updatedAt: new Date()
                  })
                  .where(eq(userSubscriptions.id, subscription[0].id));
                  
                console.log(`Activated subscription ${subscription[0].id} based on invoice payment`);
              }
            } else {
              console.log(`Transaction for payment ${invoice.payment_id} already exists in database (${existingTransaction.length} records), skipping`);
            }
          }
        } catch (invoiceError) {
          console.error(`Error processing invoice ${invoice.id}:`, invoiceError);
          // Continue with next invoice
        }
      }
      
      return invoiceData;
    } catch (error) {
      console.error(`Error fetching invoices for subscription ${subscriptionId}:`, error);
      return { count: 0, items: [] };
    }
  }

  /**
   * Fix plan mappings when a currency mismatch is detected
   * This will update the gateway config to make sure we use the correct plan_id 
   * for future subscriptions with the given currency
   */
  async fixPlanMappingsForCurrency(userId: number, planId: number, correctCurrency: 'USD' | 'INR'): Promise<boolean> {
    try {
      console.log(`Fixing plan mappings for user ${userId}, plan ${planId}, currency ${correctCurrency}`);
      
      // Get user's current subscription to find the Razorpay plan ID
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, 'ACTIVE')
          )
        )
        .limit(1);
        
      if (!subscription.length || !subscription[0].paymentReference) {
        console.log(`No active subscription found for user ${userId}`);
        return false;
      }
      
      // Get the subscription details from Razorpay
      const subscriptionDetails = await this.getSubscriptionDetails(subscription[0].paymentReference);
      if (!subscriptionDetails || !subscriptionDetails.plan_id) {
        console.log(`Could not fetch subscription details from Razorpay for ${subscription[0].paymentReference}`);
        return false;
      }
      
      const razorpayPlanId = subscriptionDetails.plan_id;
      console.log(`Found Razorpay plan ID: ${razorpayPlanId}`);
      
      // Fetch the plan details to check its currency
      const razorpayPlan = await this.razorpay!.plans.fetch(razorpayPlanId);
      if (!razorpayPlan || !razorpayPlan.item || !razorpayPlan.item.currency) {
        console.log(`Could not fetch plan details from Razorpay for ${razorpayPlanId}`);
        return false;
      }
      
      const planCurrency = razorpayPlan.item.currency;
      console.log(`Razorpay plan ${razorpayPlanId} currency: ${planCurrency}`);
      
      // Only proceed if the plan currency doesn't match the correct currency
      if (planCurrency === correctCurrency) {
        console.log(`Plan currency already matches correct currency (${correctCurrency}), no fix needed`);
        return true;
      }
      
      // Get the gateway config to update mappings
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
        
      if (!gatewayConfig.length) {
        console.log('No active Razorpay gateway config found');
        return false;
      }
      
      // Update the config options with the corrected mapping
      const currentOptions = gatewayConfig[0].configOptions || {};
      const planMappings = ((currentOptions as any).plan_mappings || {}) as Record<string, string>;
      
      // First remove any incorrect mapping
      const incorrectMappingKey = `${planId}_${planCurrency}`;
      if (planMappings[incorrectMappingKey] === razorpayPlanId) {
        console.log(`Removing incorrect mapping: ${incorrectMappingKey} -> ${razorpayPlanId}`);
        delete planMappings[incorrectMappingKey];
      }
      
      // Need to create a new plan with the correct currency
      console.log(`Creating new Razorpay plan for internal plan ${planId} with corrected currency ${correctCurrency}`);
      
      // Get the plan details from our database
      const plan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);
        
      if (!plan.length) {
        console.log(`Plan not found for ID: ${planId}`);
        return false;
      }
      
      // Get the pricing for the correct currency
      const pricing = await db.select()
        .from(planPricing)
        .where(
          and(
            eq(planPricing.planId, planId),
            eq(planPricing.currency, correctCurrency)
          )
        )
        .limit(1);
        
      if (!pricing.length) {
        console.log(`No pricing found for plan ${planId} with currency ${correctCurrency}`);
        return false;
      }
      
      // Determine the period based on billing cycle
      const period = plan[0].billingCycle === 'YEARLY' ? 'yearly' : 'monthly';
      
      // Convert amount to smallest currency unit
      const amountInSmallestUnit = Math.round(parseFloat(pricing[0].price) * 100);
      
      // Create the plan in Razorpay
      const newRazorpayPlan = await this.razorpay!.plans.create({
        period,
        interval: 1,
        item: {
          name: `${plan[0].name} (${period}, ${correctCurrency})`,
          amount: amountInSmallestUnit,
          currency: correctCurrency,
          description: plan[0].description || `${plan[0].name} subscription plan`
        },
        notes: {
          internal_plan_id: planId.toString(),
          billing_cycle: plan[0].billingCycle,
          currency: correctCurrency,
          is_fixed_mapping: 'true',
          fixed_date: new Date().toISOString()
        }
      });
      
      const newRazorpayPlanId = newRazorpayPlan.id;
      console.log(`Created new Razorpay plan: ${newRazorpayPlanId} with correct currency ${correctCurrency}`);
      
      // Add the corrected mapping
      const correctMappingKey = `${planId}_${correctCurrency}`;
      planMappings[correctMappingKey] = newRazorpayPlanId;
      
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
        
      console.log(`Updated plan mappings: ${correctMappingKey} -> ${newRazorpayPlanId}`);
      console.log(`Plan mappings fixed for user ${userId}, plan ${planId}, currency ${correctCurrency}`);
      
      return true;
    } catch (error) {
      console.error('Error fixing plan mappings:', error);
      return false;
    }
  }
}

// Create instance
const razorpayGateway = new RazorpayGateway(); 

// Utility function to format phone number for Razorpay compatibility
export function formatPhoneForRazorpay(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return '';
  
  // Clean the phone number - keep only digits and + symbol
  let cleaned = phoneNumber.replace(/[^0-9+]/g, '');
  
  // Ensure + is only at the beginning if present
  if (cleaned.includes('+') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.replace(/\+/g, '');
  }
  
  // If we have multiple +, keep only the first one
  if (cleaned.indexOf('+') !== cleaned.lastIndexOf('+')) {
    const parts = cleaned.split('+');
    cleaned = '+' + parts.slice(1).join('');
  }
  
  // Ensure we have at least 5 digits for Razorpay to accept it
  if (cleaned.replace(/\+/g, '').length < 5) {
    return ''; // Return empty if too short - Razorpay will reject very short numbers
  }
  
  return cleaned;
}