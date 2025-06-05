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
import { EventEmitter } from 'events';
import { loadSessionConfig } from '../middleware/session-security';
import { EmailService } from '../services/email-service';
import * as geoip from 'geoip-lite';
import { NotificationService } from "../services/notification-service";
import { adminNotificationService } from "../services/admin-notification-service";

// Increase max listeners to prevent warnings
EventEmitter.defaultMaxListeners = 20;

// Initialize notification service
const notificationService = new NotificationService();

// Extend User type to include our runtime properties
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      password: string;
      fullName: string;
      isAdmin: boolean;
      lastLogin: Date | null;
      razorpayCustomerId: string | null;
      lastPasswordChange: Date | null;
      passwordHistory: any | null;
      failedLoginAttempts: number | null;
      lockoutUntil: Date | null;
      resetPasswordToken: string | null;
      resetPasswordExpiry: Date | null;
      emailVerified: boolean | null;
      emailVerificationToken: string | null;
      emailVerificationExpiry: Date | null;
      createdAt: Date | null;
      updatedAt: Date | null;
      // Additional runtime properties
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

// Implement synchronous access to the session configuration
// This caches the latest configuration for synchronous access
let currentSessionConfig: any = null;

/**
 * Get the current session configuration synchronously
 * @returns The current session configuration or null if not initialized
 */
export function getCurrentSessionConfig() {
  return currentSessionConfig;
}

/**
 * Set the current session configuration - called during initialization
 * @param config The session configuration
 */
export function setCurrentSessionConfig(config: any) {
  currentSessionConfig = config;
  console.log('Current session configuration updated');
}

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
  // Try to get settings from the loaded database configuration
  const sessionConfig = getCurrentSessionConfig();
  
  // Use configured maxAge or fall back to default
  const maxAge = sessionConfig?.maxAge || parseInt(process.env.SESSION_MAX_AGE || '604800000'); // Default: 7 days
  
  // For production, determine if we should disable secure cookies
  // This is needed when testing production mode without HTTPS
  const disableSecure = process.env.DISABLE_SECURE_COOKIE === 'true';
  
  // Always use secure cookies in production unless explicitly disabled
  const useSecure = env === "production" && !disableSecure;
  
  // Get SameSite setting from environment variable
  const sameSiteValue = process.env.COOKIE_SAMESITE || 'lax';
  
  // SameSite=none requires Secure=true, so enforce that
  let finalSecure = useSecure;
  if (sameSiteValue === 'none') {
    finalSecure = true;
    if (!useSecure) {
      console.warn('WARNING: SameSite=none requires Secure=true. Enforcing Secure=true for session cookies.');
    }
  }
  
  console.log(`Cookie config: env=${env}, secure=${finalSecure}, sameSite=${sameSiteValue}, domain=${process.env.COOKIE_DOMAIN || 'undefined'}`);
  
  return {
    maxAge: maxAge,
    httpOnly: true, // Prevent client-side JS from reading the cookie
    secure: finalSecure, // Use secure in production with special case for SameSite=none
    sameSite: sameSiteValue as 'none' | 'lax' | 'strict', // Use appropriate sameSite setting
    path: '/', // Cookie available across the entire site
    // Domain restriction - only use in production if specified
    domain: (env === "production" && process.env.COOKIE_DOMAIN) ? process.env.COOKIE_DOMAIN : undefined,
  };
}

