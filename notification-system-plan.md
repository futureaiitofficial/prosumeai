# Notification System Implementation Plan for ProsumeAI

## Current Implementation Status

**✅ IMPLEMENTED: In-App Notification System**
- Real-time in-app notifications with sound alerts
- Notification preferences for categories (account, resume, cover letter, job application, subscription, system)
- Sound notification controls with volume adjustment
- Quiet hours functionality
- Database storage with proper schema and relationships
- Admin notification management

**⚠️ DATABASE SCHEMA PREPARED BUT NOT IMPLEMENTED: Email Notifications**
- The database schema includes email notification preferences fields (`enableEmailNotifications`, `dailyDigest`, `weeklyDigest`)
- These fields exist for potential future implementation but do NOT currently send actual email notifications
- Email service exists for authentication-related emails (password reset, welcome, etc.) but NOT for the notification system

**🎯 CURRENT FOCUS: In-App Notifications Only**
- All notification functionality is designed for in-app use with optional sound alerts
- Users see notifications in the application header dropdown
- Sound notifications play when new notifications arrive (if enabled)

## 1. Notification Data Model

Let's define the notification data structure:

```typescript
interface Notification {
  id: string;
  recipientId: number;  // User ID
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;  // Additional context data
  isRead: boolean;
  isSystem: boolean;
  createdAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'normal' | 'high';
  category: NotificationCategory;
  action?: {
    type: 'link' | 'button';
    label: string;
    url?: string;
    payload?: Record<string, any>;
  };
}

enum NotificationType {
  // User notifications
  RESUME_CREATED = 'resume_created',
  RESUME_DOWNLOADED = 'resume_downloaded',
  RESUME_SHARED = 'resume_shared',
  COVER_LETTER_CREATED = 'cover_letter_created',
  JOB_APPLICATION_CREATED = 'job_application_created',
  JOB_APPLICATION_UPDATED = 'job_application_updated',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_UPDATE = 'account_update',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  CUSTOM_NOTIFICATION = 'custom_notification',
  
  // Admin notifications
  NEW_USER_REGISTERED = 'new_user_registered',
  NEW_SUBSCRIPTION = 'new_subscription',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  ACCOUNT_DELETION = 'account_deletion',
  SUPPORT_REQUEST = 'support_request',
  SERVER_ERROR = 'server_error',
  SECURITY_ALERT = 'security_alert',
  ADMIN_ACTION_REQUIRED = 'admin_action_required'
}

enum NotificationCategory {
  ACCOUNT = 'account',
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  JOB_APPLICATION = 'job_application',
  SUBSCRIPTION = 'subscription',
  SYSTEM = 'system',
  SECURITY = 'security',
  PAYMENT = 'payment',
  ADMIN = 'admin'
}
```

## 2. Backend Implementation

### Database Schema (Drizzle)

```typescript
// In server/drizzle/schema/notifications.ts
import { pgTable, serial, text, integer, boolean, timestamp, json } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  recipientId: integer('recipient_id').references(() => users.id).notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: json('data'),
  isRead: boolean('is_read').notNull().default(false),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  priority: text('priority').notNull().default('normal'),
  category: text('category').notNull(),
  action: json('action')
});

// Relationships
export const notificationRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
}));
```

### API Endpoints

```typescript
// Notification API Routes

// User endpoints
// GET /api/notifications - Get user's notifications
// GET /api/notifications/unread - Get unread count
// PATCH /api/notifications/:id - Mark notification as read
// PATCH /api/notifications/mark-all-read - Mark all as read
// DELETE /api/notifications/:id - Delete notification
// GET /api/notifications/preferences - Get notification preferences
// PUT /api/notifications/preferences - Update notification preferences

// Admin endpoints
// POST /api/admin/notifications - Create new notification (to specific users or all)
// GET /api/admin/notifications/templates - Get notification templates
// POST /api/admin/notifications/templates - Create notification template
// GET /api/admin/notifications/analytics - Get notification analytics
// GET /api/admin/notifications/log - Get notification log
```

### Notification Service

```typescript
// In server/services/notification-service.ts
export class NotificationService {
  // Core notification methods
  async createNotification(data: CreateNotificationParams): Promise<Notification>;
  async getUserNotifications(userId: number, options?: NotificationQueryOptions): Promise<Notification[]>;
  async markAsRead(notificationId: number): Promise<void>;
  async markAllAsRead(userId: number): Promise<void>;
  async deleteNotification(notificationId: number, userId: number): Promise<void>;
  
  // Notification preferences
  async getUserNotificationPreferences(userId: number): Promise<NotificationPreferences>;
  async updateUserNotificationPreferences(userId: number, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  
  // Admin methods
  async createSystemNotification(params: SystemNotificationParams): Promise<void>;
  async sendNotificationToAllUsers(params: BroadcastNotificationParams): Promise<void>;
  async sendNotificationToUserGroup(params: GroupNotificationParams): Promise<void>;
  
  // Event listeners
  async handleUserEvent(event: UserEvent): Promise<void>;
  async handleSystemEvent(event: SystemEvent): Promise<void>;
  async handleAdminEvent(event: AdminEvent): Promise<void>;
}
```

### Event System

We'll need an event system to trigger notifications:

```typescript
// In server/services/event-service.ts
export class EventService {
  // Event emitter methods
  emit(eventName: string, data: any): void;
  on(eventName: string, listener: (data: any) => void): void;
  off(eventName: string, listener: (data: any) => void): void;
  
  // Predefined events
  emitUserEvent(event: UserEvent): void;
  emitSystemEvent(event: SystemEvent): void;
  emitAdminEvent(event: AdminEvent): void;
}
```

## 3. Frontend Implementation

### Notification Context/Provider

