/**
 * Production-safe logger utility
 * Only logs in development mode, suppresses logs in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// For auth-specific debugging that should be completely silent in production
export const authLogger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[AUTH]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[AUTH]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    // Only log auth errors in development
    if (isDevelopment) {
      console.error('[AUTH]', ...args);
    }
  }
}; 