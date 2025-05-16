import express from 'express';
import { requireUser } from '../../middleware/auth';
import { requireFeatureAccess, trackFeatureUsage } from '../../middleware/feature-access';
import { db } from '../../config/db';
import { eq, and, sql } from 'drizzle-orm';
import { features, featureUsage } from '@shared/schema';
import { 
  generateSummary,
  enhanceExperienceBullets,
  extractSkills,
  enhanceProject,
  calculateATSScore,
  generateSkillsForPosition
} from '../utils/ai-resume-utils-new';

// Constants for tokens used per request - these are estimates
const TOKENS_PER_REQUEST = {
  SUMMARY: 1000,
  ENHANCE_EXPERIENCE: 1500,
  EXTRACT_SKILLS: 800,
  ENHANCE_PROJECT: 1000,
  ATS_SCORE: 2000
};

// Function to track token usage, similar to the one in ai.ts
async function trackTokenUsage(userId: number, featureCode: string, tokensUsed: number) {
  try {
    // First, fetch the feature ID for the given feature code
    const featureResult = await db.select({ id: features.id })
      .from(features)
      .where(eq(features.code, featureCode))
      .limit(1);

    // If feature doesn't exist, log an error and return
    if (!featureResult.length) {
      console.error(`Feature with code '${featureCode}' not found for token usage tracking`);
      return null;
    }

    const featureId = featureResult[0].id;
    
    // Check if featureId is valid
    if (!featureId) {
      console.error(`Invalid feature ID for feature code '${featureCode}'`);
      return null;
    }

    // Now insert/update with the correct feature ID
    const existingUsage = await db.select()
      .from(featureUsage)
      .where(and(
        eq(featureUsage.userId, userId),
        eq(featureUsage.featureId, featureId)
      ))
      .limit(1);

    if (existingUsage.length) {
      // Update existing usage record
      return await db.update(featureUsage)
        .set({
          aiTokenCount: sql`${featureUsage.aiTokenCount} + ${tokensUsed}`,
          lastUsed: new Date()
        })
        .where(eq(featureUsage.id, existingUsage[0].id))
        .returning();
    } else {
      // Create new usage record with correct feature ID
      return await db.insert(featureUsage)
        .values({
          userId: userId,
          featureId: featureId,
          aiTokenCount: tokensUsed,
          usageCount: 0,
          lastUsed: new Date(),
          resetDate: new Date()
        })
        .returning();
    }
  } catch (error) {
    console.error('Error tracking token usage:', error);
    return null;
  }
}

/**
 * Register AI resume routes
 */
