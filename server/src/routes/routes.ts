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
import { registerResumeRoutes } from "./resume-routes";
import { registerCoverLetterRoutes } from "./cover-letter-routes";
import { registerJobApplicationRoutes } from "./job-applications-routes";
import { registerSubscriptionRoutes } from "./subscription-routes";
import { registerUserRoutes } from "./user-routes";
import { registerPaymentRoutes } from "./payment-routes";
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
  
  // Setup authentication
  setupAuth(app);
  
  // Apply session security middleware
  app.use(sessionTimeoutMiddleware);
  app.use(validateActiveSession);
  
  // Apply login-specific middleware
  app.use('/api/login', regenerateSessionAfterLogin);
  app.post('/api/login', postLoginSessionHandler);
  
  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
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
  
  // Register other routes by calling their registration functions
  registerAIResumeRoutes(app);
  registerAICoverLetterRoutes(app);
  registerResumeTemplateRoutes(app);
  registerCoverLetterTemplateRoutes(app);
  registerTemplateRoutes(app);
  registerResumeRoutes(app);
  registerCoverLetterRoutes(app);
  registerJobApplicationRoutes(app);
  registerSubscriptionRoutes(app);
  registerPaymentRoutes(app);
  registerUserRoutes(app);

  return server;
}