import express from 'express';
import { requireUser } from '../../middleware/auth';
import { db } from '../../config/db';
import { getPaymentGatewayByName, decryptApiKey } from '../../services/payment-gateways';
import { userSubscriptions, subscriptionPlans, paymentTransactions, userBillingDetails, planPricing, paymentGatewayConfigs, users } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { SubscriptionService } from '../../services/subscription-service';
import { appSettings } from '@shared/schema';
import crypto from 'crypto';
import { requireAdmin } from '../../middleware/admin';
import { withEncryption } from '../../middleware/index';
import { sanitizeBillingData } from '../../middleware/data-encryption';

// Add this helper function before registerPaymentRoutes
function cleanEncryptedEmptyValues(data: any): any {
  if (!data) return data;
  
  // Create a copy to avoid modifying the original
  const cleanedData = { ...data };
  
  // Clean up any field that looks like encrypted data but should be empty
  Object.keys(cleanedData).forEach(key => {
    const value = cleanedData[key];
    if (typeof value === 'string') {
      // Check if it looks like an encrypted value (salt:authTag:encrypted)
      const parts = value.split(':');
      if (parts.length === 3 && 
          parts[0].length === 16 && 
          parts[1].length === 32 && 
          /^[0-9a-f]+$/i.test(parts[0]) && 
          /^[0-9a-f]+$/i.test(parts[1]) && 
          /^[0-9a-f]+$/i.test(parts[2])) {
        
        // Treat these optional fields specially
        if (['phoneNumber', 'addressLine2', 'taxId', 'companyName'].includes(key)) {
          cleanedData[key] = ''; // Set to empty string
        }
      }
    }
  });
  
  return cleanedData;
}

