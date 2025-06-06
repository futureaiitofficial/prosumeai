import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { appSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { Session, SessionData } from 'express-session';
import { storage } from '../config/storage';

/**
 * Session configuration interface
 */
export interface SessionConfig {
  maxAge: number;
  inactivityTimeout: number;
  absoluteTimeout: number;
  singleSession: boolean;
  regenerateAfterLogin: boolean;
  rotateSecretInterval: number;
  freemiumRestrictions: {
    enabled: boolean;
    maxAccountsPerIp: number;
    maxAccountsPerDevice: number;
    trackIpAddresses: boolean;
    trackDevices: boolean;
  };
}

// Default session configuration
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  absoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours
  singleSession: false,
  regenerateAfterLogin: true,
  rotateSecretInterval: 24 * 60 * 60 * 1000, // 24 hours
  freemiumRestrictions: {
    enabled: true,
    maxAccountsPerIp: 1,
    maxAccountsPerDevice: 1,
    trackIpAddresses: true,
    trackDevices: true
  }
};

// Global cached session configuration
let cachedSessionConfig: SessionConfig | null = null;
let lastConfigLoad = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load session configuration from database
 */
export async function loadSessionConfig(): Promise<SessionConfig> {
  try {
    const now = Date.now();
    
    // Return cached config if available and not expired
    if (cachedSessionConfig && (now - lastConfigLoad < CONFIG_CACHE_TTL)) {
      return cachedSessionConfig;
    }
    
    console.log('Loading session configuration from database');
    const [configSettings] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'session_config'))
      .limit(1);
    
    if (configSettings && configSettings.value) {
      cachedSessionConfig = {
        ...DEFAULT_SESSION_CONFIG,
        ...configSettings.value as Partial<SessionConfig>
      };
    } else {
      cachedSessionConfig = DEFAULT_SESSION_CONFIG;
    }
    
    lastConfigLoad = now;
    console.log('Session configuration loaded:', cachedSessionConfig);
    return cachedSessionConfig;
  } catch (error) {
    console.error('Error loading session configuration:', error);
    return DEFAULT_SESSION_CONFIG;
  }
}

/**
 * Save session configuration to database
 */
export async function saveSessionConfig(config: Partial<SessionConfig>): Promise<void> {
  try {
    const [existingConfig] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'session_config'))
      .limit(1);
    
    const newConfig = {
      ...DEFAULT_SESSION_CONFIG,
      ...(existingConfig?.value as Partial<SessionConfig> || {}),
      ...config
    };
    
    if (existingConfig) {
      await db.update(appSettings)
        .set({
          value: newConfig,
          updatedAt: new Date()
        })
        .where(eq(appSettings.key, 'session_config'));
    } else {
      await db.insert(appSettings)
        .values({
          key: 'session_config',
          value: newConfig,
          category: 'security',
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
    
    // Update cache
    cachedSessionConfig = newConfig;
    lastConfigLoad = Date.now();
    
    console.log('Session configuration saved:', newConfig);
  } catch (error) {
    console.error('Error saving session configuration:', error);
    throw error;
  }
}

/**
 * Initialize session configuration
 */
export async function initializeSessionConfig(): Promise<void> {
  try {
    const [existingConfig] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'session_config'))
      .limit(1);
    
    if (!existingConfig) {
      console.log('Creating default session configuration');
      await saveSessionConfig(DEFAULT_SESSION_CONFIG);
    } else {
      // Load the config into cache
      await loadSessionConfig();
    }
    
    console.log('Session configuration initialized');
  } catch (error) {
    console.error('Error initializing session configuration:', error);
  }
}

/**
 * Middleware to enforce session timeout based on configuration
 */
