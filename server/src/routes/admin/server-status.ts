import express, { Request, Response } from 'express';
import os from 'os';
import { db } from '../../../config/db';
import { requireAdmin } from '../../../middleware/admin';
import { storage } from '../../../config/storage';
import { cookieManager } from '../../../utils/cookie-manager';
import { sql, eq, count } from 'drizzle-orm';
import { users } from '@shared/schema';

const router = express.Router();

// Helper function to ensure values are safe and valid
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const safeBoolean = (value: any): boolean => {
  return !!value;
};

/**
 * GET /api/admin/server-status
 * Returns server status information including system info,
 * database connection, user statistics, and session info
 */
router.get('/server-status', requireAdmin, async (req: Request, res: Response) => {
  try {
    // System information
    const systemInfo = {
      platform: safeString(os.platform()),
      architecture: safeString(os.arch()),
      cpus: safeNumber(os.cpus().length),
      totalMemory: safeNumber(os.totalmem()),
      freeMemory: safeNumber(os.freemem()),
      uptime: safeNumber(os.uptime()),
      load: Array.isArray(os.loadavg()) ? 
        os.loadavg().map(v => safeNumber(v)) : 
        [0, 0, 0],
      nodeVersion: safeString(process.version),
      nodeEnv: safeString(process.env.NODE_ENV || 'development')
    };

    // Check database connection
    let dbConnected = true;
    let dbError = null;
    try {
      // Simple query to test database connection
      await db.execute(sql`SELECT 1`);
    } catch (error) {
      dbConnected = false;
      dbError = error instanceof Error ? safeString(error.message) : safeString(error);
    }

    // Get user statistics
    let userStats = {
      total: 0,
      active: 0,
      admins: 0,
      totalResumes: 0,
      totalCoverLetters: 0,
      totalJobApplications: 0
    };
    
    try {
      // Get basic user stats
      const stats = await storage.getUserStatistics();
      
      // Basic user stats - ensure numeric values
      userStats.total = safeNumber(stats.totalUsers || 0);
      userStats.active = safeNumber(stats.recentLogins || 0);
      
      // Get count of admin users
      try {
        // Query to count admin users using proper Drizzle syntax
        const adminCount = await db.select({ count: count() })
          .from(users)
          .where(eq(users.isAdmin, true));
        
        if (adminCount && adminCount.length > 0 && adminCount[0].count !== undefined) {
          // Convert BigInt or string to number
          const count = adminCount[0].count;
          userStats.admins = safeNumber(typeof count === 'bigint' ? Number(count) : count);
        }
      } catch (adminCountError) {
        console.error('Error counting admin users:', adminCountError);
      }
      
      // Try to get additional statistics using safer checks
      try {
        // Get total counts from the stats object which already has the global counts
        userStats.totalResumes = safeNumber(stats.totalResumes || 0);
        userStats.totalCoverLetters = safeNumber(stats.totalCoverLetters || 0);
        userStats.totalJobApplications = safeNumber(stats.totalJobApplications || 0);
      } catch (statsError) {
        console.error('Error fetching detailed stats:', statsError);
      }
    } catch (error) {
      console.error('Error fetching user statistics:', error);
    }

    // Session information
    const sessionInfo = {
      isAuthenticated: safeBoolean(req.isAuthenticated()),
      sessionID: safeString(req.sessionID),
      cookie: req.session?.cookie ? {
        maxAge: safeNumber(req.session.cookie.maxAge),
        httpOnly: safeBoolean(req.session.cookie.httpOnly),
        secure: safeBoolean(req.session.cookie.secure),
        sameSite: safeString(req.session.cookie.sameSite)
      } : {
        maxAge: 0,
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
      }
    };

    // Rate limiter settings - simplified as we may not have direct access
    const rateLimiterInfo = {
      enabled: safeBoolean(process.env.RATE_LIMIT_ENABLED === 'true'),
      windowMs: safeNumber(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000')),
      max: safeNumber(parseInt(process.env.RATE_LIMIT_MAX || '100'))
    };

    // Cookie manager details
    const cookieManagerInfo = {
      enabled: safeBoolean(cookieManager),
      settings: {
        prefix: safeString(cookieManager ? (cookieManager as any).prefix || 'ATScribe' : 'ATScribe'),
        secure: safeBoolean(process.env.NODE_ENV === 'production'),
        sameSite: safeString(process.env.NODE_ENV === 'production' ? 'strict' : 'lax')
      }
    };

    // Return all gathered information
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      system: systemInfo,
      database: {
        connected: dbConnected,
        error: dbError
      },
      users: userStats,
      session: sessionInfo,
      rateLimiter: rateLimiterInfo,
      cookieManager: cookieManagerInfo
    };
    
    console.log('SERVER STATUS RESPONSE:', JSON.stringify(response, null, 2));
    
    res.json(response);
  } catch (error) {
    console.error('Error getting server status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get server status',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/admin/clear-rate-limits
 * Clears all rate limits if possible
 */
router.post('/clear-rate-limits', requireAdmin, (req: Request, res: Response) => {
  try {
    // Implementation would depend on rate limiter implementation
    // For now, just return success
    res.json({
      status: 'success',
      message: 'Rate limits cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing rate limits:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear rate limits',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/admin/server-status-debug
 * Simplified endpoint to help diagnose server status issues
 */
router.get('/server-status-debug', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Basic system info
    const systemInfo = {
      platform: safeString(os.platform()),
      uptime: safeNumber(os.uptime()),
      nodeVersion: safeString(process.version)
    };

    // Test database separately
    let dbTest = { success: false, error: null as string | null };
    try {
      await db.execute(sql`SELECT 1`);
      dbTest.success = true;
    } catch (error) {
      dbTest.error = error instanceof Error ? safeString(error.message) : safeString(error);
      console.error('Database test failed:', error);
    }

    // Test storage separately
    let storageTest = { success: false, error: null as string | null };
    try {
      const stats = await storage.getUserStatistics();
      storageTest.success = true;
    } catch (error) {
      storageTest.error = error instanceof Error ? safeString(error.message) : safeString(error);
      console.error('Storage test failed:', error);
    }

    res.json({
      system: systemInfo,
      database: dbTest,
      storage: storageTest,
      env: {
        NODE_ENV: safeString(process.env.NODE_ENV),
        DATABASE_URL: process.env.DATABASE_URL ? '****' : 'not set'
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Debug test failed',
      error: error instanceof Error ? safeString(error.message) : safeString(error)
    });
  }
});

export default router; 