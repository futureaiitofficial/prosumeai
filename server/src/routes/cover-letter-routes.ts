import express from 'express';
import { storage } from "../../config/storage";
import { requireUser } from "../../middleware/auth";
import { type InsertCoverLetter } from "@shared/schema";

/**
 * Register cover letter routes
 */
export function registerCoverLetterRoutes(app: express.Express) {
  // Get all cover letters for the current user
  app.get('/api/cover-letters', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const coverLetters = await storage.getCoverLetters(req.user.id);
      res.json(coverLetters);
    } catch (error: any) {
      console.error('Error in GET /api/cover-letters:', error);
      res.status(500).json({ 
        message: "Failed to fetch cover letters", 
        error: error.message 
      });
    }
  });
  
  // Get a specific cover letter
  app.get('/api/cover-letters/:id', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const coverLetterId = parseInt(req.params.id);
      
      if (isNaN(coverLetterId)) {
        return res.status(400).json({ message: "Invalid cover letter ID" });
      }
      
      const coverLetter = await storage.getCoverLetter(coverLetterId);
      
      if (!coverLetter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      // Check if the cover letter belongs to the current user
      if (coverLetter.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to access this cover letter" });
      }
      
      res.json(coverLetter);
    } catch (error: any) {
      console.error(`Error in GET /api/cover-letters/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch cover letter", 
        error: error.message 
      });
    }
  });
  
  // Create a new cover letter
  app.post('/api/cover-letters', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Set current user ID if not provided
      const coverLetterData: InsertCoverLetter = {
        ...req.body,
        userId: req.user.id
      };
      
      // Ensure required fields are provided
      if (!coverLetterData.title) {
        return res.status(400).json({ message: "Cover letter title is required" });
      }

      if (!coverLetterData.content) {
        coverLetterData.content = " "; // Provide minimum content to pass validation
      }
      
      if (!coverLetterData.company) {
        return res.status(400).json({ message: "Company name is required" });
      }
      
      if (!coverLetterData.jobTitle) {
        return res.status(400).json({ message: "Job title is required" });
      }
      
      // Set default template if not provided
      if (!coverLetterData.template) {
        coverLetterData.template = 'standard';
      }
      
      // All input fields are already included from the spread operation above
      // The rest of the validation is handled by the schema
      
      // Create cover letter
      const newCoverLetter = await storage.createCoverLetter(coverLetterData);
      
      res.status(201).json(newCoverLetter);
    } catch (error: any) {
      console.error('Error in POST /api/cover-letters:', error);
      res.status(500).json({ 
        message: "Failed to create cover letter", 
        error: error.message 
      });
    }
  });
  
  // Update a cover letter
  app.put('/api/cover-letters/:id', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const coverLetterId = parseInt(req.params.id);
      
      if (isNaN(coverLetterId)) {
        return res.status(400).json({ message: "Invalid cover letter ID" });
      }
      
      // Check if cover letter exists and belongs to the user
      const existingCoverLetter = await storage.getCoverLetter(coverLetterId);
      
      if (!existingCoverLetter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      if (existingCoverLetter.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this cover letter" });
      }
      
      // Prevent updating userId
      const { userId, ...updateData } = req.body;
      
      // Update the cover letter
      const updatedCoverLetter = await storage.updateCoverLetter(coverLetterId, updateData);
      
      if (!updatedCoverLetter) {
        return res.status(500).json({ message: "Failed to update cover letter" });
      }
      
      res.json(updatedCoverLetter);
    } catch (error: any) {
      console.error(`Error in PUT /api/cover-letters/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to update cover letter", 
        error: error.message 
      });
    }
  });
  
  // Delete a cover letter
  app.delete('/api/cover-letters/:id', requireUser, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const coverLetterId = parseInt(req.params.id);
      
      if (isNaN(coverLetterId)) {
        return res.status(400).json({ message: "Invalid cover letter ID" });
      }
      
      // Check if cover letter exists and belongs to the user
      const existingCoverLetter = await storage.getCoverLetter(coverLetterId);
      
      if (!existingCoverLetter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      if (existingCoverLetter.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this cover letter" });
      }
      
      // Delete the cover letter
      const success = await storage.deleteCoverLetter(coverLetterId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete cover letter" });
      }
      
      res.json({ 
        message: "Cover letter deleted successfully",
        id: coverLetterId
      });
    } catch (error: any) {
      console.error(`Error in DELETE /api/cover-letters/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to delete cover letter", 
        error: error.message 
      });
    }
  });
} 