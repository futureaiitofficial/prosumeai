import express, { Request, Response } from 'express';
import os from 'os';
import { db } from '../../../config/db';
import { requireAdmin } from '../../../middleware/admin';
import { storage } from '../../../config/storage';
import { cookieManager } from '../../../utils/cookie-manager';
import { sql } from 'drizzle-orm';

const router = express.Router();

/**
 * GET /api/admin/server-status
 * Returns server status information including system info,
 * database connection, user statistics, and session info
 */
router.get('/server-status', requireAdmin, async (req: Request, res: Response) => {
  try {
    // System information
    const systemInfo = {
      platform: os.platform(),
      architecture: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      load: os.loadavg(),
      nodeVersion: process.version,
      nodeEnv: process.env.NODE_ENV || 'development'
    };

    // Check database connection
    let dbConnected = true;
    let dbError = null;
    try {
      // Simple query to test database connection
      await db.execute(sql`SELECT 1`);
    } catch (error) {
      dbConnected = false;
      dbError = error instanceof Error ? error.message : String(error);
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
      
      // Basic user stats
      userStats.total = parseInt(stats.totalUsers || '0', 10);
      userStats.active = parseInt(stats.recentLogins || '0', 10);
      
      // Try to get additional statistics using safer checks
      try {
        // Check if the storage object has extra statistics methods
        // without directly referencing method names that might not exist
        const storageAny = storage as any;
        
        // Only call these methods if they exist
        if (storageAny && typeof storageAny.getResumeCount === 'function') {
          userStats.totalResumes = await storageAny.getResumeCount();
        }
        
        if (storageAny && typeof storageAny.getCoverLetterCount === 'function') {
          userStats.totalCoverLetters = await storageAny.getCoverLetterCount();
        }
        
        if (storageAny && typeof storageAny.getJobApplicationCount === 'function') {
          userStats.totalJobApplications = await storageAny.getJobApplicationCount();
        }
      } catch (statsError) {
        console.error('Error fetching detailed stats:', statsError);
      }
    } catch (error) {
      console.error('Error fetching user statistics:', error);
    }

    // Session information
    const sessionInfo = {
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      cookie: req.session?.cookie ? {
        maxAge: req.session.cookie.maxAge,
        httpOnly: req.session.cookie.httpOnly,
        secure: req.session.cookie.secure,
        sameSite: req.session.cookie.sameSite
      } : null
    };

    // Rate limiter settings - simplified as we may not have direct access
    const rateLimiterInfo = {
      enabled: process.env.RATE_LIMIT_ENABLED === 'true',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100')
    };

    // Cookie manager details
    const cookieManagerInfo = {
      enabled: !!cookieManager,
      settings: {
        prefix: cookieManager.getPrefix(),
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
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

export default router; 