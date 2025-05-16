import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { penalizeFailedLogin } from "../middleware/rate-limit";
import { isDisposableEmail } from 'disposable-email-domains-js';
import { validatePassword, initializePasswordPolicy, getPasswordPolicy } from "../utils/password-policy";
import { Request, Response, NextFunction } from "express";
import { enforceSingleSession } from "../middleware/session-security";

// Extend User type to include our runtime properties
declare global {
  namespace Express {
    interface User extends SelectUser {
      passwordExpired?: boolean;
    }
  }
}

// Extend global namespace for password update info
declare global {
  namespace NodeJS {
    interface Global {
      passwordNeedsUpdate?: boolean;
      passwordUpdateInfo?: {
        password: string;
      };
    }
  }
}

// Define password history entry type
interface PasswordHistoryEntry {
  password: string;
  changedAt: Date;
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  try {
    console.log(`[DEBUG] Hashing password. Length: ${password.length}`);
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    console.log(`[DEBUG] Password hashed successfully. Hash format: ${hashedPassword.includes('.') ? 'valid' : 'invalid'}`);
    return hashedPassword;
  } catch (error) {
    console.error(`[DEBUG] Error hashing password:`, error);
    throw error; // Re-throw to ensure caller handles the error
  }
}

export async function comparePasswords(
  providedPassword: string,
  storedPassword: string
) {
  try {
    console.log(`[DEBUG] Comparing passwords. Provided password length: ${providedPassword.length}`);
    console.log(`[DEBUG] Stored password format: ${storedPassword.includes('.') ? 'valid' : 'invalid'}`);
    
    // Split the stored password into hash and salt
    const [hashedPassword, salt] = storedPassword.split(".");
    
    if (!hashedPassword || !salt) {
      console.error(`[DEBUG] Invalid stored password format: missing hash or salt`);
      // Legacy password handling requires database migration to update
      // Note: This should not happen in production environment after migration
      console.log(`[DEBUG] Password format invalid - returning false`);
      return false;
    }

    console.log(`[DEBUG] Hash length: ${hashedPassword.length}, Salt length: ${salt.length}`);

    try {
      const hashedBuffer = Buffer.from(hashedPassword, "hex");
      const derivedKey = (await scryptAsync(providedPassword, salt, 64)) as Buffer;
      
      // Log buffer sizes for debugging
      console.log(`[DEBUG] Derived key length: ${derivedKey.length}, Hashed buffer length: ${hashedBuffer.length}`);
      
      // Check buffer length mismatch
      if (hashedBuffer.length !== derivedKey.length) {
        console.error(`[DEBUG] Buffer length mismatch: Derived key (${derivedKey.length}) != Hashed password (${hashedBuffer.length})`);
        return false;
      }
      
      const result = timingSafeEqual(hashedBuffer, derivedKey);
      console.log(`[DEBUG] Password comparison result: ${result}`);
      return result;
    } catch (error) {
      console.error(`[DEBUG] Error in password comparison:`, error);
      return false;
    }
  } catch (error) {
    console.error(`[DEBUG] Error comparing passwords:`, error);
    return false;
  }
}

// Enhanced cookie configuration with security best practices
export function getCookieConfig(env: string): session.CookieOptions {
  // We'd normally use loadSessionConfig here, but it's async and this function
  // needs to be synchronous. We'll rely on the cached value through middleware.
  
  // Load session configurations from environment or use defaults
  const maxAge = parseInt(process.env.SESSION_MAX_AGE || '604800000'); // 7 days in ms
  
  return {
    maxAge: maxAge,
    httpOnly: true, // Prevent client-side JS from reading the cookie
    secure: env === "production", // Only use secure in production, not in dev
    sameSite: 'lax', // Use lax for development to avoid issues with redirects
    path: '/', // Cookie available across the entire site
    // Domain restriction for production environments
    domain: env === "production" ? process.env.COOKIE_DOMAIN || undefined : undefined,
  };
}

