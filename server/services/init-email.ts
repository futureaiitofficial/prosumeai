import { EmailService } from './email-service';

/**
 * Initialize email service
 * This function attempts to initialize the email service
 * by loading SMTP settings from database
 */
export async function initializeEmailService(): Promise<void> {
  console.log('Initializing email service...');
  
  try {
    const emailService = EmailService.getInstance();
    const success = await emailService.init();
    
    if (success) {
      console.log('Email service initialized successfully');
    } else {
      console.warn('Email service initialization failed: SMTP not configured or disabled');
    }
  } catch (error) {
    console.error('Error initializing email service:', error);
  }
} 