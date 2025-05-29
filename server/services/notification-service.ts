import { drizzle } from 'drizzle-orm/postgres-js';
import { 
  notifications, 
  notificationPreferences, 
  notificationTemplates,
  users,
  type Notification,
  type NotificationPreferences,
  type NotificationTemplate,
  type InsertNotification,
  type InsertNotificationPreferences,
  type NotificationData
} from '../../shared/schema';
import { eq, desc, and, count, inArray, sql, gte } from 'drizzle-orm';
import { db } from '../config/db';
import { EventEmitter } from 'events';

export interface CreateNotificationParams {
  recipientId: number;
  type: string;
  title?: string;
  message?: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  category: string;
  expiresAt?: Date;
  action?: {
    type: 'link' | 'button';
    label: string;
    url?: string;
    payload?: Record<string, any>;
  };
}

export interface NotificationQueryOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  category?: string;
  type?: string;
}

export interface SystemNotificationParams {
  type: string;
  title?: string;
  message?: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  category: string;
  expiresAt?: Date;
}

export interface BroadcastNotificationParams extends SystemNotificationParams {
  excludeUserIds?: number[];
}

export interface GroupNotificationParams extends SystemNotificationParams {
  userIds: number[];
}

export class NotificationService extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Create a notification using template if available
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    try {
      // Get template if exists
      const template = await this.getTemplate(params.type);
      
      let title = params.title;
      let message = params.message;
      
      if (template) {
        title = title || this.processTemplate(template.titleTemplate, params.data || {});
        message = message || this.processTemplate(template.messageTemplate, params.data || {});
      }

      if (!title || !message) {
        throw new Error('Title and message are required when no template is available');
      }

      const notificationData: InsertNotification = {
        recipientId: params.recipientId,
        type: params.type as any,
        title,
        message,
        data: params.data || {},
        priority: params.priority || 'normal',
        category: params.category as any,
        expiresAt: params.expiresAt,
        action: params.action,
        isSystem: false,
        isRead: false
      };

      const [notification] = await db
        .insert(notifications)
        .values(notificationData)
        .returning();

      // Emit event for real-time updates
      this.emit('notification:created', {
        notification,
        recipientId: params.recipientId
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get user notifications with options
   */
  async getUserNotifications(
    userId: number, 
    options: NotificationQueryOptions = {}
  ): Promise<NotificationData[]> {
    try {
      const {
        limit = 50,
        offset = 0,
        unreadOnly = false,
        category,
        type
      } = options;

      let query = db
        .select()
        .from(notifications)
        .where(eq(notifications.recipientId, userId));

      // Add filters
      const conditions = [eq(notifications.recipientId, userId)];
      
      if (unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }
      
      if (category) {
        conditions.push(eq(notifications.category, category as any));
      }
      
      if (type) {
        conditions.push(eq(notifications.type, type as any));
      }

      const results = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      return results.map(this.transformNotification);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Get unread notification count for user
   */
  async getUnreadCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientId, userId),
            eq(notifications.isRead, false)
          )
        );

      return result.count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId?: number): Promise<void> {
    try {
      const conditions = [eq(notifications.id, notificationId)];
      
      if (userId) {
        conditions.push(eq(notifications.recipientId, userId));
      }

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(...conditions));

      this.emit('notification:read', { notificationId, userId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: number): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.recipientId, userId),
            eq(notifications.isRead, false)
          )
        );

      this.emit('notification:all_read', { userId });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number, userId?: number): Promise<void> {
    try {
      const conditions = [eq(notifications.id, notificationId)];
      
      if (userId) {
        conditions.push(eq(notifications.recipientId, userId));
      }

      await db
        .delete(notifications)
        .where(and(...conditions));

      this.emit('notification:deleted', { notificationId, userId });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId: number): Promise<NotificationPreferences | null> {
    try {
      const [preferences] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));

      return preferences || null;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserNotificationPreferences(
    userId: number, 
    preferencesData: Partial<InsertNotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      // Check if preferences exist
      const existing = await this.getUserNotificationPreferences(userId);
      
      // Define allowed fields for updating (exclude ID and timestamp fields)
      const allowedFields = [
        'enableEmailNotifications', 'enablePushNotifications', 'enableInAppNotifications',
        'enableSoundNotifications', 'soundVolume', 'accountNotifications', 'resumeNotifications',
        'coverLetterNotifications', 'jobApplicationNotifications', 'subscriptionNotifications',
        'systemNotifications', 'dailyDigest', 'weeklyDigest', 'quietHoursEnabled',
        'quietHoursStart', 'quietHoursEnd'
      ];
      
      // Filter and clean the preferences data - only include allowed fields
      const cleanedData: any = {};
      
      // Only include allowed fields
      allowedFields.forEach(field => {
        if (preferencesData[field as keyof typeof preferencesData] !== undefined) {
          cleanedData[field] = preferencesData[field as keyof typeof preferencesData];
        }
      });
      
      // Convert soundVolume to proper decimal if it exists
      if (cleanedData.soundVolume !== undefined) {
        const volume = Number(cleanedData.soundVolume);
        if (isNaN(volume) || volume < 0 || volume > 1) {
          throw new Error(`Invalid sound volume: ${cleanedData.soundVolume}. Must be between 0 and 1.`);
        }
        cleanedData.soundVolume = volume.toFixed(2); // Convert to string with 2 decimal places
      }
      
      // Ensure boolean fields are actually booleans
      const booleanFields = [
        'enableEmailNotifications', 'enablePushNotifications', 'enableInAppNotifications',
        'enableSoundNotifications', 'accountNotifications', 'resumeNotifications',
        'coverLetterNotifications', 'jobApplicationNotifications', 'subscriptionNotifications',
        'systemNotifications', 'dailyDigest', 'weeklyDigest', 'quietHoursEnabled'
      ];
      
      booleanFields.forEach(field => {
        if (cleanedData[field] !== undefined) {
          cleanedData[field] = Boolean(cleanedData[field]);
        }
      });
      
      console.log('Cleaned preferences data (filtered):', cleanedData);
      
      if (existing) {
        // Update existing preferences - only set updatedAt, no other timestamp fields
        const [updated] = await db
          .update(notificationPreferences)
          .set({
            ...cleanedData,
            updatedAt: new Date()
          })
          .where(eq(notificationPreferences.userId, userId))
          .returning();
        
        return updated;
      } else {
        // Create new preferences
        const [created] = await db
          .insert(notificationPreferences)
          .values({
            userId,
            ...cleanedData
          })
          .returning();
        
        return created;
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      console.error('Original preferences data:', preferencesData);
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Create system notification for all users
   */
  async createSystemNotification(params: SystemNotificationParams): Promise<void> {
    try {
      // Get all user IDs
      const allUsers = await db.select({ id: users.id }).from(users);
      
      const notificationsData = allUsers.map((user: { id: number }) => ({
        recipientId: user.id,
        type: params.type as any,
        title: params.title || 'System Notification',
        message: params.message || '',
        data: params.data || {},
        priority: params.priority || 'normal',
        category: params.category as any,
        expiresAt: params.expiresAt,
        isSystem: true,
        isRead: false
      }));

      await db.insert(notifications).values(notificationsData);

      this.emit('notification:system_broadcast', { params, userCount: allUsers.length });
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw new Error('Failed to create system notification');
    }
  }

  /**
   * Send notification to all users except excluded ones
   */
  async sendNotificationToAllUsers(params: BroadcastNotificationParams): Promise<void> {
    try {
      let targetUsers;
      
      if (params.excludeUserIds && params.excludeUserIds.length > 0) {
        // Get users not in the excluded list
        targetUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(inArray(users.id, params.excludeUserIds));
      } else {
        // Get all users
        targetUsers = await db.select({ id: users.id }).from(users);
      }
      
      const notificationsData = targetUsers.map((user: { id: number }) => ({
        recipientId: user.id,
        type: params.type as any,
        title: params.title || 'Broadcast Notification',
        message: params.message || '',
        data: params.data || {},
        priority: params.priority || 'normal',
        category: params.category as any,
        expiresAt: params.expiresAt,
        isSystem: true,
        isRead: false
      }));

      await db.insert(notifications).values(notificationsData);

      this.emit('notification:broadcast', { params, userCount: targetUsers.length });
    } catch (error) {
      console.error('Error sending broadcast notification:', error);
      throw new Error('Failed to send broadcast notification');
    }
  }

  /**
   * Send notification to specific user group
   */
  async sendNotificationToUserGroup(params: GroupNotificationParams): Promise<void> {
    try {
      const notificationsData = params.userIds.map(userId => ({
        recipientId: userId,
        type: params.type as any,
        title: params.title || 'Group Notification',
        message: params.message || '',
        data: params.data || {},
        priority: params.priority || 'normal',
        category: params.category as any,
        expiresAt: params.expiresAt,
        isSystem: true,
        isRead: false
      }));

      await db.insert(notifications).values(notificationsData);

      this.emit('notification:group', { params, userCount: params.userIds.length });
    } catch (error) {
      console.error('Error sending group notification:', error);
      throw new Error('Failed to send group notification');
    }
  }

  /**
   * Get notification template by type
   */
  private async getTemplate(type: string): Promise<NotificationTemplate | null> {
    try {
      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(
          and(
            eq(notificationTemplates.type, type as any),
            eq(notificationTemplates.isActive, true)
          )
        );

      return template || null;
    } catch (error) {
      console.error('Error fetching notification template:', error);
      return null;
    }
  }

  /**
   * Process template with data
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;
    
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), String(data[key] || ''));
    });
    
    return processed;
  }

  /**
   * Transform database notification to frontend format
   */
  private transformNotification(notification: Notification): NotificationData {
    return {
      id: notification.id,
      recipientId: notification.recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data as Record<string, any> || {},
      isRead: notification.isRead,
      isSystem: notification.isSystem,
      createdAt: notification.createdAt.toISOString(),
      expiresAt: notification.expiresAt?.toISOString(),
      priority: notification.priority,
      category: notification.category,
      action: notification.action as any
    };
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.expiresAt, new Date()),
            eq(notifications.isRead, true)
          )
        );

      return Array.isArray(result) ? result.length : 0;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      return 0;
    }
  }

  /**
   * Get all notification templates
   */
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    try {
      const templates = await db
        .select()
        .from(notificationTemplates)
        .orderBy(notificationTemplates.type);

      return templates;
    } catch (error) {
      console.error('Error fetching all templates:', error);
      throw new Error('Failed to fetch notification templates');
    }
  }

  /**
   * Create or update notification template
   */
  async createOrUpdateTemplate(templateData: {
    type: string;
    titleTemplate: string;
    messageTemplate: string;
    emailSubjectTemplate?: string;
    emailBodyTemplate?: string;
    variables?: string[];
  }): Promise<NotificationTemplate> {
    try {
      // Check if template exists
      const existing = await this.getTemplate(templateData.type);
      
      if (existing) {
        // Update existing template
        const [updated] = await db
          .update(notificationTemplates)
          .set({
            titleTemplate: templateData.titleTemplate,
            messageTemplate: templateData.messageTemplate,
            emailSubjectTemplate: templateData.emailSubjectTemplate,
            emailBodyTemplate: templateData.emailBodyTemplate,
            variables: templateData.variables || [],
            updatedAt: new Date()
          })
          .where(eq(notificationTemplates.type, templateData.type as any))
          .returning();
        
        return updated;
      } else {
        // Create new template
        const [created] = await db
          .insert(notificationTemplates)
          .values({
            type: templateData.type as any,
            titleTemplate: templateData.titleTemplate,
            messageTemplate: templateData.messageTemplate,
            emailSubjectTemplate: templateData.emailSubjectTemplate,
            emailBodyTemplate: templateData.emailBodyTemplate,
            variables: templateData.variables || [],
            isActive: true
          })
          .returning();
        
        return created;
      }
    } catch (error) {
      console.error('Error creating/updating template:', error);
      throw new Error('Failed to save notification template');
    }
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(days: number = 30): Promise<{
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByCategory: Array<{ category: string; count: number }>;
    notificationsByType: Array<{ type: string; count: number }>;
    dailyStats: Array<{ date: string; count: number; unread: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total notifications
      const [totalResult] = await db
        .select({ count: count() })
        .from(notifications)
        .where(gte(notifications.createdAt, startDate));

      // Get unread notifications
      const [unreadResult] = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.isRead, false),
            gte(notifications.createdAt, startDate)
          )
        );

      // Get notifications by category
      const categoryStats = await db
        .select({
          category: notifications.category,
          count: count()
        })
        .from(notifications)
        .where(gte(notifications.createdAt, startDate))
        .groupBy(notifications.category);

      // Get notifications by type
      const typeStats = await db
        .select({
          type: notifications.type,
          count: count()
        })
        .from(notifications)
        .where(gte(notifications.createdAt, startDate))
        .groupBy(notifications.type);

      // Get daily stats (simplified version)
      const dailyStats = await db
        .select({
          date: sql`DATE(created_at)`.as('date'),
          count: count(),
          unread: sql`SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END)`.as('unread')
        })
        .from(notifications)
        .where(gte(notifications.createdAt, startDate))
        .groupBy(sql`DATE(created_at)`)
        .orderBy(sql`DATE(created_at)`);

      return {
        totalNotifications: totalResult?.count || 0,
        unreadNotifications: unreadResult?.count || 0,
        notificationsByCategory: categoryStats.map(stat => ({
          category: stat.category,
          count: stat.count
        })),
        notificationsByType: typeStats.map(stat => ({
          type: stat.type,
          count: stat.count
        })),
        dailyStats: dailyStats.map(stat => ({
          date: stat.date as string,
          count: stat.count,
          unread: Number(stat.unread)
        }))
      };
    } catch (error) {
      console.error('Error fetching notification analytics:', error);
      throw new Error('Failed to fetch notification analytics');
    }
  }

  /**
   * Get notification activity log
   */
  async getNotificationLog(options: {
    limit?: number;
    offset?: number;
    type?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    notifications: any[];
    total: number;
  }> {
    try {
      const {
        limit = 100,
        offset = 0,
        type,
        category,
        startDate,
        endDate
      } = options;

      let conditions = [];
      
      if (type) {
        conditions.push(eq(notifications.type, type as any));
      }
      
      if (category) {
        conditions.push(eq(notifications.category, category as any));
      }
      
      if (startDate) {
        conditions.push(sql`${notifications.createdAt} >= ${startDate}`);
      }
      
      if (endDate) {
        conditions.push(sql`${notifications.createdAt} <= ${endDate}`);
      }

      // Build where clause
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get notifications with user info
      const notificationResults = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          category: notifications.category,
          priority: notifications.priority,
          isRead: notifications.isRead,
          isSystem: notifications.isSystem,
          createdAt: notifications.createdAt,
          recipientId: notifications.recipientId,
          recipientUsername: users.username,
          recipientEmail: users.email
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.recipientId, users.id))
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(notifications)
        .where(whereClause);

      console.log(`Fetched ${notificationResults.length} notifications from log query`);

      return {
        notifications: notificationResults,
        total: totalResult.count
      };
    } catch (error) {
      console.error('Error fetching notification log:', error);
      throw new Error('Failed to fetch notification log');
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService(); 