const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const dotenv = require('dotenv');
const { sql } = require('drizzle-orm');

// Load environment variables
dotenv.config();

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// For migrations and one-time script execution
const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient);

async function runMigration() {
  try {
    console.log('Starting notification system migration...');
    console.log('Using database connection from environment variables');

    // Create notification type enum
    console.log('Creating notification type enum...');
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE notification_type AS ENUM (
          'resume_created',
          'resume_downloaded',
          'resume_shared',
          'cover_letter_created',
          'job_application_created',
          'job_application_updated',
          'subscription_created',
          'subscription_renewed',
          'subscription_expiring',
          'subscription_expired',
          'password_reset',
          'account_update',
          'system_announcement',
          'custom_notification',
          'new_user_registered',
          'new_subscription',
          'payment_received',
          'payment_failed',
          'account_deletion',
          'support_request',
          'server_error',
          'security_alert',
          'admin_action_required'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create notification category enum
    console.log('Creating notification category enum...');
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE notification_category AS ENUM (
          'account',
          'resume',
          'cover_letter',
          'job_application',
          'subscription',
          'system',
          'security',
          'payment',
          'admin'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create notification priority enum
    console.log('Creating notification priority enum...');
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE notification_priority AS ENUM (
          'low',
          'normal',
          'high'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Check if notifications table exists
    const notificationsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    
    if (!notificationsTableExists[0].exists) {
      console.log('Creating notifications table...');
      
      await db.execute(sql`
        CREATE TABLE "notifications" (
          "id" SERIAL PRIMARY KEY,
          "recipient_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "type" notification_type NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "data" JSONB DEFAULT '{}',
          "is_read" BOOLEAN NOT NULL DEFAULT false,
          "is_system" BOOLEAN NOT NULL DEFAULT false,
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expires_at" TIMESTAMP,
          "priority" notification_priority NOT NULL DEFAULT 'normal',
          "category" notification_category NOT NULL,
          "action" JSONB
        );
      `);
      
      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX "idx_notifications_recipient_id" ON "notifications"("recipient_id");
      `);
      
      await db.execute(sql`
        CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at");
      `);
      
      await db.execute(sql`
        CREATE INDEX "idx_notifications_is_read" ON "notifications"("is_read");
      `);
      
      await db.execute(sql`
        CREATE INDEX "idx_notifications_category" ON "notifications"("category");
      `);
      
      await db.execute(sql`
        CREATE INDEX "idx_notifications_type" ON "notifications"("type");
      `);
      
      console.log('Notifications table created successfully');
    } else {
      console.log('Notifications table already exists');
    }

    // Check if notification_preferences table exists
    const preferencesTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_preferences'
      );
    `);
    
    if (!preferencesTableExists[0].exists) {
      console.log('Creating notification preferences table...');
      
      await db.execute(sql`
        CREATE TABLE "notification_preferences" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE UNIQUE,
          "enable_email_notifications" BOOLEAN NOT NULL DEFAULT true,
          "enable_push_notifications" BOOLEAN NOT NULL DEFAULT true,
          "enable_in_app_notifications" BOOLEAN NOT NULL DEFAULT true,
          "account_notifications" BOOLEAN NOT NULL DEFAULT true,
          "resume_notifications" BOOLEAN NOT NULL DEFAULT true,
          "cover_letter_notifications" BOOLEAN NOT NULL DEFAULT true,
          "job_application_notifications" BOOLEAN NOT NULL DEFAULT true,
          "subscription_notifications" BOOLEAN NOT NULL DEFAULT true,
          "system_notifications" BOOLEAN NOT NULL DEFAULT true,
          "daily_digest" BOOLEAN NOT NULL DEFAULT false,
          "weekly_digest" BOOLEAN NOT NULL DEFAULT false,
          "quiet_hours_enabled" BOOLEAN NOT NULL DEFAULT false,
          "quiet_hours_start" TEXT DEFAULT '22:00',
          "quiet_hours_end" TEXT DEFAULT '08:00',
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create index for user lookup
      await db.execute(sql`
        CREATE INDEX "idx_notification_preferences_user_id" ON "notification_preferences"("user_id");
      `);
      
      console.log('Notification preferences table created successfully');
    } else {
      console.log('Notification preferences table already exists');
    }

    // Check if notification_templates table exists
    const templatesTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_templates'
      );
    `);
    
    if (!templatesTableExists[0].exists) {
      console.log('Creating notification templates table...');
      
      await db.execute(sql`
        CREATE TABLE "notification_templates" (
          "id" SERIAL PRIMARY KEY,
          "type" notification_type NOT NULL UNIQUE,
          "title_template" TEXT NOT NULL,
          "message_template" TEXT NOT NULL,
          "email_subject_template" TEXT,
          "email_body_template" TEXT,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "variables" JSONB DEFAULT '[]',
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('Notification templates table created successfully');
      
      // Insert default templates
      console.log('Inserting default notification templates...');
      await db.execute(sql`
        INSERT INTO "notification_templates" (
          "type", 
          "title_template", 
          "message_template",
          "email_subject_template",
          "email_body_template",
          "variables"
        ) VALUES 
        (
          'resume_created', 
          'Resume Created Successfully', 
          'Your resume "{{resumeTitle}}" has been created successfully.',
          'Your Resume "{{resumeTitle}}" is Ready',
          'Hello {{userName}},\n\nYour resume "{{resumeTitle}}" has been created successfully. You can now download, share, or continue editing it.\n\nBest regards,\nThe ProsumeAI Team',
          '["resumeTitle", "userName"]'
        ),
        (
          'cover_letter_created', 
          'Cover Letter Created', 
          'Your cover letter for {{jobTitle}} at {{company}} has been created.',
          'Cover Letter Created for {{jobTitle}}',
          'Hello {{userName}},\n\nYour cover letter for the {{jobTitle}} position at {{company}} has been created successfully.\n\nBest regards,\nThe ProsumeAI Team',
          '["jobTitle", "company", "userName"]'
        ),
        (
          'job_application_created', 
          'New Job Application Tracked', 
          'Job application for {{jobTitle}} at {{company}} has been added to your tracker.',
          'Job Application Added to Tracker',
          'Hello {{userName}},\n\nYour job application for {{jobTitle}} at {{company}} has been added to your application tracker.\n\nBest regards,\nThe ProsumeAI Team',
          '["jobTitle", "company", "userName"]'
        ),
        (
          'subscription_expiring', 
          'Subscription Expiring Soon', 
          'Your {{planName}} subscription will expire in {{daysLeft}} days.',
          'Your Subscription Expires in {{daysLeft}} Days',
          'Hello {{userName}},\n\nYour {{planName}} subscription will expire in {{daysLeft}} days. Renew now to continue enjoying all premium features.\n\nBest regards,\nThe ProsumeAI Team',
          '["planName", "daysLeft", "userName"]'
        ),
        (
          'password_reset', 
          'Password Reset Request', 
          'A password reset has been requested for your account.',
          'Password Reset Request',
          'Hello {{userName}},\n\nA password reset has been requested for your account. If this was you, please follow the instructions in your email. If not, please contact support.\n\nBest regards,\nThe ProsumeAI Team',
          '["userName"]'
        ),
        (
          'system_announcement', 
          'System Announcement', 
          '{{message}}',
          '{{title}}',
          'Hello {{userName}},\n\n{{message}}\n\nBest regards,\nThe ProsumeAI Team',
          '["title", "message", "userName"]'
        );
      `);
      
      console.log('Default notification templates inserted successfully');
    } else {
      console.log('Notification templates table already exists');
    }

    console.log('Notification system migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await migrationClient.end();
  }
}

// Run the migration
runMigration(); 