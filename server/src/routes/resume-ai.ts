import express from 'express';
import { requireUser } from '../../middleware/auth';
import { requireFeatureAccess, trackFeatureUsage } from '../../middleware/feature-access';
import { analyzeJobDescription } from './ai';

// Create the router
const router = express.Router();

// Route to extract skills from job description
router.post('/extract-skills', 
  requireUser,
  requireFeatureAccess('ai_generation'),
  trackFeatureUsage('ai_generation'),
  async (req, res) => {
    try {
      const { jobTitle, jobDescription } = req.body;
      
      if (!jobDescription) {
        return res.status(400).json({ 
          message: 'Job description is required',
          error: 'MISSING_JOB_DESCRIPTION'
        });
      }
      
      try {
        // Use the analyzeJobDescription function to get categorized skills
        const analyzedData = await analyzeJobDescription(jobDescription);
        
        // Return just the technical and soft skills for the resume
        return res.json({
          technicalSkills: analyzedData.technicalSkills || [],
          softSkills: analyzedData.softSkills || [],
          // Also include other useful categories in case the client wants them
          tools: analyzedData.tools || [],
          industryTerms: analyzedData.industryTerms || [],
          certifications: analyzedData.certifications || []
        });
      } catch (error: any) {
        console.error('Error extracting skills:', error);
        
        return res.status(500).json({ 
          message: 'Failed to extract skills. Please try again.',
          error: 'EXTRACTION_ERROR'
        });
      }
    } catch (error: any) {
      console.error('Error in extract-skills route:', error);
      return res.status(500).json({ 
        message: 'Internal server error processing your request',
        error: 'SERVER_ERROR'
      });
    }
});

export default router; 