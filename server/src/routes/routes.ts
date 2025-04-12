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

/**
 * Register all application routes
 */
export function registerRoutes(app: express.Express): Server {
  // Initialize HTTP server
  const server = createServer(app);
  
  // Setup authentication
  setupAuth(app);
  
  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
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

  return server;
}