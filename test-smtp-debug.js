#!/usr/bin/env node

/**
 * Comprehensive SMTP debugging script for Docker environment
 * This script will test email delivery and provide detailed debugging information
 */

import { db } from './server/config/db.js';
import { smtpSettings } from './shared/schema.js';
import * as nodemailer from 'nodemailer';
import { eq } from 'drizzle-orm';

const TEST_EMAIL = 'rajamuppidi@futureaiit.com'; // Your email to test

async function debugSMTP() {
  console.log('🔍 Starting comprehensive SMTP debugging...');
  console.log(`📧 Test email will be sent to: ${TEST_EMAIL}`);
  console.log('');

  try {
    // Get SMTP settings from database
    console.log('📂 Fetching SMTP settings from database...');
    const settings = await db.select().from(smtpSettings).limit(1);
    
    if (settings.length === 0) {
      console.error('❌ No SMTP settings found in database');
      return;
    }

    const smtpConfig = settings[0];
    console.log('✅ SMTP settings found:');
    console.log(`   Host: ${smtpConfig.host}`);
    console.log(`   Port: ${smtpConfig.port}`);
    console.log(`   Username: ${smtpConfig.username}`);
    console.log(`   Encryption: ${smtpConfig.encryption}`);
    console.log(`   Sender Name: ${smtpConfig.senderName}`);
    console.log(`   Sender Email: ${smtpConfig.senderEmail}`);
    console.log(`   Enabled: ${smtpConfig.enabled}`);
    console.log('');

    if (!smtpConfig.enabled) {
      console.error('❌ SMTP is disabled in database');
      return;
    }

    // Create transporter with detailed debugging
    console.log('🔧 Creating nodemailer transporter...');
    const transporter = nodemailer.createTransporter({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: smtpConfig.encryption === 'ssl',
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password
      },
      debug: true, // Enable debug output
      logger: true, // Enable logger
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Transporter created');
    console.log('');

    // Test SMTP connection
    console.log('🔗 Testing SMTP connection...');
    try {
      await transporter.verify();
      console.log('✅ SMTP connection successful!');
    } catch (verifyError) {
      console.error('❌ SMTP connection failed:', verifyError.message);
      console.error('   Full error:', verifyError);
      return;
    }
    console.log('');

    // Prepare test email
    const testSubject = 'Docker SMTP Test - ' + new Date().toISOString();
    const testText = `
This is a test email sent from ProsumeAI Docker container.

Test Details:
- Time: ${new Date().toISOString()}
- Container: Docker
- SMTP Host: ${smtpConfig.host}
- SMTP Port: ${smtpConfig.port}
- Environment: ${process.env.NODE_ENV || 'development'}

If you receive this email, your SMTP configuration is working correctly!
    `;

    const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Docker SMTP Test</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4f46e5;">🐳 Docker SMTP Test</h1>
        <p>This is a test email sent from ProsumeAI Docker container.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Test Details:</h3>
            <ul>
                <li><strong>Time:</strong> ${new Date().toISOString()}</li>
                <li><strong>Container:</strong> Docker</li>
                <li><strong>SMTP Host:</strong> ${smtpConfig.host}</li>
                <li><strong>SMTP Port:</strong> ${smtpConfig.port}</li>
                <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
            </ul>
        </div>
        
        <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; border: 1px solid #c3e6cb;">
            <h3 style="color: #155724; margin-top: 0;">✅ Success!</h3>
            <p style="margin-bottom: 0; color: #155724;">If you receive this email, your SMTP configuration is working correctly!</p>
        </div>
    </div>
</body>
</html>
    `;

    // Send test email with detailed logging
    console.log('📧 Sending test email...');
    console.log(`   To: ${TEST_EMAIL}`);
    console.log(`   Subject: ${testSubject}`);
    console.log('');

    const mailOptions = {
      from: `"${smtpConfig.senderName}" <${smtpConfig.senderEmail}>`,
      to: TEST_EMAIL,
      subject: testSubject,
      text: testText,
      html: testHtml,
      headers: {
        'X-Mailer': 'ProsumeAI-Docker-Debug',
        'X-Test-Type': 'SMTP-Debug',
        'X-Container': 'Docker'
      }
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully!');
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Response: ${info.response}`);
      
      if (info.accepted && info.accepted.length > 0) {
        console.log(`   Accepted: ${info.accepted.join(', ')}`);
      }
      
      if (info.rejected && info.rejected.length > 0) {
        console.log(`   Rejected: ${info.rejected.join(', ')}`);
      }

      if (info.pending && info.pending.length > 0) {
        console.log(`   Pending: ${info.pending.join(', ')}`);
      }

      console.log('');
      console.log('🎉 Test completed! Check your email inbox.');
      console.log('📧 If you don\'t receive the email within 5 minutes, there may be:');
      console.log('   1. SMTP server delays');
      console.log('   2. Email filtering/spam issues');
      console.log('   3. Authentication problems');
      console.log('   4. Sender reputation issues');
      
    } catch (sendError) {
      console.error('❌ Failed to send email:', sendError.message);
      console.error('   Error code:', sendError.code);
      console.error('   Error response:', sendError.response);
      console.error('   Full error:', sendError);
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.error('   Full error:', error);
  } finally {
    console.log('');
    console.log('🏁 SMTP debugging completed.');
    process.exit(0);
  }
}

// Run the debug script
debugSMTP().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 