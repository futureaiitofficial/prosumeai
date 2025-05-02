import express from 'express';
import { requireUser } from '../../middleware/auth';
import { db } from '../../config/db';
import { getPaymentGatewayByName, decryptApiKey } from '../../services/payment-gateways';
import { userSubscriptions, subscriptionPlans, paymentTransactions, userBillingDetails, planPricing, paymentGatewayConfigs } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { SubscriptionService } from '../../services/subscription-service';
import { appSettings } from '@shared/schema';
import crypto from 'crypto';

export function registerPaymentRoutes(app: express.Express) {
  // Get user's billing details
  app.get('/api/user/billing-details', requireUser, async (req, res) => {
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
      
      console.log(`Found billing details for user ${userId}`);
      res.json(responseData);
    } catch (error: any) {
      console.error('Error in GET /api/user/billing-details:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve billing details', 
        error: error.message 
      });
    }
  });

  // Create or update user's billing details
  app.post('/api/user/billing-details', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      console.log(`Creating/updating billing details for user ${userId}`, req.body);
      
      // Extract data from request body, making country field uppercase for consistency
      // Map client property (fullName) to database column (full_name)
      const billingData: any = { 
        ...req.body, 
        userId,
        country: req.body.country?.toUpperCase() || 'US',
        full_name: req.body.fullName || req.body.full_name || '' 
      };
      
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
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: 'Bad Request: Plan ID is required for payment intent' });
      }
      
      console.log(`Creating payment intent - User: ${userId}, Plan ID: ${planId}`);
      
      // Get the plan details
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
      if (!plan.length) {
        return res.status(404).json({ message: 'Not Found: Subscription plan with the specified ID does not exist' });
      }
      
      console.log(`Found plan: ${plan[0].name}`);
      
      // Get user's region
      let userRegion = 'GLOBAL';
      let currency = 'USD';
      
      // First try to get region from billing details
      const billingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      if (billingDetails.length) {
        if (billingDetails[0].country === 'IN') {
          userRegion = 'INDIA';
          currency = 'INR';
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
      
      let amount = 0;
      
      if (!pricing.length) {
        console.log(`No specific pricing found for region ${userRegion}, falling back to GLOBAL`);
        const globalPricing = await db.select()
          .from(planPricing)
          .where(and(
            eq(planPricing.planId, planId),
            eq(planPricing.targetRegion, 'GLOBAL')
          ))
          .limit(1);
        
        if (!globalPricing.length) {
          return res.status(404).json({ message: 'No pricing information found for this plan' });
        }
        
        amount = parseFloat(globalPricing[0].price);
        currency = globalPricing[0].currency;
        console.log(`[Intent] Using GLOBAL pricing: amount=${amount}, currency=${currency}`);
      } else {
        amount = parseFloat(pricing[0].price);
        currency = pricing[0].currency;
        console.log(`[Intent] Using region pricing: region=${userRegion}, amount=${amount}, currency=${currency}`);
      }
      
      console.log(`[Intent] Final values: planId=${planId}, userRegion=${userRegion}, amount=${amount}, currency=${currency}`);
      
      // Create subscription using Razorpay
      console.log(`Creating Razorpay subscription for plan ${planId} with currency ${currency}`);
      const paymentGateway = getPaymentGatewayByName('razorpay');
      const paymentData = await paymentGateway.createSubscription(
        planId,
        userId,
        {
          planName: plan[0].name,
          billingCycle: plan[0].billingCycle,
          currency: currency,
          amount: amount // Pass the original amount without multiplication
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
      
      // Return the payment intent information - with necessary fields for authorized subscriptions
      const responsePayload = {
        ...paymentData,
        planName: plan[0].name,
        amount: paymentData.amount, // Use the amount directly from payment data
        currency: currency,
        gateway: 'RAZORPAY',
        short_url: null, // No short URL for direct subscription integration
        billingCycle: plan[0].billingCycle // Add billing cycle for UI display
      };
      
      console.log('[Intent] Response to client:', responsePayload);
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
      const { paymentId, planId, signature, subscriptionId } = req.body;
      
      console.log('Payment verification request body:', JSON.stringify({
        userId,
        paymentId,
        planId,
        subscriptionId,
        signatureLength: signature?.length
      }, null, 2));
      
      if (!paymentId || !signature) {
        return res.status(400).json({ message: 'Payment ID and signature are required for verification' });
      }
      
      console.log(`Verifying payment - User: ${userId}, Payment: ${paymentId}, Plan: ${planId || 'N/A'}`);
      
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
      
      // Create/update subscription record in the database
      try {
        console.log(`Upgrading user ${userId} to plan ${actualPlanId} with payment ${paymentId}`);
        const result = await SubscriptionService.upgradeToPaidPlan(
          userId,
          actualPlanId,
          paymentId,
          'RAZORPAY',
          signature,
          subscriptionId
        );
        
        console.log(`Subscription created/updated: ${result.subscription.id}`);
        
        return res.json({
          success: true,
          message: 'Payment verified and subscription activated',
          planName: (result.subscription as any).planName || 'Subscription',
          subscriptionId: result.subscription.id,
          transactionId: result.transaction.id
        });
      } catch (subError) {
        console.error('Error creating subscription:', subError);
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
} 