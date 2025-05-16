import { db } from './config/db.js';  
import { storage } from './config/storage.js';
import express from 'express';
import session from 'express-session';
import { getCookieConfig } from './config/auth.js';
import { eq } from 'drizzle-orm';
import * as schema from '../shared/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createAdminLoginFix() {
  console.log("Starting admin login fix script...");
  
  // Create a simple Express app
  const app = express();
  const env = process.env.NODE_ENV || 'development';
  
  // Set up session middleware with the same config as the main app
  const sessionSecret = process.env.SESSION_SECRET || 'ATScribe-secret-key';
  const sessionSettings = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'ATScribe.sid',
    cookie: getCookieConfig(env),
  };
  
  app.use(session(sessionSettings));
  
  // Endpoint to manually create a session for admin user
  app.get('/fix-admin-login', async (req, res) => {
    try {
      // Get admin user by username
      const [adminUser] = await db.select().from(schema.users).where(eq(schema.users.username, 'rajamuppidi')).limit(1);
      
      if (!adminUser) {
        return res.status(404).send('Admin user not found');
      }
      
      // Update admin user to ensure all required fields are set
      await db.update(schema.users)
        .set({
          last_password_change: new Date(),
          password_history: adminUser.password_history || 
            JSON.stringify([{ 
              password: adminUser.password, 
              changedAt: new Date() 
            }])
        })
        .where(eq(schema.users.id, adminUser.id));
      
      // Manually set up session
      req.session.passport = { user: adminUser.id };
      
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).send('Error creating session');
        }
        
        res.send(`
          <html>
            <head>
              <title>Admin Login Fix</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                .success { color: green; }
                .button { 
                  margin-top: 20px; 
                  padding: 10px 20px; 
                  background-color: #4f46e5; 
                  color: white; 
                  border: none; 
                  border-radius: 5px;
                  cursor: pointer;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <h1 class="success">Admin Login Fixed!</h1>
              <p>Your session has been manually created and you should now be able to login normally.</p>
              <a href="/dashboard" class="button">Go to Dashboard</a>
            </body>
          </html>
        `);
      });
    } catch (error) {
      console.error('Fix admin login error:', error);
      res.status(500).send('Error: ' + error.message);
    }
  });
  
  // Start server on port 4001 to avoid conflicts with main app
  app.listen(4001, () => {
    console.log('Admin login fix server running on http://localhost:4001/fix-admin-login');
    console.log('Visit this URL to fix your admin login session.');
  });
}

createAdminLoginFix().catch(console.error); 