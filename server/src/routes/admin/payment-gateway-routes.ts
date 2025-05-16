import express from 'express';
import { requireAdmin } from '../../../middleware/auth';
import { db } from '../../../config/db';
import { paymentGatewayConfigs } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import Stripe from 'stripe';
import Razorpay from 'razorpay';

export function registerPaymentGatewayAdminRoutes(app: express.Express) {
  // Get all payment gateway API keys (masked)
  app.get('/api/admin/payment-gateways', requireAdmin, async (req, res) => {
    try {
      const keys = await db.select().from(paymentGatewayConfigs)
        .where(
          eq(paymentGatewayConfigs.isActive, true)
        );
      
      // Mask key values for security
      const maskedKeys = keys.map(key => ({
        ...key,
        key: maskApiKey(key.key)
      }));
      
      res.json(maskedKeys);
    } catch (error: any) {
      console.error('Error in GET /api/admin/payment-gateways:', error);
      res.status(500).json({ 
        message: 'Failed to fetch payment gateway keys', 
        error: error.message 
      });
    }
  });

  // Create or update a payment gateway API key
  app.post('/api/admin/payment-gateways', requireAdmin, async (req, res) => {
    try {
      const { name, service, key, isActive, isDefault = false, testMode = false } = req.body;
      
      // Validate input
      if (!name || !service || !key) {
        return res.status(400).json({ message: 'Name, service, and key are required' });
      }
      
      // Check if service is valid - only razorpay is supported per schema
      if (service.toLowerCase() !== 'razorpay') {
        return res.status(400).json({ message: 'Service must be "razorpay" as it\'s the only supported gateway' });
      }
      
      // Normalize the service name to match enum
      const gatewayService = 'RAZORPAY' as const; 
      
      // If this key will be default, unset other defaults for this service
      if (isDefault) {
        await db.update(paymentGatewayConfigs)
          .set({ isDefault: false })
          .where(
            and(
              eq(paymentGatewayConfigs.service, gatewayService),
              eq(paymentGatewayConfigs.isDefault, true)
            )
          );
      }
      
      // Check if a key already exists for this service with the same name
      const existingKey = await db.select().from(paymentGatewayConfigs)
        .where(
          and(
            eq(paymentGatewayConfigs.service, gatewayService),
            eq(paymentGatewayConfigs.name, name)
          )
        )
        .limit(1);
      
      // Encrypt the key value for storage
      const encryptedKey = encryptApiKey(key);
      
      let result;
      if (existingKey.length > 0) {
        // Update existing key
        result = await db.update(paymentGatewayConfigs)
          .set({
            key: encryptedKey,
            isActive: isActive !== undefined ? isActive : true,
            isDefault: isDefault !== undefined ? isDefault : false,
            testMode: testMode !== undefined ? testMode : false,
            updatedAt: new Date()
          })
          .where(eq(paymentGatewayConfigs.id, existingKey[0].id))
          .returning();
      } else {
        // Create new key
        result = await db.insert(paymentGatewayConfigs)
          .values({
            name,
            service: gatewayService,
            key: encryptedKey,
            isActive: isActive !== undefined ? isActive : true,
            isDefault: isDefault !== undefined ? isDefault : false,
            testMode: testMode !== undefined ? testMode : false,
            configOptions: {}
          })
          .returning();
      }
      
      // Mask key in response
      const responseData = {
        ...result[0],
        key: maskApiKey(result[0].key)
      };
      
      res.status(existingKey.length > 0 ? 200 : 201).json(responseData);
    } catch (error: any) {
      console.error('Error in POST /api/admin/payment-gateways:', error);
      res.status(500).json({ 
        message: 'Failed to save payment gateway key', 
        error: error.message 
      });
    }
  });

  // Delete a payment gateway API key
  app.delete('/api/admin/payment-gateways/:id', requireAdmin, async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      if (isNaN(keyId)) {
        return res.status(400).json({ message: 'Invalid key ID' });
      }
      
      await db.delete(paymentGatewayConfigs).where(eq(paymentGatewayConfigs.id, keyId));
      
      res.json({ message: 'Payment gateway key deleted successfully' });
    } catch (error: any) {
      console.error(`Error in DELETE /api/admin/payment-gateways/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to delete payment gateway key', 
        error: error.message 
      });
    }
  });

  // Toggle active status of a payment gateway API key
  app.patch('/api/admin/payment-gateways/:id/toggle', requireAdmin, async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      if (isNaN(keyId)) {
        return res.status(400).json({ message: 'Invalid key ID' });
      }
      
      const key = await db.select().from(paymentGatewayConfigs).where(eq(paymentGatewayConfigs.id, keyId)).limit(1);
      if (!key.length) {
        return res.status(404).json({ message: 'API key not found' });
      }
      
      const result = await db.update(paymentGatewayConfigs)
        .set({
          isActive: !key[0].isActive,
          updatedAt: new Date()
        })
        .where(eq(paymentGatewayConfigs.id, keyId))
        .returning();
      
      // Mask key in response
      const responseData = {
        ...result[0],
        key: maskApiKey(result[0].key)
      };
      
      res.json(responseData);
    } catch (error: any) {
      console.error(`Error in PATCH /api/admin/payment-gateways/${req.params.id}/toggle:`, error);
      res.status(500).json({ 
        message: 'Failed to toggle payment gateway key', 
        error: error.message 
      });
    }
  });

  // Verify a payment gateway API key (test connection)
  app.post('/api/admin/payment-gateways/verify', requireAdmin, async (req, res) => {
    try {
      const { service, key } = req.body;
      
      if (!service || !key) {
        return res.status(400).json({ message: 'Service and key are required' });
      }
      
      // Check if service is valid - only razorpay is supported
      if (service.toLowerCase() !== 'razorpay') {
        return res.status(400).json({ message: 'Service must be "razorpay" as it\'s the only supported gateway' });
      }
      
      let isValid = false;
      let error = null;
      
      try {
        // Implement verification logic for razorpay only
        if (service.toLowerCase() === 'razorpay') {
          if (!key.includes(':')) {
            error = 'Invalid Razorpay key format. Expected format: key_id:key_secret';
          } else {
            const [keyId, keySecret] = key.split(':');
            if (!keyId.startsWith('rzp_')) {
              error = 'Invalid Razorpay key_id format. Should start with "rzp_"';
            } else if (keySecret.length < 8) {
              error = 'Razorpay key_secret seems too short';
            } else {
              try {
                // Initialize Razorpay with the key to test
                const razorpay = new Razorpay({
                  key_id: keyId,
                  key_secret: keySecret
                });
                
                // Try a simple API call to verify the key
                // Razorpay doesn't have a lightweight call like customers.list,
                // so we'll use a simple ping method or simulate one
                if (typeof razorpay.customers !== 'undefined') {
                  await razorpay.customers.all({ count: 1 });
                } else {
                  // Fallback if the method doesn't exist or types are incorrect
                  await (razorpay as any).orders.all({ count: 1 });
                }
                
                isValid = true;
              } catch (razorpayError: any) {
                error = razorpayError.message;
              }
            }
          }
        }
      } catch (verifyError: any) {
        error = verifyError.message;
      }
      
      res.json({ 
        isValid, 
        service,
        error 
      });
    } catch (error: any) {
      console.error('Error in POST /api/admin/payment-gateways/verify:', error);
      res.status(500).json({ 
        message: 'Failed to verify payment gateway key', 
        error: error.message 
      });
    }
  });

  // Set plan mappings for a payment gateway
  app.post('/api/admin/payment-gateways/plan-mappings', requireAdmin, async (req, res) => {
    try {
      const { service, mappings } = req.body;
      
      if (!service || !mappings) {
        return res.status(400).json({ 
          message: 'Service and mappings are required fields' 
        });
      }
      
      // Validate service - only razorpay supported
      if (service.toLowerCase() !== 'razorpay') {
        return res.status(400).json({ 
          message: 'Service must be "razorpay" as it\'s the only supported gateway' 
        });
      }
      
      // Normalize service name
      const gatewayService = 'RAZORPAY' as const;
      
      // Get the active config for this service
      const gatewayConfig = await db.select()
        .from(paymentGatewayConfigs)
        .where(
          and(
            eq(paymentGatewayConfigs.service, gatewayService),
            eq(paymentGatewayConfigs.isActive, true)
          )
        )
        .orderBy(paymentGatewayConfigs.isDefault) // Default ones first
        .limit(1);
      
      if (!gatewayConfig.length) {
        return res.status(404).json({ 
          message: `No active ${service} payment gateway found` 
        });
      }
      
      // Ensure the mappings are in the correct format
      const normalizedMappings: Record<string, any> = {};
      
      // Process each mapping, ensuring it's in the right format
      for (const [planId, value] of Object.entries(mappings)) {
        if (typeof value === 'string') {
          // Legacy format - convert to new format
          normalizedMappings[planId] = { INR: value };
        } else if (typeof value === 'object' && value !== null) {
          // New format - validate that values are strings
          const currencyMappings: Record<string, string> = {};
          
          for (const [currency, planId] of Object.entries(value)) {
            if (typeof planId === 'string') {
              currencyMappings[currency] = planId;
            }
          }
          
          normalizedMappings[planId] = currencyMappings;
        }
      }
      
      // Extract the current configOptions
      const currentOptions = gatewayConfig[0].configOptions || {};
      
      // Update the configOptions with new mappings
      const updatedOptions = {
        ...currentOptions,
        plan_mappings: normalizedMappings
      };
      
      // Save to the database
      await db.update(paymentGatewayConfigs)
        .set({ 
          configOptions: updatedOptions,
          updatedAt: new Date()
        })
        .where(eq(paymentGatewayConfigs.id, gatewayConfig[0].id));
      
      res.json({
        message: 'Plan mappings updated successfully',
        service: gatewayService,
        mappings: normalizedMappings
      });
    } catch (error: any) {
      console.error('Error setting plan mappings:', error);
      res.status(500).json({ 
        message: 'Failed to set plan mappings', 
        error: error.message 
      });
    }
  });

  // Create a Razorpay plan directly through the API
  app.post('/api/admin/payment-gateways/create-razorpay-plan', requireAdmin, async (req, res) => {
    try {
      const { internalPlanId, name, description, amount, currency, period, interval } = req.body;
      
      if (!internalPlanId || !name || !amount || !currency || !period) {
        return res.status(400).json({ 
          message: 'Missing required fields for plan creation' 
        });
      }
      
      // Get active Razorpay configuration
      const gatewayConfig = await db.select()
        .from(paymentGatewayConfigs)
        .where(
          and(
            eq(paymentGatewayConfigs.service, 'RAZORPAY'),
            eq(paymentGatewayConfigs.isActive, true)
          )
        )
        .orderBy(paymentGatewayConfigs.isDefault) // Default ones first
        .limit(1);
      
      if (!gatewayConfig.length) {
        return res.status(404).json({ 
          message: 'No active Razorpay payment gateway found' 
        });
      }
      
      // Decrypt the API key
      const decryptedKey = decryptApiKey(gatewayConfig[0].key);
      const [keyId, keySecret] = decryptedKey.split(':');
      
      if (!keyId || !keySecret) {
        return res.status(400).json({ 
          message: 'Invalid Razorpay API key format' 
        });
      }
      
      // Initialize Razorpay with the API key
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      
      // Create the plan in Razorpay
      const razorpayPlan = await razorpay.plans.create({
        period: period.toLowerCase(), // 'monthly' or 'yearly'
        interval: interval || 1,
        item: {
          name,
          amount,
          currency,
          description: description || `${name} subscription plan`
        },
        notes: {
          internal_plan_id: internalPlanId.toString()
        }
      });
      
      // Update the plan mappings
      const currentOptions = gatewayConfig[0].configOptions || {};
      const planMappings = ((currentOptions as any).plan_mappings || {}) as Record<string, string>;
      
      planMappings[internalPlanId] = razorpayPlan.id;
      
      const updatedOptions = {
        ...currentOptions,
        plan_mappings: planMappings
      };
      
      // Save the updated mappings
      await db.update(paymentGatewayConfigs)
        .set({ 
          configOptions: updatedOptions,
          updatedAt: new Date()
        })
        .where(eq(paymentGatewayConfigs.id, gatewayConfig[0].id));
      
      res.json({
        message: 'Razorpay plan created successfully',
        id: razorpayPlan.id,
        name: razorpayPlan.item.name,
        period: razorpayPlan.period,
        amount: razorpayPlan.item.amount,
        currency: razorpayPlan.item.currency
      });
    } catch (error: any) {
      console.error('Error creating Razorpay plan:', error);
      res.status(500).json({ 
        message: 'Failed to create Razorpay plan', 
        error: error.message 
      });
    }
  });

  // New endpoint to create a plan with specific currency in Razorpay
  app.post('/api/admin/payment-gateways/create-plan', requireAdmin, async (req, res) => {
    try {
      const { gatewayId, planId, currency, amount, interval, name, description } = req.body;
      
      if (!gatewayId || !planId || !currency || !amount || !interval || !name) {
        return res.status(400).json({ 
          message: 'Missing required fields for plan creation',
          success: false
        });
      }
      
      // Get the gateway config by ID
      const gatewayConfig = await db.select()
        .from(paymentGatewayConfigs)
        .where(eq(paymentGatewayConfigs.id, gatewayId))
        .limit(1);
      
      if (!gatewayConfig.length) {
        return res.status(404).json({ 
          message: 'Payment gateway not found',
          success: false
        });
      }
      
      // Check if the gateway is Razorpay
      if (gatewayConfig[0].service !== 'RAZORPAY') {
        return res.status(400).json({ 
          message: 'This endpoint only supports Razorpay gateways',
          success: false
        });
      }
      
      // Decrypt the API key
      const decryptedKey = decryptApiKey(gatewayConfig[0].key);
      const [keyId, keySecret] = decryptedKey.split(':');
      
      if (!keyId || !keySecret) {
        return res.status(400).json({ 
          message: 'Invalid Razorpay API key format',
          success: false
        });
      }
      
      // Initialize Razorpay with the API key
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      
      // Create the plan in Razorpay
      const razorpayPlan = await razorpay.plans.create({
        period: interval.toLowerCase(), // 'monthly' or 'yearly'
        interval: 1,
        item: {
          name,
          amount,
          currency,
          description: description || `${name} subscription plan`
        },
        notes: {
          internal_plan_id: planId.toString(),
          currency: currency
        }
      });
      
      // Update the plan mappings
      const currentOptions = gatewayConfig[0].configOptions || {};
      let planMappings = ((currentOptions as any).plan_mappings || {}) as Record<string, any>;
      
      // Create nested structure to support multiple currencies per plan
      if (!planMappings[planId]) {
        planMappings[planId] = {};
      }
      
      // Store the plan ID mapped by currency
      planMappings[planId][currency] = razorpayPlan.id;
      
      const updatedOptions = {
        ...currentOptions,
        plan_mappings: planMappings
      };
      
      // Save the updated mappings
      await db.update(paymentGatewayConfigs)
        .set({ 
          configOptions: updatedOptions,
          updatedAt: new Date()
        })
        .where(eq(paymentGatewayConfigs.id, gatewayConfig[0].id));
      
      res.json({
        success: true,
        message: 'Razorpay plan created successfully',
        planId: razorpayPlan.id,
        name: razorpayPlan.item.name,
        period: razorpayPlan.period,
        amount: razorpayPlan.item.amount,
        currency: razorpayPlan.item.currency
      });
    } catch (error: any) {
      console.error('Error creating plan:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create plan', 
        error: error.message 
      });
    }
  });

  // Get plan mappings for a payment gateway
  app.get('/api/admin/payment-gateways/plan-mappings', requireAdmin, async (req, res) => {
    try {
      const { service } = req.query;
      
      if (!service || typeof service !== 'string') {
        return res.status(400).json({ 
          message: 'Service parameter is required' 
        });
      }
      
      // Validate service - only razorpay supported
      if (service.toLowerCase() !== 'razorpay') {
        return res.status(400).json({ 
          message: 'Service must be "razorpay" as it\'s the only supported gateway' 
        });
      }
      
      // Normalize service name
      const gatewayService = 'RAZORPAY' as const;
      
      // Get the active config for this service
      const gatewayConfig = await db.select()
        .from(paymentGatewayConfigs)
        .where(
          and(
            eq(paymentGatewayConfigs.service, gatewayService),
            eq(paymentGatewayConfigs.isActive, true)
          )
        )
        .orderBy(paymentGatewayConfigs.isDefault) // Default ones first
        .limit(1);
      
      if (!gatewayConfig.length) {
        return res.status(404).json({ 
          message: `No active ${service} payment gateway found` 
        });
      }
      
      // Extract the plan mappings from the config
      const currentOptions = gatewayConfig[0].configOptions || {};
      const planMappings = ((currentOptions as any).plan_mappings || {}) as Record<string, any>;
      
      // Convert any legacy format mappings to new structure
      const formattedMappings: Record<string, any> = {};
      
      for (const [planId, mapping] of Object.entries(planMappings)) {
        // If it's a string, it's a legacy format (direct plan ID)
        if (typeof mapping === 'string') {
          formattedMappings[planId] = { INR: mapping };
        } else {
          // It's already in the new format with currency keys
          formattedMappings[planId] = mapping;
        }
      }
      
      res.json({
        service: gatewayService,
        mappings: formattedMappings
      });
    } catch (error: any) {
      console.error('Error getting plan mappings:', error);
      res.status(500).json({ 
        message: 'Failed to get plan mappings', 
        error: error.message 
      });
    }
  });
}

// Utility functions for key security
function maskApiKey(key: string): string {
  if (!key) return '';
  const firstFour = key.substring(0, 4);
  const lastFour = key.substring(key.length - 4);
  return `${firstFour}...${lastFour}`;
}

// Properly implemented encryption with a secure key
function encryptApiKey(key: string): string {
  const SECRET = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!SECRET) {
    console.warn('Warning: API_KEY_ENCRYPTION_SECRET not set. Using insecure fallback.');
    return key; // Return unencrypted if no secret is available
  }
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET, 'hex'), iv);
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return key; // Fallback in case of error
  }
}

function decryptApiKey(encryptedKey: string): string {
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