export function sessionTimeoutMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip for unauthenticated requests
  if (!req.isAuthenticated() || !req.session) {
    return next();
  }
  
  // Skip for non-API routes in development (to avoid affecting Vite HMR)
  if (process.env.NODE_ENV === 'development' && !req.originalUrl.startsWith('/api/')) {
    return next();
  }
  
  // Load config synchronously from cache
  const config = cachedSessionConfig || DEFAULT_SESSION_CONFIG;
  
  const now = Date.now();
  const session = req.session as any;
  
  // Set last activity time if not set
  if (!session.lastActivity) {
    session.lastActivity = now;
    session.createdAt = now;
  }
  
  // Check inactivity timeout
  const inactiveTime = now - session.lastActivity;
  if (inactiveTime > config.inactivityTimeout) {
    console.log(`Session expired due to inactivity: ${inactiveTime}ms > ${config.inactivityTimeout}ms`);
    req.logout((err) => {
      if (err) {
        console.error('Error logging out expired session:', err);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying expired session:', err);
        }
        return res.status(401).json({ 
          message: 'Your session has expired due to inactivity. Please log in again.' 
        });
      });
    });
    return;
  }
  
  // Check absolute timeout
  const sessionAge = now - (session.createdAt || now);
  if (sessionAge > config.absoluteTimeout) {
    console.log(`Session expired due to absolute timeout: ${sessionAge}ms > ${config.absoluteTimeout}ms`);
    req.logout((err) => {
      if (err) {
        console.error('Error logging out expired session:', err);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying expired session:', err);
        }
        return res.status(401).json({ 
          message: 'Your session has expired. Please log in again.' 
        });
      });
    });
    return;
  }
  
  // Update last activity for this request
  session.lastActivity = now;
  
  // Continue with request
  next();
}

/**
 * Middleware to regenerate session after login to prevent session fixation
 */
export function regenerateSessionAfterLogin(req: Request, res: Response, next: NextFunction) {
  // Skip if not a login request
  if (req.path !== '/api/login' || req.method !== 'POST') {
    return next();
  }
  
  // Store the original session regeneration method
  const originalRegenerate = req.session.regenerate;
  
  // Define a new regenerate method with the correct return type
  // @ts-ignore - Ignore the type mismatch as we're replacing it at runtime
  req.session.regenerate = function(callback: (err: any) => void) {
    console.log('Session regenerate called after login');
    return originalRegenerate.call(req.session, callback);
  };
  
  next();
}

/**
 * Handle session regeneration after successful login
 */
export function postLoginSessionHandler(req: Request, res: Response, next: NextFunction) {
  // Only proceed for successful login
  if (!req.user) {
    return next();
  }
  
  // Load config from cache
  const config = cachedSessionConfig || DEFAULT_SESSION_CONFIG;
  
  // If session regeneration is enabled, regenerate the session
  if (config.regenerateAfterLogin) {
    const userData = req.user;
    
    req.session.regenerate((err) => {
      if (err) {
        console.error('Error regenerating session after login:', err);
        return next(err);
      }
      
      // Re-establish user data in the new session
      req.login(userData, (loginErr) => {
        if (loginErr) {
          console.error('Error re-establishing user in regenerated session:', loginErr);
          return next(loginErr);
        }
        
        // Mark session creation time
        (req.session as any).createdAt = Date.now();
        (req.session as any).lastActivity = Date.now();
        
        next();
      });
    });
  } else {
    // Just update the timestamps
    (req.session as any).createdAt = Date.now();
    (req.session as any).lastActivity = Date.now();
    next();
  }
}

/**
 * Ensure single session per user if enabled in configuration
 */
export async function enforceSingleSession(userId: number, currentSessionId: string): Promise<void> {
  try {
    // Load config
    const config = await loadSessionConfig();
    
    // Skip if feature is disabled
    if (!config.singleSession) {
      return;
    }
    
    // Get session store from storage
    const sessionStore = storage.sessionStore;
    if (!sessionStore) {
      console.warn('Cannot enforce single session: session store not available');
      return;
    }
    
    // Store the current valid session ID for this user
    await db.insert(appSettings)
      .values({
        key: `user_active_session_${userId}`,
        value: {
          sessionId: currentSessionId,
          updatedAt: new Date().toISOString()
        },
        category: 'session-management',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { 
          value: {
            sessionId: currentSessionId,
            updatedAt: new Date().toISOString()
          },
          updatedAt: new Date()
        }
      });
    
    console.log(`Single session enforced for user ${userId}, active sessionId: ${currentSessionId}`);
  } catch (error) {
    console.error('Error enforcing single session:', error);
  }
}

/**
 * Middleware to validate if the current session is the active one for this user
 */
