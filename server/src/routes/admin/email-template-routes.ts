import { Express, Request, Response } from "express";
import { requireAdmin } from "server/middleware/admin";
import { db } from "../../../config/db";
import { emailTemplates } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { EmailService } from "../../../services/email-service";

// Template processor function to replace variables in templates
function processTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/{{(\w+)}}/g, (match, variable) => {
    return variables[variable] !== undefined ? String(variables[variable]) : match;
  });
}

/**
 * Registers email template admin routes
 */
export function registerEmailTemplateRoutes(app: Express) {
  // Get all email templates
  app.get("/api/admin/email-templates", requireAdmin, async (req: Request, res: Response) => {
    try {
      const templates = await db
        .select()
        .from(emailTemplates)
        .orderBy(emailTemplates.templateType);
      
      return res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      return res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });
  
  // Get email template by ID
  app.get("/api/admin/email-templates/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, id))
        .limit(1);
      
      if (template.length === 0) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      return res.json(template[0]);
    } catch (error) {
      console.error("Error fetching email template:", error);
      return res.status(500).json({ message: "Failed to fetch email template" });
    }
  });
  
  // Create new email template
  app.post("/api/admin/email-templates", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { templateType, name, subject, htmlContent, textContent, variables, isDefault, isActive } = req.body;
      
      // Validation
      if (!templateType || !name || !subject || !htmlContent || !textContent) {
        return res.status(400).json({ 
          message: "Required fields are missing. Template type, name, subject, HTML content, and text content are required." 
        });
      }
      
      // If this is a default template, unset default flag for other templates of the same type
      if (isDefault) {
        await db
          .update(emailTemplates)
          .set({ isDefault: false })
          .where(and(eq(emailTemplates.templateType, templateType), eq(emailTemplates.isDefault, true)));
      }
      
      // Create new template
      const newTemplate = await db
        .insert(emailTemplates)
        .values({
          templateType,
          name,
          subject,
          htmlContent,
          textContent,
          variables: variables || {},
          isDefault: isDefault || false,
          isActive: isActive !== undefined ? isActive : true,
        })
        .returning();
      
      return res.status(201).json(newTemplate[0]);
    } catch (error) {
      console.error("Error creating email template:", error);
      return res.status(500).json({ message: "Failed to create email template" });
    }
  });
  
  // Update email template
  app.put("/api/admin/email-templates/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const { templateType, name, subject, htmlContent, textContent, variables, isDefault, isActive } = req.body;
      
      // Validation
      if (!templateType || !name || !subject || !htmlContent || !textContent) {
        return res.status(400).json({ 
          message: "Required fields are missing. Template type, name, subject, HTML content, and text content are required." 
        });
      }
      
      // Check if template exists
      const existingTemplate = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, id))
        .limit(1);
      
      if (existingTemplate.length === 0) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      // If changing to default, unset default flag for other templates of the same type
      if (isDefault && (!existingTemplate[0].isDefault || existingTemplate[0].templateType !== templateType)) {
        await db
          .update(emailTemplates)
          .set({ isDefault: false })
          .where(and(eq(emailTemplates.templateType, templateType), eq(emailTemplates.isDefault, true)));
      }
      
      // Update template
      const updatedTemplate = await db
        .update(emailTemplates)
        .set({
          templateType,
          name,
          subject,
          htmlContent,
          textContent,
          variables: variables || {},
          isDefault: isDefault || false,
          isActive: isActive !== undefined ? isActive : true,
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.id, id))
        .returning();
      
      return res.json(updatedTemplate[0]);
    } catch (error) {
      console.error("Error updating email template:", error);
      return res.status(500).json({ message: "Failed to update email template" });
    }
  });
  
  // Delete email template
  app.delete("/api/admin/email-templates/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Check if template exists
      const existingTemplate = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, id))
        .limit(1);
      
      if (existingTemplate.length === 0) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      // Don't allow deleting the last default template of a type
      if (existingTemplate[0].isDefault) {
        const otherDefaultsCount = await db
          .select({ count: emailTemplates.id })
          .from(emailTemplates)
          .where(and(
            eq(emailTemplates.templateType, existingTemplate[0].templateType),
            eq(emailTemplates.isDefault, true),
            eq(emailTemplates.isActive, true)
          ))
          .limit(1);
        
        if (otherDefaultsCount.length > 0 && otherDefaultsCount[0].count === 1) {
          return res.status(400).json({ 
            message: "Cannot delete the only default template of this type. Create another default template first." 
          });
        }
      }
      
      // Delete template
      await db
        .delete(emailTemplates)
        .where(eq(emailTemplates.id, id));
      
      return res.json({ message: "Email template deleted successfully" });
    } catch (error) {
      console.error("Error deleting email template:", error);
      return res.status(500).json({ message: "Failed to delete email template" });
    }
  });
  
  // Test email template
  app.post("/api/admin/email-templates/:id/test", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { testEmail, variables } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      if (!testEmail) {
        return res.status(400).json({ message: "Test email address is required" });
      }
      
      // Check if template exists
      const template = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, id))
        .limit(1);
      
      if (template.length === 0) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      // Get the EmailService instance
      const emailService = EmailService.getInstance();
      
      // Ensure email service is initialized
      const serviceInitialized = await emailService.init();
      if (!serviceInitialized) {
        return res.status(500).json({ message: "Email service is not configured or disabled" });
      }
      
      // Build variables with sample data if not provided
      const templateVars = variables || {};
      const templateType = template[0].templateType;
      
      // Add default variables based on template type
      switch (templateType) {
        case 'welcome':
          templateVars.username = templateVars.username || 'Sample User';
          break;
          
        case 'email_verification':
          templateVars.username = templateVars.username || 'Sample User';
          templateVars.verificationLink = templateVars.verificationLink || 'https://example.com/verify?token=sample-token';
          break;
          
        case 'password_reset':
          templateVars.username = templateVars.username || 'Sample User';
          templateVars.resetLink = templateVars.resetLink || 'https://example.com/reset-password?token=sample-token';
          break;
          
        case 'password_changed':
          templateVars.username = templateVars.username || 'Sample User';
          templateVars.resetLink = templateVars.resetLink || 'https://example.com/reset-password';
          templateVars.changeTime = templateVars.changeTime || new Date().toLocaleString();
          break;
          
        case 'login_alert':
          templateVars.username = templateVars.username || 'Sample User';
          templateVars.resetLink = templateVars.resetLink || 'https://example.com/reset-password';
          templateVars.loginTime = templateVars.loginTime || new Date().toLocaleString();
          templateVars.device = templateVars.device || 'Chrome on Windows';
          templateVars.location = templateVars.location || 'New York, USA';
          templateVars.ipAddress = templateVars.ipAddress || '192.168.1.1';
          break;
          
        default:
          // For custom template types, ensure we have username at minimum
          templateVars.username = templateVars.username || 'Sample User';
          break;
      }
      
      // Get branding data to include in the email
      const branding = await emailService.getBrandingData();
      
      // Add branding variables to template variables
      const enrichedVars = {
        ...templateVars,
        appName: branding?.appName || 'atScribe',
        appTagline: branding?.appTagline || 'AI-powered resume and career tools',
        primaryColor: branding?.primaryColor || '#4f46e5',
        secondaryColor: branding?.secondaryColor || '#10b981',
        accentColor: branding?.accentColor || '#f97316',
        footerText: branding?.footerText || '© 2023 atScribe. All rights reserved.'
      };
      
      // Send test email using the direct template rather than looking it up by type
      const subject = processTemplate(template[0].subject, enrichedVars);
      const html = processTemplate(template[0].htmlContent, enrichedVars);
      const text = processTemplate(template[0].textContent, enrichedVars);
      
      // Send the email directly
      const result = await emailService.sendEmail({
        to: testEmail,
        subject,
        html,
        text
      });
      
      if (result) {
        return res.json({ message: "Test email sent successfully" });
      } else {
        return res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error testing email template:", error);
      return res.status(500).json({ message: "Failed to test email template" });
    }
  });
} 