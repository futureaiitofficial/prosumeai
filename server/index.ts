import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from './src/routes/routes';
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './config/db';
import { cookieManager } from './utils/cookie-manager';
import { registerAdminRoutes } from './src/routes/admin-routes';
import { registerResumeRoutes } from './src/routes/resume-routes';
import { registerCoverLetterRoutes } from './src/routes/cover-letter-routes';
import { registerJobApplicationRoutes } from './src/routes/job-applications-routes';
import { registerAIResumeRoutes } from './src/routes/ai-resume-routes';
import { registerAICoverLetterRoutes } from './src/routes/ai-cover-letter-routes';
import router from './src/routes/ai';
import resumeAiRoutes from './src/routes/resume-ai';
import { initializeServices } from './middleware/index';
import fs from 'fs';
import http from 'http';
import net from 'net';
import { initializeSessionConfig } from './middleware/session-security';
import { setupAuth } from './config/auth';
import { applySessionCookiePatch } from './utils/cookie-patch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Improve logging for production
const logToFile = (message: string) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(join(logsDir, 'server.log'), formattedMessage);
  console.log(message);
};

let openConnections = new Set<net.Socket>();
let isShuttingDown = false;

const app = express();

// Configure and use CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 
    (process.env.NODE_ENV === 'production' 
      ? (process.env.CORS_ORIGIN === '*' ? true : true) // Allow specified origin or any origin in production
      : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173']),
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Accept'],
  exposedHeaders: ['Content-Length', 'Date', 'Set-Cookie'],
  maxAge: 86400 // Cache CORS preflight for 24 hours
}));

// Log CORS configuration for debugging
console.log(`CORS configured with origin: ${process.env.CORS_ORIGIN || 
  (process.env.NODE_ENV === 'production' ? 'any origin' : 'localhost development endpoints')}`);
console.log('CORS credentials setting: enabled');

// Parse JSON and URL-encoded bodies
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Add cookie-parser middleware 
const cookieSecret = process.env.COOKIE_SECRET || process.env.SESSION_SECRET || 'ATScribe-cookie-secret';
app.use(cookieParser(cookieSecret));

// Apply cookie response patch for cross-browser compatibility
applySessionCookiePatch(app);

// Serve static files from the public directory
app.use(express.static('public'));
console.log('Static file serving configured for public directory');

// Set trust proxy for production behind load balancers or when using ngrok
if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  console.log("Trust proxy enabled for production");
}

// Add a middleware to log all requests
app.use((req, res, next) => {
  // Skip logging for health checks
  if (req.path !== '/health' && req.path !== '/api/health') {
    console.log(`${req.method} ${req.path}`);
  }
  
  // Track connection for graceful shutdown
  if (process.env.NODE_ENV === 'production') {
    const connection = res.socket;
    if (connection) {
      // Set max listeners on the socket to prevent warnings
      connection.setMaxListeners(20);
      
      openConnections.add(connection);
      connection.once('close', () => {
        openConnections.delete(connection);
      });
    }
  }
  
  next();
});

// Health check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ status: 'shutting_down' });
  }
  return res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

// Start the server function - moved to a separate async function to properly handle initialization
async function startServer() {
  try {
    // Initialize session config first
    console.log('Initializing session configuration...');
    await initializeSessionConfig();
    
    console.log('Setting up authentication...');
    await setupAuth(app);
    
    console.log('Initializing services...');
    await initializeServices();
    
    console.log('Session security configuration initialized');
    console.log('Services initialized');
    
    // Register routes
    const server = await registerRoutes(app);
    
    // Add the AI router registration, after auth is set up
    app.use('/api/ai', router);  // Register AI routes AFTER auth is initialized
    app.use('/api/resume-ai', resumeAiRoutes);  // Register Resume AI routes

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`Error [${status}]: ${message}`);
      if (err.stack) console.error(err.stack);

      res.status(status).json({ message });
    });

    // Setup Vite in development or serve static files in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // Set up connection tracking for graceful shutdown
    server.on('connection', (conn) => {
      if (isShuttingDown) {
        conn.end(); // Reject new connections during shutdown
        return;
      }
      // Set max listeners on the socket to prevent warnings
      conn.setMaxListeners(20);
      
      openConnections.add(conn);
      conn.on('close', () => {
        openConnections.delete(conn);
      });
    });
    
    // Start the server
    server.listen({
      port: PORT,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`Server started in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`Serving on port ${PORT}`);
      
      // Signal ready state to PM2 or other process managers
      if (typeof process.send === 'function') {
        process.send('ready');
        console.log('Signaled ready state to process manager');
      }
    });
    
    // Graceful shutdown
    const handleShutdown = (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);
      isShuttingDown = true;
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connections if needed
        if (db && typeof db.$client?.end === 'function') {
          try {
            db.$client.end();
            logToFile('Database connection closed');
          } catch (err) {
            console.error('Error closing database connection:', err);
          }
        }
        
        // Close all active connections
        if (openConnections.size > 0) {
          logToFile(`Closing ${openConnections.size} active connections`);
          for (const socket of Array.from(openConnections)) {
            socket.destroy();
          }
        }
        
        console.log('All connections closed');
        process.exit(0);
      });
      
      // Force close if graceful shutdown takes too long
      setTimeout(() => {
        console.error('Forceful shutdown initiated after timeout');
        process.exit(1);
      }, 15000);
    };
    
    // Register shutdown handlers
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logToFile(`Uncaught exception: ${error.message}`);
  console.error('Uncaught Exception:', error);
  
  // In production, attempt to stay running despite uncaught exceptions
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logToFile(`Unhandled promise rejection: ${reason}`);
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // In production, log but don't crash on unhandled rejections
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

