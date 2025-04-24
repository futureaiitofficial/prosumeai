import express from 'express';
import { db } from '../../config/db';
import { eq, and, sql, desc } from 'drizzle-orm';
import { features, featureUsage, userSubscriptions, planFeatures } from '@shared/schema';
import { requireUser } from '../../middleware/auth';

/**
 * Register user-related routes
 */
export function registerUserRoutes(app: express.Express) {
  // Get current user profile information
  app.get('/api/user/profile', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      res.json(req.user);
    } catch (error: any) {
      console.error('Error in GET /api/user/profile:', error);
      res.status(500).json({ 
        message: "Failed to fetch user profile", 
        error: error.message 
      });
    }
  });

  // Get user's token usage information
  app.get('/api/user/token-usage/:featureCode?', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const featureCode = req.params.featureCode;
      
      // First, get the user's most recent active subscription
      const activeSubscription = await db
        .select({
          planId: userSubscriptions.planId
        })
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE')
        ))
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);
        
      if (activeSubscription.length === 0) {
        return res.json({ features: [] });
      }
      
      const planId = activeSubscription[0].planId;
      
      // Prepare conditions for the query
      const baseConditions = and(
        eq(featureUsage.userId, userId)
      );
      
      // Add feature code condition if specified
      const conditions = featureCode 
        ? and(baseConditions, eq(features.code, featureCode))
        : baseConditions;
      
      // Execute the query to get all features
      const allFeatures = await db
        .select({
          featureId: features.id,
          featureCode: features.code,
          featureName: features.name,
          tokenLimit: planFeatures.limitValue,
          tokenUsage: featureUsage.aiTokenCount,
          usageCount: featureUsage.usageCount,
          resetFrequency: planFeatures.resetFrequency,
          nextResetDate: featureUsage.resetDate
        })
        .from(features)
        .innerJoin(featureUsage, eq(featureUsage.featureId, features.id))
        .innerJoin(planFeatures, and(
          eq(planFeatures.planId, planId),
          eq(planFeatures.featureId, features.id)
        ))
        .where(conditions);
      
      // Calculate next reset date for features without a reset date
      const featuresWithResetDates = allFeatures.map(feature => {
        // If reset date is not set, calculate it based on reset frequency
        if (!feature.nextResetDate && feature.resetFrequency) {
          const now = new Date();
          let nextReset = new Date(now);
          
          switch (feature.resetFrequency) {
            case 'DAILY':
              nextReset.setDate(now.getDate() + 1);
              nextReset.setHours(0, 0, 0, 0);
              break;
            case 'WEEKLY':
              // Set to next Sunday
              nextReset.setDate(now.getDate() + (7 - now.getDay()));
              nextReset.setHours(0, 0, 0, 0);
              break;
            case 'MONTHLY':
              // Set to first day of next month
              nextReset.setMonth(now.getMonth() + 1, 1);
              nextReset.setHours(0, 0, 0, 0);
              break;
            case 'YEARLY':
              // Set to first day of next year
              nextReset.setFullYear(now.getFullYear() + 1, 0, 1);
              nextReset.setHours(0, 0, 0, 0);
              break;
          }
          
          feature.nextResetDate = nextReset;
        }
        
        return feature;
      });

      // Debug logging
      console.log('Feature usage data:', featuresWithResetDates);
      
      res.json({ 
        features: featuresWithResetDates
      });
    } catch (error: any) {
      console.error('Error fetching token usage:', error);
      res.status(500).json({ 
        message: "Failed to fetch token usage information", 
        error: error.message 
      });
    }
  });
} 