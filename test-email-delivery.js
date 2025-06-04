#!/usr/bin/env node

/**
 * Email delivery test script
 * This will send a test email and show detailed logging
 */

import { EmailService } from './server/services/email-service.js';

async function testEmailDelivery() {
  console.log('🧪 Starting email delivery test...');
  
  const testEmail = 'rajamuppidi@futureaiit.com';
  
  try {
    console.log('📧 Sending test email to:', testEmail);
    
    const result = await EmailService.sendEmail({
      to: testEmail,
      subject: 'Docker Email Delivery Test - ' + new Date().toISOString(),
      text: 'This is a test email to verify Docker email delivery is working properly.',
      html: `
        <h1>Docker Email Delivery Test</h1>
        <p>This is a test email to verify Docker email delivery is working properly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Docker Container:</strong> ${process.env.HOSTNAME || 'unknown'}</p>
        <p><strong>Node Environment:</strong> ${process.env.NODE_ENV || 'unknown'}</p>
      `
    });
    
    if (result) {
      console.log('✅ Email sending completed successfully');
    } else {
      console.log('❌ Email sending failed');
    }
    
  } catch (error) {
    console.error('🚨 Email test error:', error);
  }
  
  console.log('🏁 Email delivery test completed');
  process.exit(0);
}

testEmailDelivery(); 