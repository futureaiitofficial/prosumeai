import { initializeEncryption } from '../utils/encryption';
import { initializeDataEncryption } from './data-encryption';
import { initializeSessionConfig, sessionTimeoutMiddleware, regenerateSessionAfterLogin, postLoginSessionHandler, validateActiveSession } from './session-security';
import { initializeEmailService } from '../services/init-email';
import { initializePuppeteerPDFService } from '../services/puppeteer-pdf-service';
import { setupAuth } from '../config/auth';
import type { Express } from 'express';

/**
 * Export middleware components for convenient importing
 * Selectively re-export to avoid naming conflicts
 */
export { encryptModelData, decryptModelData, withEncryption, logEncryptionStatus } from './data-encryption';
export { requireAdmin } from './admin';
export { requireUser } from './auth';
export { authRateLimiter, usernameRateLimiter, penalizeFailedLogin } from './rate-limit';
export { requireFeatureAccess, trackFeatureUsage } from './feature-access';
export { 
  sessionTimeoutMiddleware, 
  regenerateSessionAfterLogin, 
  postLoginSessionHandler,
  loadSessionConfig,
  saveSessionConfig,
  validateActiveSession
} from './session-security';

/**
 * Initialize all middleware and services
 * This should be called at application startup
 */
export async function initializeServices(app?: Express) {
  try {
    console.log('Initializing services...');
    
    // Initialize session security configuration first
    await initializeSessionConfig();
    console.log('Session configuration initialized');
    
    // Setup authentication (Passport) if app is provided
    if (app) {
      console.log('Setting up authentication...');
      await setupAuth(app);
      console.log('✅ Authentication setup complete');
    }
    
    // Initialize encryption key and IV
    await initializeEncryption();
    console.log('Encryption keys initialized');
    
    // Initialize data encryption configuration
    await initializeDataEncryption();
    console.log('Data encryption configuration initialized');
    
    // Initialize email service
    await initializeEmailService();
    
    // Initialize PDF service (non-blocking)
    initializePuppeteerPDFService().then(() => {
      console.log('Using puppeteer for PDF generation instead of pdfmake');
    }).catch(error => {
      console.error('PDF service initialization failed:', error);
      console.log('Server will continue without PDF service - PDFs may not work');
    });
    
    console.log('Services initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize services:', error);
    return false;
  }
} 