import express from 'express';
import { storage } from "../../config/storage";
import { requireUser } from "../../middleware/auth";
import { type InsertJobApplication } from "@shared/schema";
import { z } from 'zod';
import { Router } from 'express';

// Add the import for feature access middleware
import { requireFeatureAccess, trackFeatureUsage } from '../../middleware/feature-access';
import { withEncryption } from '../../middleware/index';

const router = Router();

// Job application status enum values - matches PostgreSQL enum
export enum JobApplicationStatus {
  Applied = 'applied',
  Screening = 'screening',
  Interview = 'interview',
  Assessment = 'assessment',
  Offer = 'offer',
  Rejected = 'rejected',
  Accepted = 'accepted'
}

/**
 * Register job application routes
 */
export function registerJobApplicationRoutes(app: express.Express) {
  // Get all job applications for the current user
  app.get('/api/job-applications', 
    requireUser, 
    ...withEncryption('jobApplications'),
    async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const applications = await storage.getJobApplications(req.user.id);
      res.json(applications);
    } catch (error: any) {
      console.error('Error in GET /api/job-applications:', error);
      res.status(500).json({ 
        message: "Failed to fetch job applications", 
        error: error.message 
      });
    }
  });
  
  // Get a specific job application
  app.get('/api/job-applications/:id', 
    requireUser, 
    ...withEncryption('jobApplications'),
    async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const applicationId = parseInt(req.params.id);
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid job application ID" });
      }
      
      const application = await storage.getJobApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Job application not found" });
      }
      
      // Check if the application belongs to the current user
      if (application.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to access this job application" });
      }
      
      res.json(application);
    } catch (error: any) {
      console.error(`Error in GET /api/job-applications/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch job application", 
        error: error.message 
      });
    }
  });
  
  // Create a new job application
  app.post('/api/job-applications', 
    requireUser, 
    requireFeatureAccess('job_application'), // Check if user has access to this feature
    trackFeatureUsage('job_application'),    // Track usage for this feature
    ...withEncryption('jobApplications'),    // Apply encryption to sensitive fields
    async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Set current user ID if not provided
      const applicationData: InsertJobApplication = {
        ...req.body,
        userId: req.user.id
      };
      
      // Validate required fields
      if (!applicationData.company) {
        return res.status(400).json({ message: "Company name is required" });
      }
      
      if (!applicationData.jobTitle) {
        return res.status(400).json({ message: "Job title is required" });
      }
      
      if (!applicationData.status) {
        applicationData.status = JobApplicationStatus.Applied;
      }
      
      // Validate email format if provided
      if (applicationData.contactEmail) {
        const emailSchema = z.string().email("Invalid email format");
        try {
          emailSchema.parse(applicationData.contactEmail);
        } catch (error) {
          return res.status(400).json({ message: "The contact email did not match the expected pattern" });
        }
      }
      
      // Validate phone format if provided
      if (applicationData.contactPhone) {
        // Allow only digits, spaces, parentheses, and dashes
        const phoneSchema = z.string().regex(/^[\d\s\-\(\)]+$/, "Invalid phone number format");
        try {
          phoneSchema.parse(applicationData.contactPhone);
        } catch (error) {
          return res.status(400).json({ message: "The contact phone did not match the expected pattern" });
        }
      }
      
      // Create job application
      const newApplication = await storage.createJobApplication(applicationData);
      
      res.status(201).json(newApplication);
    } catch (error: any) {
      console.error('Error in POST /api/job-applications:', error);
      res.status(500).json({ 
        message: "Failed to create job application", 
        error: error.message 
      });
    }
  });
  
  // Update a job application
  app.put('/api/job-applications/:id', 
    requireUser, 
    ...withEncryption('jobApplications'),
    async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const applicationId = parseInt(req.params.id);
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid job application ID" });
      }
      
      // Check if application exists and belongs to the user
      const existingApplication = await storage.getJobApplication(applicationId);
      
      if (!existingApplication) {
        return res.status(404).json({ message: "Job application not found" });
      }
      
      if (existingApplication.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this job application" });
      }
      
      // Prevent updating userId
      const { userId, ...updateData } = req.body;
      
      // Validate email format if provided
      if (updateData.contactEmail) {
        const emailSchema = z.string().email("Invalid email format");
        try {
          emailSchema.parse(updateData.contactEmail);
        } catch (error) {
          return res.status(400).json({ message: "The contact email did not match the expected pattern" });
        }
      }
      
      // Validate phone format if provided
      if (updateData.contactPhone) {
        // Allow only digits, spaces, parentheses, and dashes
        const phoneSchema = z.string().regex(/^[\d\s\-\(\)]+$/, "Invalid phone number format");
        try {
          phoneSchema.parse(updateData.contactPhone);
        } catch (error) {
          return res.status(400).json({ message: "The contact phone did not match the expected pattern" });
        }
      }
      
      // Update the job application
      const updatedApplication = await storage.updateJobApplication(applicationId, updateData);
      
      if (!updatedApplication) {
        return res.status(500).json({ message: "Failed to update job application" });
      }
      
      res.json(updatedApplication);
    } catch (error: any) {
      console.error(`Error in PUT /api/job-applications/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to update job application", 
        error: error.message 
      });
    }
  });
  
  // Delete a job application
  app.delete('/api/job-applications/:id', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const applicationId = parseInt(req.params.id);
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid job application ID" });
      }
      
      // Check if application exists and belongs to the user
      const existingApplication = await storage.getJobApplication(applicationId);
      
      if (!existingApplication) {
        return res.status(404).json({ message: "Job application not found" });
      }
      
      if (existingApplication.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this job application" });
      }
      
      // Delete the job application
      const success = await storage.deleteJobApplication(applicationId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete job application" });
      }
      
      // Use HTTP 204 No Content for successful deletions
      res.status(204).end();
    } catch (error: any) {
      console.error(`Error in DELETE /api/job-applications/${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to delete job application", 
        error: error.message 
      });
    }
  });
  
  // Add status history entry to a job application
  app.post('/api/job-applications/:id/status-history', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const applicationId = parseInt(req.params.id);
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid job application ID" });
      }
      
      // Check if application exists and belongs to the user
      const existingApplication = await storage.getJobApplication(applicationId);
      
      if (!existingApplication) {
        return res.status(404).json({ message: "Job application not found" });
      }
      
      if (existingApplication.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this job application" });
      }
      
      // Extract status data from request
      const { status, notes } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Create status history entry
      const newEntry = {
        id: Date.now().toString(), // Simple ID generation
        status,
        date: new Date().toISOString(),
        notes: notes || null
      };
      
      // Add to existing status history or create new array
      const statusHistory = Array.isArray(existingApplication.statusHistory) 
        ? existingApplication.statusHistory 
        : [];
      statusHistory.push(newEntry);
      
      // Update the job application with new status and history
      const updatedApplication = await storage.updateJobApplication(applicationId, {
        status, // Update current status
        statusHistory // Add entry to history
      });
      
      if (!updatedApplication) {
        return res.status(500).json({ message: "Failed to update job application status" });
      }
      
      res.json(updatedApplication);
    } catch (error: any) {
      console.error(`Error in POST /api/job-applications/${req.params.id}/status-history:`, error);
      res.status(500).json({ 
        message: "Failed to update job application status", 
        error: error.message 
      });
    }
  });
}

// Status color mapping for consistency with client-side
export const statusColors: Record<string, string> = {
  [JobApplicationStatus.Applied]: "blue",
  [JobApplicationStatus.Screening]: "purple",
  [JobApplicationStatus.Interview]: "cyan",
  [JobApplicationStatus.Assessment]: "green",
  [JobApplicationStatus.Offer]: "orange",
  [JobApplicationStatus.Rejected]: "red",
  [JobApplicationStatus.Accepted]: "emerald",
  'default': "gray"
};

// Helper function to get status color
export const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  return statusColors[normalizedStatus] || statusColors.default;
}; 