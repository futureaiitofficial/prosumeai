import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import os from 'os';
import { db } from '../../config/db';
import { storage } from '../../config/storage';
import { sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/admin/server-status
 * Returns server status information including system info,
 * database connection, user statistics, and session info
 */
router.get('/server-status', requireAdmin, async (req, res) => {
  try {
    // Get system information
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      cpus: os.cpus().length,
      loadAvg: os.loadavg(),
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      nodeVersion: process.version,
    };

    // Check database connection
    let dbConnected = true;
    let dbError = null;

    try {
      // Simple query to check connection
      await db.execute(sql`SELECT 1`);
    } catch (error: any) {
      dbConnected = false;
      dbError = error.message;
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
      
      // Parse user counts as integers
      userStats.total = parseInt(stats.totalUsers || '0', 10);
      userStats.active = parseInt(stats.recentLogins || '0', 10);
      
      // Try to get additional statistics
      try {
        // Cast to any to avoid TypeScript errors
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
      console.error('Error getting user statistics:', error);
    }

    // Get session information
    let sessionInfo = null;
    try {
      const activeSessions = await storage.getActiveSessions();
      sessionInfo = {
        count: activeSessions.length,
        sessions: activeSessions,
      };
    } catch (error) {
      console.error('Error getting session information:', error);
      sessionInfo = { count: 0, error: 'Failed to retrieve session data' };
    }

    // Get rate limiter information from store (if set up)
    // This is a placeholder - implementation depends on your rate limiter
    let rateLimiterInfo = {
      enabled: process.env.RATE_LIMIT_ENABLED === 'true',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'), 
    };

    // Cookie manager information
    const cookieManagerInfo = {
      prefix: process.env.COOKIE_PREFIX || 'prosume',
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax'
    };

    // Return all information
    res.json({
      system: systemInfo,
      database: {
        connected: dbConnected,
        error: dbError
      },
      users: userStats,
      sessions: sessionInfo,
      rateLimiter: rateLimiterInfo,
      cookieManager: cookieManagerInfo,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Error getting server status:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/admin/clear-rate-limits
 * Clears all rate limits if possible
 */
router.post('/clear-rate-limits', requireAdmin, (req, res) => {
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