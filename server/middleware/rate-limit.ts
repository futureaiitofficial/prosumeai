import { Request, Response, NextFunction } from "express";
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { pool } from '../config/db';

// Options for memory-based rate limiting
const authRateLimiterMemoryOptions = {
  points: parseInt(process.env.AUTH_RATE_LIMIT_ATTEMPTS || '5'), // Default: 5 attempts
  duration: parseInt(process.env.AUTH_RATE_LIMIT_DURATION || '900'), // Default: 15 minutes (in seconds)
};

// Create a memory-based rate limiter
const rateLimiter = new RateLimiterMemory(authRateLimiterMemoryOptions);

// Log configuration on startup
console.log(`Memory-based rate limiter configured with ${authRateLimiterMemoryOptions.points} points per ${authRateLimiterMemoryOptions.duration} seconds`);

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