export async function setupAuth(app: Express) {
  try {
    // Initialize password policy
    await initializePasswordPolicy().catch(err => {
      console.error('Failed to initialize password policy:', err);
    });
    
    const env = process.env.NODE_ENV || 'development';
    console.log(`Setting up auth in ${env} environment`);
    
    const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
    
    if (env === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'ATScribe-secret-key')) {
      console.warn('WARNING: Using default session secret in production is a security risk!');
    }
  
    // Load session configuration from database
    const sessionConfig = await loadSessionConfig();
    
    // Cache the config for synchronous access
    setCurrentSessionConfig(sessionConfig);
    
    // Verify session table exists (important for Docker compatibility)
    console.log('🔍 Verifying session store setup...');
    try {
      const { verifySessionTable } = await import('./storage');
      const sessionTableReady = await verifySessionTable();
      if (!sessionTableReady) {
        console.warn('⚠️  Session table verification failed, but continuing with setup');
      }
    } catch (error) {
      console.warn('⚠️  Could not verify session table:', error);
    }
    
    // Enhanced session settings with database config
    const sessionSettings: session.SessionOptions = {
      secret: sessionSecret,
      resave: true, // Keep true to ensure session is saved on each request
      saveUninitialized: false,
      store: storage.sessionStore,
      name: 'ATScribe.sid', // Custom cookie name for better security
      cookie: getCookieConfig(env),
      rolling: true, // Refresh the cookie expiration on every response
      // Add explicit proxy settings for Docker
      proxy: env === 'production' ? true : undefined,
    };
  
    // Set trust proxy for production behind load balancers and Docker
    if (env === 'production') {
      console.log('Setting trust proxy for production environment');
      app.set("trust proxy", 1);
      
      // Load rate limiter middleware
      try {
        const rateLimit = await import('../middleware/rate-limit');
        const { authRateLimiter } = rateLimit;
        app.use('/api/login', authRateLimiter);
        app.use('/api/register', authRateLimiter);
      } catch (err) {
        console.error('Failed to load rate limiter:', err);
      }
    }
    
    // Initialize sessions and authentication
    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());
    
    console.log('✅ Session setup complete using database configuration');
    
    // Add session debugging middleware in development
    if (env === 'development') {
      app.use((req, res, next) => {
        if (req.originalUrl.startsWith('/api/') && req.session) {
          console.log(`[SESSION] ${req.method} ${req.originalUrl} - SessionID: ${req.sessionID}, Authenticated: ${req.isAuthenticated()}`);
        }
        next();
      });
    }
  } catch (err) {
    console.error('Error in auth setup:', err);
    
    // Ensure basic auth still works even if database config failed
    const env = process.env.NODE_ENV || 'development';
    const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
    
    // Fallback to default session settings
    const sessionSettings: session.SessionOptions = {
      secret: sessionSecret,
      resave: true,
      saveUninitialized: false,
      store: storage.sessionStore,
      name: 'ATScribe.sid',
      cookie: getCookieConfig(env),
      rolling: true,
      proxy: env === 'production' ? true : undefined,
    };
    
    if (env === 'production') {
      app.set("trust proxy", 1);
    }
    
    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());
    
    console.log('⚠️  Session setup complete using default configuration (fallback)');
  }

  // Set up authentication strategies and routes - this should happen after session setup
  setupPassportStrategies();
  setupAuthRoutes(app);
}

// Extract Passport strategy setup to a separate function
function setupPassportStrategies() {
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
}