```tsx
// In client/src/contexts/notification-context.tsx
export const NotificationContext = createContext<{
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  preferences: NotificationPreferences;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
}>({
  // Default values
});

export const NotificationProvider = ({ children }) => {
  // Implementation
};
```

### Notification Components

#### 1. Notification Dropdown (Header Component)

```tsx
// In client/src/components/ui/notification-dropdown.tsx
export const NotificationDropdown = () => {
  // Implementation
};
```

#### 2. Notification List

```tsx
// In client/src/components/ui/notification-list.tsx
export const NotificationList = ({ notifications, onMarkAsRead, onDelete }) => {
  // Implementation
};
```

#### 3. Notification Item

```tsx
// In client/src/components/ui/notification-item.tsx
export const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  // Implementation
};
```

#### 4. Notification Center Page

```tsx
// In client/src/pages/user/notifications.tsx
export default function NotificationsPage() {
  // Implementation
};
```

#### 5. Notification Settings Page

```tsx
// In client/src/pages/user/notification-settings.tsx
export default function NotificationSettingsPage() {
  // Implementation
};
```

#### 6. Admin Notification Management

```tsx
// In client/src/pages/admin/notifications/index.tsx
export default function AdminNotificationsPage() {
  // Implementation
};
```

#### 7. Admin Notification Creation

```tsx
// In client/src/pages/admin/notifications/create.tsx
export default function CreateNotificationPage() {
  // Implementation
};
```

## 4. Real-time Notifications

We should implement real-time notifications using WebSockets:

```typescript
// In server/services/websocket-service.ts
export class WebSocketService {
  // Methods to handle connections
  handleConnection(socket: WebSocket, userId: number): void;
  broadcastToUser(userId: number, event: string, data: any): void;
  broadcastToAllUsers(event: string, data: any): void;
  broadcastToAdmin(event: string, data: any): void;
}
```

On the client:

```typescript
// In client/src/hooks/use-notifications-socket.ts
export const useNotificationsSocket = () => {
  // Implementation using WebSockets
};
```

## 5. Email Notifications

Some notifications should also be sent via email:

```typescript
// In server/services/email-notification-service.ts
export class EmailNotificationService {
  async sendNotificationEmail(userId: number, notification: Notification): Promise<void>;
  async sendPasswordResetEmail(userId: number, token: string): Promise<void>;
  async sendWelcomeEmail(userId: number): Promise<void>;
  async sendSubscriptionEmail(userId: number, subscriptionDetails: any): Promise<void>;
  // Other email notification methods
}
```

## 6. Specific Event Types to Handle

### User Notifications

1. **Account Related**
   - Account created
   - Password reset requested
   - Password changed
   - Email verification
   - Profile updated
   - Two-factor authentication enabled/disabled

2. **Resume Related**
   - Resume created
   - Resume updated
   - Resume shared
   - Resume download
   - AI resume suggestions
   - Resume score improved

3. **Cover Letter Related**
   - Cover letter created
   - Cover letter updated
   - Cover letter shared
   - Cover letter download

4. **Job Application Related**
   - Job application created
   - Job application status updated
   - Job application reminder
   - Interview scheduled

5. **Subscription Related**
   - Subscription created
   - Subscription renewed
   - Subscription expiring soon (7 days, 3 days, 1 day)
   - Subscription expired
   - Payment successful
   - Payment failed
   - Plan upgraded/downgraded

6. **System Notifications**
   - Platform updates
   - New features
   - Maintenance notifications
   - Security alerts
   - Usage limits (approaching/reached)

### Admin Notifications

1. **User Management**
   - New user registration
   - User account deletion
   - Suspicious activity
   
2. **Subscription & Payments**
   - New subscription
   - Subscription cancellation
   - Payment received
   - Payment failed
   - Refund requested
   - Revenue milestones

3. **System Alerts**
   - Server errors
   - Database issues
   - API errors
   - Security breaches
   - High resource usage

4. **Content & Usage**
   - Inappropriate content flagged
   - High traffic periods
   - Feature usage analytics

5. **Support**
   - New support ticket
   - Support ticket updates
   - User feedback received

## 7. Implementation Phases

### Phase 1: Core Backend Infrastructure
- Implement database schema
- Create notification service
- Set up event system
- Create basic API endpoints

### Phase 2: Frontend Components
- Build notification dropdown
- Create notification list view
- Implement notification settings

### Phase 3: Admin Functionality
- Build admin notification dashboard
- Create system notification sending interface
- Implement notification analytics

### Phase 4: Real-time Updates
- Implement WebSocket service
- Add real-time notification display
- Set up client socket connections

### Phase 5: Email Integration
- Set up email templates
- Implement email notification service
- Configure email delivery preferences

### Phase 6: Testing & Optimization
- Load testing
- UX testing
- Performance optimization

## 8. User Preferences

Allow users to customize their notification preferences:

```typescript
interface NotificationPreferences {
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  enableInAppNotifications: boolean;
  
  // Category preferences
  accountNotifications: boolean;
  resumeNotifications: boolean;
  coverLetterNotifications: boolean;
  jobApplicationNotifications: boolean;
  subscriptionNotifications: boolean;
  systemNotifications: boolean;
  
  // Frequency preferences
  dailyDigest: boolean;
  weeklyDigest: boolean;
  
  // Do not disturb
  quietHoursEnabled: boolean;
  quietHoursStart: string; // Time format: "HH:MM"
  quietHoursEnd: string;
}
```

## Next Steps

To begin implementation:

1. First, create the database schema for notifications
2. Implement the core notification service
3. Build the event system to trigger notifications
4. Create the notification components in the UI
5. Add API endpoints for notification management
6. Implement user preferences for notifications 