import express, { Request, Response } from "express";
import { db } from "../../config/db";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "../../middleware/admin";
import { storage } from "../../config/storage";
import { resumeTemplates, coverLetterTemplates } from "@shared/schema";
import path from "path";
import fs from "fs";

/**
 * Register template management routes for the admin panel
 */
export function registerTemplateRoutes(app: express.Express) {
  // Get all templates
  app.get("/api/admin/templates", requireAdmin, async (req, res) => {
    try {
      // Fetch resume templates
      const resumeTemplatesData = await db.select().from(resumeTemplates);
      
      // Fetch cover letter templates
      const coverLetterTemplatesData = await db.select().from(coverLetterTemplates);
      
      // Combine and format the templates
      const allTemplates = [
        ...resumeTemplatesData.map(template => ({
          ...template,
          type: "resume" as const
        })),
        ...coverLetterTemplatesData.map(template => ({
          ...template,
          type: "cover-letter" as const
        }))
      ];
      
      res.json(allTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });
  
  // Get a specific template
  app.get("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const templateType = req.query.type as string;
      
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      if (!templateType || (templateType !== "resume" && templateType !== "cover-letter")) {
        return res.status(400).json({ message: "Invalid template type" });
      }
      
      let template;
      if (templateType === "resume") {
        [template] = await db.select().from(resumeTemplates).where(eq(resumeTemplates.id, templateId));
      } else {
        [template] = await db.select().from(coverLetterTemplates).where(eq(coverLetterTemplates.id, templateId));
      }
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json({
        ...template,
        type: templateType
      });
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });
  
  // Create a new template
  app.post("/api/admin/templates", requireAdmin, async (req, res) => {
    try {
      const { name, description, content, thumbnail, type, isDefault, isActive } = req.body;
      
      if (!name || !content || !type) {
        return res.status(400).json({ message: "Name, content, and type are required" });
      }
      
      if (type !== "resume" && type !== "cover-letter") {
        return res.status(400).json({ message: "Invalid template type" });
      }
      
      // Create the template based on type
      let newTemplate;
      if (type === "resume") {
        // If this is set as default, unset any existing default
        if (isDefault) {
          await db
            .update(resumeTemplates)
            .set({ isDefault: false })
            .where(eq(resumeTemplates.isDefault, true));
        }
        
        const [template] = await db
          .insert(resumeTemplates)
          .values({
            name,
            description: description || "",
            content,
            thumbnail: thumbnail || "",
            isDefault: isDefault || false,
            isActive: isActive !== undefined ? isActive : true,
          })
          .returning();
          
        newTemplate = {
          ...template,
          type: "resume" as const
        };
      } else {
        // If this is set as default, unset any existing default
        if (isDefault) {
          await db
            .update(coverLetterTemplates)
            .set({ isDefault: false })
            .where(eq(coverLetterTemplates.isDefault, true));
        }
        
        const [template] = await db
          .insert(coverLetterTemplates)
          .values({
            name,
            description: description || "",
            content,
            thumbnail: thumbnail || "",
            isDefault: isDefault || false,
            isActive: isActive !== undefined ? isActive : true,
          })
          .returning();
          
        newTemplate = {
          ...template,
          type: "cover-letter" as const
        };
      }
      
      res.status(201).json(newTemplate);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });
  
  // Update a template
  app.patch("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const { name, description, content, thumbnail, type, isDefault, isActive } = req.body;
      
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      if (!type || (type !== "resume" && type !== "cover-letter")) {
        return res.status(400).json({ message: "Invalid template type" });
      }
      
      // Update the template based on type
      let updatedTemplate;
      if (type === "resume") {
        // First check if the template exists
        const [existingTemplate] = await db
          .select()
          .from(resumeTemplates)
          .where(eq(resumeTemplates.id, templateId));
          
        if (!existingTemplate) {
          return res.status(404).json({ message: "Template not found" });
        }
        
        // If setting as default, unset any existing default
        if (isDefault && !existingTemplate.isDefault) {
          await db
            .update(resumeTemplates)
            .set({ isDefault: false })
            .where(eq(resumeTemplates.isDefault, true));
        }
        
        // Update the template
        const [template] = await db
          .update(resumeTemplates)
          .set({
            name: name !== undefined ? name : existingTemplate.name,
            description: description !== undefined ? description : existingTemplate.description,
            content: content !== undefined ? content : existingTemplate.content,
            thumbnail: thumbnail !== undefined ? thumbnail : existingTemplate.thumbnail,
            isDefault: isDefault !== undefined ? isDefault : existingTemplate.isDefault,
            isActive: isActive !== undefined ? isActive : existingTemplate.isActive,
          })
          .where(eq(resumeTemplates.id, templateId))
          .returning();
          
        updatedTemplate = {
          ...template,
          type: "resume" as const
        };
      } else {
        // First check if the template exists
        const [existingTemplate] = await db
          .select()
          .from(coverLetterTemplates)
          .where(eq(coverLetterTemplates.id, templateId));
          
        if (!existingTemplate) {
          return res.status(404).json({ message: "Template not found" });
        }
        
        // If setting as default, unset any existing default
        if (isDefault && !existingTemplate.isDefault) {
          await db
            .update(coverLetterTemplates)
            .set({ isDefault: false })
            .where(eq(coverLetterTemplates.isDefault, true));
        }
        
        // Update the template
        const [template] = await db
          .update(coverLetterTemplates)
          .set({
            name: name !== undefined ? name : existingTemplate.name,
            description: description !== undefined ? description : existingTemplate.description,
            content: content !== undefined ? content : existingTemplate.content,
            thumbnail: thumbnail !== undefined ? thumbnail : existingTemplate.thumbnail,
            isDefault: isDefault !== undefined ? isDefault : existingTemplate.isDefault,
            isActive: isActive !== undefined ? isActive : existingTemplate.isActive,
          })
          .where(eq(coverLetterTemplates.id, templateId))
          .returning();
          
        updatedTemplate = {
          ...template,
          type: "cover-letter" as const
        };
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });
  
  // Delete a template
  app.delete("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const templateType = req.query.type as string;
      
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      if (!templateType || (templateType !== "resume" && templateType !== "cover-letter")) {
        return res.status(400).json({ message: "Invalid template type" });
      }
      
      // Check if the template exists and is not default
      let isDefault = false;
      if (templateType === "resume") {
        const [template] = await db
          .select()
          .from(resumeTemplates)
          .where(eq(resumeTemplates.id, templateId));
          
        if (!template) {
          return res.status(404).json({ message: "Template not found" });
        }
        
        isDefault = template.isDefault;
      } else {
        const [template] = await db
          .select()
          .from(coverLetterTemplates)
          .where(eq(coverLetterTemplates.id, templateId));
          
        if (!template) {
          return res.status(404).json({ message: "Template not found" });
        }
        
        isDefault = template.isDefault;
      }
      
      // Don't allow deleting default templates
      if (isDefault) {
        return res.status(400).json({ message: "Cannot delete default template" });
      }
      
      // Delete the template
      if (templateType === "resume") {
        await db
          .delete(resumeTemplates)
          .where(eq(resumeTemplates.id, templateId));
      } else {
        await db
          .delete(coverLetterTemplates)
          .where(eq(coverLetterTemplates.id, templateId));
      }
      
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });
  
  // Set default template
  app.patch("/api/admin/templates/set-default", requireAdmin, async (req, res) => {
    try {
      const { templateId, type } = req.body;
      
      if (!templateId || isNaN(parseInt(templateId))) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      if (!type || (type !== "resume" && type !== "cover-letter")) {
        return res.status(400).json({ message: "Invalid template type" });
      }
      
      if (type === "resume") {
        // Check if the template exists
        const [template] = await db
          .select()
          .from(resumeTemplates)
          .where(eq(resumeTemplates.id, parseInt(templateId)));
          
        if (!template) {
          return res.status(404).json({ message: "Template not found" });
        }
        
        // Update all templates to not be default
        await db
          .update(resumeTemplates)
          .set({ isDefault: false });
          
        // Set the specified template as default
        const [updatedTemplate] = await db
          .update(resumeTemplates)
          .set({ isDefault: true })
          .where(eq(resumeTemplates.id, parseInt(templateId)))
          .returning();
          
        res.json({
          ...updatedTemplate,
          type: "resume" as const
        });
      } else {
        // Check if the template exists
        const [template] = await db
          .select()
          .from(coverLetterTemplates)
          .where(eq(coverLetterTemplates.id, parseInt(templateId)));
          
        if (!template) {
          return res.status(404).json({ message: "Template not found" });
        }
        
        // Update all templates to not be default
        await db
          .update(coverLetterTemplates)
          .set({ isDefault: false });
          
        // Set the specified template as default
        const [updatedTemplate] = await db
          .update(coverLetterTemplates)
          .set({ isDefault: true })
          .where(eq(coverLetterTemplates.id, parseInt(templateId)))
          .returning();
          
        res.json({
          ...updatedTemplate,
          type: "cover-letter" as const
        });
      }
    } catch (error) {
      console.error("Error setting default template:", error);
      res.status(500).json({ message: "Failed to set default template" });
    }
  });
  
  // Get public templates (for users)
  app.get("/api/templates", async (req, res) => {
    try {
      const type = req.query.type as string;
      
      if (!type || (type !== "resume" && type !== "cover-letter")) {
        return res.status(400).json({ message: "Invalid template type" });
      }
      
      let templates;
      if (type === "resume") {
        // Get all resume templates
        templates = await db
          .select()
          .from(resumeTemplates);
          
        templates = templates.map(template => ({
          ...template,
          type: "resume" as const
        }));
      } else {
        // Get all cover letter templates
        templates = await db
          .select()
          .from(coverLetterTemplates);
          
        templates = templates.map(template => ({
          ...template,
          type: "cover-letter" as const
        }));
      }
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching public templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });
  
  // Get default template (for users)
  app.get("/api/templates/default", async (req, res) => {
    try {
      const type = req.query.type as string;
      
      if (!type || (type !== "resume" && type !== "cover-letter")) {
        return res.status(400).json({ message: "Invalid template type" });
      }
      
      let template;
      if (type === "resume") {
        // Get default resume template
        [template] = await db
          .select()
          .from(resumeTemplates)
          .where(eq(resumeTemplates.isDefault, true));
          
        if (!template) {
          // If no default template, get the first template
          [template] = await db
            .select()
            .from(resumeTemplates);
        }
        
        if (template) {
          template = {
            ...template,
            type: "resume" as const
          };
        }
      } else {
        // Get default cover letter template
        [template] = await db
          .select()
          .from(coverLetterTemplates)
          .where(eq(coverLetterTemplates.isDefault, true));
          
        if (!template) {
          // If no default template, get the first template
          [template] = await db
            .select()
            .from(coverLetterTemplates);
        }
        
        if (template) {
          template = {
            ...template,
            type: "cover-letter" as const
          };
        }
      }
      
      if (!template) {
        return res.status(404).json({ message: "No templates found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching default template:", error);
      res.status(500).json({ message: "Failed to fetch default template" });
    }
  });
  
  // Public endpoint for template images (no admin required)
  app.get("/api/templates/images", async (req, res) => {
    try {
      console.log("Getting template images for public use");
      const imagesDir = path.join(process.cwd(), 'server', 'uploads', 'templates');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
        return res.json({ images: [] });
      }
      
      // First, get all active templates
      const activeResumeTemplates = await db
        .select()
        .from(resumeTemplates)
        .where(eq(resumeTemplates.isActive, true));
      
      const activeCoverLetterTemplates = await db
        .select()
        .from(coverLetterTemplates)
        .where(eq(coverLetterTemplates.isActive, true));
        
      // Combine all active templates
      const activeTemplates = [
        ...activeResumeTemplates,
        ...activeCoverLetterTemplates
      ];
      
      console.log(`Found ${activeTemplates.length} active templates`);
      
      // Extract thumbnail paths from active templates
      const activeThumbnails = activeTemplates
        .map(template => template.thumbnail)
        .filter(Boolean);
      
      console.log(`Active templates have ${activeThumbnails.length} thumbnail paths`);
      if (activeThumbnails.length > 0) {
        console.log("Sample thumbnails:", activeThumbnails.slice(0, 3));
      }
      
      // Read all files in the directory
      const files = fs.readdirSync(imagesDir);
      console.log(`Found ${files.length} image files in directory`);
      
      // Filter files to only include those used by active templates
      // or include all if in admin mode or if debug mode is enabled
      const isAdminRequest = req.query.admin === 'true';
      const isDebugMode = process.env.NODE_ENV !== 'production' || req.query.debug === 'true';
      
      // For development or when explicitly requested, show all images
      const filteredFiles = isAdminRequest || isDebugMode
        ? files 
        : files.filter(file => {
            // Check if the file path is used in any active template
            const isUsed = activeThumbnails.some(thumbnail => 
              thumbnail.includes(file) || 
              thumbnail.endsWith(`/uploads/templates/${file}`)
            );
            
            if (!isUsed) {
              // Also try matching by template name patterns as fallback
              const isMatchByName = activeTemplates.some(template => {
                const templateName = template.name.toLowerCase().replace(/\s+/g, '-');
                return file.toLowerCase().includes(templateName);
              });
              
              return isMatchByName;
            }
            
            return isUsed;
          });
      
      // Map to relative URLs for consistency
      const images = filteredFiles.map(file => ({
        name: file,
        url: `/uploads/templates/${file}`,
        size: fs.statSync(path.join(imagesDir, file)).size
      }));
      
      console.log(`Returning ${images.length} template images for public use`);
      if (images.length > 0) {
        console.log("Sample image names:", images.map(img => img.name).slice(0, 3));
      } else {
        console.log("No images found that match active templates");
      }
      
      res.json({ images });
    } catch (error) {
      console.error('Error getting template images:', error);
      res.status(500).json({ message: 'Failed to get template images' });
    }
  });

  // Toggle template visibility by registry ID
  app.post("/api/admin/templates/:id/toggle-visibility", requireAdmin, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const { isActive, type } = req.body;
      
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      if (isActive === undefined) {
        return res.status(400).json({ message: "Visibility status is required" });
      }
      
      if (!type || (type !== "resume" && type !== "cover-letter")) {
        return res.status(400).json({ message: "Invalid template type" });
      }
      
      // Choose the appropriate table
      const table = type === "resume" ? resumeTemplates : coverLetterTemplates;
      
      // Update the template's active state
      const [updatedTemplate] = await db
        .update(table)
        .set({ isActive })
        .where(eq(table.id, templateId))
        .returning();
        
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      return res.json({
        ...updatedTemplate,
        type,
        message: `Template ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error("Error toggling template visibility:", error);
      res.status(500).json({ message: "Failed to update template visibility" });
    }
  });
  
  // Get all active templates for use in the frontend
  app.get("/api/templates/active", async (req, res) => {
    try {
      // Fetch active resume templates
      const activeResumeTemplates = await db
        .select()
        .from(resumeTemplates)
        .where(eq(resumeTemplates.isActive, true));
      
      // Fetch active cover letter templates
      const activeCoverLetterTemplates = await db
        .select()
        .from(coverLetterTemplates)
        .where(eq(coverLetterTemplates.isActive, true));
      
      return res.json({
        resumeTemplates: activeResumeTemplates,
        coverLetterTemplates: activeCoverLetterTemplates
      });
    } catch (error) {
      console.error("Error fetching active templates:", error);
      return res.status(500).json({ message: "Failed to fetch active templates" });
    }
  });

  // Ensure templates exist in the database
  app.post("/api/admin/templates/ensure", requireAdmin, async (req, res) => {
    try {
      const { templates } = req.body;
      
      if (!templates || !Array.isArray(templates)) {
        return res.status(400).json({ message: "Invalid templates data" });
      }

      const results = [];
      
      // Process each template
      for (const template of templates) {
        const { name, description, content, category } = template;
        
        if (!name || !category) {
          continue; // Skip invalid templates
        }
        
        // Choose the appropriate table
        const table = category === "resume" ? resumeTemplates : coverLetterTemplates;
        
        // Normalize the name for better matching
        const normalizedName = name.toLowerCase().trim();
        
        // Check if the template already exists by name (case-insensitive)
        const existingTemplates = await db
          .select()
          .from(table);
          
        // Find existing template by normalized name matching
        const existingTemplate = existingTemplates.find(existing => 
          existing.name.toLowerCase().trim() === normalizedName ||
          existing.name.toLowerCase().replace(/\s+/g, '-') === normalizedName.replace(/\s+/g, '-') ||
          existing.name.toLowerCase().replace(/\s+/g, '') === normalizedName.replace(/\s+/g, '')
        );
          
        if (existingTemplate) {
          results.push({
            id: existingTemplate.id,
            name: existingTemplate.name, // Use existing name
            action: "existing",
            type: category
          });
          continue;
        }
        
        // Create a new template only if it doesn't exist
        const [newTemplate] = await db
          .insert(table)
          .values({
            name,
            description: description || "",
            content: content || "",
            thumbnail: "",
            isDefault: false,
            isActive: true,
          })
          .returning();
          
        results.push({
          id: newTemplate.id,
          name,
          action: "created",
          type: category
        });
      }
      
      // Log the results for debugging
      console.log("Template initialization results:", results);
      
      res.json({
        message: "Templates processed successfully",
        results: results,
        summary: {
          created: results.filter(r => r.action === "created").length,
          existing: results.filter(r => r.action === "existing").length,
          total: results.length
        }
      });
    } catch (error) {
      console.error("Error ensuring templates:", error);
      res.status(500).json({ message: "Failed to process templates" });
    }
  });

  // Debug helper endpoint to fix template thumbnails
  app.get("/api/debug/template-images", async (req, res) => {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV === 'production' && !req.query.force) {
        return res.status(403).json({ message: "Endpoint only available in development mode" });
      }
      
      console.log("Running template image repair utility");
      
      // Get the images directory
      const imagesDir = path.join(process.cwd(), 'server', 'uploads', 'templates');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
        return res.json({ message: "Images directory created, no images to process" });
      }
      
      // Get all files in the directory
      const files = fs.readdirSync(imagesDir);
      console.log(`Found ${files.length} image files`);
      
      // Get all templates
      const resumeTemplatesData = await db.select().from(resumeTemplates);
      const coverLetterTemplatesData = await db.select().from(coverLetterTemplates);
      
      console.log(`Found ${resumeTemplatesData.length} resume templates and ${coverLetterTemplatesData.length} cover letter templates`);
      
      const results = [];
      
      // Try to match resume templates with images
      for (const template of resumeTemplatesData) {
        const templateName = template.name.toLowerCase().replace(/\s+/g, '-');
        const templateId = template.id.toString();
        
        // Find matching image
        const matchingFile = files.find(file => 
          file.toLowerCase().includes(templateName) || 
          file.toLowerCase().includes(`template-${templateId}`) ||
          file.toLowerCase().includes(`resume-${templateId}`)
        );
        
        if (matchingFile && (!template.thumbnail || template.thumbnail === '')) {
          // Update template with thumbnail
          const thumbnailUrl = `/uploads/templates/${matchingFile}`;
          
          await db.update(resumeTemplates)
            .set({ 
              thumbnail: thumbnailUrl,
              isActive: true // Also make active
            })
            .where(eq(resumeTemplates.id, template.id));
          
          results.push({
            id: template.id,
            name: template.name,
            type: "resume",
            action: "updated",
            thumbnail: thumbnailUrl
          });
          
          console.log(`Updated resume template ${template.name} with thumbnail ${thumbnailUrl}`);
        }
      }
      
      // Try to match cover letter templates with images
      for (const template of coverLetterTemplatesData) {
        const templateName = template.name.toLowerCase().replace(/\s+/g, '-');
        const templateId = template.id.toString();
        
        // Find matching image
        const matchingFile = files.find(file => 
          file.toLowerCase().includes(templateName) || 
          file.toLowerCase().includes(`template-${templateId}`) ||
          file.toLowerCase().includes(`cover-letter-${templateId}`) ||
          file.toLowerCase().includes(`cl-${templateId}`)
        );
        
        if (matchingFile && (!template.thumbnail || template.thumbnail === '')) {
          // Update template with thumbnail
          const thumbnailUrl = `/uploads/templates/${matchingFile}`;
          
          await db.update(coverLetterTemplates)
            .set({ 
              thumbnail: thumbnailUrl,
              isActive: true // Also make active
            })
            .where(eq(coverLetterTemplates.id, template.id));
          
          results.push({
            id: template.id,
            name: template.name,
            type: "cover-letter",
            action: "updated",
            thumbnail: thumbnailUrl
          });
          
          console.log(`Updated cover letter template ${template.name} with thumbnail ${thumbnailUrl}`);
        }
      }
      
      return res.json({
        message: `Template image repair completed. Updated ${results.length} templates.`,
        updated: results
      });
    } catch (error) {
      console.error("Error running template image repair:", error);
      return res.status(500).json({ message: "Failed to repair template images" });
    }
  });

  // Debug helper endpoint to clean up duplicate templates
  app.post("/api/admin/templates/cleanup-duplicates", requireAdmin, async (req, res) => {
    try {
      console.log("Starting template cleanup process...");
      
      const results = {
        resumeTemplates: { duplicatesRemoved: 0, kept: 0 },
        coverLetterTemplates: { duplicatesRemoved: 0, kept: 0 }
      };
      
      // Clean up resume templates
      const resumeTemplatesData = await db.select().from(resumeTemplates);
      const resumeGroups = new Map();
      
      // Group templates by normalized name
      for (const template of resumeTemplatesData) {
        const normalizedName = template.name.toLowerCase().trim().replace(/\s+/g, '-');
        if (!resumeGroups.has(normalizedName)) {
          resumeGroups.set(normalizedName, []);
        }
        resumeGroups.get(normalizedName).push(template);
      }
      
      // Remove duplicates, keeping the first one (lowest ID)
      for (const [normalizedName, templates] of Array.from(resumeGroups.entries())) {
        if (templates.length > 1) {
          console.log(`Found ${templates.length} duplicate resume templates for: ${normalizedName}`);
          
          // Sort by ID to keep the oldest one
          templates.sort((a: any, b: any) => a.id - b.id);
          const toKeep = templates[0];
          const toRemove = templates.slice(1);
          
          // Remove duplicates
          for (const duplicate of toRemove) {
            await db.delete(resumeTemplates).where(eq(resumeTemplates.id, duplicate.id));
            results.resumeTemplates.duplicatesRemoved++;
            console.log(`Removed duplicate resume template: ${duplicate.name} (ID: ${duplicate.id})`);
          }
          
          results.resumeTemplates.kept++;
          console.log(`Kept resume template: ${toKeep.name} (ID: ${toKeep.id})`);
        } else {
          results.resumeTemplates.kept++;
        }
      }
      
      // Clean up cover letter templates
      const coverLetterTemplatesData = await db.select().from(coverLetterTemplates);
      const coverLetterGroups = new Map();
      
      // Group templates by normalized name
      for (const template of coverLetterTemplatesData) {
        const normalizedName = template.name.toLowerCase().trim().replace(/\s+/g, '-');
        if (!coverLetterGroups.has(normalizedName)) {
          coverLetterGroups.set(normalizedName, []);
        }
        coverLetterGroups.get(normalizedName).push(template);
      }
      
      // Remove duplicates, keeping the first one (lowest ID)
      for (const [normalizedName, templates] of Array.from(coverLetterGroups.entries())) {
        if (templates.length > 1) {
          console.log(`Found ${templates.length} duplicate cover letter templates for: ${normalizedName}`);
          
          // Sort by ID to keep the oldest one
          templates.sort((a: any, b: any) => a.id - b.id);
          const toKeep = templates[0];
          const toRemove = templates.slice(1);
          
          // Remove duplicates
          for (const duplicate of toRemove) {
            await db.delete(coverLetterTemplates).where(eq(coverLetterTemplates.id, duplicate.id));
            results.coverLetterTemplates.duplicatesRemoved++;
            console.log(`Removed duplicate cover letter template: ${duplicate.name} (ID: ${duplicate.id})`);
          }
          
          results.coverLetterTemplates.kept++;
          console.log(`Kept cover letter template: ${toKeep.name} (ID: ${toKeep.id})`);
        } else {
          results.coverLetterTemplates.kept++;
        }
      }
      
      console.log("Template cleanup completed:", results);
      
      return res.json({
        message: "Template cleanup completed successfully",
        results,
        totalDuplicatesRemoved: results.resumeTemplates.duplicatesRemoved + results.coverLetterTemplates.duplicatesRemoved,
        totalTemplatesKept: results.resumeTemplates.kept + results.coverLetterTemplates.kept
      });
    } catch (error) {
      console.error("Error cleaning up duplicate templates:", error);
      return res.status(500).json({ message: "Failed to cleanup duplicate templates" });
    }
  });
}