// Extract auth routes setup to a separate function 
function setupAuthRoutes(app: Express) {
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

      // Generate email verification token and expiry
      const verificationToken = randomBytes(32).toString('hex');
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hours to verify

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        lastPasswordChange: new Date(),
        passwordHistory: passwordHistory,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry
      });

      req.login(user, async (err) => {
        if (err) return next(err);
        const { password, passwordHistory, ...userDataToReturn } = user;
        console.log(`New user registered and logged in: ${user.username} (ID: ${user.id})`);
        
        // Notify admins about new user registration
        try {
          await adminNotificationService.notifyNewUserRegistration({
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName || user.username
          });
        } catch (notificationError) {
          console.error('Failed to send admin notification for new user registration:', notificationError);
          // Don't fail the registration if notification fails
        }
        
        // Send welcome email
        try {
          EmailService.sendWelcomeEmail(user.email, user.username)
            .then((sent) => {
              if (sent) {
                console.log(`Welcome email sent to ${user.email}`);
              } else {
                console.warn(`Failed to send welcome email to ${user.email}`);
              }
            })
            .catch((error) => {
              console.error(`Error sending welcome email: ${error}`);
            });
        } catch (error) {
          console.error(`Error sending welcome email: ${error}`);
          // Don't block the registration process if email fails
        }
        
        // Send email verification email
        try {
          const baseUrl = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || 'http://localhost:5173';
          const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}&userId=${user.id}`;
          
          EmailService.sendEmailVerificationEmail(user.email, user.username, verificationLink)
            .then((sent) => {
              if (sent) {
                console.log(`Email verification sent to ${user.email}`);
              } else {
                console.warn(`Failed to send email verification to ${user.email}`);
              }
            })
            .catch((error) => {
              console.error(`Error sending email verification: ${error}`);
            });
        } catch (error) {
          console.error(`Error sending email verification: ${error}`);
          // Don't block the registration process if email fails
        }
        
        // Add emailVerified status to the returned user data
        (userDataToReturn as any).emailVerified = false;
        
        res.status(201).json(userDataToReturn);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log(`[DEBUG] Login attempt for username: ${req.body.username}`);
    console.log(`[DEBUG] Headers: ${JSON.stringify(req.headers)}`);
    console.log(`[DEBUG] Client IP: ${req.ip}`);
    console.log(`[DEBUG] Session ID before auth: ${req.sessionID}`);
    console.log(`[DEBUG] Cookie header: ${req.headers.cookie}`);
    
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
      
      req.login(user, async (err) => {
        if (err) {
          console.error("[DEBUG] Session login error:", err);
          return next(err);
        }
        
        const { password, passwordHistory, ...userData } = user;
        console.log(`[DEBUG] User logged in: ${user.username} (ID: ${user.id})`);
        console.log(`[DEBUG] User data at login: isAdmin=${user.isAdmin}, passwordExpired=${(user as Express.User).passwordExpired}`);
        console.log(`[DEBUG] Session ID after login: ${req.sessionID}`);
        
        // Save session to ensure cookie is set
        req.session.save(async (err) => {
          if (err) {
            console.error("[DEBUG] Error saving session:", err);
            return next(err);
          }
          
          console.log(`[DEBUG] Session saved successfully. Session ID: ${req.sessionID}`);
          console.log(`[DEBUG] Session cookie:`, req.session.cookie);
          
          // Set last login time
          storage.updateUser(user.id, { lastLogin: new Date() })
            .catch(err => console.error(`[DEBUG] Failed to update last login time: ${err}`));
          
          // Enforce single session for this user if enabled
          enforceSingleSession(user.id, req.sessionID)
            .catch(err => console.error(`[DEBUG] Failed to enforce single session: ${err}`));
          
          // Send login alert email for suspicious logins
          try {
            // Generate a reset token (random 32 bytes as hex) and expiry time (1 hour from now)
            const resetToken = randomBytes(32).toString('hex');
            const resetExpiry = new Date();
            resetExpiry.setHours(resetExpiry.getHours() + 24); // Give them 24 hours to reset
            
            // Save the token and expiry to the user record
            // We need to handle this asynchronously but can't block the login process
            storage.updateUser(user.id, {
              resetPasswordToken: resetToken,
              resetPasswordExpiry: resetExpiry
            }).catch(err => console.error(`Error saving reset token: ${err}`));
            
            const baseURL = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || 'http://localhost:5173';
            // Match the reset password format expected by the client
            const resetLink = `${baseURL}/reset-password?token=${resetToken}&userId=${user.id}`;
            
            // Look up location information from IP
            let locationInfo = 'Unknown location';
            let clientIp = req.ip || '0.0.0.0';
            
            try {
              // Try to get real IP from headers if behind proxy/Docker
              const forwardedIp = req.headers['x-forwarded-for'] as string;
              const realIp = req.headers['x-real-ip'] as string;
              
              if (forwardedIp) {
                // Take the first IP from the forwarded chain
                clientIp = forwardedIp.split(',')[0].trim();
              } else if (realIp) {
                clientIp = realIp;
              }
              
              console.log(`[GEOLOCATION] Original IP: ${req.ip}, Forwarded: ${forwardedIp}, Real: ${realIp}, Using: ${clientIp}`);
              
              // Check if IP is private/local
              const isPrivateIp = (
                clientIp === '127.0.0.1' || 
                clientIp === '0.0.0.0' || 
                clientIp.startsWith('192.168.') || 
                clientIp.startsWith('10.') || 
                clientIp.startsWith('172.') ||
                clientIp === '::1' ||
                clientIp.startsWith('fc00:') ||
                clientIp.startsWith('fe80:')
              );
              
              if (!isPrivateIp) {
                console.log(`[GEOLOCATION] Looking up public IP: ${clientIp}`);
                
                // Try local geoip-lite first (fastest)
                const geo = geoip.lookup(clientIp);
                if (geo && geo.country) {
                  locationInfo = `${geo.city ? geo.city + ', ' : ''}${geo.region ? geo.region + ', ' : ''}${geo.country}`;
                  console.log(`[GEOLOCATION] Local lookup successful: ${locationInfo}`);
                } else {
                  console.log(`[GEOLOCATION] Local lookup failed, trying external service...`);
                  
                  // Fallback to external service (with AbortController for timeout)
                  try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    
                    const response = await fetch(`https://ipapi.co/${clientIp}/json/`, {
                      signal: controller.signal,
                      headers: {
                        'User-Agent': 'ProsumeAI/1.0'
                      }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                      const geoData = await response.json();
                      if (geoData && geoData.country_name) {
                        locationInfo = `${geoData.city ? geoData.city + ', ' : ''}${geoData.region ? geoData.region + ', ' : ''}${geoData.country_name}`;
                        console.log(`[GEOLOCATION] External lookup successful: ${locationInfo}`);
                      }
                    }
                  } catch (apiError: any) {
                    console.log(`[GEOLOCATION] External API failed: ${apiError.message}`);
                  }
                }
              } else {
                locationInfo = process.env.NODE_ENV === 'production' 
                  ? 'Private network'
                  : 'Local development environment';
                console.log(`[GEOLOCATION] Private IP detected: ${clientIp} -> ${locationInfo}`);
              }
            } catch (geoError) {
              console.error(`[GEOLOCATION] Error looking up IP location: ${geoError}`);
              locationInfo = 'Location lookup failed';
            }
            
            // Create login info object
            const loginInfo = {
              time: new Date().toLocaleString(),
              device: req.headers['user-agent'] || 'Unknown',
              location: locationInfo,
              ipAddress: clientIp
            };
            
            // Send login alert email
            EmailService.sendLoginAlertEmail(
              user.email,
              user.username,
              loginInfo,
              resetLink
            ).then(sent => {
              if (sent) {
                console.log(`Login alert email sent to ${user.email} with secure reset link`);
              } else {
                console.warn(`Failed to send login alert email to ${user.email}`);
              }
            }).catch(err => {
              console.error(`Error sending login alert email: ${err}`);
            });
          } catch (error) {
            console.error(`Error preparing login alert email: ${error}`);
            // Don't block login process if email fails
          }
          
          // Add flag if password is expired and needs to be changed
          if ((user as Express.User).passwordExpired) {
            console.log(`[DEBUG] Setting passwordExpired flag for ${user.username} in response`);
            (userData as any).passwordExpired = true;
          }
          
          // Check if 2FA is enabled for this user
          try {
            const TwoFactorService = (await import('../services/two-factor-service')).default;
            const twoFactorEnabled = await TwoFactorService.isEnabled(user.id);
            
            if (twoFactorEnabled) {
              // If 2FA is enabled, include this info in response
              const preferredMethod = await TwoFactorService.getPreferredMethod(user.id);
              
              console.log(`[DEBUG] User ${user.username} has 2FA enabled with method: ${preferredMethod}`);
              
              // Add 2FA flag to the response
              (userData as any).requiresTwoFactor = true;
              (userData as any).twoFactorMethod = preferredMethod;
              
              // Check if device is remembered via cookie
              if (req.cookies['2fa_remember'] && req.body.deviceId) {
                const deviceRemembered = await TwoFactorService.isDeviceRemembered(
                  user.id, 
                  req.body.deviceId, 
                  req.cookies['2fa_remember']
                );
                
                if (deviceRemembered) {
                  console.log(`[DEBUG] Device is remembered for user ${user.username}, skipping 2FA`);
                  (userData as any).requiresTwoFactor = false;
                }
              }
            }
          } catch (error) {
            console.error(`[DEBUG] Error checking 2FA status:`, error);
            // Continue with login even if 2FA check fails
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
    
    console.log(`[DEBUG] Logging out user: ${username} (ID: ${userId})`);
    console.log(`[DEBUG] Session ID before logout: ${req.sessionID}`);
    console.log(`[DEBUG] Cookie header: ${req.headers.cookie}`);
    
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
          
          // Try multiple approaches to clear the cookie for maximum browser compatibility
          
          // Approach 1: Clear with same settings as when cookie was set
          const disableSecure = process.env.DISABLE_SECURE_COOKIE === 'true';
          const useSecure = !disableSecure;
          const useSameSiteNone = useSecure;
          
          const clearCookieOptions = {
            path: '/',
            httpOnly: true,
            secure: useSecure,
            sameSite: useSameSiteNone ? 'none' : 'lax',
            domain: process.env.COOKIE_DOMAIN || undefined,
            expires: new Date(0) // Set to epoch time for immediate expiration
          };
          
          console.log(`[DEBUG] Clearing cookie with options:`, clearCookieOptions);
          
          // Approach 1: Use Express's clearCookie
          res.clearCookie('ATScribe.sid', clearCookieOptions as any);
          
          // Approach 2: Set empty value with expired date
          res.cookie('ATScribe.sid', '', {
            ...clearCookieOptions,
            maxAge: -1
          } as any);
          
          // Approach 3: Try clearing with different domain settings
          if (process.env.COOKIE_DOMAIN) {
            // Also try clearing with no domain specified
            res.clearCookie('ATScribe.sid', {
              ...clearCookieOptions,
              domain: undefined
            } as any);
            
            // Also try clearing with just domain (no subdomain)
            const domainParts = process.env.COOKIE_DOMAIN.split('.');
            if (domainParts.length > 1) {
              const mainDomain = domainParts.slice(-2).join('.');
              res.clearCookie('ATScribe.sid', {
                ...clearCookieOptions,
                domain: mainDomain
              } as any);
            }
          }
          
          console.log(`[DEBUG] Cookies should be cleared now`);
          res.sendStatus(200);
        });
      });
    });
  });

  // Add remaining auth routes...
  setupPasswordRoutes(app);
  setupUserRoutes(app);

  // Add a debug endpoint to check session status (disable in production)
  if (process.env.NODE_ENV !== 'production') {
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
    
    // Debug endpoint to check email verification status
    app.get("/api/debug/email-verification/:userId", async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }
        
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        res.json({
          userId: user.id,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified,
          hasVerificationToken: !!user.emailVerificationToken,
          verificationTokenPrefix: user.emailVerificationToken?.substring(0, 10) + '...' || null,
          verificationExpiry: user.emailVerificationExpiry,
          tokenExpired: user.emailVerificationExpiry ? new Date() > new Date(user.emailVerificationExpiry) : null
        });
      } catch (error) {
        console.error("Error in email verification debug endpoint:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    });
  }
}