export function validateActiveSession(req: Request, res: Response, next: NextFunction) {
  // Skip for unauthenticated requests
  if (!req.isAuthenticated() || !req.session || !req.user?.id) {
    return next();
  }
  
  // Skip for non-API routes in development (to avoid affecting Vite HMR)
  if (process.env.NODE_ENV === 'development' && !req.originalUrl.startsWith('/api/')) {
    return next();
  }
  
  // Load config synchronously from cache
  const config = cachedSessionConfig || DEFAULT_SESSION_CONFIG;
  
  // Skip if single session feature is disabled
  if (!config.singleSession) {
    return next();
  }
  
  const userId = req.user.id;
  const currentSessionId = req.sessionID;
  
  // Check if this is the active session for this user
  db.select()
    .from(appSettings)
    .where(eq(appSettings.key, `user_active_session_${userId}`))
    .limit(1)
    .then(([record]) => {
      if (!record || !record.value) {
        // No active session record yet, let's create one
        enforceSingleSession(userId, currentSessionId)
          .then(() => next())
          .catch((err) => {
            console.error('Error creating active session record:', err);
            next();
          });
        return;
      }
      
      const activeSession = record.value as { sessionId: string; updatedAt: string };
      
      // If this is not the active session, invalidate it
      if (activeSession.sessionId !== currentSessionId) {
        console.log(`Session invalidated - User ${userId} has a newer active session`);
        req.logout((err) => {
          if (err) {
            console.error('Error logging out invalidated session:', err);
          }
          
          req.session.destroy((err) => {
            if (err) {
              console.error('Error destroying invalidated session:', err);
            }
            
            // Clear the cookie on the client side
            const env = process.env.NODE_ENV || 'development';
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
            
            res.clearCookie('ATScribe.sid', clearCookieOptions);
            
            res.status(401).json({ 
              message: 'Your account has been logged in elsewhere. Only one active session is allowed.' 
            });
          });
        });
        return;
      }
      
      // This is the active session, continue
      next();
    })
    .catch((err) => {
      console.error('Error checking active session:', err);
      next();
    });
}

/**
 * Track user IP address and device for freemium fraud prevention
 */
export async function trackUserDevice(req: Request, userId: number): Promise<void> {
  try {
    // Load config
    const config = await loadSessionConfig();
    
    // Skip if tracking is disabled
    if (!config.freemiumRestrictions.enabled) {
      return;
    }

    // Get client IP address
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Get or generate device ID (ideally this would be done client-side with a fingerprinting library)
    const deviceId = req.cookies['device_id'] || generateDeviceId(req);
    
    // Store the device tracking information in database
    await db.insert(appSettings)
      .values({
        key: `user_device_${userId}`,
        value: {
          userId,
          ipAddress: clientIp,
          deviceId,
          userAgent,
          lastSeen: new Date().toISOString()
        },
        category: 'user-tracking'
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { 
          value: {
            userId,
            ipAddress: clientIp,
            deviceId,
            userAgent,
            lastSeen: new Date().toISOString()
          },
          updatedAt: new Date()
        }
      });
      
    // Also maintain a reverse lookup for IP/device to users
    if (config.freemiumRestrictions.trackIpAddresses) {
      await trackIpAddress(clientIp, userId);
    }
    
    if (config.freemiumRestrictions.trackDevices) {
      await trackDeviceId(deviceId, userId);
    }
  } catch (error) {
    console.error('Error tracking user device:', error);
  }
}

/**
 * Track IP address to user mapping
 */
