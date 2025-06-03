import express from 'express';
import { storage } from "../../config/storage";
import { requireUser } from "../../middleware/auth";
import { requireFeatureAccess, trackFeatureUsage } from "../../middleware/feature-access";
import { withEncryption } from "../../middleware/index";
import { type InsertResume } from "@shared/schema";
import { NotificationService } from "../../services/notification-service";

// Initialize notification service
const notificationService = new NotificationService();

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
        
        // Create notification for resume creation
        try {
          await notificationService.createNotification({
            recipientId: req.user.id,
            type: 'resume_created',
            category: 'resume',
            data: { 
              resumeTitle: newResume.title,
              userName: req.user.username || req.user.fullName,
              resumeId: newResume.id
            }
          });
        } catch (notificationError) {
          console.error('Failed to create resume notification:', notificationError);
          // Don't fail the request if notification fails
        }
        
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
      const { userId, isAutoSave, ...updateData } = req.body;
      
      // Update the resume
      const updatedResume = await storage.updateResume(resumeId, updateData);
      
      if (!updatedResume) {
        return res.status(500).json({ message: "Failed to update resume" });
      }
      
      // Only create notification for significant manual saves, not auto-saves
      if (!isAutoSave) {
        try {
          await notificationService.createNotification({
            recipientId: req.user.id,
            type: 'custom_notification',
            category: 'resume',
            title: 'Resume Updated',
            message: `Your resume "${updatedResume.title}" has been updated successfully.`,
            data: { 
              resumeTitle: updatedResume.title,
              userName: req.user.username || req.user.fullName,
              resumeId: updatedResume.id,
              action: 'updated'
            }
          });
        } catch (notificationError) {
          console.error('Failed to create resume update notification:', notificationError);
          // Don't fail the request if notification fails
        }
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
      
      // Try to delete the resume
      try {
        const success = await storage.deleteResume(resumeId);
        
        if (!success) {
          return res.status(500).json({ message: "Failed to delete resume" });
        }
        
        res.json({ 
          message: "Resume deleted successfully",
          id: resumeId
        });
      } catch (deleteError: any) {
        // Check for foreign key constraint violations
        if (deleteError.code === '23503') {
          if (deleteError.constraint_name === 'cover_letters_resume_id_resumes_id_fk') {
            return res.status(409).json({ 
              message: "Cannot delete resume that is linked to cover letters",
              error: "This resume is referenced by one or more cover letters. Please remove these references first or delete the cover letters.",
              detail: "foreign key constraint violation",
              constraint: "cover_letters"
            });
          } else if (deleteError.constraint_name === 'job_applications_resume_id_resumes_id_fk') {
            return res.status(409).json({ 
              message: "Cannot delete resume that is linked to job applications",
              error: "This resume is referenced by one or more job applications. Please remove these references first.",
              detail: "foreign key constraint violation",
              constraint: "job_applications"
            });
          } else {
            // Generic foreign key constraint error
            return res.status(409).json({ 
              message: "Cannot delete resume due to existing references",
              error: "This resume is referenced by other data. Please remove these references first.",
              detail: "foreign key constraint violation"
            });
          }
        }
        
        // Re-throw other errors
        throw deleteError;
      }
    } catch (error: any) {
      console.error(`Error in DELETE /api/resumes/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to delete resume", 
        error: error.message 
      });
    }
  });

  // Get resume references (what's linked to this resume)
  app.get('/api/resumes/:id/references', 
    requireUser, 
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
        return res.status(403).json({ message: "You don't have permission to access this resume" });
      }
      
      // Get all cover letters that reference this resume
      const coverLetters = await storage.getCoverLetters(req.user.id);
      const linkedCoverLetters = coverLetters.filter(cl => cl.resumeId === resumeId);
      
      // Get all job applications that reference this resume
      const jobApplications = await storage.getJobApplications(req.user.id);
      const linkedJobApplications = jobApplications.filter(ja => ja.resumeId === resumeId);
      
      res.json({
        resumeId,
        resumeTitle: existingResume.title,
        references: {
          coverLetters: linkedCoverLetters.map(cl => ({
            id: cl.id,
            title: cl.title,
            company: cl.company,
            jobTitle: cl.jobTitle
          })),
          jobApplications: linkedJobApplications.map(ja => ({
            id: ja.id,
            company: ja.company,
            jobTitle: ja.jobTitle,
            status: ja.status
          }))
        },
        canDelete: linkedCoverLetters.length === 0 && linkedJobApplications.length === 0
      });
    } catch (error: any) {
      console.error(`Error in GET /api/resumes/${req.params.id}/references:`, error);
      res.status(500).json({ 
        message: "Failed to fetch resume references", 
        error: error.message 
      });
    }
  });
} 