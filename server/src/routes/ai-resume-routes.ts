import express from 'express';
import { 
  generateSummary,
  enhanceExperiencePoints,
  extractSkills,
  enhanceProject,
  calculateATSScore
} from '../utils/ai-resume-utils-new';

export function registerAIResumeRoutes(app: express.Express) {
  // Generate professional summary
  app.post('/api/resume-ai/summary', async (req, res) => {
    if (!req.isAuthenticated()) {
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
      
      res.json({ summary });
    } catch (error: any) {
      console.error('Error in resume-ai/summary route:', error);
      res.status(500).json({ 
        message: "Failed to generate summary", 
        error: error.message 
      });
    }
  });
  
  // Enhance experience bullet points
  app.post('/api/resume-ai/enhance-experience', async (req, res) => {
    if (!req.isAuthenticated()) {
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
      
      const enhancedBullets = await enhanceExperiencePoints(
        jobTitle,
        jobDescription,
        experienceItem,
        context
      );
      
      res.json({ enhancedBullets });
    } catch (error: any) {
      console.error('Error in resume-ai/enhance-experience route:', error);
      res.status(500).json({ 
        message: "Failed to enhance experience bullets", 
        error: error.message 
      });
    }
  });
  
  // Extract relevant skills from job description
  app.post('/api/resume-ai/extract-skills', async (req, res) => {
    if (!req.isAuthenticated()) {
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
      
      res.json(skills);
    } catch (error: any) {
      console.error('Error in resume-ai/extract-skills route:', error);
      res.status(500).json({ 
        message: "Failed to extract skills", 
        error: error.message 
      });
    }
  });
  
  // Enhance project description
  app.post('/api/resume-ai/enhance-project', async (req, res) => {
    if (!req.isAuthenticated()) {
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
      
      res.json({ enhancedDescription });
    } catch (error: any) {
      console.error('Error in resume-ai/enhance-project route:', error);
      res.status(500).json({ 
        message: "Failed to enhance project description", 
        error: error.message 
      });
    }
  });
  
  // Calculate ATS score
  app.post('/api/resume-ai/ats-score', async (req, res) => {
    if (!req.isAuthenticated()) {
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
      
      res.json(score);
    } catch (error: any) {
      console.error('Error in resume-ai/ats-score route:', error);
      res.status(500).json({ 
        message: "Failed to calculate ATS score", 
        error: error.message 
      });
    }
  });
}