import express from 'express';
import { storage } from "../../config/storage";
import { requireUser } from "../../middleware/auth";
import { requireFeatureAccess, trackFeatureUsage } from "../../middleware/feature-access";
import { withEncryption } from "../../middleware/index";
import { type InsertCoverLetter } from "@shared/schema";

/**
 * Register cover letter routes
 */
export function registerCoverLetterRoutes(app: express.Express) {
  // Get all cover letters for the current user
  app.get('/api/cover-letters', 
    requireUser, 
    ...withEncryption('coverLetters'),
    async (req, res) => {
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
  app.get('/api/cover-letters/:id', 
    requireUser, 
    ...withEncryption('coverLetters'),
    async (req, res) => {
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
  app.post('/api/cover-letters', 
    requireUser,
    requireFeatureAccess('cover_letter'),
    trackFeatureUsage('cover_letter'),
    ...withEncryption('coverLetters'),
    async (req, res) => {
      console.log('Creating new cover letter, received data:', JSON.stringify(req.body, null, 2));
      
      try {
        if (!req.isAuthenticated() || !req.user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        // Extract only the fields we want to specifically use
        const {
          title = '',
          company = '',
          jobTitle = '',
          template = 'standard',
          recipientName = '',
          resumeId = null
        } = req.body;

        // Validate required fields
        if (!title) {
          return res.status(400).json({ message: 'Title is required' });
        }

        // Create clean cover letter data with explicit initialization for all fields to prevent data leakage
        const coverLetterData: InsertCoverLetter = {
          userId: req.user!.id,
          title,
          company,
          jobTitle,
          template,
          recipientName,
          resumeId: resumeId || null,
          // Explicitly initialize personal fields to empty to prevent data leakage
          fullName: '',
          email: '',
          phone: '',
          address: '',
          // Initialize content fields with empty strings to completely prevent data leakage
          content: '',
          jobDescription: ''
        };

        console.log('Sanitized cover letter data for creation:', JSON.stringify(coverLetterData, null, 2));

        const newCoverLetter = await storage.createCoverLetter(coverLetterData);
        console.log('Successfully created new cover letter with ID:', newCoverLetter.id);
        
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
  app.put('/api/cover-letters/:id', 
    requireUser, 
    trackFeatureUsage('cover_letter_update'),
    ...withEncryption('coverLetters'),
    async (req, res) => {
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
  app.delete('/api/cover-letters/:id', 
    requireUser, 
    trackFeatureUsage('cover_letter_delete'),
    async (req, res) => {
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
      
      // Try to delete the cover letter
      try {
        const success = await storage.deleteCoverLetter(coverLetterId);
        
        if (!success) {
          return res.status(500).json({ message: "Failed to delete cover letter" });
        }
        
        res.json({ 
          message: "Cover letter deleted successfully",
          id: coverLetterId
        });
      } catch (deleteError: any) {
        // Check for foreign key constraint violation
        if (deleteError.code === '23503' && 
            deleteError.constraint_name === 'job_applications_cover_letter_id_cover_letters_id_fk') {
          return res.status(409).json({ 
            message: "Cannot delete cover letter that is linked to job applications",
            error: "This cover letter is referenced by one or more job applications. Please remove these references first.",
            detail: "foreign key constraint violation"
          });
        }
        
        // Re-throw other errors
        throw deleteError;
      }
    } catch (error: any) {
      console.error(`Error in DELETE /api/cover-letters/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to delete cover letter", 
        error: error.message 
      });
    }
  });
} 