export function registerAIResumeRoutes(app: express.Express) {
  // Generate professional summary
  app.post('/api/resume-ai/summary', 
    requireUser,
    requireFeatureAccess('ai_generation'),
    trackFeatureUsage('ai_generation'),
    async (req, res) => {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      try {
        const { jobTitle, jobDescription, experience, skills } = req.body;
        
        if (!jobTitle || !jobDescription) {
          return res.status(400).json({ 
            message: "Missing required fields: jobTitle and jobDescription" 
          });
        }
        
        const summary = await generateSummary(
          jobTitle,
          jobDescription,
          experience || [],
          skills || []
        );
        
        // Track token usage for AI-specific metrics
        if (req.isAuthenticated() && req.isAuthenticated() && req.user) {
          await trackTokenUsage(req.user.id, 'ai_generation', TOKENS_PER_REQUEST.SUMMARY);
        }
        
        res.json({ summary });
      } catch (error: any) {
        console.error('Error in resume-ai/summary route:', error);
        res.status(500).json({ 
          message: "Failed to generate summary", 
          error: error.message 
        });
      }
    }
  );
  
  // Enhance experience bullet points
  app.post('/api/resume-ai/enhance-experience', 
    requireUser,
    requireFeatureAccess('ai_generation'),
    trackFeatureUsage('ai_generation'),
    async (req, res) => {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      try {
        const { jobTitle, jobDescription, experienceItem, existingSkills = [], missingKeywords = [] } = req.body;
        
        if (!jobTitle || !jobDescription || !experienceItem) {
          return res.status(400).json({ 
            message: "Missing required fields: jobTitle, jobDescription, and experienceItem" 
          });
        }
        
        // Create context object with additional resume information
        const context = {
          existingSkills,
          missingKeywords,
          optimizationTarget: missingKeywords.length > 0 ? "focus on incorporating missing keywords" : "balance keywords naturally"
        };
        
        const enhancedBullets = await enhanceExperienceBullets(
          jobTitle,
          jobDescription,
          experienceItem,
          context
        );
        
        // Track token usage for AI-specific metrics
        if (req.isAuthenticated() && req.isAuthenticated() && req.user) {
          await trackTokenUsage(req.user.id, 'ai_generation', TOKENS_PER_REQUEST.ENHANCE_EXPERIENCE);
        }
        
        res.json({ enhancedBullets });
      } catch (error: any) {
        console.error('Error in resume-ai/enhance-experience route:', error);
        res.status(500).json({ 
          message: "Failed to enhance experience bullets", 
          error: error.message 
        });
      }
    }
  );
  
  // Extract relevant skills from job description
  app.post('/api/resume-ai/extract-skills',
    requireUser,
    requireFeatureAccess('ai_generation'),
    trackFeatureUsage('ai_generation'),
    async (req, res) => {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      try {
        const { jobTitle, jobDescription } = req.body;
        
        if (!jobTitle || !jobDescription) {
          return res.status(400).json({ 
            message: "Missing required fields: jobTitle and jobDescription" 
          });
        }
        
        const skills = await extractSkills(
          jobTitle,
          jobDescription
        );
        
        // Track token usage for AI-specific metrics
        if (req.isAuthenticated() && req.isAuthenticated() && req.user) {
          await trackTokenUsage(req.user.id, 'ai_generation', TOKENS_PER_REQUEST.EXTRACT_SKILLS);
        }
        
        res.json(skills);
      } catch (error: any) {
        console.error('Error in resume-ai/extract-skills route:', error);
        res.status(500).json({ 
          message: "Failed to extract skills", 
          error: error.message 
        });
      }
    }
  );
  
  // Enhance project description
  app.post('/api/resume-ai/enhance-project',
    requireUser,
    requireFeatureAccess('ai_generation'),
    trackFeatureUsage('ai_generation'),
    async (req, res) => {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      try {
        const { jobTitle, jobDescription, project } = req.body;
        
        if (!jobTitle || !jobDescription || !project) {
          return res.status(400).json({ 
            message: "Missing required fields: jobTitle, jobDescription, and project" 
          });
        }
        
        const enhancedDescription = await enhanceProject(
          jobTitle,
          jobDescription,
          project
        );
        
        // Track token usage for AI-specific metrics
        if (req.isAuthenticated() && req.isAuthenticated() && req.user) {
          await trackTokenUsage(req.user.id, 'ai_generation', TOKENS_PER_REQUEST.ENHANCE_PROJECT);
        }
        
        res.json({ enhancedDescription });
      } catch (error: any) {
        console.error('Error in resume-ai/enhance-project route:', error);
        res.status(500).json({ 
          message: "Failed to enhance project description", 
          error: error.message 
        });
      }
    }
  );
  
  // Calculate ATS score
  app.post('/api/resume-ai/ats-score',
    requireUser,
    requireFeatureAccess('ai_generation'),
    trackFeatureUsage('ai_generation'),
    async (req, res) => {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      try {
        const { resumeData, jobTitle, jobDescription } = req.body;
        
        if (!resumeData) {
          return res.status(400).json({ 
            message: "Missing required field: resumeData" 
          });
        }
        
        const score = await calculateATSScore(
          resumeData,
          jobTitle,
          jobDescription
        );
        
        // Track token usage for AI-specific metrics
        if (req.isAuthenticated() && req.isAuthenticated() && req.user) {
          await trackTokenUsage(req.user.id, 'ai_generation', TOKENS_PER_REQUEST.ATS_SCORE);
        }
        
        res.json(score);
      } catch (error: any) {
        console.error('Error in resume-ai/ats-score route:', error);
        res.status(500).json({ 
          message: "Failed to calculate ATS score", 
          error: error.message 
        });
      }
    }
  );

  // Generate skills based on just the target job position
  app.post('/api/resume-ai/generate-position-skills',
    requireUser,
    requireFeatureAccess('ai_generation'),
    trackFeatureUsage('ai_generation'),
    async (req, res) => {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      try {
        const { jobTitle } = req.body;
        
        if (!jobTitle) {
          return res.status(400).json({ 
            message: "Missing required field: jobTitle" 
          });
        }
        
        // Call AI function to generate skills based on job title
        const skills = await generateSkillsForPosition(jobTitle);
        
        // Track token usage for AI-specific metrics
        if (req.isAuthenticated() && req.user) {
          await trackTokenUsage(req.user.id, 'ai_generation', TOKENS_PER_REQUEST.EXTRACT_SKILLS);
        }
        
        res.json(skills);
      } catch (error: any) {
        console.error('Error in resume-ai/generate-position-skills route:', error);
        res.status(500).json({ 
          message: "Failed to generate skills for position", 
          error: error.message 
        });
      }
    }
  );
}