import express from 'express';
import { storage } from "../../config/storage";
import { requireUser } from "../../middleware/auth";
import { requireFeatureAccess, trackFeatureUsage } from "../../middleware/feature-access";
import { withEncryption } from "../../middleware/index";
import { type InsertResume } from "@shared/schema";

/**
 * Register resume routes
 */
export function registerResumeRoutes(app: express.Express) {
  // Get all resumes for the current user
  app.get('/api/resumes', 
    requireUser, 
    ...withEncryption('resumes'),
    async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const resumes = await storage.getResumes(req.user.id);
      res.json(resumes);
    } catch (error: any) {
      console.error('Error in GET /api/resumes:', error);
      res.status(500).json({ 
        message: "Failed to fetch resumes", 
        error: error.message 
      });
    }
  });
  
  // Get a specific resume
  app.get('/api/resumes/:id', 
    requireUser, 
    ...withEncryption('resumes'),
    async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const resumeId = parseInt(req.params.id);
      
      if (isNaN(resumeId)) {
        return res.status(400).json({ message: "Invalid resume ID" });
      }
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if the resume belongs to the current user
      if (resume.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to access this resume" });
      }
      
      res.json(resume);
    } catch (error: any) {
      console.error(`Error in GET /api/resumes/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch resume", 
        error: error.message 
      });
    }
  });
  
  // Create a new resume
  app.post('/api/resumes', 
    requireUser, 
    requireFeatureAccess('resume'), 
    trackFeatureUsage('resume'),
    ...withEncryption('resumes'),
    async (req, res) => {
      try {
        if (!req.isAuthenticated() || !req.user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        // Set current user ID if not provided
        const resumeData: InsertResume = {
          ...req.body,
          userId: req.user.id
        };
        
        // Ensure required fields are provided
        if (!resumeData.title) {
          return res.status(400).json({ message: "Resume title is required" });
        }

        if (!resumeData.targetJobTitle) {
          return res.status(400).json({ message: "Target job title is required" });
        }
        
        // Set default template if not provided
        if (!resumeData.template) {
          resumeData.template = 'professional';
        }
        
        // Create resume
        const newResume = await storage.createResume(resumeData);
        
        res.status(201).json(newResume);
      } catch (error: any) {
        console.error('Error in POST /api/resumes:', error);
        res.status(500).json({ 
          message: "Failed to create resume", 
          error: error.message 
        });
      }
  });
  
  // Update a resume
  app.patch('/api/resumes/:id', 
    requireUser, 
    trackFeatureUsage('resume_update'),
    ...withEncryption('resumes'),
    async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const resumeId = parseInt(req.params.id);
      
      if (isNaN(resumeId)) {
        return res.status(400).json({ message: "Invalid resume ID" });
      }
      
      // Check if resume exists and belongs to the user
      const existingResume = await storage.getResume(resumeId);
      
      if (!existingResume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      if (existingResume.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this resume" });
      }
      
      // Prevent updating userId
      const { userId, ...updateData } = req.body;
      
      // Update the resume
      const updatedResume = await storage.updateResume(resumeId, updateData);
      
      if (!updatedResume) {
        return res.status(500).json({ message: "Failed to update resume" });
      }
      
      res.json(updatedResume);
    } catch (error: any) {
      console.error(`Error in PATCH /api/resumes/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to update resume", 
        error: error.message 
      });
    }
  });
  
  // Delete a resume
  app.delete('/api/resumes/:id', 
    requireUser, 
    trackFeatureUsage('resume_delete'),
    async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const resumeId = parseInt(req.params.id);
      
      if (isNaN(resumeId)) {
        return res.status(400).json({ message: "Invalid resume ID" });
      }
      
      // Check if resume exists and belongs to the user
      const existingResume = await storage.getResume(resumeId);
      
      if (!existingResume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      if (existingResume.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this resume" });
      }
      
      // Delete the resume
      const success = await storage.deleteResume(resumeId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete resume" });
      }
      
      res.json({ 
        message: "Resume deleted successfully",
        id: resumeId
      });
    } catch (error: any) {
      console.error(`Error in DELETE /api/resumes/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to delete resume", 
        error: error.message 
      });
    }
  });
} 