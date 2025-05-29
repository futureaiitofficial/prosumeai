import { NotificationService } from './notification-service';
import { storage } from '../config/storage';

export class AdminNotificationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Get all admin users
   */
  private async getAdminUsers(): Promise<number[]> {
    try {
      const admins = await storage.getAdminUsers();
      return admins.map(admin => admin.id);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  }

  /**
   * Send notification to all admin users
   */
  private async notifyAdmins(params: {
    type: string;
    category: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high';
  }) {
    const adminIds = await this.getAdminUsers();
    
    if (adminIds.length === 0) {
      console.warn('No admin users found to notify');
      return;
    }

    // Send notification to each admin
    for (const adminId of adminIds) {
      try {
        await this.notificationService.createNotification({
          recipientId: adminId,
          type: params.type,
          category: params.category,
          title: params.title,
          message: params.message,
          data: params.data,
          priority: params.priority || 'normal'
        });
      } catch (error) {
        console.error(`Failed to create admin notification for admin ${adminId}:`, error);
      }
    }
  }

  /**
   * Notify admins about new user registration
   */
  async notifyNewUserRegistration(userData: {
    id: number;
    username: string;
    email: string;
    fullName: string;
  }) {
    await this.notifyAdmins({
      type: 'new_user_registered',
      category: 'admin',
      title: 'New User Registered',
      message: `${userData.fullName} (${userData.username}) has registered a new account.`,
      data: {
        userId: userData.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName,
        registrationTime: new Date().toISOString()
      },
      priority: 'normal'
    });
  }

  /**
   * Notify admins about new subscription
   */
  async notifyNewSubscription(subscriptionData: {
    userId: number;
    userName: string;
    planName: string;
    amount: string;
    currency: string;
    subscriptionId: number;
  }) {
    await this.notifyAdmins({
      type: 'new_subscription',
      category: 'admin',
      title: 'New Subscription',
      message: `${subscriptionData.userName} has subscribed to ${subscriptionData.planName} plan for ${subscriptionData.amount} ${subscriptionData.currency}.`,
      data: {
        userId: subscriptionData.userId,
        userName: subscriptionData.userName,
        planName: subscriptionData.planName,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency,
        subscriptionId: subscriptionData.subscriptionId,
        subscriptionTime: new Date().toISOString()
      },
      priority: 'normal'
    });
  }

  /**
   * Notify admins about payment events
   */
  async notifyPaymentReceived(paymentData: {
    userId: number;
    userName: string;
    amount: string;
    currency: string;
    transactionId: string;
    planName: string;
  }) {
    await this.notifyAdmins({
      type: 'payment_received',
      category: 'admin',
      title: 'Payment Received',
      message: `Payment of ${paymentData.amount} ${paymentData.currency} received from ${paymentData.userName} for ${paymentData.planName}.`,
      data: {
        userId: paymentData.userId,
        userName: paymentData.userName,
        amount: paymentData.amount,
        currency: paymentData.currency,
        transactionId: paymentData.transactionId,
        planName: paymentData.planName,
        paymentTime: new Date().toISOString()
      },
      priority: 'normal'
    });
  }

  /**
   * Notify admins about payment failures
   */
  async notifyPaymentFailed(paymentData: {
    userId: number;
    userName: string;
    amount: string;
    currency: string;
    reason: string;
    planName: string;
  }) {
    await this.notifyAdmins({
      type: 'payment_failed',
      category: 'admin',
      title: 'Payment Failed',
      message: `Payment failed for ${paymentData.userName} - ${paymentData.amount} ${paymentData.currency} for ${paymentData.planName}. Reason: ${paymentData.reason}`,
      data: {
        userId: paymentData.userId,
        userName: paymentData.userName,
        amount: paymentData.amount,
        currency: paymentData.currency,
        reason: paymentData.reason,
        planName: paymentData.planName,
        failureTime: new Date().toISOString()
      },
      priority: 'high'
    });
  }

  /**
   * Notify admins about support requests
   */
  async notifySupportRequest(supportData: {
    userId: number;
    userName: string;
    subject: string;
    message: string;
    ticketId?: string;
  }) {
    await this.notifyAdmins({
      type: 'support_request',
      category: 'admin',
      title: 'New Support Request',
      message: `${supportData.userName} submitted a support request: "${supportData.subject}"`,
      data: {
        userId: supportData.userId,
        userName: supportData.userName,
        subject: supportData.subject,
        message: supportData.message,
        ticketId: supportData.ticketId,
        requestTime: new Date().toISOString()
      },
      priority: 'normal'
    });
  }

  /**
   * Notify admins about security alerts
   */
  async notifySecurityAlert(alertData: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    userId?: number;
    userName?: string;
    details?: Record<string, any>;
  }) {
    const priority = alertData.severity === 'critical' || alertData.severity === 'high' ? 'high' : 'normal';
    
    await this.notifyAdmins({
      type: 'security_alert',
      category: 'security',
      title: `Security Alert - ${alertData.type}`,
      message: alertData.message,
      data: {
        alertType: alertData.type,
        severity: alertData.severity,
        userId: alertData.userId,
        userName: alertData.userName,
        details: alertData.details,
        alertTime: new Date().toISOString()
      },
      priority
    });
  }

  /**
   * Notify admins about server errors
   */
  async notifyServerError(errorData: {
    error: string;
    endpoint: string;
    method: string;
    userId?: number;
    userName?: string;
    stack?: string;
  }) {
    await this.notifyAdmins({
      type: 'server_error',
      category: 'system',
      title: 'Server Error',
      message: `Error on ${errorData.method} ${errorData.endpoint}: ${errorData.error}`,
      data: {
        error: errorData.error,
        endpoint: errorData.endpoint,
        method: errorData.method,
        userId: errorData.userId,
        userName: errorData.userName,
        stack: errorData.stack,
        errorTime: new Date().toISOString()
      },
      priority: 'high'
    });
  }

  /**
   * Notify admins about admin actions that require attention
   */
  async notifyAdminActionRequired(actionData: {
    type: string;
    message: string;
    userId?: number;
    userName?: string;
    details?: Record<string, any>;
  }) {
    await this.notifyAdmins({
      type: 'admin_action_required',
      category: 'admin',
      title: 'Admin Action Required',
      message: actionData.message,
      data: {
        actionType: actionData.type,
        userId: actionData.userId,
        userName: actionData.userName,
        details: actionData.details,
        requestTime: new Date().toISOString()
      },
      priority: 'high'
    });
  }
}

// Export singleton instance
export const adminNotificationService = new AdminNotificationService(); 