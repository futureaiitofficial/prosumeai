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
    console.log('Adding two factor authentication email templates...');

    // Check if the template already exists
    const existingTemplate = await db.execute(sql`
      SELECT * FROM email_templates WHERE template_type = 'two_factor_code' LIMIT 1;
    `);

    if (existingTemplate.length > 0) {
      console.log('Two factor code email template already exists, skipping creation.');
    } else {
      // Add the two-factor code email template
      console.log('Creating two factor code email template...');
      await db.execute(sql`
        INSERT INTO email_templates (
          template_type, 
          name, 
          subject, 
          html_content, 
          text_content, 
          variables,
          is_default,
          is_active
        )
        VALUES (
          'two_factor_code',
          'Two-Factor Authentication Code',
          'Your verification code for two-factor authentication',
          '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Two-Factor Authentication Code</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #e5e7eb; border-top: none; }
    .code { font-size: 32px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 5px; color: #4f46e5; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .warning { background-color: #fee2e2; border: 1px solid #fecaca; padding: 10px; border-radius: 5px; margin: 20px 0; color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Two-Factor Authentication</h1>
    </div>
    <div class="content">
      <p>Hello {{username}},</p>
      <p>You are receiving this email because you are attempting to log in to your account or complete a secure action that requires verification. To proceed, please use the following verification code:</p>
      
      <div class="code">{{code}}</div>
      
      <p>This code will expire in {{expiryMinutes}} minutes.</p>
      
      <div class="warning">
        <strong>Important Security Notice:</strong> If you did not request this code, please ignore this email and consider changing your password immediately.
      </div>
      
      <p>Thank you for keeping your account secure!</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
          'Hello {{username}},

You are receiving this email because you are attempting to log in to your account or complete a secure action that requires verification. To proceed, please use the following verification code:

{{code}}

This code will expire in {{expiryMinutes}} minutes.

IMPORTANT SECURITY NOTICE: If you did not request this code, please ignore this email and consider changing your password immediately.

Thank you for keeping your account secure!

This is an automated message, please do not reply to this email.',
          '{"username": "User''s name", "code": "Verification code", "expiryMinutes": "Expiry time in minutes"}',
          true,
          true
        );
      `);

      console.log('Two factor code email template created successfully.');
    }

    console.log('Two factor authentication email templates migration completed successfully!');
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