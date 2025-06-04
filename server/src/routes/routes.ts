import express from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { setupAuth } from "../../config/auth";
import aiRouter from "./ai";
import { registerAIResumeRoutes } from "./ai-resume-routes";
import { registerAICoverLetterRoutes } from "./ai-cover-letter-routes";
import { registerAdminRoutes } from "../routes/admin-routes";
import { registerResumeTemplateRoutes } from "./resume-template-routes";
import { registerCoverLetterTemplateRoutes } from "./cover-letter-template-routes";
import { registerTemplateRoutes } from "./template-routes";
import { registerEnhancedResumeRoutes } from "./resume-routes-enhanced";
import { registerCoverLetterRoutes } from "./cover-letter-routes";
import { registerJobApplicationRoutes } from "./job-applications-routes";
import { registerSubscriptionRoutes } from "./subscription-routes";
import { registerUserRoutes } from "./user-routes";
import { registerPaymentRoutes } from "./payment-routes";
import { registerTaxRoutes } from "./tax-routes";
import { registerTaxAdminRoutes } from "./tax-admin-routes";
import { registerTwoFactorRoutes, checkTwoFactorRequired } from "./two-factor-routes";
import { registerPublicBlogRoutes } from "./public-blog-routes";
import { registerEnhancedAIRoutes } from "./ai-enhanced";
import notificationRouter from "./notification-routes";
import { 
  sessionTimeoutMiddleware, 
  regenerateSessionAfterLogin, 
  postLoginSessionHandler,
  loadSessionConfig,
  validateActiveSession
} from "../../middleware/index";

/**
 * Register all application routes
 */
export function registerRoutes(app: express.Express): Server {
  // Initialize HTTP server
  const server = createServer(app);
  
  // Authentication is now set up in initializeServices() before this function is called
  // setupAuth(app); // REMOVED - now handled in initializeServices
  
  // Apply session security middleware
  app.use(sessionTimeoutMiddleware);
  app.use(validateActiveSession);
  
  // Apply login-specific middleware
  app.use('/api/login', regenerateSessionAfterLogin);
  app.post('/api/login', postLoginSessionHandler);
  
  // Apply 2FA required check middleware
  app.use(checkTwoFactorRequired);
  
  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // Session persistence test endpoint
  app.get('/api/session-test', (req, res) => {
    if (!req.session) {
      return res.status(500).json({ error: 'Session not available' });
    }
    
    // Get or create session test data
    const session = req.session as any; // Type assertion for test data
    if (!session.sessionTestData) {
      session.sessionTestData = {
        createdAt: new Date().toISOString(),
        counter: 1,
        sessionId: req.sessionID
      };
    } else {
      session.sessionTestData.counter += 1;
      session.sessionTestData.lastAccessed = new Date().toISOString();
    }
    
    res.json({
      message: 'Session persistence test',
      sessionId: req.sessionID,
      authenticated: req.isAuthenticated(),
      user: req.user ? { id: req.user.id, username: req.user.username } : null,
      testData: session.sessionTestData,
      instructions: {
        test: 'Access this endpoint, restart Docker, access again to verify session persists',
        restart: 'docker compose restart app'
      }
    });
  });
  
  // Add session security debug endpoint (development only)
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug/session-test', async (req, res) => {
      try {
        const sessionConfig = await loadSessionConfig();
        
        console.log('Debug session endpoint called, sessionID:', req.sessionID);
        
        res.json({
          session: {
            id: req.sessionID,
            cookie: req.session?.cookie,
            lastActivity: (req.session as any)?.lastActivity,
            createdAt: (req.session as any)?.createdAt,
          },
          config: sessionConfig,
          authenticated: req.isAuthenticated(),
          user: req.user ? { 
            id: req.user.id, 
            username: req.user.username 
          } : null,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error in debug session endpoint:', error);
        res.status(500).json({ error: String(error) });
      }
    });
  }
  
  // Register all admin routes directly - admin routes are registered with full paths
  registerAdminRoutes(app);
  
  // Register AI router directly (it exports a router)
  app.use('/api/ai', aiRouter);
  
  // Register enhanced AI routes with security
  registerEnhancedAIRoutes(app);
  
  // Register notification routes
  app.use('/api', notificationRouter);
  
  // Register public blog routes (no authentication required)
  registerPublicBlogRoutes(app);
  
  // Register other routes by calling their registration functions
  registerAIResumeRoutes(app);
  registerAICoverLetterRoutes(app);
  registerResumeTemplateRoutes(app);
  registerCoverLetterTemplateRoutes(app);
  registerTemplateRoutes(app);
  registerEnhancedResumeRoutes(app);
  registerCoverLetterRoutes(app);
  registerJobApplicationRoutes(app);
  registerSubscriptionRoutes(app);
  registerPaymentRoutes(app);
  registerUserRoutes(app);
  registerTaxRoutes(app);
  registerTaxAdminRoutes(app);
  registerTwoFactorRoutes(app);

  // Add debug cookie endpoint (available in all environments)
  app.get('/api/debug/cookies', (req, res) => {
    // Log all incoming cookies
    console.log('[COOKIE DEBUG] Incoming cookies:', req.headers.cookie);
    
      // Set a test cookie with various settings
  const isProduction = process.env.NODE_ENV === 'production';
  const disableSecure = process.env.DISABLE_SECURE_COOKIE === 'true';
  const sameSiteSetting = process.env.COOKIE_SAMESITE || 'lax';
  
  // Convert string to valid sameSite type
  const sameSite = (sameSiteSetting === 'none' || sameSiteSetting === 'strict' || sameSiteSetting === 'lax') 
    ? sameSiteSetting as 'none' | 'strict' | 'lax'
    : 'lax';
  
  // Set a test cookie
  res.cookie('debug_cookie', 'test-value', {
    httpOnly: true,
    secure: isProduction && !disableSecure,
    sameSite: sameSite,
    maxAge: 3600000, // 1 hour
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  });
    
    // Return debug information
    res.json({
      receivedCookies: req.cookies,
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      newCookieSet: {
        name: 'debug_cookie',
        value: 'test-value',
              settings: {
        secure: isProduction && !disableSecure,
        sameSite: sameSite,
        domain: process.env.COOKIE_DOMAIN || undefined
      }
      },
      userAgent: req.headers['user-agent'],
      clientIP: req.ip
    });
  });

  return server;
}