export function registerPaymentRoutes(app: express.Express) {
  // Get user's billing details
  app.get('/api/user/billing-details', 
    requireUser, 
    ...withEncryption('userBillingDetails'),
    async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      console.log(`Fetching billing details for user ${userId}`);
      
      const billingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      if (billingDetails.length === 0) {
        console.log(`No billing details found for user ${userId}`);
        return res.status(200).json(null);
      }
      
      // Map database column name (full_name) to client expected property (fullName)
      const responseData = {
        ...billingDetails[0],
        fullName: billingDetails[0].fullName || (billingDetails[0] as any).full_name
      };
      
      // Clean up any encrypted empty values
      const cleanedData = cleanEncryptedEmptyValues(responseData);
      
      console.log(`Found billing details for user ${userId}`);
      res.json(cleanedData);
    } catch (error: any) {
      console.error('Error in GET /api/user/billing-details:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve billing details', 
        error: error.message 
      });
    }
  });

  // Create or update user's billing details
  app.post('/api/user/billing-details', 
    requireUser, 
    ...withEncryption('userBillingDetails'),
    async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      console.log(`Creating/updating billing details for user ${userId}`, req.body);
      
      // Extract data from request body, making country field uppercase for consistency
      // Map client property (fullName) to database column (full_name)
      let billingData: any = { 
        ...req.body, 
        userId,
        country: req.body.country?.toUpperCase() || 'US',
        full_name: req.body.fullName || req.body.full_name || '' 
      };
      
      // Sanitize the billing data to ensure optional fields are properly handled
      billingData = sanitizeBillingData(billingData);
      
      // Check if billing details already exist
      const existingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      let updatedDetails;
      
      if (existingDetails.length > 0) {
        // Update existing billing details
        console.log(`Updating existing billing details for user ${userId}`);
        updatedDetails = await db.update(userBillingDetails)
          .set({
            ...billingData,
            updatedAt: new Date()
          })
          .where(eq(userBillingDetails.userId, userId))
          .returning();
      } else {
        // Create new billing details
        console.log(`Creating new billing details for user ${userId}`);
        updatedDetails = await db.insert(userBillingDetails)
          .values(billingData)
          .returning();
      }
      
      // Map database column name (full_name) to client expected property (fullName)
      const responseData = {
        ...updatedDetails[0],
        fullName: updatedDetails[0].fullName || (updatedDetails[0] as any).full_name
      };
      
      console.log(`Successfully saved billing details for user ${userId}`);
      res.status(200).json(responseData);
    } catch (error: any) {
      console.error('Error in POST /api/user/billing-details:', error);
      res.status(500).json({ 
        message: 'Failed to update billing details', 
        error: error.message 
      });
    }
  });

  // Create payment intent (handle subscription initialization)
  app.post('/api/payments/create-intent', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: No user session found' });
      }
      
      const userId = req.user.id;
      const planId = req.body.planId ? parseInt(req.body.planId) : null;
      const customAmount = req.body.amount ? parseFloat(req.body.amount) : null;
      const customCurrency = req.body.currency;
      let isUpgrade = req.body.isUpgrade === true;
      
      console.log('Creating payment intent - User:', userId, 'Plan ID:', planId, 'Is Upgrade:', isUpgrade ? 'Yes' : 'No');
      console.log('Request body for payment intent:', JSON.stringify(req.body, null, 2));
      
      if (!planId) {
        return res.status(400).json({ message: 'Bad Request: Plan ID is required for payment intent' });
      }
      
      console.log(`Creating payment intent - User: ${userId}, Plan ID: ${planId}, Is Upgrade: ${isUpgrade ? 'Yes' : 'No'}`);
      
      // Get the plan details
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
      if (!plan.length) {
        return res.status(404).json({ message: 'Not Found: Subscription plan with the specified ID does not exist' });
      }
      
      console.log(`Found plan: ${plan[0].name}`);
      
      // Get current subscription details if this is an upgrade
      let currentSubscription = null;
      let prorationDetails = null;
      
      if (isUpgrade) {
        // Check if user has an active subscription to upgrade
        const userSub = await db.select()
          .from(userSubscriptions)
          .where(and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, 'ACTIVE')
          ))
          .limit(1);
          
        if (!userSub.length) {
          console.log(`Upgrade requested for user ${userId} but no active subscription found. Treating as a new subscription.`);
          isUpgrade = false;
          console.log(`Setting isUpgrade to false for user ${userId} since no active subscription exists`);
        } else {
          // Store the current subscription for reference
          currentSubscription = userSub[0];
          
          // Get proration calculation
          try {
            const subscriptionService = SubscriptionService;
            prorationDetails = await subscriptionService.calculateProration(userId, planId);
            console.log('Proration calculation result:', JSON.stringify(prorationDetails, null, 2));
            
            // If the result says it's not an upgrade, respect that determination
            if (!prorationDetails.isUpgrade) {
              console.log(`Proration calculation determined this is not an upgrade. Setting isUpgrade=false.`);
              isUpgrade = false;
            }
          } catch (prorationError) {
            console.error('Error calculating proration:', prorationError);
            // Continue with the upgrade, but without proration information
          }
        }
      }
      
      // Get user's region
      let userRegion = 'GLOBAL';
      let currency = customCurrency || 'USD';
      
      // First try to get region from billing details
      const billingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      if (billingDetails.length) {
        if (billingDetails[0].country === 'IN') {
          userRegion = 'INDIA';
          if (!customCurrency) currency = 'INR';
        }
      }
      
      // Get specific pricing for the user's region
      let pricing = await db.select()
        .from(planPricing)
        .where(and(
          eq(planPricing.planId, planId),
          eq(planPricing.targetRegion, userRegion as any)
        ))
        .limit(1);
      
      let amount = customAmount || 0;
      
      // If no region-specific pricing is found, fall back to global pricing
      if (!pricing.length) {
        console.log(`No pricing found for region ${userRegion}, falling back to GLOBAL pricing`);
        pricing = await db.select()
          .from(planPricing)
          .where(and(
            eq(planPricing.planId, planId),
            eq(planPricing.targetRegion, 'GLOBAL')
          ))
          .limit(1);
      }
      
      if (!pricing.length) {
        return res.status(404).json({ message: 'Not Found: No pricing available for the selected plan' });
      }
      
      // If using custom amount for upgrade proration
      if (isUpgrade && customAmount !== null) {
        console.log(`[Intent] Using custom amount: ${customAmount}, currency=${currency}`);
        amount = customAmount;
      } else {
        // Otherwise use the plan price
        amount = parseFloat(pricing[0].price);
        currency = pricing[0].currency;
      }
      
      // For upgrade with proration but no custom amount
      if (isUpgrade && prorationDetails && prorationDetails.prorationAmount !== undefined && customAmount === null) {
        console.log(`Using calculated proration amount: ${prorationDetails.prorationAmount}`);
        amount = prorationDetails.prorationAmount;
        
        // Ensure we're using the currency from the proration calculation
        if (prorationDetails.currency) {
          console.log(`Using currency from proration calculation: ${prorationDetails.currency}`);
          currency = prorationDetails.currency;
        }
      }
      
      console.log(`[Intent] Final values: planId=${planId}, userRegion=${userRegion}, amount=${amount}, currency=${currency}, isUpgrade=${isUpgrade}`);
      
      const paymentGatewayName = 'razorpay'; // Default to Razorpay, can be made configurable later
      const paymentGateway = getPaymentGatewayByName(paymentGatewayName);
      
      if (!paymentGateway) {
        console.error(`Payment gateway ${paymentGatewayName} not found or not configured properly`);
        return res.status(500).json({ message: 'Internal Server Error: Payment gateway not available' });
      }
      
      // Get user's account information
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user.length) {
        return res.status(404).json({ message: 'Not Found: User account not found' });
      }
      
      // Create the subscription
      console.log(`Creating Razorpay subscription for plan ${planId} with currency ${currency}`);
      
      const paymentData = await paymentGateway.createSubscription(
        planId,
        userId,
        {
          planName: plan[0].name,
          billingCycle: plan[0].billingCycle,
          currency: currency,
          amount: amount,
          isUpgrade: isUpgrade,
          startImmediately: true,
          startDate: new Date()
        }
      ).catch((razorpayError) => {
        console.error('Error in Razorpay subscription creation:', razorpayError);
        const errorMessage = razorpayError instanceof Error 
          ? razorpayError.message 
          : 'Unknown Razorpay error';
        
        throw new Error(`Razorpay error: ${errorMessage}`);
      });
      
      console.log(`Razorpay subscription created - Subscription ID: ${paymentData.subscriptionId}`);
      
      // Validate subscription ID format before sending to client
      if (!paymentData.subscriptionId || typeof paymentData.subscriptionId !== 'string' || !paymentData.subscriptionId.startsWith('sub_')) {
        console.error(`Invalid subscription ID format received from Razorpay: "${paymentData.subscriptionId}"`);
        return res.status(500).json({
          message: 'Failed to create a valid subscription with payment gateway',
          error: 'Invalid subscription ID format'
        });
      }
      
      // Build comprehensive response for client
      const responsePayload = {
        ...paymentData,
        planName: plan[0].name,
        billingCycle: plan[0].billingCycle,
        currency: currency,
        gateway: 'RAZORPAY',
        short_url: null,
        isUpgrade: isUpgrade
      };
      
      // Add proration details for upgrades
      if (isUpgrade && prorationDetails) {
        const prorationInfo = {
          originalPlanPrice: prorationDetails.originalPlanPrice,
          newPlanPrice: prorationDetails.newPlanPrice,
          remainingValue: prorationDetails.remainingValue,
          prorationAmount: prorationDetails.prorationAmount,
          prorationCredit: prorationDetails.prorationCredit,
          isUpgrade: prorationDetails.isUpgrade
        };
        
        Object.assign(responsePayload, { 
          prorationInfo,
          // Include the full plan price for reference (in currency units, not smallest units)
          fullPlanPrice: parseFloat(pricing[0].price)
        });
      }
      
      // For debugging
      console.log('[Intent] Response to client:', JSON.stringify(responsePayload, null, 2));
      
      res.json(responsePayload);
    } catch (error: any) {
      console.error('Error creating payment/subscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      res.status(500).json({ 
        message: 'Failed to process payment request', 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Verify a payment with gateway
  app.post('/api/payments/verify', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: No user session found' });
      }
      
      const userId = req.user.id;
      const { paymentId, planId, signature, subscriptionId, isUpgrade } = req.body;
      
      console.log('Payment verification request body:', JSON.stringify({
        userId,
        paymentId,
        planId,
        subscriptionId,
        isUpgrade: isUpgrade || false,
        signatureLength: signature?.length
      }, null, 2));
      
      if (!paymentId || !signature) {
        return res.status(400).json({ message: 'Payment ID and signature are required for verification' });
      }
      
      console.log(`Verifying payment - User: ${userId}, Payment: ${paymentId}, Plan: ${planId || 'N/A'}, Upgrade: ${isUpgrade ? 'Yes' : 'No'}`);
      
      // Log subscription ID if present
      if (subscriptionId) {
        console.log(`Verifying with subscription ID: ${subscriptionId}`);
        // Validate subscription ID format
        if (!subscriptionId.startsWith('sub_')) {
          console.error(`Invalid subscription ID format: ${subscriptionId}`);
          return res.status(400).json({ 
            message: 'Invalid subscription ID format',
            error: 'Subscription ID must start with "sub_"'
           });
        }
      } else {
        console.log('Verifying payment without subscription ID');
      }
      
      // Get the Razorpay key_secret from the gateway config
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
        return res.status(500).json({ message: 'No active Razorpay gateway config found' });
      }
      
      const decryptedKey = decryptApiKey(gatewayConfig[0].key);
      const keySecret = decryptedKey.split(':')[1];
      if (!keySecret) {
        return res.status(500).json({ message: 'Invalid Razorpay key format' });
      }
      
      // Create signature according to Razorpay's documentation for subscription payments
      // hmac_sha256(razorpay_payment_id + "|" + subscription_id, secret);
      const dataToSign = `${paymentId}|${subscriptionId}`;
      console.log(`Creating HMAC signature with: "${dataToSign}"`);
      
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(dataToSign)
        .digest('hex');
        
      console.log(`Generated signature (length ${generatedSignature.length}): ${generatedSignature}`);
      console.log(`Received signature (length ${signature.length}): ${signature}`);
      
      if (generatedSignature !== signature) {
        console.error('Signature verification failed! Generated vs Received:');
        console.error(`Generated: ${generatedSignature}`);
        console.error(`Received:  ${signature}`);
        return res.status(400).json({ message: 'Invalid payment signature' });
      }
      
      console.log(`Payment signature verified successfully - User: ${userId}, Payment: ${paymentId}`);
      
      // For Razorpay subscriptions, we need to extract plan ID from the subscription
      let actualPlanId = planId;
      
      if (subscriptionId && !actualPlanId) {
        try {
          // Get the subscription details from Razorpay to find plan
          const paymentGateway = getPaymentGatewayByName('razorpay');
          console.log(`Fetching subscription details for ID: ${subscriptionId}`);
          const subscriptionDetails = await paymentGateway.getSubscriptionDetails(subscriptionId);
          
          if (subscriptionDetails && subscriptionDetails.plan_id) {
            console.log(`Found Razorpay plan ID: ${subscriptionDetails.plan_id}`);
            
            // Look up the mapping from Razorpay plan ID to our internal plan ID
            const razorpayPlanId = subscriptionDetails.plan_id;
            
            // Find internal plan ID from the mappings
            // First get the gateway config with mappings
            const mappings = ((gatewayConfig[0].configOptions || {}) as any).plan_mappings || {};
            
            // Loop through mappings to find the right one (internal_plan_id_currency -> razorpay_plan_id)
            for (const [key, value] of Object.entries(mappings)) {
              if (value === razorpayPlanId) {
                // Key format is "internalPlanId_currency"
                const parts = key.split('_');
                if (parts.length >= 1) {
                  actualPlanId = parseInt(parts[0]);
                  break;
                }
              }
            }
            
            if (!actualPlanId) {
              console.warn(`Could not find internal plan ID for Razorpay plan: ${razorpayPlanId}`);
            } else {
              console.log(`Found internal plan ID: ${actualPlanId}`);
            }
          }
        } catch (lookupError) {
          console.error('Error getting plan details from subscription:', lookupError);
          // Continue with actualPlanId = planId
        }
      }
      
      if (!actualPlanId) {
        return res.status(400).json({ message: 'Plan ID is required and could not be determined from subscription' });
      }
      
      // Get user's billing details to check for region and expected currency
      const userBillingInfo = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      const userCountry = userBillingInfo.length > 0 ? userBillingInfo[0].country : 'US';
      const expectedRegion = userCountry === 'IN' ? 'INDIA' : 'GLOBAL';
      const expectedCurrency = userCountry === 'IN' ? 'INR' : 'USD';
      
      console.log(`User ${userId} region: ${expectedRegion}, expected currency: ${expectedCurrency}`);
      
      // Verify that the payment was made in the correct currency by checking with Razorpay
      let paymentCurrency = '';
      let hasCurrencyMismatch = false;
      try {
        // Get payment details from Razorpay
        const razorpayGateway = getPaymentGatewayByName('RAZORPAY') as any;
        const paymentDetails = await razorpayGateway.razorpay.payments.fetch(paymentId);
        
        if (paymentDetails) {
          paymentCurrency = paymentDetails.currency;
          console.log(`Payment details from Razorpay:`, {
            id: paymentDetails.id,
            amount: paymentDetails.amount / 100,
            currency: paymentDetails.currency,
            status: paymentDetails.status
          });
          
          // Check for currency mismatch
          if (paymentCurrency !== expectedCurrency) {
            console.error(`CURRENCY MISMATCH DETECTED! User charged in ${paymentCurrency}, but should be ${expectedCurrency}`);
            hasCurrencyMismatch = true;
          }
        }
      } catch (paymentFetchError) {
        console.error('Error fetching payment details from Razorpay:', paymentFetchError);
        // Continue even if we can't get payment details
      }
      
      // Create/update subscription record in the database
      try {
        let result;
        
        if (isUpgrade) {
          console.log(`Upgrading user ${userId} to plan ${actualPlanId} with payment ${paymentId}`);
          result = await SubscriptionService.upgradeToPaidPlan(
            userId,
            actualPlanId,
            paymentId,
            'RAZORPAY',
            signature,
            subscriptionId,
            { isUpgrade: true }
          );
        } else {
          console.log(`Creating new subscription for user ${userId} to plan ${actualPlanId} with payment ${paymentId}`);
          result = await SubscriptionService.upgradeToPaidPlan(
            userId,
            actualPlanId,
            paymentId,
            'RAZORPAY',
            signature,
            subscriptionId
          );
        }
        
        console.log(`Subscription created/updated: ${result.subscription.id}`);
        
        // Record the transaction
        console.log(`Recording payment transaction for user: ${userId}, payment: ${paymentId}, planId: ${planId}`);
        
        // Get plan pricing for the correct region
        const planPricingData = await db.select()
          .from(planPricing)
          .where(
            and(
              eq(planPricing.planId, planId),
              eq(planPricing.targetRegion, expectedRegion as any)
            )
          )
          .limit(1);
        
        // Fall back to global pricing if regional pricing not found
        let correctPlanPrice = '0.00';
        let correctPlanCurrency = 'USD';
        
        if (planPricingData.length > 0) {
          correctPlanPrice = planPricingData[0].price;
          correctPlanCurrency = planPricingData[0].currency;
        } else {
          const globalPricing = await db.select()
            .from(planPricing)
            .where(
              and(
                eq(planPricing.planId, planId),
                eq(planPricing.targetRegion, 'GLOBAL')
              )
            )
            .limit(1);
            
          if (globalPricing.length) {
            console.log(`No pricing found for region ${expectedRegion}, using GLOBAL pricing instead`);
            correctPlanPrice = globalPricing[0].price;
            correctPlanCurrency = globalPricing[0].currency;
          }
        }
        
        // Get payment details from Razorpay to get the correct amount
        const razorpayGateway = getPaymentGatewayByName('RAZORPAY') as any;
        let paymentDetails;
        
        try {
          paymentDetails = await razorpayGateway.razorpay.payments.fetch(paymentId);
          console.log(`Retrieved payment details from Razorpay:`, {
            id: paymentDetails.id,
            amount: paymentDetails.amount,
            currency: paymentDetails.currency
          });
        } catch (fetchError) {
          console.error('Error fetching payment details from Razorpay:', fetchError);
          // Continue with default values if we can't fetch
        }
        
        // Determine transaction amount and currency information
        const amount = paymentDetails ? paymentDetails.amount / 100 : 0;
        
        // Get the currency from payment details, but prioritize the currency from subscription metadata if available
        // This ensures we record the transaction with the currency that was intended and shown to the user
        let currency = paymentDetails ? paymentDetails.currency : 'USD';
        
        // Check if the subscription has notes with currency information
        if (subscriptionId) {
          try {
            // Get subscription details to extract the correct currency
            const subscriptionDetails = await razorpayGateway.getSubscriptionDetails(subscriptionId);
            
            // If subscription has notes with currency information, use that instead
            if (subscriptionDetails && subscriptionDetails.notes && subscriptionDetails.notes.currency) {
              const subscriptionCurrency = subscriptionDetails.notes.currency;
              console.log(`Using currency from subscription notes: ${subscriptionCurrency} (payment API reported: ${currency})`);
              currency = subscriptionCurrency;
            }
          } catch (subscriptionFetchError) {
            console.error('Error fetching subscription details for currency check:', subscriptionFetchError);
            // Continue with the currency from payment details
          }
        }
        
        // Determine if there's a currency mismatch
        hasCurrencyMismatch = currency !== expectedCurrency;
        
        // Get the correct plan price in the user's regional currency
        console.log(`For user ${userId}, correct plan pricing: ${correctPlanPrice} ${correctPlanCurrency}`);
        console.log(`Actual payment: ${amount} ${currency}`);
        
        if (hasCurrencyMismatch) {
          console.error(`IMPORTANT: Currency mismatch detected for user ${userId}: Charged ${amount} ${currency} instead of ${correctPlanPrice} ${correctPlanCurrency}`);
        }
        
        const planData = await db.select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, planId))
          .limit(1);
          
        const planName = planData.length > 0 ? planData[0].name : '';
        const planCycle = planData.length > 0 ? planData[0].billingCycle : 'MONTHLY';
        
        const transactionNote = `SUBSCRIPTION_PAYMENT: plan_name: ${planName}, plan_cycle: ${planCycle}, payment_type: subscription, actual_plan_amount: ${correctPlanPrice}, plan_currency: ${correctPlanCurrency}, transaction_currency: ${currency}, expected_currency: ${expectedCurrency}`;
        
        // Record transaction with metadata - only if it doesn't exist already
        // First check if a transaction already exists with this payment ID
        const existingTransaction = await db.select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.gatewayTransactionId, paymentId))
          .execute();
          
        if (existingTransaction.length > 0) {
          console.log(`Transaction for payment ${paymentId} already exists (${existingTransaction.length} records), skipping creation`);
        } else {
          await db.insert(paymentTransactions)
            .values({
              userId: parseInt(userId.toString()),
              subscriptionId: result.subscription.id,
              amount: amount.toString(),
              currency: currency,
              gateway: 'RAZORPAY',
              gatewayTransactionId: paymentId,
              status: 'COMPLETED',
              refundReason: transactionNote,
              metadata: {
                // Store rich metadata for better admin UI display
                planDetails: {
                  id: planId,
                  name: result.subscription.planName || 'Unknown Plan',
                  cycle: planData.length > 0 ? planData[0].billingCycle : 'MONTHLY'
                },
                paymentDetails: {
                  expectedCurrency: expectedCurrency,
                  actualCurrency: currency,
                  hasCurrencyMismatch: hasCurrencyMismatch,
                  correctPlanPrice: correctPlanPrice,
                  correctPlanCurrency: correctPlanCurrency
                },
                userRegion: expectedRegion,
                userCountry: userCountry,
                isUpgrade: isUpgrade === true
              }
            })
            .onConflictDoNothing(); // Extra safeguard against duplicates
            
          console.log(`Payment transaction recorded with metadata to handle currency display issues.`);
        }
        
        // If there's a currency mismatch, inform user but don't fail the transaction
        // The system can handle the mismatch with proper display in admin panel
        
        // If currency mismatch detected, try to fix the plan mappings for future subscriptions
        if (hasCurrencyMismatch && expectedCurrency) {
          try {
            console.log(`Attempting to fix plan mappings due to currency mismatch for user ${userId}, plan ${planId}`);
            const razorpayGateway = getPaymentGatewayByName('RAZORPAY') as any;
            
            // This will create a new plan with the correct currency and update mappings
            // Cast expectedCurrency to the correct type 'USD' | 'INR'
            const validCurrency = expectedCurrency === 'INR' ? 'INR' : 'USD';
            const fixResult = await razorpayGateway.fixPlanMappingsForCurrency(userId, planId, validCurrency);
            
            if (fixResult) {
              console.log(`Successfully fixed plan mappings for user ${userId} to use ${expectedCurrency} in the future`);
            } else {
              console.warn(`Failed to fix plan mappings for user ${userId}`);
            }
          } catch (fixError) {
            console.error(`Error fixing plan mappings:`, fixError);
            // Non-critical, continue with the subscription
          }
        }
        
        return res.json({
          success: true,
          message: isUpgrade ? 'Payment verified and subscription upgraded' : 'Payment verified and subscription activated',
          planName: (result.subscription as any).planName || 'Subscription',
          subscriptionId: result.subscription.id,
          transactionId: result.transaction.id,
          isUpgrade: isUpgrade,
          hasCurrencyMismatch: hasCurrencyMismatch,
          // Include warning if currency mismatch was detected
          warningMessage: hasCurrencyMismatch 
            ? `Note: Your payment processed in ${currency} instead of your local currency ${expectedCurrency}. This won't affect your subscription.` 
            : undefined
        });
      } catch (subError) {
        console.error('Error creating/upgrading subscription:', subError);
        return res.status(500).json({
          success: false,
          message: subError instanceof Error ? subError.message : 'Failed to create subscription',
          error: 'Subscription creation failed'
        });
      }
    } catch (error: any) {
      console.error('Error in payment verification:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to verify payment', 
        error: error.message 
      });
    }
  });

  // Cancel subscription
  app.post('/api/payments/cancel-subscription', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      console.log(`Cancelling subscription for user ${userId}`);
      
      // Cancel subscription through service
      const result = await SubscriptionService.cancelSubscription(userId);
      
      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        ...result
      });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to cancel subscription', 
        error: error.message 
      });
    }
  });

  // Get payment gateway public key
  app.get('/api/payments/gateway-key', async (req, res) => {
    try {
      // Always use Razorpay for both regions
      const gateway = 'RAZORPAY';
      
      console.log(`Getting gateway key for Razorpay`);
      
      // Get the appropriate gateway config
      const gatewayConfig = await db.select()
        .from(paymentGatewayConfigs)
        .where(
          and(
            eq(paymentGatewayConfigs.service, gateway),
            eq(paymentGatewayConfigs.isActive, true)
          )
        )
        .orderBy(paymentGatewayConfigs.isDefault) // Default ones first
        .limit(1);
        
      if (!gatewayConfig.length) {
        return res.status(404).json({ 
          message: `No active Razorpay payment gateway found`,
          gateway
        });
      }
      
      // Extract public portion of the key (for Razorpay, it's the key_id before the :)
      let publicKey = '';
      // Make sure to decrypt the key first
      const decryptedKey = decryptApiKey(gatewayConfig[0].key);
      
      // Format: "key_id:key_secret"
      publicKey = decryptedKey.split(':')[0];
      
      // Return the info needed for client
      res.json({
        publicKey,
        gateway,
        isTestMode: gatewayConfig[0].testMode
      });
    } catch (error: any) {
      console.error('Error retrieving payment gateway key:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve payment gateway information', 
        error: error.message 
      });
    }
  });

  // Webhook handler for Razorpay
  app.post('/api/webhooks/razorpay', async (req, res) => {
    try {
      const gateway = getPaymentGatewayByName('razorpay');
      const result = await gateway.processWebhook(req);
      res.json(result);
    } catch (error: any) {
      console.error('Error in Razorpay webhook:', error);
      res.status(500).json({ 
        message: 'Failed to process Razorpay webhook', 
        error: error.message 
      });
    }
  });
  
  // Get user region for pricing
  app.get('/api/user/region', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      let userRegion = 'GLOBAL';
      let currency = 'USD';
      
      // First try to get region from billing details
      const billingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      if (billingDetails.length > 0 && billingDetails[0].country === 'IN') {
        userRegion = 'INDIA';
        currency = 'INR';
        console.log(`Using billing details region for user ${userId}: INDIA`);
      } else {
        // Get the IP address
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
        
        // Try getting from cache
        const cacheKey = `ip-region-${clientIp}`;
        const cachedRegion = await db.select()
          .from(appSettings)
          .where(eq(appSettings.key, cacheKey))
          .limit(1);
        
        if (cachedRegion.length > 0 && cachedRegion[0].value) {
          const regionData = cachedRegion[0].value as any;
          if (regionData.country === 'IN') {
            userRegion = 'INDIA';
            currency = 'INR';
            console.log(`Using cached IP geolocation for user ${userId}: INDIA`);
          }
        }
      }
      
      res.json({ region: userRegion, currency });
    } catch (error: any) {
      console.error('Error determining user region:', error);
      // Default to GLOBAL if we can't determine
      res.json({ region: 'GLOBAL', currency: 'USD' });
    }
  });

  // Public endpoint to get plan pricing for a given planId and user region
  app.get('/api/public/subscription-plans/:planId/pricing', async (req, res) => {
    const planId = parseInt(req.params.planId, 10);
    if (!planId) return res.status(400).json({ message: 'Invalid planId' });

    // Default to GLOBAL/USD
    let userRegion = 'GLOBAL';
    let currency = 'USD';

    // Try to get region from billing details if user is logged in
    let userId = req.user?.id;
    if (userId) {
      const billingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      if (billingDetails.length > 0 && billingDetails[0].country === 'IN') {
        userRegion = 'INDIA';
        currency = 'INR';
      }
    }

    // Optionally: Try to get region from IP (for guests)
    // ... (your IP region logic here, if needed)

    // Get pricing for the region
    let pricing = await db.select()
      .from(planPricing)
      .where(and(
        eq(planPricing.planId, planId),
        eq(planPricing.targetRegion, userRegion as 'INDIA' | 'GLOBAL')
      ))
      .limit(1);

    if (!pricing.length) {
      // Fallback to GLOBAL
      pricing = await db.select()
        .from(planPricing)
        .where(and(
          eq(planPricing.planId, planId),
          eq(planPricing.targetRegion, 'GLOBAL')
        ))
        .limit(1);
      if (!pricing.length) {
        return res.status(404).json({ message: 'No pricing found for this plan' });
      }
    }

    return res.json({
      amount: parseFloat(pricing[0].price),
      currency: pricing[0].currency
    });
  });

  // Add fetchSubscriptionInvoices endpoint
  app.get('/api/admin/subscription-invoices/:subscriptionId', requireUser, requireAdmin, async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      
      if (!subscriptionId) {
        return res.status(400).json({ message: 'Subscription ID is required' });
      }
      
      console.log(`Admin requesting invoices for subscription: ${subscriptionId}`);
      
      // Check if the subscription exists in our database
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.paymentReference, subscriptionId))
        .limit(1);
      
      if (!subscription.length) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      // Fetch invoices from the payment gateway
      const gateway = getPaymentGatewayByName('razorpay');
      const invoices = await gateway.fetchInvoicesForSubscription(subscriptionId);
      
      // Get the transactions associated with this subscription from our database
      const transactions = await db.select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.subscriptionId, subscription[0].id))
        .orderBy(desc(paymentTransactions.createdAt));
      
      // Return combined data
      res.json({
        subscriptionId,
        internalSubscriptionId: subscription[0].id,
        userId: subscription[0].userId,
        invoices: invoices.items || [],
        transactions: transactions,
        invoiceCount: invoices.count || 0,
        transactionCount: transactions.length
      });
    } catch (error: any) {
      console.error(`Error fetching subscription invoices: ${error.message}`, error);
      res.status(500).json({
        message: 'Failed to fetch subscription invoices',
        error: error.message
      });
    }
  });

  // Regular user fetch their own subscription's invoices
  app.get('/api/subscription/invoices/:subscriptionId', requireUser, async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const userId = req.user?.id;
      
      if (!subscriptionId) {
        return res.status(400).json({ message: 'Subscription ID is required' });
      }
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      console.log(`User ${userId} requesting invoices for subscription: ${subscriptionId}`);
      
      // Check if the subscription exists and belongs to the user
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.paymentReference, subscriptionId),
            eq(userSubscriptions.userId, userId)
          )
        )
        .limit(1);
      
      if (!subscription.length) {
        return res.status(404).json({ message: 'Subscription not found or does not belong to you' });
      }
      
      // Fetch invoices from the payment gateway
      const gateway = getPaymentGatewayByName('razorpay');
      const invoices = await gateway.fetchInvoicesForSubscription(subscriptionId);
      
      // Get the transactions associated with this subscription from our database
      const transactions = await db.select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.subscriptionId, subscription[0].id))
        .orderBy(desc(paymentTransactions.createdAt));
      
      // Return combined data
      res.json({
        subscriptionId,
        invoices: invoices.items || [],
        transactions: transactions,
        invoiceCount: invoices.count || 0,
        transactionCount: transactions.length
      });
    } catch (error: any) {
      console.error(`Error fetching subscription invoices: ${error.message}`, error);
      res.status(500).json({
        message: 'Failed to fetch subscription invoices',
        error: error.message
      });
    }
  });
} 