import express from "express";
import { z } from "zod";
import { storage } from "server/config/storage";
import { generateCoverLetter, enhanceCoverLetter, analyzeCoverLetter } from "../utils/ai-cover-letter-utils";
import { requireUser } from "../../middleware/auth";
import { requireFeature, FeatureKey, trackTokenUsage } from "../../middleware/subscription";

// Approximate token count for tracking purposes
const TOKENS_PER_REQUEST = {
  GENERATE: 1500,
  ENHANCE: 1200,
  ANALYZE: 800
};

// Schema for cover letter generation request
const generateCoverLetterSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(1, "Job description is required"),
  companyName: z.string().min(1, "Company name is required"),
  resumeId: z.number().nullable().optional(),
  resumeData: z.any().optional(),
  recipientName: z.string().optional(),
  letterStyle: z.string().optional()
});

// Schema for cover letter enhancement request
const enhanceCoverLetterSchema = z.object({
  content: z.string().min(1, "Cover letter content is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(1, "Job description is required"),
  companyName: z.string().min(1, "Company name is required"),
  feedback: z.string().optional()
});

// Schema for cover letter analysis request
const analyzeCoverLetterSchema = z.object({
  content: z.string().min(1, "Cover letter content is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(1, "Job description is required")
});

export function registerAICoverLetterRoutes(app: express.Express) {
  // Generate a cover letter
  app.post("/api/cover-letter-ai/generate", requireUser, requireFeature(FeatureKey.COVER_LETTER_AI), async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { jobTitle, jobDescription, companyName, resumeId, resumeData, recipientName, letterStyle } = 
        generateCoverLetterSchema.parse(req.body);
      
      // If resumeId is provided, fetch the resume data
      let fetchedResumeData = resumeData;
      if (resumeId && !resumeData) {
        const resume = await storage.getResume(resumeId);
        if (resume && resume.userId === req.user.id) {
          try {
            // Construct resume data from the actual database fields
            fetchedResumeData = {
              fullName: resume.fullName || '',
              email: resume.email || '',
              phone: resume.phone || '',
              summary: resume.summary || '',
              workExperience: resume.workExperience ? resume.workExperience : [],
              education: resume.education ? resume.education : [],
              skills: resume.skills || []
            };
          } catch (error) {
            console.error("Error parsing resume data:", error);
          }
        }
      }
      
      // Generate cover letter
      const content = await generateCoverLetter(
        jobTitle, 
        jobDescription, 
        companyName,
        resumeId,
        fetchedResumeData,
        recipientName,
        letterStyle
      );
      
      // Track token usage
      await trackTokenUsage(
        req.user.id,
        FeatureKey.COVER_LETTER_AI,
        TOKENS_PER_REQUEST.GENERATE,
        "gpt-4o"
      );
      
      res.json({ content });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to generate cover letter" });
    }
  });
  
  // Enhance an existing cover letter
  app.post("/api/cover-letter-ai/enhance", requireUser, requireFeature(FeatureKey.COVER_LETTER_AI), async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { content, jobTitle, jobDescription, companyName, feedback } = 
        enhanceCoverLetterSchema.parse(req.body);
      
      // Enhance cover letter
      const enhancedContent = await enhanceCoverLetter(
        content, 
        jobTitle, 
        jobDescription, 
        companyName, 
        feedback
      );
      
      // Track token usage
      await trackTokenUsage(
        req.user.id,
        FeatureKey.COVER_LETTER_AI,
        TOKENS_PER_REQUEST.ENHANCE,
        "gpt-4o"
      );
      
      res.json({ content: enhancedContent });
    } catch (error) {
      console.error("Error enhancing cover letter:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to enhance cover letter" });
    }
  });
  
  // Analyze a cover letter
  app.post("/api/cover-letter-ai/analyze", requireUser, requireFeature(FeatureKey.COVER_LETTER_AI), async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { content, jobTitle, jobDescription } = 
        analyzeCoverLetterSchema.parse(req.body);
      
      // Analyze cover letter
      const analysis = await analyzeCoverLetter(
        content, 
        jobTitle, 
        jobDescription
      );
      
      // Track token usage
      await trackTokenUsage(
        req.user.id,
        FeatureKey.COVER_LETTER_AI,
        TOKENS_PER_REQUEST.ANALYZE,
        "gpt-4o"
      );
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing cover letter:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to analyze cover letter" });
    }
  });
}