async function trackIpAddress(ipAddress: string, userId: number): Promise<void> {
  const key = `ip_users_${ipAddress.replace(/\./g, '_')}`;
  
  try {
    const [existingRecord] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);
      
    if (existingRecord) {
      const userIds: number[] = existingRecord.value as number[] || [];
      
      if (!userIds.includes(userId)) {
        userIds.push(userId);
        await db.update(appSettings)
          .set({
            value: userIds,
            updatedAt: new Date()
          })
          .where(eq(appSettings.key, key));
      }
    } else {
      await db.insert(appSettings)
        .values({
          key,
          value: [userId],
          category: 'ip-tracking',
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
  } catch (error) {
    console.error(`Error tracking IP address ${ipAddress}:`, error);
  }
}

/**
 * Track device ID to user mapping
 */
async function trackDeviceId(deviceId: string, userId: number): Promise<void> {
  const key = `device_users_${deviceId}`;
  
  try {
    const [existingRecord] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);
      
    if (existingRecord) {
      const userIds: number[] = existingRecord.value as number[] || [];
      
      if (!userIds.includes(userId)) {
        userIds.push(userId);
        await db.update(appSettings)
          .set({
            value: userIds,
            updatedAt: new Date()
          })
          .where(eq(appSettings.key, key));
      }
    } else {
      await db.insert(appSettings)
        .values({
          key,
          value: [userId],
          category: 'device-tracking',
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
  } catch (error) {
    console.error(`Error tracking device ID ${deviceId}:`, error);
  }
}

/**
 * Check if user is allowed to use freemium plan based on device/IP restrictions
 */
export async function checkFreemiumEligibility(
  req: Request, 
  userId: number
): Promise<{eligible: boolean; reason?: string}> {
  try {
    // Load config
    const config = await loadSessionConfig();
    
    // Skip if restrictions are disabled
    if (!config.freemiumRestrictions.enabled) {
      return { eligible: true };
    }
    
    const clientIp = getClientIp(req);
    const deviceId = req.cookies['device_id'] || generateDeviceId(req);
    
    // Check IP address restrictions
    if (config.freemiumRestrictions.trackIpAddresses) {
      const ipKey = `ip_users_${clientIp.replace(/\./g, '_')}`;
      const [ipRecord] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, ipKey))
        .limit(1);
        
      if (ipRecord) {
        const userIds = ipRecord.value as number[] || [];
        
        // Check if there are too many users from this IP
        if (userIds.length >= config.freemiumRestrictions.maxAccountsPerIp && !userIds.includes(userId)) {
          return {
            eligible: false,
            reason: 'Too many freemium accounts from this IP address'
          };
        }
      }
    }
    
    // Check device restrictions
    if (config.freemiumRestrictions.trackDevices) {
      const deviceKey = `device_users_${deviceId}`;
      const [deviceRecord] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, deviceKey))
        .limit(1);
        
      if (deviceRecord) {
        const userIds = deviceRecord.value as number[] || [];
        
        // Check if there are too many users from this device
        if (userIds.length >= config.freemiumRestrictions.maxAccountsPerDevice && !userIds.includes(userId)) {
          return {
            eligible: false,
            reason: 'Too many freemium accounts from this device'
          };
        }
      }
    }
    
    return { eligible: true };
  } catch (error) {
    console.error('Error checking freemium eligibility:', error);
    // Allow by default on error to prevent blocking legitimate users
    return { eligible: true };
  }
}

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // If x-forwarded-for contains multiple IPs, take the first one (client IP)
    return Array.isArray(forwardedFor) 
      ? forwardedFor[0].split(',')[0].trim() 
      : forwardedFor.split(',')[0].trim();
  }
  
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Generate a pseudo-unique device ID from request headers
 * Note: This is a simple approach and not foolproof. A client-side fingerprinting solution
 * would be more robust (like Fingerprint.js or similar)
 */
function generateDeviceId(req: Request): string {
  const components = [
    req.headers['user-agent'],
    req.headers['accept-language'],
    req.headers['accept-encoding']
  ].filter(Boolean);
  
  // This is a simple hash function - consider a more secure one
  let hash = 0;
  const combinedString = components.join('|');
  
  for (let i = 0; i < combinedString.length; i++) {
    const char = combinedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Update freemium restriction settings
 */
export async function updateFreemiumRestrictions(
  newSettings: Partial<SessionConfig['freemiumRestrictions']>
): Promise<void> {
  try {
    // Load current config
    const currentConfig = await loadSessionConfig();
    
    // Create updated config
    const updatedFreemiumSettings = {
      ...currentConfig.freemiumRestrictions,
      ...newSettings
    };
    
    // Save the updated config
    await saveSessionConfig({
      ...currentConfig,
      freemiumRestrictions: updatedFreemiumSettings
    });
    
    console.log('Freemium restrictions updated:', updatedFreemiumSettings);
  } catch (error) {
    console.error('Error updating freemium restrictions:', error);
    throw error;
  }
} 