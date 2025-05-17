import { Response, NextFunction, Request, CookieOptions } from 'express';
import { Express } from 'express';

/**
 * Patch Express response object to handle cookies consistently across browsers
 * This is especially important for cross-origin requests in production
 */
export function applyResponseCookiePatch(req: Request, res: Response, next: NextFunction) {
  // Store the request object on the response for later use
  (res as any)._request = req;
  
  // Store the original cookie function
  const originalCookie = res.cookie;
  
  // Override the cookie function with our patched version
  res.cookie = function(name: string, value: any, options?: CookieOptions) {
    // Get environment from NODE_ENV
    const env = process.env.NODE_ENV || 'development';
    const isProduction = env === 'production';
    
    // Clone options to avoid modifying the original object
    const patchedOptions: CookieOptions = { ...(options || {}) };
    
    // For cross-origin in production, ensure cookies work with proper settings
    if (isProduction) {
      // Respect environment-specific settings to override defaults
      const disableSecure = process.env.DISABLE_SECURE_COOKIE === 'true';
      const useSecure = !disableSecure;
      
      // Use environment variables to control cookie settings
      const sameSiteSetting = process.env.COOKIE_SAMESITE || 'lax';
      
      // Always ensure secure is set for proper cookie handling
      patchedOptions.secure = useSecure;
      
      // For SameSite=none, secure MUST be true
      if (sameSiteSetting === 'none') {
        if (!useSecure) {
          console.warn('[COOKIE WARNING] SameSite=none requires Secure=true. Setting Secure=true for cookie: ' + name);
          patchedOptions.secure = true;
        }
        patchedOptions.sameSite = 'none';
      } else if (sameSiteSetting === 'lax') {
        patchedOptions.sameSite = 'lax';
      } else if (sameSiteSetting === 'strict') {
        patchedOptions.sameSite = 'strict';
      } else {
        patchedOptions.sameSite = 'lax'; // Default to lax for any invalid values
      }
      
      // Set domain if specified
      if (process.env.COOKIE_DOMAIN) {
        patchedOptions.domain = process.env.COOKIE_DOMAIN;
      }
      
      console.log(`[COOKIE PATCH] Setting cookie ${name} with options:`, 
                  {sameSite: patchedOptions.sameSite, secure: patchedOptions.secure, domain: patchedOptions.domain});
    }
    
    // FIX for clearCookie issue: If this.req is undefined (happens during clearCookie),
    // manually provide req object from the stored _request
    if (!(this as any).req && (this as any)._request) {
      // Create a temporary backup of this.req
      const tempReq = (this as any).req;
      
      try {
        // Set this.req temporarily to the stored request
        (this as any).req = (this as any)._request;
        
        // Call the original cookie function directly
        return originalCookie.bind(this)(name, value, patchedOptions);
      } finally {
        // Restore the original req property
        (this as any).req = tempReq;
      }
    }
    
    // If req is available, just call the original function
    return originalCookie.bind(this)(name, value, patchedOptions);
  };
  
  next();
}

/**
 * Apply the patch to all routes for session cookies
 */
export function applySessionCookiePatch(app: Express): void {
  // Apply to all routes to ensure consistent cookie handling
  app.use((req: Request, res: Response, next: NextFunction) => {
    applyResponseCookiePatch(req, res, next);
  });
  
  console.log('Applied session cookie patches for cross-browser compatibility');
} 