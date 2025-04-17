import { Express, Request, Response } from "express";
import { requireAdmin } from "server/middleware/admin";
import { storage } from "server/config/storage";
import { db } from "../../config/db";
import { 
  users, 
  resumes, 
  coverLetters, 
  jobApplications, 
  appSettings,
  apiKeys
} from "@shared/schema";
import { eq, count, and, or, desc, asc, gt, lt, gte, lte, like, ilike, inArray, isNull, notInArray, isNotNull, between, sql, sum } from "drizzle-orm";
import { hashPassword } from "../../config/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { cookieManager } from "../../utils/cookie-manager";
import os from "os";
import adminRouter from "./admin/index";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

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
  // Mount the admin router that includes server-status router
  app.use('/api/admin', adminRouter);
  
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
      const { username, email, password, fullName, isAdmin = false } = req.body;
      
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
      
      // Create new user
      const userData: any = {
        username,
        email,
        password: hashedPassword,
        fullName: fullName || username,
        isAdmin: isAdmin === true
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
  app.get('/dashboard', async (req: Request, res: Response) => {
    try {
      // Get total users count
      const [userCount] = await db.select({ count: count() }).from(users);
      
      // Get recent registrations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const [recentUsers] = await db.select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo));
      
      res.json({
        userStats: {
          total: userCount?.count || 0,
          recentRegistrations: recentUsers?.count || 0,
        }
      });
    } catch (error) {
      console.error('Error getting admin dashboard data:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });
  
  // Get all users
  app.get('/users', async (req: Request, res: Response) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        isAdmin: users.isAdmin,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt
      })
      .from(users);
      
      res.json(allUsers);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
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

  // Get server status information
  app.get("/api/admin/server-status", async (req, res) => {
    try {
      // Get basic system information
      const systemInfo = {
        os: {
          platform: os.platform(),
          release: os.release(),
          type: os.type(),
          arch: os.arch(),
          uptime: os.uptime(),
          loadAvg: os.loadavg(),
          totalMem: os.totalmem(),
          freeMem: os.freemem(),
          cpus: os.cpus().length
        },
        process: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          version: process.version,
          pid: process.pid
        }
      };

      // Get database status
      let dbStatus = { connected: false, message: "Not connected" };
      try {
        const result = await db.execute(sql`SELECT 1`);
        dbStatus = { connected: true, message: "Connected" };
      } catch (err) {
        dbStatus = { 
          connected: false, 
          message: err instanceof Error ? err.message : "Unknown database error" 
        };
      }

      // Get active sessions count
      const activeSessions = await storage.getActiveSessions();

      // Get rate limiter status
      let rateLimiterStatus: { enabled: boolean; loginAttempts?: { maxAttempts: number; duration: number; blockDuration: number; } } = { enabled: false };
      if (process.env.NODE_ENV === 'production') {
        rateLimiterStatus = { 
          enabled: true,
          loginAttempts: {
            maxAttempts: parseInt(process.env.AUTH_RATE_LIMIT_ATTEMPTS || '5'),
            duration: parseInt(process.env.AUTH_RATE_LIMIT_DURATION || '900'),
            blockDuration: parseInt(process.env.AUTH_RATE_LIMIT_BLOCK || '3600')
          }
        };
      }

      // Get user statistics
      const userStats = await storage.getUserStatistics();

      // Return all information
      res.json({
        timestamp: new Date().toISOString(),
        system: systemInfo,
        database: dbStatus,
        sessions: {
          active: activeSessions.length,
          details: activeSessions
        },
        cookies: {
          prefix: cookieManager.getPrefix(),
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          domain: process.env.COOKIE_DOMAIN || 'localhost'
        },
        rateLimiter: rateLimiterStatus,
        users: userStats
      });
    } catch (error) {
      console.error("Error fetching server status:", error);
      res.status(500).json({ 
        error: "Failed to fetch server status",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Database backup functionality
  app.get("/api/admin/backup/database", requireAdmin, async (req: Request, res: Response) => {
    try {
      const execPromise = promisify(exec);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `prosumeai-backup-${timestamp}.sql`;
      const backupDir = path.join(process.cwd(), 'backups');
      const backupPath = path.join(backupDir, backupFileName);

      // Ensure the backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Get database connection info directly from the pool
      const dbUrl = process.env.DATABASE_URL;
      console.log(`Using DATABASE_URL: ${dbUrl?.replace(/:[^:@]+@/, ':****@')}`); // Log redacted URL for debugging
      
      if (!dbUrl) {
        console.error("DATABASE_URL environment variable is not set");
        return res.status(500).json({ error: "Database connection string is not configured" });
      }

      const dbUrlRegex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
      const match = dbUrl.match(dbUrlRegex);

      if (!match) {
        console.error("Invalid DATABASE_URL format");
        return res.status(500).json({ error: "Invalid database connection string format" });
      }

      const [, user, password, host, port, database] = match;
      
      console.log(`Executing pg_dump for database ${database} on ${host}:${port} as user ${user}`);
      
      // Set environment variables for pg_dump
      const env = {
        ...process.env,
        PGPASSWORD: password
      };

      // Use absolute path to pg_dump to ensure we're using the correct binary
      const pgDumpPath = 'pg_dump'; // Use 'which pg_dump' output if needed
      const pgDumpCommand = `${pgDumpPath} -h ${host} -p ${port} -U ${user} -d ${database} -f ${backupPath}`;
      
      console.log(`Executing command: ${pgDumpCommand.replace('-U ' + user, '-U [REDACTED]')}`);
      
      try {
        const { stdout, stderr } = await execPromise(pgDumpCommand, { env });
        
        if (stderr) {
          console.warn("pg_dump warning/info:", stderr);
        }
        
        if (!fs.existsSync(backupPath)) {
          throw new Error("Backup file was not created");
        }
        
        // Get file size for logging
        const stats = fs.statSync(backupPath);
        console.log(`Backup created successfully at ${backupPath} (${stats.size} bytes)`);
        
        // Stream the file to the client
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename=${backupFileName}`);
        
        const fileStream = fs.createReadStream(backupPath);
        
        // Handle stream errors
        fileStream.on('error', (err) => {
          console.error("Error streaming backup file:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Failed to read backup file" });
          } else {
            res.end();
          }
        });
        
        // Pipe the file to the response
        fileStream.pipe(res);
        
        // Delete the file after sending
        fileStream.on('end', () => {
          fs.unlink(backupPath, (err) => {
            if (err) console.error("Error deleting backup file:", err);
            else console.log(`Temporary backup file deleted: ${backupPath}`);
          });
        });
      } catch (execError) {
        console.error("Error executing pg_dump:", execError);
        return res.status(500).json({ 
          error: "Failed to create database backup",
          details: execError instanceof Error ? execError.message : "Unknown execution error",
          command: pgDumpCommand.replace(user, '[REDACTED]').replace(password, '[REDACTED]')
        });
      }
    } catch (error) {
      console.error("Error in backup process:", error);
      res.status(500).json({ 
        error: "Failed to create database backup",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Clear rate limiter data (for testing purposes in development)
  app.post("/api/admin/clear-rate-limits", async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: "This operation is not allowed in production"
      });
    }
    
    try {
      // This would require implementing a method in your rate limiter
      // For example:
      // await resetRateLimiter();
      res.json({ success: true, message: "Rate limiter data cleared" });
    } catch (error) {
      console.error("Error clearing rate limiter data:", error);
      res.status(500).json({ error: "Failed to clear rate limiter data" });
    }
  });

  // API Keys Management
  
  // Get all API keys
  app.get("/api/admin/api-keys", requireAdmin, async (req, res) => {
    try {
      const allApiKeys = await db.select().from(apiKeys);
      
      // For security, let's not expose full keys in the list view
      const safeApiKeys = allApiKeys.map(key => {
        return {
          ...key,
          key: maskApiKey(key.key)
        };
      });
      
      res.json(safeApiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });
  
  // Get a specific API key
  app.get("/api/admin/api-keys/:id", requireAdmin, async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      
      if (isNaN(keyId)) {
        return res.status(400).json({ message: "Invalid API key ID" });
      }
      
      const apiKey = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);
      
      if (!apiKey || apiKey.length === 0) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      res.json(apiKey[0]);
    } catch (error) {
      console.error("Error fetching API key:", error);
      res.status(500).json({ message: "Failed to fetch API key" });
    }
  });
  
  // Create a new API key
  app.post("/api/admin/api-keys", requireAdmin, async (req, res) => {
    try {
      const { name, service, key } = req.body;
      
      if (!name || !key) {
        return res.status(400).json({ message: "Name and API key are required" });
      }
      
      // Create the new API key
      const newApiKey = await db.insert(apiKeys).values({
        name,
        service: service || "openai",
        key,
        isActive: true,
        createdAt: new Date(),
        lastUsed: null
      }).returning();
      
      if (!newApiKey || newApiKey.length === 0) {
        return res.status(500).json({ message: "Failed to create API key" });
      }
      
      res.status(201).json(newApiKey[0]);
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });
  
  // Toggle API key status (active/inactive)
  app.patch("/api/admin/api-keys/:id/toggle", requireAdmin, async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      
      if (isNaN(keyId)) {
        return res.status(400).json({ message: "Invalid API key ID" });
      }
      
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({ message: "isActive status is required" });
      }
      
      const updatedKey = await db.update(apiKeys)
        .set({ isActive })
        .where(eq(apiKeys.id, keyId))
        .returning();
      
      if (!updatedKey || updatedKey.length === 0) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      res.json(updatedKey[0]);
    } catch (error) {
      console.error("Error updating API key status:", error);
      res.status(500).json({ message: "Failed to update API key status" });
    }
  });
  
  // Delete an API key
  app.delete("/api/admin/api-keys/:id", requireAdmin, async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      
      if (isNaN(keyId)) {
        return res.status(400).json({ message: "Invalid API key ID" });
      }
      
      const deletedKey = await db.delete(apiKeys)
        .where(eq(apiKeys.id, keyId))
        .returning();
      
      if (!deletedKey || deletedKey.length === 0) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      res.json({ message: "API key deleted successfully" });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Failed to delete API key" });
    }
  });
}

// Helper function to mask API keys for display
function maskApiKey(key: string): string {
  if (!key) return "";
  // Show only first 4 and last 4 characters
  return key.substring(0, 4) + "..." + key.substring(key.length - 4);
}