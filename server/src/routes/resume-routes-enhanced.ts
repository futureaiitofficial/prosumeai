import express from 'express';
import { storage } from "../../config/storage";
import { requireUser } from "../../middleware/auth";
import { requireFeatureAccess, trackFeatureUsage } from "../../middleware/feature-access";
import { withEncryption } from "../../middleware/index";
import { type InsertResume } from "@shared/schema";
import { NotificationService } from "../../services/notification-service";
import { 
  sanitizeResumeData, 
  validateResumeStructure, 
  detectSuspiciousPatterns 
} from "../utils/resume-sanitizer";
import rateLimit from "express-rate-limit";

// Initialize notification service
const notificationService = new NotificationService();

// Rate limiting for resume operations
const resumeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per windowMs
  message: {
    error: "TOO_MANY_REQUESTS",
    message: "Too many resume operations. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `resume_${req.user?.id || req.ip}`;
  }
});

// Stricter rate limiting for create operations
const resumeCreateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit resume creation to 10 per hour
  message: {
    error: "TOO_MANY_CREATES",
    message: "Too many resume creations. Please try again later."
  },
  keyGenerator: (req) => {
    return `resume_create_${req.user?.id || req.ip}`;
  }
});

// Security logging function
function logSecurityEvent(event: string, details: any, req: express.Request) {
  console.warn(`[SECURITY] Resume ${event}:`, {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    details
  });
}

/**
 * Register enhanced resume routes with comprehensive security
 */
