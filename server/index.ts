import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from './src/routes/routes';
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db, validateSchema } from './config/db';
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
import { registerPaymentRoutes } from './src/routes/payment-routes';
import { registerSubscriptionRoutes } from './src/routes/subscription-routes';
import { registerTaxRoutes } from './src/routes/tax-routes';
import { registerTaxAdminRoutes } from './src/routes/tax-admin-routes';
import os from 'os';
import { randomBytes } from 'crypto';

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

// Function to get local network IP addresses
function getLocalNetworkIPs() {
  const ips = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(`http://${iface.address}:3000`);
        ips.push(`http://${iface.address}:5173`);
      }
    }
  }
  
  return ips;
}

// Configure and use CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 
    (process.env.NODE_ENV === 'production' 
      ? (process.env.CORS_ORIGIN === '*' ? true : true) // Allow specified origin or any origin in production
      : getLocalNetworkIPs()), // Include network IPs in development
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

// Add cookie-parser middleware with improved security
const cookieSecret = process.env.COOKIE_SECRET || process.env.SESSION_SECRET || randomBytes(32).toString('hex');

if (!process.env.COOKIE_SECRET && !process.env.SESSION_SECRET) {
  console.warn('⚠️  Neither COOKIE_SECRET nor SESSION_SECRET found in environment variables. Using randomly generated secret for this session.');
}

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
    // Validate database schema first
    await validateSchema();
    console.log('📋 Database schema validation complete');
    
    // Verify session store is ready
    try {
      console.log('🔍 Initializing session store...');
      const { verifySessionTable } = await import('./config/storage');
      const sessionReady = await verifySessionTable();
      if (sessionReady) {
        console.log('✅ Session store initialized successfully');
      } else {
        console.warn('⚠️  Session store initialization had issues, but continuing...');
      }
    } catch (error) {
      console.warn('⚠️  Session store initialization failed:', error);
    }

    // Initialize middleware and services
    await initializeServices(app);
    
    // Setup routes
    const server = registerRoutes(app);
    
    // Setup Vite in development
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || "3000");
    
    server.listen(port, "0.0.0.0", () => {
      console.log(`\n🚀 Server running on http://0.0.0.0:${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: Connected`);
      console.log(`🍪 Sessions: PostgreSQL store`);
      
      if (process.env.NODE_ENV === "development") {
        console.log(`\n🔗 Access URLs:`);
        console.log(`   Local:    http://localhost:${port}`);
        console.log(`   Network:  ${getLocalNetworkIPs().map(ip => `http://${ip}:${port}`).join(', ')}`);
      }

      logToFile(`Server started on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logToFile(`Server startup failed: ${error}`);
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

