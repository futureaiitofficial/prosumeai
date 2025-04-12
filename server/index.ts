import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from './src/routes/routes';
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from './config/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Configure and use CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN || 'https://www.prosumeai.com' 
    : 'http://localhost:3000',
  credentials: true
}));

// Parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static('public'));
console.log('Static file serving configured for public directory');

// Add a middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 3000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 3000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
  });

  // Add diagnostic routes to help troubleshoot auth issues
  app.get("/api/debug/auth", (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email
      } : null,
      sessionID: req.sessionID,
      cookies: req.headers.cookie
    });
  });

  app.get("/api/debug/check-session", (req, res) => {
    console.log("Session debug info:", {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? `${req.user.username} (${req.user.id})` : "Not authenticated"
    });
    
    res.json({
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      authenticated: req.isAuthenticated(),
      userInfo: req.user ? {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email
      } : null
    });
  });
})();