export function registerEnhancedResumeRoutes(app: express.Express) {
  // Get all resumes for the current user
  app.get('/api/resumes', 
    requireUser, 
    resumeRateLimit,
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
    resumeRateLimit,
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
        logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
          resumeId,
          actualUserId: resume.userId,
          attemptedUserId: req.user.id
        }, req);
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
  
  // Create a new resume with comprehensive security
  app.post('/api/resumes', 
    requireUser, 
    requireFeatureAccess('resume'), 
    trackFeatureUsage('resume'),
    resumeCreateRateLimit,
    ...withEncryption('resumes'),
    async (req, res) => {
      try {
        if (!req.isAuthenticated() || !req.user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        // Initial security validation
        try {
          validateResumeStructure(req.body);
        } catch (validationError) {
          logSecurityEvent('INVALID_STRUCTURE', {
            error: validationError instanceof Error ? validationError.message : 'Unknown error',
            dataKeys: Object.keys(req.body || {})
          }, req);
          
          return res.status(400).json({ 
            message: "Invalid resume data structure",
            error: "VALIDATION_FAILED",
            details: validationError instanceof Error ? validationError.message : 'Unknown error'
          });
        }
        
        // Sanitize all input data
        let sanitizedData: any;
        try {
          sanitizedData = sanitizeResumeData(req.body);
        } catch (sanitizationError) {
          logSecurityEvent('SANITIZATION_FAILED', {
            error: sanitizationError instanceof Error ? sanitizationError.message : 'Unknown error',
            suspiciousPatterns: detectSuspiciousPatterns(req.body)
          }, req);
          
          return res.status(400).json({ 
            message: "Invalid data format",
            error: "SANITIZATION_FAILED",
            details: sanitizationError instanceof Error ? sanitizationError.message : 'Unknown error'
          });
        }
        
        // Prepare resume data with user ID
        const resumeData: InsertResume = {
          ...sanitizedData,
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
  
  // Update a resume with comprehensive security
  app.patch('/api/resumes/:id', 
    requireUser, 
    trackFeatureUsage('resume_update'),
    resumeRateLimit,
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
        logSecurityEvent('UNAUTHORIZED_UPDATE_ATTEMPT', {
          resumeId,
          actualUserId: existingResume.userId,
          attemptedUserId: req.user.id
        }, req);
        return res.status(403).json({ message: "You don't have permission to update this resume" });
      }
      
      // Extract and validate update data
      const { userId, isAutoSave, ...updateData } = req.body;
      
      // Prevent updating userId
      if (userId && userId !== req.user.id) {
        logSecurityEvent('USERID_MANIPULATION_ATTEMPT', {
          resumeId,
          originalUserId: req.user.id,
          attemptedUserId: userId
        }, req);
        return res.status(403).json({ message: "Cannot modify user ownership" });
      }
      
      // Initial security validation
      try {
        validateResumeStructure(updateData);
      } catch (validationError) {
        logSecurityEvent('INVALID_UPDATE_STRUCTURE', {
          resumeId,
          error: validationError instanceof Error ? validationError.message : 'Unknown error',
          dataKeys: Object.keys(updateData || {})
        }, req);
        
        return res.status(400).json({ 
          message: "Invalid resume data structure",
          error: "VALIDATION_FAILED",
          details: validationError instanceof Error ? validationError.message : 'Unknown error'
        });
      }
      
      // CRITICAL: Sanitize all input data
      let sanitizedData: any;
      try {
        sanitizedData = sanitizeResumeData(updateData);
      } catch (sanitizationError) {
        logSecurityEvent('UPDATE_SANITIZATION_FAILED', {
          resumeId,
          error: sanitizationError instanceof Error ? sanitizationError.message : 'Unknown error',
          suspiciousPatterns: detectSuspiciousPatterns(updateData)
        }, req);
        
        // Provide more specific error messages based on the sanitization error
        const errorMessage = sanitizationError instanceof Error ? sanitizationError.message : 'Unknown error';
        let userFriendlyMessage = "Invalid data format";
        let fieldHint = "";
        
        // Check for specific URL validation errors
        if (errorMessage.includes('LinkedIn URL must be')) {
          userFriendlyMessage = "LinkedIn URL Error";
          fieldHint = errorMessage;
        } else if (errorMessage.includes('Invalid URL format')) {
          userFriendlyMessage = "URL Format Error";
          fieldHint = errorMessage;
        } else if (errorMessage.includes('URL protocol not allowed')) {
          userFriendlyMessage = "URL Protocol Error";
          fieldHint = errorMessage;
        } else if (errorMessage.includes('URL contains invalid characters')) {
          userFriendlyMessage = "URL Content Error";
          fieldHint = errorMessage;
        } else if (errorMessage.includes('URL domain not allowed')) {
          userFriendlyMessage = "URL Domain Error";
          fieldHint = errorMessage;
        } else if (errorMessage.includes('Please enter a valid website URL')) {
          userFriendlyMessage = "URL Format Error";
          fieldHint = errorMessage;
        } else if (errorMessage.includes('Invalid email format')) {
          userFriendlyMessage = "Email Format Error";
          fieldHint = "Please enter a valid email address (e.g., name@example.com)";
        } else if (errorMessage.includes('Invalid phone format')) {
          userFriendlyMessage = "Phone Format Error";
          fieldHint = "Please enter a valid phone number (e.g., (123) 456-7890 or +1-123-456-7890)";
        } else if (errorMessage.includes('Invalid date format')) {
          userFriendlyMessage = "Date Format Error";
          fieldHint = "Please use the format YYYY-MM-DD for dates";
        } else if (errorMessage.includes('Text contains potentially malicious content')) {
          userFriendlyMessage = "Content Security Error";
          fieldHint = "Please remove any HTML tags or scripts from your text";
        } else {
          // Generic fallback
          fieldHint = errorMessage;
        }
        
        return res.status(400).json({ 
          message: userFriendlyMessage,
          error: "VALIDATION_ERROR",
          details: fieldHint,
          hint: "Please check your input and try again. Make sure URLs include http:// or https://"
        });
      }
      
      // Log suspicious patterns for monitoring
      const suspiciousPatterns = detectSuspiciousPatterns(updateData);
      if (suspiciousPatterns.length > 0) {
        logSecurityEvent('SUSPICIOUS_UPDATE_PATTERNS', {
          resumeId,
          patterns: suspiciousPatterns,
          dataSize: JSON.stringify(updateData).length
        }, req);
      }
      
      // Update the resume with sanitized data
      const updatedResume = await storage.updateResume(resumeId, sanitizedData);
      
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
      
      // Log the error for security monitoring
      logSecurityEvent('UPDATE_ERROR', {
        resumeId: req.params.id,
        error: error.message,
        stack: error.stack
      }, req);
      
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
    resumeRateLimit,
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
        logSecurityEvent('UNAUTHORIZED_DELETE_ATTEMPT', {
          resumeId,
          actualUserId: existingResume.userId,
          attemptedUserId: req.user.id
        }, req);
        return res.status(403).json({ message: "You don't have permission to delete this resume" });
      }
      
      // Try to delete the resume
      try {
        const success = await storage.deleteResume(resumeId);
        
        if (!success) {
          return res.status(500).json({ message: "Failed to delete resume" });
        }
        
        // Log successful deletion for audit trail
        logSecurityEvent('RESUME_DELETED', {
          resumeId,
          resumeTitle: existingResume.title
        }, req);
        
        res.json({ 
          message: "Resume deleted successfully",
          id: resumeId
        });
      } catch (deleteError: any) {
        // Log the constraint violation for security monitoring
        logSecurityEvent('RESUME_DELETE_CONSTRAINT_VIOLATION', {
          resumeId,
          constraintName: deleteError.constraint_name,
          errorCode: deleteError.code
        }, req);
        
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
    resumeRateLimit,
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
        logSecurityEvent('UNAUTHORIZED_REFERENCES_ACCESS', {
          resumeId,
          actualUserId: existingResume.userId,
          attemptedUserId: req.user.id
        }, req);
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
      
      // Log the error for security monitoring
      logSecurityEvent('REFERENCES_CHECK_ERROR', {
        resumeId: req.params.id,
        error: error.message,
        stack: error.stack
      }, req);
      
      res.status(500).json({ 
        message: "Failed to fetch resume references", 
        error: error.message 
      });
    }
  });
  
  // Bulk operations with additional security
  app.post('/api/resumes/bulk-update',
    requireUser,
    resumeRateLimit,
    async (req, res) => {
      try {
        if (!req.isAuthenticated() || !req.user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const { resumeIds, updateData } = req.body;
        
        // Validate input
        if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
          return res.status(400).json({ message: "Invalid resume IDs" });
        }
        
        // Limit bulk operations
        if (resumeIds.length > 10) {
          return res.status(400).json({ message: "Too many resumes for bulk update" });
        }
        
        // Sanitize update data
        let sanitizedData: any;
        try {
          sanitizedData = sanitizeResumeData(updateData);
        } catch (sanitizationError) {
          logSecurityEvent('BULK_UPDATE_SANITIZATION_FAILED', {
            resumeIds,
            error: sanitizationError instanceof Error ? sanitizationError.message : 'Unknown error'
          }, req);
          
          return res.status(400).json({
            message: "Invalid data format",
            error: "SANITIZATION_FAILED"
          });
        }
        
        // Verify ownership of all resumes
        const results = [];
        for (const resumeId of resumeIds) {
          const id = parseInt(resumeId);
          if (isNaN(id)) continue;
          
          const resume = await storage.getResume(id);
          if (!resume || resume.userId !== req.user.id) {
            logSecurityEvent('BULK_UPDATE_UNAUTHORIZED', {
              resumeId: id,
              userId: req.user.id
            }, req);
            continue;
          }
          
          try {
            const updated = await storage.updateResume(id, sanitizedData);
            results.push({ id, success: true, resume: updated });
          } catch (error) {
            results.push({ id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
        
        res.json({ 
          message: "Bulk update completed",
          results 
        });
        
      } catch (error: any) {
        console.error('Error in bulk update:', error);
        res.status(500).json({
          message: "Failed to perform bulk update",
          error: error.message
        });
      }
    }
  );
} 