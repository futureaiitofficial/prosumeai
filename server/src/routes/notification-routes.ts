import { Router } from 'express';
import { Request, Response } from 'express';
import { notificationService } from '../../services/notification-service';
import { requireUser, requireAdmin } from '../../middleware/auth';
import { eq, gte, desc, count } from 'drizzle-orm';
import { notifications } from '@shared/schema';
import { db } from '../../config/db';

const router = Router();

// User notification routes
router.get('/notifications', requireUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      limit = '50',
      offset = '0',
      unreadOnly = 'false',
      category,
      type
    } = req.query;

    const options = {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      unreadOnly: unreadOnly === 'true',
      category: category as string,
      type: type as string
    };

    const notifications = await notificationService.getUserNotifications(userId, options);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Get unread notification count
router.get('/notifications/unread-count', requireUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', requireUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notificationId = parseInt(req.params.id, 10);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    await notificationService.markAsRead(notificationId, userId);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/notifications/mark-all-read', requireUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await notificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// Delete notification
router.delete('/notifications/:id', requireUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notificationId = parseInt(req.params.id, 10);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    await notificationService.deleteNotification(notificationId, userId);
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// Get notification preferences
router.get('/notifications/preferences', requireUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const preferences = await notificationService.getUserNotificationPreferences(userId);
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences'
    });
  }
});

// Update notification preferences
router.put('/notifications/preferences', requireUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const preferences = await notificationService.updateUserNotificationPreferences(userId, req.body);
    
    res.json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

// Admin routes for notification management
router.post('/admin/notifications/system', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { type, title, message, data, priority, category, expiresAt } = req.body;

    if (!type || !title || !message || !category) {
      return res.status(400).json({
        error: 'Type, title, message, and category are required'
      });
    }

    await notificationService.createSystemNotification({
      type,
      title,
      message,
      data,
      priority,
      category,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });
    
    res.json({
      success: true,
      message: 'System notification created'
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create system notification'
    });
  }
});

// Send notification to specific users
router.post('/admin/notifications/group', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userIds, type, title, message, data, priority, category, expiresAt } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'User IDs array is required'
      });
    }

    if (!type || !title || !message || !category) {
      return res.status(400).json({
        error: 'Type, title, message, and category are required'
      });
    }

    await notificationService.sendNotificationToUserGroup({
      userIds,
      type,
      title,
      message,
      data,
      priority,
      category,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });
    
    res.json({
      success: true,
      message: 'Notification sent to user group'
    });
  } catch (error) {
    console.error('Error sending group notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send group notification'
    });
  }
});

// Send broadcast notification
router.post('/admin/notifications/broadcast', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { excludeUserIds, type, title, message, data, priority, category, expiresAt } = req.body;

    if (!type || !title || !message || !category) {
      return res.status(400).json({
        error: 'Type, title, message, and category are required'
      });
    }

    await notificationService.sendNotificationToAllUsers({
      excludeUserIds,
      type,
      title,
      message,
      data,
      priority,
      category,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });
    
    res.json({
      success: true,
      message: 'Broadcast notification sent'
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send broadcast notification'
    });
  }
});

// Cleanup expired notifications
router.delete('/admin/notifications/cleanup', requireAdmin, async (req: Request, res: Response) => {
  try {
    const deletedCount = await notificationService.cleanupExpiredNotifications();
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired notifications`
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup notifications'
    });
  }
});

// Get notification templates
router.get('/admin/notifications/templates', requireAdmin, async (req: Request, res: Response) => {
  try {
    const templates = await notificationService.getAllTemplates();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification templates'
    });
  }
});

// Create or update notification template
router.post('/admin/notifications/templates', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { type, titleTemplate, messageTemplate, emailSubjectTemplate, emailBodyTemplate, variables } = req.body;

    if (!type || !titleTemplate || !messageTemplate) {
      return res.status(400).json({
        error: 'Type, title template, and message template are required'
      });
    }

    const template = await notificationService.createOrUpdateTemplate({
      type,
      titleTemplate,
      messageTemplate,
      emailSubjectTemplate,
      emailBodyTemplate,
      variables: variables || []
    });
    
    res.json({
      success: true,
      data: template,
      message: 'Notification template saved'
    });
  } catch (error) {
    console.error('Error saving notification template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save notification template'
    });
  }
});

// Get notification analytics
router.get('/admin/notifications/analytics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;
    console.log(`Fetching notification analytics for ${days} days...`);
    
    const analytics = await notificationService.getNotificationAnalytics(parseInt(days as string, 10));
    
    console.log('Analytics result:', {
      totalNotifications: analytics.totalNotifications,
      unreadNotifications: analytics.unreadNotifications,
      categoriesCount: analytics.notificationsByCategory.length,
      typesCount: analytics.notificationsByType.length,
      dailyStatsCount: analytics.dailyStats.length
    });
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching notification analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification analytics'
    });
  }
});

// Get notification activity log
router.get('/admin/notifications/log', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      limit = '100',
      offset = '0',
      type,
      category,
      startDate,
      endDate
    } = req.query;

    const options = {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      type: type as string,
      category: category as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const log = await notificationService.getNotificationLog(options);
    
    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error fetching notification log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification log'
    });
  }
});

// Debug endpoint for notification analytics (development only)
if (process.env.NODE_ENV !== 'production') {
  router.get('/admin/notifications/debug', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get basic notification stats
      const totalNotifications = await db.select({ count: count() }).from(notifications);
      const totalUnread = await db.select({ count: count() }).from(notifications).where(eq(notifications.isRead, false));
      
      // Get all notifications for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentNotifications = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          category: notifications.category,
          createdAt: notifications.createdAt,
          isRead: notifications.isRead
        })
        .from(notifications)
        .where(gte(notifications.createdAt, thirtyDaysAgo))
        .orderBy(desc(notifications.createdAt))
        .limit(10);
      
      res.json({
        success: true,
        debug: {
          totalNotificationsInDb: totalNotifications[0]?.count || 0,
          totalUnreadInDb: totalUnread[0]?.count || 0,
          thirtyDaysAgoDate: thirtyDaysAgo.toISOString(),
          sampleRecentNotifications: recentNotifications,
          analyticsEndpointWorking: true
        }
      });
    } catch (error) {
      console.error('Debug endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default router; 