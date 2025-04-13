import { Request, Response, NextFunction } from "express";
import { RateLimiterMemory, RateLimiterPostgres, RateLimiterRes } from 'rate-limiter-flexible';
import { pool } from '../config/db'; // Assuming you have a pool export in db.ts

// Options for memory-based rate limiting
const authRateLimiterMemoryOptions = {
  points: parseInt(process.env.AUTH_RATE_LIMIT_ATTEMPTS || '5'), // Default: 5 attempts
  duration: parseInt(process.env.AUTH_RATE_LIMIT_DURATION || '900'), // Default: 15 minutes (in seconds)
};

// Options for postgres-based rate limiting 
const authRateLimiterPostgresOptions = {
  storeClient: pool,
  tableName: 'login_rate_limits',
  points: parseInt(process.env.AUTH_RATE_LIMIT_ATTEMPTS || '5'), // Default: 5 attempts
  duration: parseInt(process.env.AUTH_RATE_LIMIT_DURATION || '900'), // Default: 15 minutes (in seconds)
  blockDuration: parseInt(process.env.AUTH_RATE_LIMIT_BLOCK || '3600'), // Default: 1 hour (in seconds)
};

// Create a memory-based rate limiter as a fallback
const memoryRateLimiter = new RateLimiterMemory(authRateLimiterMemoryOptions);

// Try to create a PostgreSQL rate limiter, fall back to memory if it fails
let rateLimiter: RateLimiterMemory | RateLimiterPostgres = memoryRateLimiter;

// Attempt to initialize PostgreSQL rate limiter
try {
  // Use PostgreSQL rate limiter in production for persistence across app instances
  if (process.env.NODE_ENV === 'production') {
    rateLimiter = new RateLimiterPostgres(authRateLimiterPostgresOptions);
    console.log('Using PostgreSQL rate limiter for authentication');
  } else {
    console.log('Using memory rate limiter for authentication in development');
  }
} catch (err) {
  console.error('Failed to initialize PostgreSQL rate limiter, using memory-based fallback', err);
}

// Middleware for rate limiting authentication attempts
export const authRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use IP address and username (if provided) as key for rate limiting
    const username = req.body.username || '';
    const key = `${req.ip}-${username}`;
    
    await rateLimiter.consume(key);
    next();
  } catch (err: unknown) {
    // Type guard to check if error is RateLimiterRes
    if (err instanceof Object && 'msBeforeNext' in err) {
      const rateLimiterRes = err as RateLimiterRes;
      const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
      
      // Set appropriate headers for rate limiting information
      res.set('Retry-After', String(secs));
      res.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + secs));
      
      console.warn(`Rate limit exceeded for IP: ${req.ip}, Username attempt: ${req.body.username || 'unknown'}`);
      
      return res.status(429).json({
        message: `Too many login attempts. Please try again after ${secs} seconds.`,
      });
    }
    
    // Any other error
    console.error('Rate limiter error:', err);
    next(err);
  }
};

// More specific limiter for failed login attempts by username
export const usernameRateLimiter = async (username: string): Promise<boolean> => {
  try {
    // Use just the username as the key
    const key = `username-${username}`;
    await rateLimiter.consume(key);
    return true;
  } catch (err) {
    return false;
  }
};

// Function to penalize failed logins more heavily
export const penalizeFailedLogin = async (username: string, ip: string): Promise<void> => {
  try {
    // Penalize both IP and username specifically
    const ipKey = `${ip}`;
    const usernameKey = `username-${username}`;
    const combinedKey = `${ip}-${username}`;
    
    // Consume multiple points to penalize failed login attempts more heavily
    await Promise.all([
      rateLimiter.consume(ipKey, 1),        // Penalize IP
      rateLimiter.consume(usernameKey, 2),  // Penalize username more
      rateLimiter.consume(combinedKey, 3)   // Penalize the combination most heavily
    ]);
  } catch (err) {
    console.error('Error penalizing failed login:', err);
  }
}; 