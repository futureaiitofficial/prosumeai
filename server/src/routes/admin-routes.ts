import { Express, Request, Response } from "express";
import { requireAdmin } from "../../middleware/admin";
import { storage } from "server/config/storage";
import { db } from "../../config/db";
import { 
  users, 
  resumes, 
  coverLetters, 
  jobApplications, 
  appSettings,
} from "@shared/schema";
import { eq, count, and, or, desc, asc, gt, lt, gte, lte, like, ilike, inArray, isNull, notInArray, isNotNull, between } from "drizzle-orm";
import { hashPassword } from "../../config/auth";
import { sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const templateStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'templates');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Get the template ID from the request parameters
    const templateId = req.params.id;
    const fileType = path.extname(file.originalname);
    
    // Create a filename pattern: template-[id]-[timestamp][extension]
    const fileName = `template-${templateId}-${Date.now()}${fileType}`;
    cb(null, fileName);
  }
});

// Set up the multer upload with file filtering
const upload = multer({
  storage: templateStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Accept only images
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error("Only image files are allowed!"));
  }
});

/**
 * Register admin-only routes
 */
export function registerAdminRoutes(app: Express) {
  // Debug endpoint - available without admin check to help troubleshoot admin access
  app.get("/api/admin/debug", (req: Request, res: Response) => {
    console.log("Admin debug endpoint accessed");
    
    // Check if the user is authenticated at all
    const isAuthenticated = req.isAuthenticated();
    console.log(`User authenticated: ${isAuthenticated}`);
    
    // Check if the user object exists
    const hasUserObject = !!req.user;
    console.log(`Has user object: ${hasUserObject}`);
    
    // Safety check - create a typed user object
    const user = req.user as Express.User | undefined;
    
    // Check if the user is an admin
    const isAdmin = hasUserObject && user?.isAdmin === true;
    console.log(`Is admin: ${isAdmin}`);
    
    // Return detailed debugging information
    return res.json({
      isAuthenticated,
      hasUserObject,
      isAdmin,
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      } : null,
      sessionID: req.sessionID,
      cookies: req.headers.cookie
    });
  });

  // Special route for initializing the first admin
  // This only works if there are no admin users in the system
  app.post("/api/admin/init", async (req: Request, res: Response) => {
    try {
      // Check if there are any admin users
      const [{ total }] = await db
        .select({ total: count() })
        .from(users)
        .where(eq(users.isAdmin, true));
      
      if (total > 0) {
        return res.status(403).json({ 
          message: "Admin users already exist in the system" 
        });
      }
      
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // First check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the user to be an admin
      const updatedUser = await storage.updateUser(userId, { isAdmin: true });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Remove password before sending response
      const { password, ...safeUser } = updatedUser;
      
      res.json({ 
        message: "First admin user successfully created",
        user: safeUser
      });
    } catch (error) {
      console.error("Error initializing admin:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Check if user is admin
  app.get("/api/admin/check", requireAdmin, (req, res) => {
    res.json({ isAdmin: true });
  });

  // Get all users (admin only)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      // Get all users from the database
      const allUsers = await db.select().from(users);
      
      // Remove password field for security
      const safeUsers = allUsers.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Get a specific user by ID (admin only)
  app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password field for security
      const { password, ...safeUser } = user;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Update a user (admin only)
  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user with new data
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Remove password field for security
      const { password, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Create a new user (admin only)
  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { username, email, password, fullName, planId, isAdmin = false } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }
      
      // Check if username or email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.username, username),
            eq(users.email, email)
          )
        )
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.status(409).json({ 
          message: "A user with this username or email already exists" 
        });
      }
      
      // Hash the password before storing it
      const hashedPassword = await hashPassword(password);
      
      // Create new user with plan if provided
      const userData: any = {
        username,
        email,
        password: hashedPassword,
        fullName: fullName || username,
        isAdmin: isAdmin === true,
        subscriptionStatus: planId ? "active" : "none",
        subscriptionPlanId: planId || null
      };
      
      const newUser = await storage.createUser(userData);
      
      if (!newUser) {
        return res.status(500).json({ message: "Failed to create user" });
      }

      // Remove password before sending response
      const { password: pwd, ...safeUser } = newUser;
      
      res.status(201).json({
        user: safeUser,
        message: "User created successfully"
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Delete a user (admin only)
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Don't allow deleting the authenticated user
      if (req.user && userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Make sure we're not deleting the last admin
      if (user.isAdmin) {
        const admins = await db.select().from(users).where(eq(users.isAdmin, true));
        
        if (admins.length <= 1) {
          return res.status(400).json({ 
            message: "Cannot delete the last admin user" 
          });
        }
      }
      
      // Delete user
      // NOTE: In a real application, we might want to implement soft delete
      // or handle cascading deletions for related data
      
      // For now, this is a basic implementation
      await db.delete(users).where(eq(users.id, userId));
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  // Promote a user to admin (admin only)
  app.post("/api/admin/promote", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // First check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the user to be an admin
      const updatedUser = await storage.updateUser(userId, { isAdmin: true });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Remove password before sending response
      const { password, ...safeUser } = updatedUser;
      
      res.json({ 
        message: "User successfully promoted to admin",
        user: safeUser
      });
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Demote a user from admin (admin only)
  app.post("/api/admin/demote", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // First check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Make sure we're not demoting the last admin
      const admins = await db.select().from(users).where(eq(users.isAdmin, true));
      
      if (admins.length <= 1 && user.isAdmin) {
        return res.status(400).json({ 
          message: "Cannot demote the last admin user" 
        });
      }
      
      // Update the user to not be an admin
      const updatedUser = await storage.updateUser(userId, { isAdmin: false });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Remove password before sending response
      const { password, ...safeUser } = updatedUser;
      
      res.json({ 
        message: "User successfully demoted from admin",
        user: safeUser
      });
    } catch (error) {
      console.error("Error demoting user from admin:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get dashboard statistics
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      // Get user count
      const [usersCount] = await db
        .select({ total: count() })
        .from(users);
      
      // Get resume count
      const [resumesCount] = await db
        .select({ total: count() })
        .from(resumes);
      
      // Get cover letter count
      const [coverLettersCount] = await db
        .select({ total: count() })
        .from(coverLetters);
      
      // Get job application count
      const [jobApplicationsCount] = await db
        .select({ total: count() })
        .from(jobApplications);
      
      // Add some logging to help debug
      console.log("Admin stats endpoint accessed by user:", req.user?.id);
      console.log("Stats being returned:", {
        users: usersCount.total,
        resumes: resumesCount.total,
        coverLetters: coverLettersCount.total,
        applications: jobApplicationsCount.total
      });
      
      return res.json({
        users: usersCount.total,
        resumes: resumesCount.total,
        coverLetters: coverLettersCount.total,
        applications: jobApplicationsCount.total
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
 
  // Add a new endpoint to get user statistics
  app.get("/api/admin/users/:id/stats", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get resource counts
      const resumeCount = await storage.getResumeCount(userId);
      const coverLetterCount = await storage.getCoverLetterCount(userId);
      const jobApplicationCount = await storage.getJobApplicationCount(userId);
  
      
      res.json({
        resumeCount,
        coverLetterCount,
        jobAppCount: jobApplicationCount,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });
  
  // Add a new endpoint for app settings
  app.get("/api/admin/settings/:category?", requireAdmin, async (req, res) => {
    try {
      const category = req.params.category;
      let settings;
      
      if (category) {
        settings = await storage.getAppSettings(category);
      } else {
        settings = await storage.getAppSettings();
      }
      
      // Format settings into a more user-friendly structure
      const formattedSettings: Record<string, any> = {};
      
      settings.forEach(setting => {
        if (!formattedSettings[setting.category]) {
          formattedSettings[setting.category] = {};
        }
        formattedSettings[setting.category][setting.key] = setting.value;
      });
      
      res.json(formattedSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  
  // Update app settings
  app.post("/api/admin/settings/:category", requireAdmin, async (req, res) => {
    try {
      const category = req.params.category;
      const settingsData = req.body;
      
      if (!category || !settingsData || typeof settingsData !== 'object') {
        return res.status(400).json({ message: "Invalid settings data" });
      }
      
      // Process each setting
      const results = [];
      
      for (const [key, value] of Object.entries(settingsData)) {
        const setting = await storage.upsertAppSetting(key, value, category);
        if (setting) {
          results.push(setting);
        }
      }
      
      res.json({
        message: `${category} settings updated successfully`,
        updated: results.length
      });
    } catch (error) {
      console.error(`Error updating ${req.params.category} settings:`, error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // TEMPLATE IMAGE MANAGEMENT ROUTES

  // Get all template images
  app.get("/api/admin/templates/images", requireAdmin, async (req, res) => {
    try {
      // Set CORS headers for image URLs
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      const imagesDir = path.join(process.cwd(), 'public', 'images', 'templates');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
        return res.json({ images: [] });
      }
      
      // Read the directory
      const files = fs.readdirSync(imagesDir);
      
      // Map to full URLs - use relative URLs instead of absolute to avoid CORS issues
      const images = files.map(file => ({
        name: file,
        url: `/images/templates/${file}`,
        size: fs.statSync(path.join(imagesDir, file)).size
      }));
      
      console.log(`Returning ${images.length} template images`);
      
      res.json({ images });
    } catch (error) {
      console.error('Error getting template images:', error);
      res.status(500).json({ message: 'Failed to get template images' });
    }
  });

  // Upload a template image
  app.post("/api/admin/templates/:id/image", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      // Set CORS headers for the response
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      if (!req.file) {
        return res.status(400).json({ message: 'No image provided' });
      }
      
      const templateId = req.params.id;
      
      // Get the file information
      const filename = req.file.filename;
      // Use relative URL instead of absolute to avoid CORS issues
      const imageUrl = `/images/templates/${filename}`;
      
      // Log success information
      console.log(`Template image uploaded: ${filename} for template ID: ${templateId}`);
      console.log(`Image URL: ${imageUrl}`);
      
      // Return the URL of the uploaded image
      res.json({ 
        message: 'Template image uploaded successfully',
        templateId,
        imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Error uploading template image:', error);
      res.status(500).json({ message: 'Failed to upload template image' });
    }
  });

  // Delete a template image
  app.delete("/api/admin/templates/images/:filename", requireAdmin, async (req, res) => {
    try {
      // Set CORS headers for the response
      res.header('Access-Control-Allow-Origin', '*');
      
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), 'public', 'images', 'templates', filename);
      
      console.log(`Attempting to delete template image: ${filename}`);
      console.log(`File path: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return res.status(404).json({ message: 'Image not found' });
      }
      
      // Delete the file
      fs.unlinkSync(filePath);
      console.log(`File successfully deleted: ${filePath}`);
      
      res.json({ message: 'Template image deleted successfully' });
    } catch (error) {
      console.error('Error deleting template image:', error);
      res.status(500).json({ message: 'Failed to delete template image' });
    }
  });
}