// Extract password-related routes to a separate function
function setupPasswordRoutes(app: Express) {
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

      // Create notification for password change
      try {
        await notificationService.createNotification({
          recipientId: req.user.id,
          type: 'password_reset',
          category: 'account',
          data: { 
            userName: req.user.username || req.user.fullName,
            changeType: 'manual_change',
            timestamp: new Date().toISOString()
          }
        });
      } catch (notificationError) {
        console.error('Failed to create password change notification:', notificationError);
        // Don't fail the request if notification fails
      }

      // Send password changed notification email
      try {
        const baseUrl = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || 'http://localhost:5173';
        const resetLink = `${baseUrl}/forgot-password`;
        
        EmailService.sendPasswordChangedEmail(user.email, user.username, resetLink)
          .then((sent) => {
            if (sent) {
              console.log(`Password changed notification email sent to ${user.email}`);
            } else {
              console.warn(`Failed to send password changed notification email to ${user.email}`);
            }
          })
          .catch((error) => {
            console.error(`Error sending password changed notification email: ${error}`);
          });
      } catch (error) {
        console.error(`Error sending password changed notification email: ${error}`);
        // Don't block the password change if email fails
      }

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
      
      // Generate a reset token (random 32 bytes as hex) and expiry time (24 hours from now)
      const resetToken = randomBytes(32).toString('hex');
      const resetExpiry = new Date();
      resetExpiry.setHours(resetExpiry.getHours() + 24); // Extended to 24 hours for better user experience
      
      // Save the token and expiry to the user record
      await storage.updateUser(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry
      });
      
      // Send password reset email
      const baseUrl = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || 'http://localhost:5173';
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}&userId=${user.id}`;
      
      try {
        EmailService.sendPasswordResetEmail(user.email, resetLink, user.username)
          .then((sent) => {
            if (sent) {
              console.log(`Password reset email sent to ${user.email}`);
            } else {
              console.warn(`Failed to send password reset email to ${user.email}`);
            }
          })
          .catch((error) => {
            console.error(`Error sending password reset email: ${error}`);
          });
      } catch (error) {
        console.error(`Error sending password reset email: ${error}`);
        // Still return success even if email fails to avoid revealing account existence
      }
      
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
  
  // Add endpoint for debugging token issues (only in development)
  if (process.env.NODE_ENV !== 'production') {
    app.get("/api/debug/verify-token", async (req, res) => {
      try {
        const token = req.query.token as string;
        const userId = req.query.userId as string;
        
        if (!token || !userId) {
          return res.status(400).json({ message: "Token and userId are required" });
        }
        
        const user = await storage.getUser(parseInt(userId, 10));
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const isValidToken = (
          user.resetPasswordToken === token && 
          user.resetPasswordExpiry && 
          new Date() <= new Date(user.resetPasswordExpiry)
        );
        
        return res.json({
          valid: isValidToken,
          tokenInfo: {
            hasToken: !!user.resetPasswordToken,
            hasExpiry: !!user.resetPasswordExpiry,
            tokenMatch: user.resetPasswordToken === token,
            notExpired: user.resetPasswordExpiry ? new Date() <= new Date(user.resetPasswordExpiry) : false,
            tokenPrefix: user.resetPasswordToken ? user.resetPasswordToken.substring(0, 10) + '...' : 'null',
            requestTokenPrefix: token ? token.substring(0, 10) + '...' : 'null',
            expiry: user.resetPasswordExpiry
          }
        });
      } catch (error) {
        console.error("Error in verify-token debug endpoint:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    });
  }
  
  // Add endpoint to reset password with token
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, userId, newPassword } = req.body;
      
      console.log(`Reset password request received for user ID: ${userId} with token: ${token?.substring(0, 10)}...`);
      
      if (!token || !userId || !newPassword) {
        return res.status(400).json({ 
          message: "Token, user ID, and new password are required" 
        });
      }
      
      // Find user by ID
      const user = await storage.getUser(parseInt(userId, 10));
      if (!user) {
        console.log(`User not found with ID: ${userId}`);
        return res.status(400).json({ message: "Invalid reset request" });
      }
      
      console.log(`User found: ${user.username}, validating reset token...`);
      
      // For additional security and to handle multiple reset requests,
      // check if this token might be from a previous login alert
      let isLoginAlertToken = false;
      
      // Check if this is a valid token from EITHER the resetPasswordToken OR from a login alert
      const isValidToken = (
        (user.resetPasswordToken === token && 
         user.resetPasswordExpiry && 
         new Date() <= new Date(user.resetPasswordExpiry))
      );
      
      // Verify the token and expiry
      if (!isValidToken) {
        console.log(`Reset password token verification failed for user ${userId}:
          - Has token: ${!!user.resetPasswordToken}
          - Has expiry: ${!!user.resetPasswordExpiry}
          - Token match: ${user.resetPasswordToken === token}
          - Not expired: ${user.resetPasswordExpiry ? new Date() <= new Date(user.resetPasswordExpiry) : false}
          - User token: ${user.resetPasswordToken ? user.resetPasswordToken.substring(0, 10) + '...' : 'null'}
          - Provided token: ${token.substring(0, 10)}...
        `);
        
        // For easier debugging in development environment
        if (process.env.NODE_ENV !== 'production') {
          console.log("Full tokens for debugging:");
          console.log("User token:", user.resetPasswordToken);
          console.log("Provided token:", token);
        }
        
        if (isLoginAlertToken) {
          console.log(`But token matches a previous login alert token, allowing password reset`);
        } else {
          return res.status(400).json({ 
            message: "Password reset token is invalid or has expired" 
          });
        }
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
      
      // Create notification for password reset
      try {
        await notificationService.createNotification({
          recipientId: user.id,
          type: 'password_reset',
          category: 'account',
          data: { 
            userName: user.username || user.fullName,
            changeType: 'token_reset',
            timestamp: new Date().toISOString()
          }
        });
      } catch (notificationError) {
        console.error('Failed to create password reset notification:', notificationError);
        // Don't fail the request if notification fails
      }
      
      // Send password changed notification email
      try {
        const baseUrl = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || 'http://localhost:5173';
        const resetLink = `${baseUrl}/forgot-password`;
        
        EmailService.sendPasswordChangedEmail(user.email, user.username, resetLink)
          .then((sent) => {
            if (sent) {
              console.log(`Password reset notification email sent to ${user.email}`);
            } else {
              console.warn(`Failed to send password reset notification email to ${user.email}`);
            }
          })
          .catch((error) => {
            console.error(`Error sending password reset notification email: ${error}`);
          });
      } catch (error) {
        console.error(`Error sending password reset notification email: ${error}`);
        // Don't block the password reset process if email fails
      }
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      next(error);
    }
  });
}

// Extract user-related routes to a separate function
function setupUserRoutes(app: Express) {
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
  
  // Add endpoint to request email verification
  app.post("/api/request-email-verification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate verification token (random 32 bytes as hex) and expiry time (24 hours from now)
      const verificationToken = randomBytes(32).toString('hex');
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + 24);
      
      // Store token and expiry in user record
      // Note: We're adding these fields dynamically, you might want to add them to the schema
      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        // Initially set emailVerified to false if it's not set yet
        emailVerified: user.emailVerified === undefined ? false : user.emailVerified
      });
      
      // Build verification link
      const baseUrl = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || 'http://localhost:5173';
      const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}&userId=${user.id}`;
      
      // Send verification email
      try {
        const sent = await EmailService.sendEmailVerificationEmail(user.email, user.username, verificationLink);
        if (sent) {
          console.log(`Email verification sent to ${user.email}`);
          return res.json({ message: "Verification email sent successfully" });
        } else {
          console.error(`Failed to send verification email to ${user.email}`);
          return res.status(500).json({ message: "Failed to send verification email. Please try again later." });
        }
      } catch (error) {
        console.error(`Error sending verification email: ${error}`);
        return res.status(500).json({ message: "Error sending verification email. Please try again later." });
      }
    } catch (error) {
      console.error("Email verification request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Verify email endpoint
  app.post("/api/verify-email", async (req, res) => {
    try {
      const { token, userId } = req.body;
      
      console.log(`[EMAIL VERIFICATION] Request received - Token: ${token?.substring(0, 10)}..., UserId: ${userId}`);
      
      if (!token || !userId) {
        console.log(`[EMAIL VERIFICATION] Missing parameters - Token: ${!!token}, UserId: ${!!userId}`);
        return res.status(400).json({ message: "Token and user ID are required" });
      }
      
      const id = parseInt(userId);
      if (isNaN(id)) {
        console.log(`[EMAIL VERIFICATION] Invalid user ID: ${userId}`);
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Find user by ID
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`[EMAIL VERIFICATION] User not found with ID: ${id}`);
        return res.status(400).json({ message: "User not found" });
      }
      
      console.log(`[EMAIL VERIFICATION] User found: ${user.username} (${user.email})`);
      console.log(`[EMAIL VERIFICATION] Email already verified: ${user.emailVerified}`);
      console.log(`[EMAIL VERIFICATION] Stored token: ${user.emailVerificationToken?.substring(0, 10)}...`);
      console.log(`[EMAIL VERIFICATION] Token expiry: ${user.emailVerificationExpiry}`);
      console.log(`[EMAIL VERIFICATION] Current time: ${new Date()}`);
      
      // If user is already verified, clear any remaining tokens and return success
      if (user.emailVerified === true) {
        console.log(`[EMAIL VERIFICATION] User ${user.username} is already verified, clearing tokens`);
        await storage.updateUser(user.id, {
          emailVerificationToken: null,
          emailVerificationExpiry: null
        });
        return res.json({ message: "Email is already verified" });
      }
      
      // Verify the token and expiry
      const hasToken = !!user.emailVerificationToken;
      const hasExpiry = !!user.emailVerificationExpiry;
      const tokenMatches = user.emailVerificationToken === token;
      const notExpired = user.emailVerificationExpiry ? new Date() <= new Date(user.emailVerificationExpiry) : false;
      
      console.log(`[EMAIL VERIFICATION] Token validation:
        - Has token: ${hasToken}
        - Has expiry: ${hasExpiry}
        - Token matches: ${tokenMatches}
        - Not expired: ${notExpired}
      `);
      
      if (!hasToken || !hasExpiry || !tokenMatches || !notExpired) {
        console.log(`[EMAIL VERIFICATION] Token validation failed for user ${user.username}`);
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      console.log(`[EMAIL VERIFICATION] Token validation successful, marking email as verified`);
      
      // Mark email as verified and clear verification token
      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null
      });
      
      console.log(`[EMAIL VERIFICATION] Email verified successfully for user ${user.username}`);
      return res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Email verification error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
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


