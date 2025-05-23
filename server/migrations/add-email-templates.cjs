/**
 * Migration to add email templates table
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
};

async function migrate() {
  // Connect to database
  const pool = new Pool(dbConfig);
  let client;

  try {
    client = await pool.connect();
    console.log('Connected to database, starting migration...');

    // Start a transaction
    await client.query('BEGIN');

    // Check if email_templates table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'email_templates'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('Creating email_templates table...');

      // Create email_templates table
      await client.query(`
        CREATE TABLE email_templates (
          id SERIAL PRIMARY KEY,
          template_type VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          html_content TEXT NOT NULL,
          text_content TEXT NOT NULL,
          variables JSONB,
          is_default BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create unique constraint on template_type for default templates
      await client.query(`
        CREATE UNIQUE INDEX idx_default_email_template 
        ON email_templates (template_type) 
        WHERE is_default = true;
      `);

      // Insert default templates
      await insertDefaultTemplates(client);

      console.log('Email templates table created successfully');
    } else {
      console.log('Email templates table already exists');
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error during migration:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

async function insertDefaultTemplates(client) {
  console.log('Inserting default email templates...');

  // Welcome email template
  await client.query(`
    INSERT INTO email_templates (
      template_type, name, subject, html_content, text_content, variables, is_default, is_active
    ) VALUES (
      'welcome', 
      'Welcome Email', 
      'Welcome to {{appName}}!',
      E'<div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>Welcome to {{appName}}!</h1>
        <p>Hello {{username}},</p>
        <p>Thank you for joining {{appName}}! We are excited to have you on board and can not wait to help you advance your career with our powerful tools.</p>
        <p>With {{appName}}, you can:</p>
        <ul>
          <li>Create AI-powered resumes tailored to specific job descriptions</li>
          <li>Generate personalized cover letters that highlight your unique qualifications</li>
          <li>Track your job applications in one organized dashboard</li>
          <li>And much more!</li>
        </ul>
        <p>If you have any questions or need assistance, our support team is always ready to help.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
      </div>',
      'Hello {{username}},

Thank you for joining {{appName}}! We are excited to have you on board and can not wait to help you advance your career with our powerful tools.

With {{appName}}, you can:
- Create AI-powered resumes tailored to specific job descriptions
- Generate personalized cover letters that highlight your unique qualifications
- Track your job applications in one organized dashboard
- And much more!

If you have any questions or need assistance, our support team is always ready to help.

Best regards,
The {{appName}} Team',
      '{"username": "User''s name", "appName": "Application name"}',
      true,
      true
    );
  `);

  // Email verification template
  await client.query(`
    INSERT INTO email_templates (
      template_type, name, subject, html_content, text_content, variables, is_default, is_active
    ) VALUES (
      'email_verification', 
      'Email Verification', 
      'Verify Your Email Address for {{appName}}',
      E'<div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>Verify Your Email Address</h1>
        <p>Hello {{username}},</p>
        <p>Thank you for registering with {{appName}}. To complete your registration and verify your email address, please click the button below:</p>
        <p style="text-align: center;">
          <a href="{{verificationLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">Verify Email Address</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>{{verificationLink}}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account with {{appName}}, please ignore this email.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
      </div>',
      'Hello {{username}},

Thank you for registering with {{appName}}. To complete your registration and verify your email address, please click the link below:

{{verificationLink}}

This link will expire in 24 hours.

If you did not create an account with {{appName}}, please ignore this email.

Best regards,
The {{appName}} Team',
      '{"username": "User''s name", "appName": "Application name", "verificationLink": "Email verification link"}',
      true,
      true
    );
  `);

  // Password reset template
  await client.query(`
    INSERT INTO email_templates (
      template_type, name, subject, html_content, text_content, variables, is_default, is_active
    ) VALUES (
      'password_reset', 
      'Password Reset', 
      'Password Reset Request for {{appName}}',
      E'<div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>Password Reset Request</h1>
        <p>Hello {{username}},</p>
        <p>We received a request to reset your password for your {{appName}} account. If you did not make this request, you can safely ignore this email.</p>
        <p style="text-align: center;">
          <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">Reset Your Password</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>{{resetLink}}</p>
        <p>This password reset link will expire in 24 hours for security reasons.</p>
        <p>If you did not request a password reset, please contact our support team immediately.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
      </div>',
      'Hello {{username}},

We received a request to reset your password for your {{appName}} account. If you did not make this request, you can safely ignore this email.

To reset your password, please visit the following link:

{{resetLink}}

This password reset link will expire in 24 hours for security reasons.

If you did not request a password reset, please contact our support team immediately.

Best regards,
The {{appName}} Team',
      '{"username": "User''s name", "appName": "Application name", "resetLink": "Password reset link"}',
      true,
      true
    );
  `);

  // Password changed notification template
  await client.query(`
    INSERT INTO email_templates (
      template_type, name, subject, html_content, text_content, variables, is_default, is_active
    ) VALUES (
      'password_changed', 
      'Password Changed Notification', 
      'Your {{appName}} Password Has Been Changed',
      E'<div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>Password Changed</h1>
        <p>Hello {{username}},</p>
        <p>We want to inform you that your password for {{appName}} was recently changed.</p>
        <p>If you made this change, you can safely ignore this email.</p>
        <p>If you did not change your password, please contact our support team immediately or reset your password by clicking the button below:</p>
        <p style="text-align: center;">
          <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">Reset Your Password</a>
        </p>
        <p>Best regards,<br>The {{appName}} Team</p>
      </div>',
      'Hello {{username}},

We want to inform you that your password for {{appName}} was recently changed.

If you made this change, you can safely ignore this email.

If you did not change your password, please contact our support team immediately or reset your password by visiting:

{{resetLink}}

Best regards,
The {{appName}} Team',
      '{"username": "User''s name", "appName": "Application name", "resetLink": "Password reset link", "changeTime": "Time when password was changed"}',
      true,
      true
    );
  `);

  // Login alert template
  await client.query(`
    INSERT INTO email_templates (
      template_type, name, subject, html_content, text_content, variables, is_default, is_active
    ) VALUES (
      'login_alert', 
      'Login Alert', 
      'New Login to Your {{appName}} Account',
      E'<div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>New Login Detected</h1>
        <p>Hello {{username}},</p>
        <p>We detected a new login to your {{appName}} account.</p>
        <p><strong>Login Details:</strong></p>
        <ul>
          <li>Date and Time: {{loginTime}}</li>
          <li>Device: {{device}}</li>
          <li>Location: {{location}}</li>
          <li>IP Address: {{ipAddress}}</li>
        </ul>
        <p>If this was you, you can safely ignore this email.</p>
        <p>If you do not recognize this login activity, please secure your account immediately by changing your password:</p>
        <p style="text-align: center;">
          <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">Secure Your Account</a>
        </p>
        <p>Best regards,<br>The {{appName}} Team</p>
      </div>',
      'Hello {{username}},

We detected a new login to your {{appName}} account.

Login Details:
- Date and Time: {{loginTime}}
- Device: {{device}}
- Location: {{location}}
- IP Address: {{ipAddress}}

If this was you, you can safely ignore this email.

If you do not recognize this login activity, please secure your account immediately by changing your password:

{{resetLink}}

Best regards,
The {{appName}} Team',
      '{"username": "User''s name", "appName": "Application name", "resetLink": "Password reset link", "loginTime": "Login time", "device": "Device information", "location": "Login location", "ipAddress": "IP address"}',
      true,
      true
    );
  `);
}

// Run migration
migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 