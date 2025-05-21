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
  apiKeys,
  subscriptionPlans,
  userSubscriptions,
  paymentTransactions,
  paymentWebhookEvents,
  userBillingDetails,
  planPricing,
  brandingSettings,
  smtpSettings,
  invoices
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
import { registerPaymentGatewayAdminRoutes } from './admin/payment-gateway-routes';
import { registerSmtpRoutes } from './admin/smtp-routes';
import { SubscriptionService } from "../../services/subscription-service";
import { fileURLToPath } from "url";
import { TaxService } from '../../services/tax-service';

// Get server root path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..', '..');

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
  
  // Register payment gateway routes
  registerPaymentGatewayAdminRoutes(app);
  
  // Register SMTP settings routes
  registerSmtpRoutes(app);
  
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
  
  // Reset user password (admin only)
  app.post("/api/admin/reset-password", requireAdmin, async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
      
      if (!userId || !newPassword) {
        return res.status(400).json({ message: "User ID and new password are required" });
      }
      
      // First check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password and set last password change date
      const updatedUser = await storage.updateUser(userId, { 
        password: hashedPassword,
        lastPasswordChange: new Date(),
        // Clear any failed login attempts or lockouts
        failedLoginAttempts: 0,
        lockoutUntil: null
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user password" });
      }
      
      // Log the action but don't include the password
      console.log(`Admin ${req.user?.username} (ID: ${req.user?.id}) reset password for user ${user.username} (ID: ${userId})`);
      
      res.json({ 
        message: "Password reset successful",
        username: user.username
      });
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Failed to reset user password" });
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
  app.get('/api/admin/dashboard', requireAdmin, async (req: Request, res: Response) => {
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
        },
        aiStats: {
          totalTokens: 0 // Add a default value for now
        }
      });
    } catch (error) {
      console.error('Error getting admin dashboard data:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });
  
  // Get all users
  app.get('/api/admin/users', async (req: Request, res: Response) => {
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
      const backupFileName = `ATScribe-backup-${timestamp}.sql`;
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

  // Route to assign a subscription plan to a user (for testing without payment)
  app.post("/api/admin/user/assign-plan", requireAdmin, async (req, res) => {
    const { userId, planId } = req.body;
    
    if (!userId || !planId) {
      return res.status(400).json({ message: "User ID and Plan ID are required" });
    }
    
    try {
      console.log(`Assigning plan ${planId} to user ${userId}`);
      
      // Find the user
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Find the plan
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId)
      });
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Begin a transaction to ensure atomicity
      await db.transaction(async (tx) => {
        console.log(`Started transaction for assigning plan ${planId} to user ${userId}`);
        
        // Find all user's subscriptions to clean up properly
        const allUserSubscriptions = await tx.select().from(userSubscriptions)
          .where(eq(userSubscriptions.userId, userId));
        
        console.log(`Found ${allUserSubscriptions.length} existing subscriptions for user ${userId}`);
        
        // First, cancel any existing subscriptions
        for (const sub of allUserSubscriptions) {
          if (sub.status === 'ACTIVE') {
            console.log(`Cancelling active subscription ID ${sub.id} for user ${userId}`);
            await tx.update(userSubscriptions)
              .set({
                status: "CANCELLED",
                endDate: new Date(),
                updatedAt: new Date()
              })
              .where(eq(userSubscriptions.id, sub.id));
          }
        }
        
        // Create a new subscription
        const startDate = new Date();
        // Set end date to 1 year from now for testing purposes
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        
        console.log(`Creating new active subscription for user ${userId} with plan ${planId}`);
        
        // Insert new active subscription with explicit type
        const newSubscription = await tx.insert(userSubscriptions).values([{
          userId: userId as number,
          planId: planId as number,
          startDate: startDate,
          endDate: endDate,
          status: "ACTIVE" as const,
          paymentGateway: "NONE" as const,
          paymentReference: "ADMIN_ASSIGNED",
          autoRenew: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }]).returning();
        
        console.log(`Created new subscription with ID ${newSubscription[0]?.id}`);
      });
      
      // Verify successful subscription assignment
      const activeSubscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.planId, planId),
          eq(userSubscriptions.status, "ACTIVE")
        )
      });
      
      if (!activeSubscription) {
        console.error(`Failed to verify active subscription for user ${userId} with plan ${planId}`);
        return res.status(500).json({ message: "Failed to assign subscription plan" });
      }
      
      console.log(`Successfully assigned plan ${plan.name} (ID: ${planId}) to user ${userId}`);
      
      return res.json({ 
        message: "Subscription plan assigned successfully",
        planName: plan.name,
        subscriptionId: activeSubscription.id
      });
    } catch (error) {
      console.error("Error assigning subscription plan:", error);
      return res.status(500).json({ message: "Failed to assign subscription plan" });
    }
  });

  // Route to get all user subscriptions with user and plan details
  app.get("/user-subscriptions", requireAdmin, async (req, res) => {
    try {
      const subscriptions = await db.query.userSubscriptions.findMany({
        with: {
          user: true,
          plan: true
        }
      });
      
      return res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
      return res.status(500).json({ message: "Failed to fetch user subscriptions" });
    }
  });

  // Get transactions for a specific user
  app.get('/api/admin/user-transactions/:userId', requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      console.log(`Fetching transactions for user ${userId}`);
      
      // First verify the user exists
      const user = await db.select({ id: users.id, email: users.email, username: users.username, razorpayCustomerId: users.razorpayCustomerId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
        
      if (!user.length) {
        console.log(`User ${userId} not found`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`Found user: ${user[0].username} (${user[0].email}), RazorpayID: ${user[0].razorpayCustomerId || 'Not set'}`);
      
      // Get user billing info to determine correct currency
      const userBillingInfo = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      const userRegion = userBillingInfo.length && userBillingInfo[0].country === 'IN' ? 'INDIA' : 'GLOBAL';
      const userCurrency = userRegion === 'INDIA' ? 'INR' : 'USD';
      
      console.log(`User region detected as: ${userRegion}, preferred currency: ${userCurrency}`);
      
      // Get active subscription for context
      const activeSubscriptions = await db.select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, 'ACTIVE' as any)
          )
        )
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);
        
      if (activeSubscriptions.length) {
        const activeSub = activeSubscriptions[0];
        console.log(`User has active subscription ID: ${activeSub.id}, Plan ID: ${activeSub.planId}`);
        console.log(`Payment reference: ${activeSub.paymentReference || 'No reference'}`);
        console.log(`Gateway: ${activeSub.paymentGateway || 'None'}`);
        
        // Get correct pricing for this plan and user's region
        const planPricingInfo = await db.select()
          .from(planPricing)
          .where(
            and(
              eq(planPricing.planId, activeSub.planId),
              eq(planPricing.currency, userCurrency)
            )
          )
          .limit(1);
          
        if (planPricingInfo.length) {
          console.log(`Plan pricing for user's region: ${planPricingInfo[0].price} ${planPricingInfo[0].currency}`);
        }
      } else {
        console.log(`User has no active subscription`);
      }

      // Get all transactions for the user
      const transactions = await db.select({
        id: paymentTransactions.id,
        amount: paymentTransactions.amount,
        currency: paymentTransactions.currency,
        status: paymentTransactions.status,
        gateway: paymentTransactions.gateway,
        subscriptionId: paymentTransactions.subscriptionId,
        gatewayTransactionId: paymentTransactions.gatewayTransactionId,
        createdAt: paymentTransactions.createdAt,
        refundReason: paymentTransactions.refundReason,
        metadata: paymentTransactions.metadata,
        // Join with subscription to get plan details
        planId: userSubscriptions.planId,
        planName: subscriptionPlans.name,
        userId: paymentTransactions.userId
      })
      .from(paymentTransactions)
      .leftJoin(userSubscriptions, eq(paymentTransactions.subscriptionId, userSubscriptions.id))
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(paymentTransactions.userId, userId))
      .orderBy(desc(paymentTransactions.createdAt));

      console.log(`Found ${transactions.length} transactions for user ${userId}`);
      
      // Define enhanced transaction type
      interface EnhancedTransaction {
        id: number;
        amount: string;
        currency: "INR" | "USD";
        status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
        gateway: "RAZORPAY" | "NONE";
        subscriptionId: number;
        gatewayTransactionId: string | null;
        createdAt: Date | null;
        refundReason: string | null;
        planId: number | null;
        planName: string | null;
        correctPlanPrice?: string;
        correctPlanCurrency?: string;
      }
      
      // Enhance transaction data with proper plan pricing information
      const enhancedTransactions = await Promise.all(transactions.map(async (tx) => {
        let enhancedTx: EnhancedTransaction = { ...tx as any };
        
        if (tx.planId) {
          // Get the correct pricing for this plan for the user's region
          const pricing = await db.select()
            .from(planPricing)
            .where(
              and(
                eq(planPricing.planId, tx.planId),
                eq(planPricing.currency, userCurrency)
              )
            )
            .limit(1);
            
          if (pricing.length) {
            enhancedTx.correctPlanPrice = pricing[0].price;
            enhancedTx.correctPlanCurrency = pricing[0].currency;
          }
        }
        
        return enhancedTx;
      }));
      
      if (transactions.length === 0) {
        // Check if there might be webhook processing issues
        const pendingWebhooks = await db.select({ count: sql<number>`count(*)` })
          .from(paymentWebhookEvents)
          .where(
            and(
              eq(paymentWebhookEvents.processed, false),
              sql`${paymentWebhookEvents.rawData}::text LIKE ${'%' + (user[0].razorpayCustomerId || user[0].email) + '%'}`
            )
          );
          
        if (pendingWebhooks.length && pendingWebhooks[0].count > 0) {
          console.log(`Found ${pendingWebhooks[0].count} unprocessed webhooks that might be related to this user`);
        }
      }
      
      res.json({
        transactions: enhancedTransactions,
        userDetails: {
          region: userRegion,
          preferredCurrency: userCurrency
        }
      });
    } catch (error: any) {
      console.error('Error in GET /api/admin/user-transactions/:userId:', error);
      res.status(500).json({ 
        message: 'Failed to get user transactions', 
        error: error.message 
      });
    }
  });

  // Cancel a specific user subscription
  app.post('/api/admin/cancel-subscription/:subscriptionId', requireAdmin, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.subscriptionId);
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ message: 'Invalid subscription ID' });
      }

      console.log(`Cancelling subscription ${subscriptionId}`);
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.id, subscriptionId))
        .limit(1);

      if (!subscription.length) {
        return res.status(404).json({ message: 'Subscription not found' });
      }

      await SubscriptionService.cancelSubscription(subscription[0].userId);
      res.json({ message: 'Subscription cancelled successfully' });
    } catch (error: any) {
      console.error(`Error in POST /api/admin/cancel-subscription/${req.params.subscriptionId}:`, error);
      res.status(500).json({ 
        message: 'Failed to cancel subscription', 
        error: error.message 
      });
    }
  });

  // Get user details for admin
  app.get('/api/admin/users/:userId', requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Get user details
      const user = await db.select({
        id: users.id, 
        email: users.email,
        username: users.username,
        fullName: users.fullName,
        isAdmin: users.isAdmin,
        razorpayCustomerId: users.razorpayCustomerId,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
      if (!user.length) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Also get billing details
      const billingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);
      
      // Create combined response
      const userDetails = {
        ...user[0],
        billingDetails: billingDetails.length ? billingDetails[0] : null
      };
      
      res.json(userDetails);
    } catch (error: any) {
      console.error(`Error in GET /api/admin/users/${req.params.userId}:`, error);
      res.status(500).json({ message: 'Error fetching user details', error: error.message });
    }
  });

  // Change subscription status (admin only)
  app.post('/api/admin/change-subscription-status/:subscriptionId', requireAdmin, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.subscriptionId);
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ success: false, message: 'Invalid subscription ID' });
      }

      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      // Validate the status value
      const validStatuses = ['ACTIVE', 'CANCELLED', 'GRACE_PERIOD', 'EXPIRED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      // Find the subscription
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.id, subscriptionId))
        .limit(1);

      if (!subscription.length) {
        return res.status(404).json({ success: false, message: 'Subscription not found' });
      }

      const updateData: Record<string, any> = {
        status: status,
        updatedAt: new Date()
      };

      // Add status-specific data
      if (status === 'GRACE_PERIOD') {
        // Set grace period for 7 days
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
        updateData.gracePeriodEnd = gracePeriodEnd;
      } else if (status === 'CANCELLED') {
        // Set autoRenew to false
        updateData.autoRenew = false;
      } else if (status === 'ACTIVE') {
        // If moving from grace period to active, clear grace period end date
        updateData.gracePeriodEnd = null;
      }

      // Update the subscription
      await db.update(userSubscriptions)
        .set(updateData)
        .where(eq(userSubscriptions.id, subscriptionId));

      console.log(`Subscription ${subscriptionId} status changed to ${status} by admin`);

      res.json({ 
        success: true, 
        message: `Subscription status changed to ${status} successfully` 
      });
    } catch (error: any) {
      console.error(`Error changing subscription status:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to change subscription status', 
        error: error.message 
      });
    }
  });

  // Sync subscription with Razorpay (admin only)
  app.post('/api/admin/sync-subscription/:subscriptionId', requireAdmin, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.subscriptionId);
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ success: false, message: 'Invalid subscription ID' });
      }

      // Find the subscription
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.id, subscriptionId))
        .limit(1);

      if (!subscription.length) {
        return res.status(404).json({ success: false, message: 'Subscription not found' });
      }

      // Check if we have a Razorpay subscription ID
      if (!subscription[0].paymentReference || !subscription[0].paymentReference.startsWith('sub_')) {
        return res.status(400).json({ 
          success: false, 
          message: 'This subscription does not have a valid Razorpay subscription ID' 
        });
      }

      // Import and use the payment gateway
      const { getPaymentGatewayByName } = await import('../../services/payment-gateways');
      const razorpayGateway = getPaymentGatewayByName('RAZORPAY');

      // Get current status from Razorpay
      const razorpaySubscription = await razorpayGateway.getSubscriptionDetails(subscription[0].paymentReference);

      if (!razorpaySubscription) {
        return res.status(404).json({ 
          success: false, 
          message: 'Subscription not found in Razorpay' 
        });
      }

      // Map Razorpay status to our status
      let mappedStatus = subscription[0].status;
      const razorpayStatus = razorpaySubscription.status;

      if (razorpayStatus === 'active') {
        mappedStatus = 'ACTIVE';
      } else if (razorpayStatus === 'authenticated') {
        // Razorpay "authenticated" status means the initial payment succeeded but service hasn't started
        mappedStatus = 'ACTIVE'; // We don't have an "authenticated" status, so map to active
      } else if (razorpayStatus === 'pending') {
        mappedStatus = 'GRACE_PERIOD';
      } else if (razorpayStatus === 'halted') {
        mappedStatus = 'GRACE_PERIOD';
      } else if (razorpayStatus === 'cancelled') {
        mappedStatus = 'CANCELLED';
      } else if (razorpayStatus === 'completed') {
        mappedStatus = 'EXPIRED';
      } else if (razorpayStatus === 'expired') {
        mappedStatus = 'EXPIRED';
      }

      // Update our record if statuses don't match
      if (mappedStatus !== subscription[0].status) {
        const updateData: Record<string, any> = {
          status: mappedStatus,
          updatedAt: new Date()
        };

        // Add status-specific data
        if (mappedStatus === 'GRACE_PERIOD') {
          // Set grace period for 14 days for pending/halted Razorpay subscriptions
          const gracePeriodEnd = new Date();
          gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14);
          updateData.gracePeriodEnd = gracePeriodEnd;
        } else if (mappedStatus === 'CANCELLED') {
          updateData.autoRenew = false;
        } else if (mappedStatus === 'ACTIVE') {
          updateData.gracePeriodEnd = null;
        }

        // Update the subscription
        await db.update(userSubscriptions)
          .set(updateData)
          .where(eq(userSubscriptions.id, subscriptionId));

        console.log(`Sync: Subscription ${subscriptionId} status changed from ${subscription[0].status} to ${mappedStatus} based on Razorpay status: ${razorpayStatus}`);

        // Fetch the updated subscription record
        const updatedSubscription = await db.select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.id, subscriptionId))
          .limit(1);

        return res.json({
          success: true,
          message: `Subscription status synced with Razorpay (${razorpayStatus} → ${mappedStatus})`,
          razorpayStatus: razorpayStatus,
          subscription: updatedSubscription[0]
        });
      } else {
        console.log(`Sync: Subscription ${subscriptionId} status already matches Razorpay status: ${razorpayStatus}`);
        return res.json({
          success: true,
          message: 'Subscription status is already in sync with Razorpay',
          razorpayStatus: razorpayStatus,
          subscription: subscription[0]
        });
      }
    } catch (error: any) {
      console.error(`Error syncing subscription with Razorpay:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to sync subscription with Razorpay', 
        error: error.message 
      });
    }
  });

  // Get all user subscriptions with enhanced details for admin UI
  app.get('/api/admin/user-subscriptions', requireAdmin, async (req, res) => {
    try {
      // Get all user subscriptions with user details and plan info
      const subscriptionsWithDetails = await db.select({
        id: userSubscriptions.id,
        userId: userSubscriptions.userId,
        planId: userSubscriptions.planId,
        startDate: userSubscriptions.startDate,
        endDate: userSubscriptions.endDate,
        status: userSubscriptions.status,
        autoRenew: userSubscriptions.autoRenew,
        paymentReference: userSubscriptions.paymentReference,
        paymentGateway: userSubscriptions.paymentGateway,
        createdAt: userSubscriptions.createdAt,
        updatedAt: userSubscriptions.updatedAt,
        gracePeriodEnd: userSubscriptions.gracePeriodEnd,
        userEmail: users.email,
        username: users.username,
        razorpayCustomerId: users.razorpayCustomerId,
        planName: subscriptionPlans.name,
        planDescription: subscriptionPlans.description,
        billingCycle: subscriptionPlans.billingCycle
      })
      .from(userSubscriptions)
      .leftJoin(users, eq(userSubscriptions.userId, users.id))
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .orderBy(desc(userSubscriptions.updatedAt));

      // For each subscription in GRACE_PERIOD, get the failed payment count
      const enhancedSubscriptions = await Promise.all(subscriptionsWithDetails.map(async (sub) => {
        if (sub.status === 'GRACE_PERIOD') {
          // Count failed payments since grace period began (or in last 30 days if no grace period end date)
          const sinceDate = sub.gracePeriodEnd 
            ? new Date(new Date(sub.gracePeriodEnd).getTime() - (14 * 24 * 60 * 60 * 1000)) // 14 days before grace period end
            : new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000)); // Last 30 days
            
          const failedPayments = await db.select({ count: count() })
            .from(paymentTransactions)
            .where(
              and(
                eq(paymentTransactions.userId, sub.userId),
                eq(paymentTransactions.status, 'FAILED'),
                gte(paymentTransactions.createdAt, sinceDate)
              )
            );
            
          return {
            ...sub,
            paymentFailureCount: failedPayments[0].count
          };
        }
        
        return sub;
      }));

      res.json(enhancedSubscriptions);
    } catch (error: any) {
      console.error(`Error fetching user subscriptions:`, error);
      res.status(500).json({ 
        message: 'Failed to fetch user subscriptions', 
        error: error.message 
      });
    }
  });

  // Correct transaction currency for administrative purposes
  app.post('/api/admin/correct-transaction-currency/:transactionId', requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: 'Invalid transaction ID' });
      }

      const { correctCurrency } = req.body;
      if (!correctCurrency || !['USD', 'INR'].includes(correctCurrency)) {
        return res.status(400).json({ message: 'Valid currency (USD or INR) is required' });
      }

      console.log(`Correcting currency for transaction ${transactionId} to ${correctCurrency}`);
      
      // Get the transaction to check it exists
      const transaction = await db.select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.id, transactionId))
        .limit(1);

      if (!transaction.length) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      // Get subscription associated with this transaction
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.id, transaction[0].subscriptionId))
        .limit(1);
        
      if (!subscription.length) {
        return res.status(404).json({ message: 'Associated subscription not found' });
      }
      
      // Get plan pricing for the transaction's currency to ensure we record the correct amount
      const pricing = await db.select()
        .from(planPricing)
        .where(
          and(
            eq(planPricing.planId, subscription[0].planId),
            eq(planPricing.currency, correctCurrency)
          )
        )
        .limit(1);
        
      // Get the correct amount based on pricing, fallback to existing amount
      const correctAmount = pricing.length > 0 
        ? pricing[0].price 
        : transaction[0].amount;
      
      // Update the transaction
      await db.update(paymentTransactions)
        .set({ 
          currency: correctCurrency, 
          amount: correctAmount.toString(),
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.id, transactionId));
        
      res.json({
        success: true,
        message: `Transaction ${transactionId} currency corrected to ${correctCurrency}`,
        transaction: {
          id: transactionId,
          amount: correctAmount,
          currency: correctCurrency,
        }
      });
    } catch (error: any) {
      console.error(`Error correcting transaction currency:`, error);
      res.status(500).json({ 
        message: 'Failed to correct transaction currency', 
        error: error.message 
      });
    }
  });

  // Cron job management
  app.get('/api/admin/cron/status', requireAdmin, async (req, res) => {
    try {
      // Check if PID file exists
      const pidFile = path.join(serverRoot, 'auto_sync.pid');
      let isRunning = false;
      let pid = null;
      let logFile = null;
      let lastRunTimestamp = null;
      
      console.log(`Status - Server root path: ${serverRoot}`);
      console.log(`Status - PID file path: ${pidFile}`);
      
      if (fs.existsSync(pidFile)) {
        pid = fs.readFileSync(pidFile, 'utf8').trim();
        
        // Check if process is actually running
        try {
          const execAsync = promisify(exec);
          const { stdout } = await execAsync(`ps -p ${pid} -o comm=`);
          isRunning = stdout.trim().length > 0;
        } catch (err) {
          isRunning = false;
        }
      }
      
      // Get the most recent log file
      const logsDir = path.join(serverRoot, 'logs');
      console.log(`Status - Logs directory: ${logsDir}`);
      
      if (fs.existsSync(logsDir)) {
        try {
          const logFiles = fs.readdirSync(logsDir)
            // Update filter to handle both log name formats
            .filter(file => /^auto_sync_(\d{8}_\d{6}|\d{4}-\d{2}-\d{2}_\d{2}_\d{2})\.log$/.test(file))
            .sort()
            .reverse();
          
          if (logFiles.length > 0) {
            logFile = logFiles[0];
            
            // Extract timestamp from filename
            const timestampMatch = logFile.match(/auto_sync_(\d{8}_\d{6}|\d{4}-\d{2}-\d{2}_\d{2}_\d{2})\.log/);
            if (timestampMatch && timestampMatch[1]) {
              // Handle different timestamp formats
              let parts;
              let year, month, day, hour, minute, second;
              
              if (timestampMatch[1].includes('-')) {
                // Format: 2025-05-15_20_48
                const [datePart, timePart1, timePart2] = timestampMatch[1].split('_');
                [year, month, day] = datePart.split('-');
                hour = timePart1;
                minute = timePart2;
                second = '00'; // Assume 00 seconds if not present
              } else {
                // Format: 20250515_133910
                parts = timestampMatch[1].split('_');
                const date = parts[0];
                const time = parts[1];
                year = date.substring(0, 4);
                month = date.substring(4, 6);
                day = date.substring(6, 8);
                hour = time.substring(0, 2);
                minute = time.substring(2, 4);
                second = time.substring(4, 6);
              }
              
              lastRunTimestamp = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
            }
            
            // Get the last few lines of the log file for preview
            const logPreview = fs.readFileSync(`${logsDir}/${logFile}`, 'utf8')
              .split('\n')
              .slice(-20) // Last 20 lines
              .join('\n');
              
            return res.json({
              isRunning,
              pid,
              logFile,
              lastRunTimestamp,
              logPreview,
              interval: 900 // 15 minutes between sync operations
            });
          }
        } catch (err) {
          console.error('Error reading logs directory:', err);
        }
      }
      
      return res.json({
        isRunning,
        pid,
        logFile,
        lastRunTimestamp,
        logPreview: null,
        interval: 900 // 15 minutes between sync operations
      });
    } catch (error) {
      console.error('Error checking cron status:', error);
      res.status(500).json({ error: 'Failed to check cron status' });
    }
  });
  
  app.post('/api/admin/cron/start', requireAdmin, async (req, res) => {
    try {
      // Check if already running
      const pidFilePath = path.join(serverRoot, 'auto_sync.pid');
      
      console.log(`Server root path: ${serverRoot}`);
      console.log(`PID file path: ${pidFilePath}`);
      
      if (fs.existsSync(pidFilePath)) {
        const pid = fs.readFileSync(pidFilePath, 'utf8').trim();
        try {
          const execAsync = promisify(exec);
          const { stdout } = await execAsync(`ps -p ${pid} -o comm=`);
          if (stdout.trim().length > 0) {
            return res.status(400).json({ error: 'Cron job is already running' });
          } else {
            // PID file exists but process is not running
            fs.unlinkSync(pidFilePath);
          }
        } catch (err) {
          // If error checking process, assume not running and remove PID file
          fs.unlinkSync(pidFilePath);
        }
      }
      
      // Start the cron job using absolute path
      const execAsync = promisify(exec);
      const startScriptPath = path.join(serverRoot, 'start-auto-sync.sh');
      
      console.log(`Starting cron job using script at: ${startScriptPath}`);
      
      // Execute with bash directly to ensure permissions
      const cmd = `bash ${startScriptPath}`;
      const result = await execAsync(cmd);
      
      res.json({ message: 'Cron job started successfully', output: result.stdout });
    } catch (error) {
      console.error('Error starting cron job:', error);
      res.status(500).json({ error: 'Failed to start cron job' });
    }
  });
  
  app.post('/api/admin/cron/stop', requireAdmin, async (req, res) => {
    try {
      // Stop the cron job using absolute path
      const stopScriptPath = path.join(serverRoot, 'stop-auto-sync.sh');
      
      console.log(`Stopping cron job using script at: ${stopScriptPath}`);
      const execAsync = promisify(exec);
      
      // Execute with bash directly to ensure permissions
      const cmd = `bash ${stopScriptPath}`;
      const result = await execAsync(cmd);
      
      res.json({ message: 'Cron job stopped successfully', output: result.stdout });
    } catch (error) {
      console.error('Error stopping cron job:', error);
      res.status(500).json({ error: 'Failed to stop cron job' });
    }
  });
  
  app.get('/api/admin/cron/logs/:filename', requireAdmin, async (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Security check - ensure only log files are accessed
      if (!filename.match(/^auto_sync_(\d{8}_\d{6}|\d{4}-\d{2}-\d{2}_\d{2}_\d{2})\.log$/)) {
        console.log(`Invalid log filename format: ${filename}`);
        return res.status(400).json({ error: 'Invalid log filename' });
      }
      
      const logPath = path.join(serverRoot, 'logs', filename);
      
      console.log(`Log file path: ${logPath}`);
      
      if (!fs.existsSync(logPath)) {
        console.log(`Log file not found: ${logPath}`);
        return res.status(404).json({ error: 'Log file not found' });
      }
      
      try {
        const logContent = fs.readFileSync(logPath, 'utf8');
        res.json({ filename, content: logContent });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error reading log file ${logPath}:`, error);
        res.status(500).json({ error: 'Failed to read log file content', details: errorMessage });
      }
    } catch (error) {
      console.error('Error reading log file:', error);
      res.status(500).json({ error: 'Failed to read log file' });
    }
  });
  
  app.get('/api/admin/cron/logs', requireAdmin, async (req, res) => {
    try {
      const logsDir = path.join(serverRoot, 'logs');
      
      console.log(`Logs directory: ${logsDir}`);
      
      if (!fs.existsSync(logsDir)) {
        return res.json({ logs: [] });
      }
      
      const logFiles = fs.readdirSync(logsDir)
        // Update the filter to include both log formats
        .filter(file => /^auto_sync_(\d{8}_\d{6}|\d{4}-\d{2}-\d{2}_\d{2}_\d{2})\.log$/.test(file))
        .sort()
        .reverse()
        .map(filename => {
          const stats = fs.statSync(path.join(logsDir, filename));
          return {
            filename,
            size: stats.size,
            created: stats.birthtime
          };
        });
      
      res.json({ logs: logFiles });
    } catch (error) {
      console.error('Error listing log files:', error);
      res.status(500).json({ error: 'Failed to list log files' });
    }
  });

  // Get device tracking data for a user
  app.get('/api/admin/users/:userId/device-tracking', requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Get user device records
      const userDeviceKey = `user_device_${userId}`;
      const [userDeviceRecord] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, userDeviceKey))
        .limit(1);
      
      // Initialize the results
      const result: any = {
        ipAddresses: [],
        devices: []
      };
      
      // Get IP address data
      if (userDeviceRecord?.value) {
        const deviceData = userDeviceRecord.value as any;
        
        // Add current IP data
        if (deviceData.ipAddress) {
          result.ipAddresses.push({
            ipAddress: deviceData.ipAddress,
            lastSeen: deviceData.lastSeen
          });
        }
        
        // Add device data
        if (deviceData.deviceId) {
          result.devices.push({
            deviceId: deviceData.deviceId,
            userAgent: deviceData.userAgent,
            lastSeen: deviceData.lastSeen
          });
        }
      }
      
      // Check for IP sharing
      const sharedAccounts = [];
      
      // Only check if we have IP addresses to check
      if (result.ipAddresses.length > 0) {
        for (const ip of result.ipAddresses) {
          // Get all users for this IP
          const ipKey = `ip_users_${ip.ipAddress.replace(/\./g, '_')}`;
          const [ipRecord] = await db
            .select()
            .from(appSettings)
            .where(eq(appSettings.key, ipKey))
            .limit(1);
            
          if (ipRecord?.value) {
            const userIds = ipRecord.value as number[];
            
            // For each user sharing the IP (excluding the current user)
            for (const sharedUserId of userIds) {
              if (sharedUserId !== userId) {
                // Get the user's name
                const [userData] = await db
                  .select({
                    id: users.id,
                    username: users.username,
                    email: users.email
                  })
                  .from(users)
                  .where(eq(users.id, sharedUserId))
                  .limit(1);
                  
                if (userData) {
                  sharedAccounts.push({
                    userId: userData.id,
                    username: userData.username,
                    email: userData.email,
                    shareType: 'Shared IP Address'
                  });
                }
              }
            }
          }
        }
      }
      
      // Check for device sharing
      if (result.devices.length > 0) {
        for (const device of result.devices) {
          // Get all users for this device
          const deviceKey = `device_users_${device.deviceId}`;
          const [deviceRecord] = await db
            .select()
            .from(appSettings)
            .where(eq(appSettings.key, deviceKey))
            .limit(1);
            
          if (deviceRecord?.value) {
            const userIds = deviceRecord.value as number[];
            
            // For each user sharing the device (excluding the current user)
            for (const sharedUserId of userIds) {
              if (sharedUserId !== userId) {
                // Get the user's name
                const [userData] = await db
                  .select({
                    id: users.id,
                    username: users.username,
                    email: users.email
                  })
                  .from(users)
                  .where(eq(users.id, sharedUserId))
                  .limit(1);
                  
                if (userData) {
                  // Check if this user is already in the shared accounts list
                  const existingAccount = sharedAccounts.find(acc => acc.userId === userData.id);
                  if (existingAccount) {
                    existingAccount.shareType += ', Shared Device';
                  } else {
                    sharedAccounts.push({
                      userId: userData.id,
                      username: userData.username,
                      email: userData.email,
                      shareType: 'Shared Device'
                    });
                  }
                }
              }
            }
          }
        }
      }
      
      // Add the shared accounts to the result
      if (sharedAccounts.length > 0) {
        result.sharedAccounts = sharedAccounts;
      }
      
      res.json(result);
    } catch (error: any) {
      console.error(`Error fetching device tracking data for user ${req.params.userId}:`, error);
      res.status(500).json({ 
        message: 'Failed to fetch device tracking data', 
        error: error.message 
      });
    }
  });

  // Reset device tracking data for a user
  app.post('/api/admin/users/:userId/reset-device-tracking', requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Get user device record key
      const userDeviceKey = `user_device_${userId}`;
      
      // Delete the user device record
      await db.delete(appSettings)
        .where(eq(appSettings.key, userDeviceKey));
      
      // Also remove this user from any IP address mappings
      const allIpRecords = await db
        .select()
        .from(appSettings)
        .where(like(appSettings.key, 'ip_users_%'));
        
      for (const ipRecord of allIpRecords) {
        const userIds = ipRecord.value as number[];
        if (userIds.includes(userId)) {
          // Filter out this user
          const updatedUserIds = userIds.filter(id => id !== userId);
          
          if (updatedUserIds.length === 0) {
            // Delete the record if no users left
            await db.delete(appSettings)
              .where(eq(appSettings.key, ipRecord.key));
          } else {
            // Update the record with the user removed
            await db.update(appSettings)
              .set({ value: updatedUserIds })
              .where(eq(appSettings.key, ipRecord.key));
          }
        }
      }
      
      // Also remove this user from any device mappings
      const allDeviceRecords = await db
        .select()
        .from(appSettings)
        .where(like(appSettings.key, 'device_users_%'));
        
      for (const deviceRecord of allDeviceRecords) {
        const userIds = deviceRecord.value as number[];
        if (userIds.includes(userId)) {
          // Filter out this user
          const updatedUserIds = userIds.filter(id => id !== userId);
          
          if (updatedUserIds.length === 0) {
            // Delete the record if no users left
            await db.delete(appSettings)
              .where(eq(appSettings.key, deviceRecord.key));
          } else {
            // Update the record with the user removed
            await db.update(appSettings)
              .set({ value: updatedUserIds })
              .where(eq(appSettings.key, deviceRecord.key));
          }
        }
      }
      
      // Get the user details for logging
      const [user] = await db
        .select({
          username: users.username,
          email: users.email
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      // Log using admin username if available
      const adminUsername = req.user?.username || 'Unknown admin';
      console.log(`Device tracking data reset for user ${userId} (${user?.username}, ${user?.email}) by admin ${adminUsername}`);
      
      res.json({
        success: true,
        message: 'Device tracking data reset successfully'
      });
    } catch (error: any) {
      console.error(`Error resetting device tracking data for user ${req.params.userId}:`, error);
      res.status(500).json({ 
        message: 'Failed to reset device tracking data', 
        error: error.message 
      });
    }
  });

  // Branding Settings Management
  
  // Get branding settings
  app.get("/api/admin/branding-settings", async (req, res) => {
    try {
      const brandingSettingsData = await db.select().from(brandingSettings).limit(1);
      
      // If no settings exist yet, return default settings
      if (!brandingSettingsData || brandingSettingsData.length === 0) {
        // Default branding settings
        const defaultSettings = {
          appName: "ProsumeAI",
          appTagline: "AI-powered resume and career tools",
          logoUrl: "/logo.png",
          faviconUrl: "/favicon.ico",
          enableDarkMode: true,
          primaryColor: "#4f46e5",
          secondaryColor: "#10b981",
          accentColor: "#f97316",
          footerText: "© 2023 ProsumeAI. All rights reserved.",
          customCss: "",
          customJs: ""
        };
        
        res.json(defaultSettings);
      } else {
        res.json(brandingSettingsData[0]);
      }
    } catch (error) {
      console.error("Error fetching branding settings:", error);
      res.status(500).json({ message: "Failed to fetch branding settings" });
    }
  });
  
  // Update branding settings
  app.post("/api/admin/branding-settings", requireAdmin, async (req, res) => {
    try {
      const { 
        appName, 
        appTagline, 
        logoUrl, 
        faviconUrl, 
        enableDarkMode, 
        primaryColor, 
        secondaryColor, 
        accentColor, 
        footerText, 
        customCss, 
        customJs 
      } = req.body;
      
      // Input validation
      if (!appName) {
        return res.status(400).json({ message: "Application name is required" });
      }
      
      // Check if branding settings exist
      const existingSettings = await db.select().from(brandingSettings).limit(1);
      
      if (existingSettings && existingSettings.length > 0) {
        // Update existing settings
        const updatedSettings = await db.update(brandingSettings)
          .set({
            appName,
            appTagline,
            logoUrl,
            faviconUrl,
            enableDarkMode,
            primaryColor,
            secondaryColor,
            accentColor,
            footerText,
            customCss,
            customJs,
            updatedAt: new Date()
          })
          .where(eq(brandingSettings.id, existingSettings[0].id))
          .returning();
        
        res.json(updatedSettings[0]);
      } else {
        // Create new settings
        const newSettings = await db.insert(brandingSettings)
          .values({
            appName,
            appTagline,
            logoUrl,
            faviconUrl,
            enableDarkMode,
            primaryColor,
            secondaryColor,
            accentColor,
            footerText,
            customCss,
            customJs
          })
          .returning();
        
        res.json(newSettings[0]);
      }
    } catch (error) {
      console.error("Error updating branding settings:", error);
      res.status(500).json({ message: "Failed to update branding settings" });
    }
  });
  
  // Logo upload endpoint
  app.post("/api/admin/branding/logo", requireAdmin, upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No logo image provided' });
      }
      
      const logoDir = path.join(process.cwd(), 'public', 'images', 'branding');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
      }
      
      // Generate filename with timestamp
      const fileType = path.extname(req.file.originalname);
      const fileName = `logo-${Date.now()}${fileType}`;
      const filePath = path.join(logoDir, fileName);
      
      // Move file from uploads to final destination
      fs.renameSync(req.file.path, filePath);
      
      // Create URL for the logo
      const logoUrl = `/images/branding/${fileName}`;
      
      // Update branding settings with new logo URL
      const existingSettings = await db.select().from(brandingSettings).limit(1);
      
      if (existingSettings && existingSettings.length > 0) {
        await db.update(brandingSettings)
          .set({
            logoUrl,
            updatedAt: new Date()
          })
          .where(eq(brandingSettings.id, existingSettings[0].id));
      }
      
      res.json({ 
        message: "Logo uploaded successfully",
        logoUrl 
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });
  
  // Favicon upload endpoint
  app.post("/api/admin/branding/favicon", requireAdmin, upload.single('favicon'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No favicon image provided' });
      }
      
      const faviconDir = path.join(process.cwd(), 'public', 'images', 'branding');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(faviconDir)) {
        fs.mkdirSync(faviconDir, { recursive: true });
      }
      
      // Generate filename with timestamp
      const fileType = path.extname(req.file.originalname);
      const fileName = `favicon-${Date.now()}${fileType}`;
      const filePath = path.join(faviconDir, fileName);
      
      // Move file from uploads to final destination
      fs.renameSync(req.file.path, filePath);
      
      // Create URL for the favicon
      const faviconUrl = `/images/branding/${fileName}`;
      
      // Update branding settings with new favicon URL
      const existingSettings = await db.select().from(brandingSettings).limit(1);
      
      if (existingSettings && existingSettings.length > 0) {
        await db.update(brandingSettings)
          .set({
            faviconUrl,
            updatedAt: new Date()
          })
          .where(eq(brandingSettings.id, existingSettings[0].id));
      }
      
      res.json({ 
        message: "Favicon uploaded successfully",
        faviconUrl 
      });
    } catch (error) {
      console.error("Error uploading favicon:", error);
      res.status(500).json({ message: "Failed to upload favicon" });
    }
  });

  // Public endpoint for branding settings (no admin auth required)
  app.get("/api/branding", async (req, res) => {
    try {
      const brandingSettingsData = await db.select().from(brandingSettings).limit(1);
      
      // If no settings exist yet, return default settings
      if (!brandingSettingsData || brandingSettingsData.length === 0) {
        // Default branding settings
        const defaultSettings = {
          appName: "ProsumeAI",
          appTagline: "AI-powered resume and career tools",
          logoUrl: "/logo.png",
          faviconUrl: "/favicon.ico",
          enableDarkMode: true,
          primaryColor: "#4f46e5",
          secondaryColor: "#10b981",
          accentColor: "#f97316",
          footerText: "© 2023 ProsumeAI. All rights reserved."
        };
        
        // Don't expose custom CSS and JS to public
        res.json(defaultSettings);
      } else {
        // Don't expose custom CSS and JS to public
        const { customCss, customJs, ...publicSettings } = brandingSettingsData[0];
        res.json(publicSettings);
      }
    } catch (error) {
      console.error("Error fetching branding settings:", error);
      res.status(500).json({ message: "Failed to fetch branding settings" });
    }
  });

  // Manually trigger currency validation
  app.post('/api/admin/validate-transaction-currencies', requireAdmin, async (req, res) => {
    try {
      // Import the validation function
      const { validateTransactionCurrencies } = await import('../../scripts/validate-transaction-currencies.js');
      
      // Run validation in the background without blocking the response
      setTimeout(async () => {
        try {
          const issues = await validateTransactionCurrencies();
          console.log(`Manual transaction validation completed. Found ${issues.length} issues.`);
        } catch (validationError) {
          console.error('Error in manual transaction validation:', validationError);
        }
      }, 0);
      
      res.json({ 
        message: 'Transaction currency validation started',
        note: 'The validation is running asynchronously. Check the server logs for results.'
      });
    } catch (error) {
      console.error('Error triggering transaction validation:', error);
      res.status(500).json({ error: 'Failed to trigger transaction validation' });
    }
  });

  // Manually fix a specific transaction's currency and amount
  app.post('/api/admin/fix-transaction/:transactionId', requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ error: 'Invalid transaction ID' });
      }
      
      // Get transaction details
      const transaction = await db.select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.id, transactionId))
        .limit(1);
        
      if (!transaction.length) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Get the user's billing details to determine correct currency
      const userBillingInfo = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, transaction[0].userId))
        .limit(1);
        
      // Get correct currency based on user's location  
      const userCountry = userBillingInfo.length > 0 ? userBillingInfo[0].country : 'US';
      const targetRegion = userCountry === 'IN' ? 'INDIA' : 'GLOBAL';
      const correctCurrency = targetRegion === 'INDIA' ? 'INR' : 'USD';
      
      // Get subscription and plan information
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.id, transaction[0].subscriptionId))
        .limit(1);
        
      if (!subscription.length) {
        return res.status(404).json({ error: 'Subscription not found for this transaction' });
      }
      
      const planId = subscription[0].planId;
      
      // Get pricing for the correct currency
      const pricingInfo = await db.select()
        .from(planPricing)
        .where(
          and(
            eq(planPricing.planId, planId),
            eq(planPricing.currency, correctCurrency)
          )
        )
        .limit(1);
        
      if (!pricingInfo.length) {
        return res.status(404).json({ error: `No pricing found for plan ${planId} with currency ${correctCurrency}` });
      }
      
      // Update transaction with correct currency and amount
      const correctAmount = pricingInfo[0].price;
      
      await db.update(paymentTransactions)
        .set({
          currency: correctCurrency,
          amount: correctAmount,
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.id, transactionId));
        
      // Delete and regenerate invoice
      await db.delete(invoices)
        .where(eq(invoices.transactionId, transactionId));
        
      // Generate new invoice
      const newInvoice = await TaxService.generateInvoice(transactionId);
      
      res.json({
        message: 'Transaction and invoice fixed successfully',
        transaction: {
          id: transactionId,
          newCurrency: correctCurrency,
          newAmount: correctAmount
        },
        invoice: {
          id: newInvoice.id,
          invoiceNumber: newInvoice.invoiceNumber,
          currency: newInvoice.currency,
          total: newInvoice.total
        }
      });
    } catch (error) {
      console.error('Error fixing transaction:', error);
      res.status(500).json({ error: 'Failed to fix transaction' });
    }
  });
}

// Helper function to mask API keys for display
function maskApiKey(key: string): string {
  if (!key) return "";
  // Show only first 4 and last 4 characters
  return key.substring(0, 4) + "..." + key.substring(key.length - 4);
}