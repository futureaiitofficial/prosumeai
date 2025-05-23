/**
 * Simple test script for email templates
 */

const nodemailer = require('nodemailer');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Email to send test to
const TEST_EMAIL = process.argv[2] || 'test@example.com';
const TEST_TYPE = process.argv[3] || 'welcome';

// Template processor function
function processTemplate(template, variables) {
  return template.replace(/{{(\w+)}}/g, (match, variable) => {
    return variables[variable] !== undefined ? String(variables[variable]) : match;
  });
}

/**
 * Run the test
 */
async function runTest() {
  console.log(`Initializing email test...`);
  console.log(`Test type: ${TEST_TYPE}`);
  console.log(`Test email: ${TEST_EMAIL}`);
  
  // Connect to database
  const pool = new Pool(dbConfig);
  let client;
  
  try {
    client = await pool.connect();
    console.log('Connected to database');
    
    // Get SMTP settings
    const smtpResult = await client.query('SELECT * FROM smtp_settings LIMIT 1');
    
    if (smtpResult.rows.length === 0) {
      console.error('No SMTP settings found in database. Please configure SMTP settings first.');
      return false;
    }
    
    const smtpConfig = smtpResult.rows[0];
    
    // Get branding settings
    const brandingResult = await client.query('SELECT * FROM branding_settings LIMIT 1');
    let brandingData = {
      app_name: 'ProsumeAI',
      app_tagline: 'AI-powered resume and career tools',
      primary_color: '#4f46e5',
      secondary_color: '#10b981',
      accent_color: '#f97316',
      footer_text: '© 2023 ProsumeAI. All rights reserved.'
    };
    
    if (brandingResult.rows.length > 0) {
      brandingData = brandingResult.rows[0];
    }
    
    // Get email template
    const templateResult = await client.query(
      'SELECT * FROM email_templates WHERE template_type = $1 AND is_default = true LIMIT 1',
      [TEST_TYPE]
    );
    
    if (templateResult.rows.length === 0) {
      console.error(`No template found for type: ${TEST_TYPE}`);
      return false;
    }
    
    const template = templateResult.rows[0];
    console.log(`Found template: ${template.name}`);
    
    // Prepare test variables
    const testVariables = {
      username: 'Test User',
      appName: brandingData.app_name,
      appTagline: brandingData.app_tagline,
      primaryColor: brandingData.primary_color,
      secondaryColor: brandingData.secondary_color,
      accentColor: brandingData.accent_color,
      footerText: brandingData.footer_text
    };
    
    // Add additional variables based on template type
    switch (TEST_TYPE) {
      case 'email_verification':
        testVariables.verificationLink = 'https://example.com/verify?token=sample-token';
        break;
        
      case 'password_reset':
        testVariables.resetLink = 'https://example.com/reset?token=sample-token';
        break;
        
      case 'password_changed':
        testVariables.resetLink = 'https://example.com/reset';
        testVariables.changeTime = new Date().toLocaleString();
        break;
        
      case 'login_alert':
        testVariables.resetLink = 'https://example.com/reset';
        testVariables.loginTime = new Date().toLocaleString();
        testVariables.device = 'Chrome on MacOS';
        testVariables.location = 'New York, USA';
        testVariables.ipAddress = '192.168.1.1';
        break;
    }
    
    // Process the template
    const subject = processTemplate(template.subject, testVariables);
    const html = processTemplate(template.html_content, testVariables);
    const text = processTemplate(template.text_content, testVariables);
    
    console.log(`Processed subject: ${subject}`);
    
    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: smtpConfig.encryption === 'ssl',
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"${smtpConfig.sender_name}" <${smtpConfig.sender_email}>`,
      to: TEST_EMAIL,
      subject: subject,
      text: text,
      html: html
    });
    
    console.log(`Email sent successfully! Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the test
runTest()
  .then(result => {
    console.log(result ? 'Test completed successfully.' : 'Test failed.');
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 