import { Express, Request, Response } from "express";
import { requireAdmin } from "server/middleware/admin";
import { TwoFactorService } from 'server/services/two-factor-service';
import { db } from 'server/config/db';
import { userTwoFactor, twoFactorEmail, twoFactorAuthenticator, twoFactorBackupCodes, users } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Register routes for managing 2FA settings in the admin dashboard
 * @param app Express application
 */
export function registerTwoFactorAdminRoutes(app: Express) {
  // Get the global 2FA policy
  app.get('/api/admin/2fa/policy', requireAdmin, async (req: Request, res: Response) => {
    try {
      const policy = await TwoFactorService.getPolicy();
      res.json(policy);
    } catch (error) {
      console.error('Error getting 2FA policy:', error);
      res.status(500).json({ 
        error: 'Failed to get 2FA policy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update the global 2FA policy
  app.post('/api/admin/2fa/policy', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { enforceForAdmins, enforceForAllUsers, allowedMethods, rememberDeviceDays } = req.body;

      // Validate required fields
      if (enforceForAdmins === undefined || enforceForAllUsers === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate allowed methods
      if (allowedMethods && !Array.isArray(allowedMethods)) {
        return res.status(400).json({ error: 'allowedMethods must be an array' });
      }

      if (allowedMethods && allowedMethods.length === 0) {
        return res.status(400).json({ error: 'At least one 2FA method must be allowed' });
      }

      // Validate remember days
      if (rememberDeviceDays !== undefined && 
          (typeof rememberDeviceDays !== 'number' || rememberDeviceDays < 0 || rememberDeviceDays > 365)) {
        return res.status(400).json({ error: 'rememberDeviceDays must be a number between 0 and 365' });
      }

      // Update policy
      const updatedPolicy = await TwoFactorService.updatePolicy({
        enforceForAdmins,
        enforceForAllUsers,
        allowedMethods: allowedMethods || ['EMAIL', 'AUTHENTICATOR_APP'],
        rememberDeviceDays: rememberDeviceDays !== undefined ? rememberDeviceDays : 30
      });

      res.json(updatedPolicy);
    } catch (error) {
      console.error('Error updating 2FA policy:', error);
      res.status(500).json({ 
        error: 'Failed to update 2FA policy',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get 2FA stats
  app.get('/api/admin/2fa/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get total user count
      const [totalUsers] = await db.select({ count: sql`COUNT(*)` }).from(users);
      
      // Get count of users with 2FA enabled
      const [enabledUsers] = await db.select({ count: sql`COUNT(*)` })
        .from(userTwoFactor)
        .where(eq(userTwoFactor.enabled, true));
      
      // Get count of users with email 2FA
      const [emailUsers] = await db.select({ count: sql`COUNT(*)` })
        .from(twoFactorEmail);
      
      // Get count of users with authenticator app 2FA
      const [authenticatorUsers] = await db.select({ count: sql`COUNT(*)` })
        .from(twoFactorAuthenticator)
        .where(eq(twoFactorAuthenticator.verified, true));
      
      // Get count of admins
      const [totalAdmins] = await db.select({ count: sql`COUNT(*)` })
        .from(users)
        .where(eq(users.isAdmin, true));
      
      // Get count of admins with 2FA enabled
      const [enabledAdmins] = await db.select({ count: sql`COUNT(*)` })
        .from(userTwoFactor)
        .innerJoin(users, eq(userTwoFactor.userId, users.id))
        .where(
          and(
            eq(userTwoFactor.enabled, true),
            eq(users.isAdmin, true)
          )
        );
      
      // Safely convert SQL counts to numbers
      const totalUsersCount = Number(totalUsers?.count || 0);
      const enabledUsersCount = Number(enabledUsers?.count || 0);
      const emailUsersCount = Number(emailUsers?.count || 0);
      const authenticatorUsersCount = Number(authenticatorUsers?.count || 0);
      const totalAdminsCount = Number(totalAdmins?.count || 0);
      const enabledAdminsCount = Number(enabledAdmins?.count || 0);
      
      res.json({
        totalUsers: totalUsersCount,
        enabledUsers: enabledUsersCount,
        enabledPercentage: totalUsersCount ? 
          Math.round((enabledUsersCount / totalUsersCount) * 100) : 0,
        byMethod: {
          email: emailUsersCount,
          authenticator: authenticatorUsersCount
        },
        admins: {
          total: totalAdminsCount,
          withTwoFactor: enabledAdminsCount,
          percentage: totalAdminsCount ? 
            Math.round((enabledAdminsCount / totalAdminsCount) * 100) : 0
        }
      });
    } catch (error) {
      console.error('Error getting 2FA stats:', error);
      res.status(500).json({ 
        error: 'Failed to get 2FA stats',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get all users with their 2FA status
  app.get('/api/admin/2fa/users', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get query parameters for pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      // Get users with their 2FA status
      const usersWithStatus = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        isAdmin: users.isAdmin,
        twoFactorEnabled: userTwoFactor.enabled,
        twoFactorMethod: userTwoFactor.preferredMethod,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt
      })
      .from(users)
      .leftJoin(userTwoFactor, eq(users.id, userTwoFactor.userId))
      .orderBy(desc(users.lastLogin))
      .limit(limit)
      .offset(offset);
      
      // Get total user count for pagination
      const [totalCount] = await db.select({ count: sql`COUNT(*)` }).from(users);
      const totalUsersCount = Number(totalCount?.count || 0);
      
      res.json({
        users: usersWithStatus,
        pagination: {
          page,
          limit,
          total: totalUsersCount,
          pages: Math.ceil(totalUsersCount / limit)
        }
      });
    } catch (error) {
      console.error('Error getting users with 2FA status:', error);
      res.status(500).json({ 
        error: 'Failed to get users with 2FA status',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get a specific user's 2FA configuration
  app.get('/api/admin/2fa/users/:userId', requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // Get user details
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          username: true,
          email: true,
          isAdmin: true,
          lastLogin: true
        }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get 2FA configuration
      const twoFactorConfig = await TwoFactorService.getUserTwoFactorConfig(userId);
      
      res.json({
        user,
        twoFactor: twoFactorConfig
      });
    } catch (error) {
      console.error('Error getting user 2FA config:', error);
      res.status(500).json({ 
        error: 'Failed to get user 2FA configuration',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Reset/disable 2FA for a user (admin action)
  app.post('/api/admin/2fa/users/:userId/reset', requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // Get user details
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          username: true,
          email: true
        }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Delete all 2FA settings for the user
      await db.delete(userTwoFactor)
        .where(eq(userTwoFactor.userId, userId));
      
      await db.delete(twoFactorEmail)
        .where(eq(twoFactorEmail.userId, userId));
      
      await db.delete(twoFactorAuthenticator)
        .where(eq(twoFactorAuthenticator.userId, userId));
      
      await db.delete(twoFactorBackupCodes)
        .where(eq(twoFactorBackupCodes.userId, userId));
      
      // Log the action
      console.log(`Admin ${req.user?.username} (ID: ${req.user?.id}) reset 2FA for user ${user.username} (ID: ${userId})`);
      
      res.json({ 
        success: true,
        message: `2FA settings were reset for user ${user.username}` 
      });
    } catch (error) {
      console.error('Error resetting user 2FA:', error);
      res.status(500).json({ 
        error: 'Failed to reset user 2FA',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}

export default registerTwoFactorAdminRoutes; 