export function setupAuth(app: Express) {
  // Initialize password policy
  initializePasswordPolicy().catch(err => {
    console.error('Failed to initialize password policy:', err);
  });
  
  const env = process.env.NODE_ENV || 'development';
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
  
  if (env === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'ATScribe-secret-key')) {
    console.warn('WARNING: Using default session secret in production is a security risk!');
  }
  
  // Enhanced session settings with better configuration
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'ATScribe.sid', // Custom cookie name for better security
    cookie: getCookieConfig(env),
  };

  // Set trust proxy for production behind load balancers
  if (env === 'production') {
    app.set("trust proxy", 1);
  }
  
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Rate limiting for authentication attempts (implementation in middleware/rate-limit.ts)
  if (env === 'production') {
    const { authRateLimiter } = require('../middleware/rate-limit');
    app.use('/api/login', authRateLimiter);
    app.use('/api/register', authRateLimiter);
  }

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[DEBUG] Attempt to authenticate user: ${username}`);
        
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`[DEBUG] Authentication failed: User ${username} not found`);
          return done(null, false);
        }
        
        // Check if account is locked out
        if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
          console.log(`[DEBUG] Authentication failed: Account locked out for ${username}`);
          return done(null, false, { message: "Account is temporarily locked. Please try again later or reset your password." });
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        
        if (!passwordMatch) {
          console.log(`[DEBUG] Authentication failed: Invalid password for ${username}`);
          
          // Get password policy for failed attempt limit
          const policy = await import('../utils/password-policy').then(m => m.getPasswordPolicy());
          
          // Increment failed login attempts
          const failedAttempts = (user.failedLoginAttempts || 0) + 1;
          
          // Check if we should lock the account
          if (failedAttempts >= policy.maxFailedAttempts) {
            // Calculate lockout end time
            const lockoutUntil = new Date();
            lockoutUntil.setMinutes(lockoutUntil.getMinutes() + policy.lockoutDurationMinutes);
            
            // Lock the account
            await storage.updateUser(user.id, {
              failedLoginAttempts: failedAttempts,
              lockoutUntil: lockoutUntil
            });
            
            console.log(`[DEBUG] Account locked out for ${username} until ${lockoutUntil}`);
            return done(null, false, { message: "Too many failed login attempts. Account is temporarily locked." });
          } else {
            // Just increment the counter
            await storage.updateUser(user.id, {
              failedLoginAttempts: failedAttempts
            });
            
            console.log(`[DEBUG] Failed login attempt ${failedAttempts} of ${policy.maxFailedAttempts} for ${username}`);
          }
          
          return done(null, false);
        }
        
        // If login successful, reset failed login attempts
        if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
          await storage.updateUser(user.id, {
            failedLoginAttempts: 0,
            lockoutUntil: null
          });
          console.log(`[DEBUG] Reset failed login attempts for user ${username}`);
        }
        
        // Check if password has expired
        let passwordExpired = false;
        
        if (user.lastPasswordChange) {
          console.log(`[DEBUG] Checking password expiration for user ${username}`);
          console.log(`[DEBUG] Last password change date: ${user.lastPasswordChange}`);
          
          try {
            passwordExpired = await isPasswordExpired(user.lastPasswordChange, user.username);
            console.log(`[DEBUG] Password expired result: ${passwordExpired}`);
          } catch (error) {
            console.error(`[DEBUG] Error checking password expiration: ${error}`);
            // Default to not expired if there's an error
            passwordExpired = false;
          }
          
          if (passwordExpired) {
            console.log(`[DEBUG] Authentication succeeded but password expired for ${username}. Needs reset.`);
            // Add a flag to the user object to indicate password expiry
            (user as Express.User).passwordExpired = true;
          } else {
            // Explicitly ensure passwordExpired is false/undefined
            (user as Express.User).passwordExpired = false;
          }
        } else {
          console.log(`[DEBUG] User ${username} has no lastPasswordChange date recorded`);
          
          // Set up lastPasswordChange for user who don't have it
          const now = new Date();
          await storage.updateUser(user.id, {
            lastPasswordChange: now
          });
          console.log(`[DEBUG] Set lastPasswordChange to ${now} for ${username}`);
          
          // Explicitly set passwordExpired to false if no last change date
          (user as Express.User).passwordExpired = false;
        }
        
        console.log(`[DEBUG] User authenticated successfully: ${username} (ID: ${user.id}), Password Expired: ${!!(user as Express.User).passwordExpired}`);
        return done(null, user);
      } catch (error) {
        console.error(`[DEBUG] Authentication error for ${username}:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log(`Serializing user to session: ${user.username} (ID: ${user.id})`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user from session ID: ${id}`);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.log(`Deserialization failed: User with ID ${id} not found`);
        return done(new Error(`User with ID ${id} not found`));
      }
      
      console.log(`User deserialized successfully: ${user.username} (ID: ${user.id})`);
      done(null, user);
    } catch (error) {
      console.error(`Deserialization error for user ID ${id}:`, error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Check if email domain is disposable
      const isDisposable = isDisposableEmail(req.body.email);
      if (isDisposable) {
        return res.status(400).json({ message: "Registration with temporary or disposable email addresses is not allowed" });
      }

      // Validate password against policy
      const passwordValidation = await validatePassword(req.body.password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: "Password does not meet requirements",
          errors: passwordValidation.errors
        });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      // Store password history for preventing reuse
      const passwordHistory: PasswordHistoryEntry[] = [{
        password: hashedPassword,
        changedAt: new Date()
      }];

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        lastPasswordChange: new Date(),
        passwordHistory: passwordHistory,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, passwordHistory, ...userData } = user;
        console.log(`New user registered and logged in: ${user.username} (ID: ${user.id})`);
        res.status(201).json(userData);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log(`[DEBUG] Login attempt for username: ${req.body.username}`);
    
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("[DEBUG] Login error:", err);
        return next(err);
      }
      
      if (!user) {
        // If login failed, penalize this attempt using the rate limiter
        const username = req.body.username;
        const ip = req.ip || '0.0.0.0'; // Provide a fallback IP if undefined
        
        console.log(`[DEBUG] Authentication failed for user: ${username}`);
        
        if (username && typeof username === 'string') {
          penalizeFailedLogin(username, ip)
            .catch(err => console.error('[DEBUG] Failed to penalize login attempt:', err));
        }
        
        return res.status(401).json({ message: info?.message || "Invalid username or password" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("[DEBUG] Session login error:", err);
          return next(err);
        }
        
        const { password, passwordHistory, ...userData } = user;
        console.log(`[DEBUG] User logged in: ${user.username} (ID: ${user.id})`);
        console.log(`[DEBUG] User data at login: isAdmin=${user.isAdmin}, passwordExpired=${(user as Express.User).passwordExpired}`);
        
        // Save session to ensure cookie is set
        req.session.save((err) => {
          if (err) {
            console.error("[DEBUG] Error saving session:", err);
            return next(err);
          }
          
          // Set last login time
          storage.updateUser(user.id, { lastLogin: new Date() })
            .catch(err => console.error(`[DEBUG] Failed to update last login time: ${err}`));
          
          // Enforce single session for this user if enabled
          enforceSingleSession(user.id, req.sessionID)
            .catch(err => console.error(`[DEBUG] Failed to enforce single session: ${err}`));
          
          // Add flag if password is expired and needs to be changed
          if ((user as Express.User).passwordExpired) {
            console.log(`[DEBUG] Setting passwordExpired flag for ${user.username} in response`);
            (userData as any).passwordExpired = true;
          }
          
          console.log(`[DEBUG] Final user data sent to client: ${JSON.stringify(userData)}`);
          res.status(200).json(userData);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const userId = req.user?.id;
    const username = req.user?.username;
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }
      
      // Regenerate session ID for security
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
        }
        
        // Then destroy the session
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destruction error:", err);
            return next(err);
          }
          
          console.log(`User logged out: ${username} (ID: ${userId})`);
          
          // Clear the cookie on the client side - use the original clearCookie method
          // since the session cookie isn't managed by our cookieManager
          const originalClearCookie = (res as any)._clearCookie || res.clearCookie.bind(res);
          const clearCookieOptions: {
            path?: string;
            domain?: string;
            secure?: boolean;
            httpOnly?: boolean;
            sameSite?: 'strict' | 'lax' | false;
          } = {
            path: '/',
            httpOnly: true,
            secure: env === 'production',
            sameSite: env === 'production' ? 'strict' : 'lax',
            domain: env === 'production' ? process.env.COOKIE_DOMAIN : undefined
          };
          
          originalClearCookie.call(res, 'ATScribe.sid', clearCookieOptions);
          
          res.sendStatus(200);
        });
      });
    });
  });

  // Add endpoint to change password
  app.post("/api/change-password", async (req, res, next) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Verify the current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const passwordMatch = await comparePasswords(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Validate the new password against policy
      const passwordValidation = await validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: "New password does not meet requirements", 
          errors: passwordValidation.errors 
        });
      }

      // Check if new password is in the password history
      const passwordHistory: PasswordHistoryEntry[] = user.passwordHistory ? 
        (user.passwordHistory as any as PasswordHistoryEntry[]) : [];
      const policy = await import('../utils/password-policy').then(m => m.getPasswordPolicy());
      
      for (let i = 0; i < Math.min(passwordHistory.length, policy.preventReuseCount); i++) {
        const historyEntry = passwordHistory[i];
        const historyMatch = await comparePasswords(newPassword, historyEntry.password);
        if (historyMatch) {
          return res.status(400).json({ 
            message: `Cannot reuse any of your last ${policy.preventReuseCount} passwords` 
          });
        }
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password history (add new password at the beginning)
      passwordHistory.unshift({
        password: hashedPassword,
        changedAt: new Date()
      });
      
      // Trim history to keep only the required number of entries
      if (passwordHistory.length > policy.preventReuseCount) {
        passwordHistory.length = policy.preventReuseCount;
      }

      // Update the user
      await storage.updateUser(req.user.id, {
        password: hashedPassword,
        lastPasswordChange: new Date(),
        passwordHistory: passwordHistory
      });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      next(error);
    }
  });

  // Add endpoint to get password requirements
  app.get("/api/password-requirements", async (req, res, next) => {
    try {
      const { getPasswordPolicy, getPasswordRequirementsText } = await import('../utils/password-policy');
      const policy = await getPasswordPolicy();
      const requirementsText = await getPasswordRequirementsText();
      
      res.json({
        requirements: {
          minLength: policy.minLength,
          requireUppercase: policy.requireUppercase,
          requireLowercase: policy.requireLowercase,
          requireNumbers: policy.requireNumbers,
          requireSpecialChars: policy.requireSpecialChars,
        },
        text: requirementsText
      });
    } catch (error) {
      console.error("Error fetching password requirements:", error);
      next(error);
    }
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("[DEBUG] Unauthenticated request to /api/user");
      return res.sendStatus(401);
    }
    
    console.log(`[DEBUG] Current authenticated user: ${req.user.username} (ID: ${req.user.id})`);
    console.log(`[DEBUG] Original user object passwordExpired flag: ${req.user.passwordExpired}`);
    console.log(`[DEBUG] Full user properties: ${Object.keys(req.user).join(', ')}`);
    
    const { password, passwordHistory, ...userData } = req.user;
    
    // Check if password has expired
    if (req.user.lastPasswordChange) {
      // Use our local isPasswordExpired function
      const lastPasswordChangeDate = req.user.lastPasswordChange as Date;
      console.log(`[DEBUG] Checking password expiration for ${req.user.username} in /api/user endpoint`);
      console.log(`[DEBUG] Last password change date: ${lastPasswordChangeDate}`);
      
      try {
        const expired = await isPasswordExpired(lastPasswordChangeDate, req.user.username);
        console.log(`[DEBUG] Password expired result in /api/user: ${expired}`);
        
        if (expired) {
          console.log(`[DEBUG] Setting passwordExpired flag to true for ${req.user.username} in /api/user response`);
          (userData as any).passwordExpired = true;
        } else {
          console.log(`[DEBUG] Password is NOT expired for ${req.user.username}`);
          // Explicitly ensure passwordExpired is false/undefined
          (userData as any).passwordExpired = false;
        }
      } catch (error) {
        console.error(`[DEBUG] Error checking password expiration: ${error}`);
        // Default to not expired if there's an error
        (userData as any).passwordExpired = false;
      }
      
      console.log(`[DEBUG] Final userData for ${req.user.username}:`, JSON.stringify({...userData, passwordExpired: (userData as any).passwordExpired }));
      res.json(userData);
    } else {
      console.log(`[DEBUG] User ${req.user.username} has no lastPasswordChange date recorded in /api/user endpoint`);
      console.log(`[DEBUG] Final userData for ${req.user.username}:`, JSON.stringify(userData));
      (userData as any).passwordExpired = false; // Explicitly set to false if no last change date
      res.json(userData);
    }
  });
  
  // Add a debug endpoint to check session status (disable in production)
  if (env !== 'production') {
    app.get("/api/debug/session", (req, res) => {
      res.json({
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? { 
          id: req.user.id, 
          username: req.user.username,
          email: req.user.email 
        } : null,
        sessionID: req.sessionID,
        // Don't expose the full session for security reasons
        sessionExists: !!req.session
      });
    });
  }

  app.get("/api/check-username", async (req, res) => {
    const username = (req.query.username as string)?.toLowerCase();
    if (!username) {
      return res.status(400).json({ available: false, message: "Username parameter is required" });
    }
    
    try {
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.json({ available: false, message: "Username is already taken" });
      }
      return res.json({ available: true, message: "Username is available" });
    } catch (error) {
      console.error("Error checking username availability:", error);
      return res.status(500).json({ available: false, message: "Error checking username availability" });
    }
  });

  app.get("/api/check-email", async (req, res) => {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ disposable: true, message: "Email parameter is required" });
    }
    
    try {
      const isDisposable = isDisposableEmail(email);
      if (isDisposable) {
        return res.json({ disposable: true, message: "Temporary or disposable email addresses are not allowed" });
      }
      return res.json({ disposable: false, message: "Email is valid" });
    } catch (error) {
      console.error("Error checking email disposability:", error);
      return res.status(500).json({ disposable: true, message: "Error checking email validity" });
    }
  });

  // Add endpoint for requesting a password reset
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.status(200).json({ 
          message: "If an account with that email exists, a password reset link has been sent." 
        });
      }
      
      // Generate a reset token (random 32 bytes as hex) and expiry time (1 hour from now)
      const resetToken = randomBytes(32).toString('hex');
      const resetExpiry = new Date();
      resetExpiry.setHours(resetExpiry.getHours() + 1);
      
      // Save the token and expiry to the user record
      await storage.updateUser(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry
      });
      
      // In a real application, you would send an email here
      // For this implementation, we'll just return the token in the response
      // TODO: Implement proper email sending in production
      console.log(`Password reset requested for ${user.username} (${user.email}). Token: ${resetToken}`);
      
      res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent.",
        // In a real app, don't send the token in the response, this is just for development
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
        userId: process.env.NODE_ENV === 'development' ? user.id : undefined
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      next(error);
    }
  });
  
  // Add endpoint to reset password with token
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, userId, newPassword } = req.body;
      
      if (!token || !userId || !newPassword) {
        return res.status(400).json({ 
          message: "Token, user ID, and new password are required" 
        });
      }
      
      // Find user by ID
      const user = await storage.getUser(parseInt(userId, 10));
      if (!user) {
        return res.status(400).json({ message: "Invalid reset request" });
      }
      
      // Verify the token and expiry
      if (!user.resetPasswordToken || 
          !user.resetPasswordExpiry || 
          user.resetPasswordToken !== token ||
          new Date() > new Date(user.resetPasswordExpiry)) {
        return res.status(400).json({ 
          message: "Password reset token is invalid or has expired" 
        });
      }
      
      // Validate the new password against policy
      const passwordValidation = await validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: "Password does not meet requirements",
          errors: passwordValidation.errors
        });
      }
      
      // Check if new password is in the password history
      const passwordHistory: PasswordHistoryEntry[] = user.passwordHistory ? 
        (user.passwordHistory as any as PasswordHistoryEntry[]) : [];
      const policy = await import('../utils/password-policy').then(m => m.getPasswordPolicy());
      
      for (let i = 0; i < Math.min(passwordHistory.length, policy.preventReuseCount); i++) {
        const historyEntry = passwordHistory[i];
        const historyMatch = await comparePasswords(newPassword, historyEntry.password);
        if (historyMatch) {
          return res.status(400).json({ 
            message: `Cannot reuse any of your last ${policy.preventReuseCount} passwords` 
          });
        }
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password history
      passwordHistory.unshift({
        password: hashedPassword,
        changedAt: new Date()
      });
      
      // Trim history to keep only the required number of entries
      if (passwordHistory.length > policy.preventReuseCount) {
        passwordHistory.length = policy.preventReuseCount;
      }
      
      // Update the user with new password and clear reset token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        lastPasswordChange: new Date(),
        passwordHistory: passwordHistory,
        resetPasswordToken: null,
        resetPasswordExpiry: null
      });
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      next(error);
    }
  });

  // Add a debug endpoint to verify user credentials directly (only in development mode)
  if (process.env.NODE_ENV !== 'production') {
    app.post("/api/debug/test-auth", async (req, res) => {
      try {
        const { username, password } = req.body;
        
        if (!username || !password) {
          return res.status(400).json({ success: false, message: "Username and password are required" });
        }
        
        console.log(`[DEBUG] Testing auth for username: ${username}`);
        
        // Get user
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`[DEBUG] Test auth failed: User ${username} not found`);
          return res.json({ success: false, message: "User not found" });
        }
        
        console.log(`[DEBUG] User found. ID: ${user.id}, Admin: ${user.isAdmin}`);
        console.log(`[DEBUG] Last password change: ${user.lastPasswordChange}`);
        
        // Test password
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`[DEBUG] Password match result: ${passwordMatch}`);
        
        // Check password expiration
        let passwordExpired = false;
        if (user.lastPasswordChange) {
          try {
            passwordExpired = await isPasswordExpired(user.lastPasswordChange, user.username);
            console.log(`[DEBUG] Password expiration check: ${passwordExpired}`);
          } catch (error) {
            console.error(`[DEBUG] Error in password expiration check:`, error);
          }
        } else {
          console.log(`[DEBUG] No lastPasswordChange date found`);
        }
        
        // Return debug info
        return res.json({
          success: true,
          authenticated: passwordMatch,
          user: {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt,
            lastPasswordChange: user.lastPasswordChange,
            passwordExpired
          }
        });
      } catch (error) {
        console.error(`[DEBUG] Error in test-auth endpoint:`, error);
        return res.status(500).json({ success: false, message: "Server error" });
      }
    });
  }
}

/**
 * Check if a user's password needs to be reset due to expiry
 * @param lastPasswordChange Date when the password was last changed
 * @param username Optional username for logging
 */
export async function isPasswordExpired(lastPasswordChange: Date, username?: string): Promise<boolean> {
  const policy = await getPasswordPolicy();
  
  // If expiry is disabled (0 days), never expire
  if (policy.passwordExpiryDays === 0) {
    console.log(`[DEBUG] Password expiry policy is disabled (0 days) for user ${username || 'unknown'}`);
    return false;
  }
  
  const now = new Date();
  const passwordCreationDate = new Date(lastPasswordChange);
  
  // Add a grace period for newly created accounts (24 hours)
  // If the password was created less than 24 hours ago, don't expire it
  const hoursSinceCreation = Math.abs(now.getTime() - passwordCreationDate.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreation < 24) {
    console.log(`[DEBUG] Password for ${username || 'unknown'} created recently (${hoursSinceCreation.toFixed(2)} hours ago), bypassing expiry check`);
    return false;
  }
  
  const expiryDate = new Date(lastPasswordChange);
  expiryDate.setDate(expiryDate.getDate() + policy.passwordExpiryDays);
  
  const isExpired = now > expiryDate;
  console.log(`[DEBUG] Password expiry check for ${username || 'unknown'}: Last Changed: ${lastPasswordChange}, Expiry: ${expiryDate}, Current: ${now}, Is Expired: ${isExpired}`);
  return isExpired;
}


