-- Migration: Add missing notification types to notification_type enum
-- Date: 2025-05-29

-- Add missing notification types to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'subscription_activated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'subscription_cancelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'subscription_grace_period';

-- Insert new notification templates for the missing types
INSERT INTO "notification_templates" (
  "type", 
  "title_template", 
  "message_template",
  "email_subject_template",
  "email_body_template",
  "variables",
  "is_active"
) VALUES 
(
  'subscription_activated', 
  'Subscription Activated', 
  'Your {{planName}} subscription has been activated successfully.',
  'Welcome to {{planName}} - Subscription Activated',
  'Hello {{userName}},\n\nYour {{planName}} subscription has been activated successfully! You now have access to all premium features.\n\nPlan Details:\n- Plan: {{planName}}\n- Amount: {{amount}} {{currency}}\n- Activation Type: {{activationType}}\n\nThank you for choosing ProsumeAI!\n\nBest regards,\nThe ProsumeAI Team',
  '["planName", "userName", "amount", "currency", "activationType"]',
  true
),
(
  'subscription_cancelled', 
  'Subscription Cancelled', 
  'Your subscription has been cancelled. Access will continue until {{endDate}}.',
  'Subscription Cancelled - Access Until {{endDate}}',
  'Hello {{userName}},\n\nYour subscription has been cancelled as requested. Don''t worry - you''ll continue to have access to all premium features until {{endDate}}.\n\nIf you change your mind, you can reactivate your subscription anytime from your account settings.\n\nBest regards,\nThe ProsumeAI Team',
  '["userName", "endDate", "planName"]',
  true
),
(
  'subscription_grace_period', 
  'Subscription in Grace Period', 
  'Your subscription has expired but you have {{gracePeriodDays}} days of grace period.',
  'Your Subscription - Grace Period Active',
  'Hello {{userName}},\n\nYour subscription has expired, but we''ve activated a {{gracePeriodDays}}-day grace period for you. This means you can continue using all premium features until {{gracePeriodEnd}}.\n\nTo avoid any interruption in service, please update your payment method or renew your subscription.\n\nBest regards,\nThe ProsumeAI Team',
  '["userName", "gracePeriodDays", "gracePeriodEnd"]',
  true
)
ON CONFLICT (type) DO UPDATE SET
  title_template = EXCLUDED.title_template,
  message_template = EXCLUDED.message_template,
  email_subject_template = EXCLUDED.email_subject_template,
  email_body_template = EXCLUDED.email_body_template,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- Update schema.ts TypeScript enum to include these types (comment for reference)
-- The following types should be added to the notificationTypeEnum in shared/schema.ts:
-- 'subscription_activated'
-- 'subscription_cancelled' 
-- 'subscription_grace_period' 