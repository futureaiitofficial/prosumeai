import { Request, Response } from 'express';
import { CookieOptions as ExpressSessionCookieOptions } from 'express-session';

// Define proper cookie options type based on Express's cookie options
interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  domain?: string;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none' | boolean;
  signed?: boolean;
}

/**
 * Cookie Manager - Provides centralized cookie management for the application
 */
export class CookieManager {
  private cookiePrefix: string;
  private defaultOptions: CookieOptions;

  constructor(appName = 'prosumeai', environment = process.env.NODE_ENV || 'development') {
    this.cookiePrefix = appName;
    
    // Set default options based on environment
    this.defaultOptions = {
      httpOnly: true,
      secure: environment === 'production',
      sameSite: environment === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days by default
      domain: environment === 'production' ? process.env.COOKIE_DOMAIN : undefined,
    };
  }

  /**
   * Set a cookie with the application prefix
   */
  setCookie(
    res: Response,
    name: string,
    value: string,
    options: Partial<CookieOptions> = {}
  ): void {
    const cookieName = `${this.cookiePrefix}.${name}`;
    const cookieOptions = { ...this.defaultOptions, ...options };
    
    res.cookie(cookieName, value, cookieOptions as any);
  }

  /**
   * Get a cookie value
   */
  getCookie(req: Request, name: string): string | undefined {
    const cookieName = `${this.cookiePrefix}.${name}`;
    return req.cookies?.[cookieName];
  }

  /**
   * Clear a cookie
   */
  clearCookie(res: Response, name: string, options: Partial<CookieOptions> = {}): void {
    const cookieName = `${this.cookiePrefix}.${name}`;
    const cookieOptions = { 
      ...this.defaultOptions, 
      ...options,
      // Force expire by setting maxAge to 0
      maxAge: 0,
      expires: new Date(0)
    };
    
    res.clearCookie(cookieName, cookieOptions as any);
  }

  /**
   * Set a session tracking cookie with consent info
   */
  setConsentCookie(res: Response, consentGiven: boolean): void {
    this.setCookie(
      res,
      'consent',
      JSON.stringify({ 
        given: consentGiven, 
        date: new Date().toISOString() 
      }),
      { 
        // Consent cookies should live longer
        maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
      }
    );
  }

  /**
   * Set a cookie for tracking user preferences
   */
  setUserPreferences(res: Response, preferences: Record<string, any>): void {
    this.setCookie(
      res,
      'preferences',
      JSON.stringify(preferences),
      { 
        // User preferences should be accessible by client-side JS
        httpOnly: false 
      }
    );
  }

  /**
   * Get user preferences from cookie
   */
  getUserPreferences(req: Request): Record<string, any> | null {
    const prefsString = this.getCookie(req, 'preferences');
    if (!prefsString) return null;
    
    try {
      return JSON.parse(prefsString);
    } catch (e) {
      return null;
    }
  }

  /**
   * Set a temporary token (e.g., for password reset)
   */
  setTemporaryToken(res: Response, tokenType: string, token: string): void {
    this.setCookie(
      res,
      `token.${tokenType}`,
      token,
      { 
        // Short-lived token
        maxAge: 60 * 60 * 1000 // 1 hour
      }
    );
  }

  /**
   * Clear all application cookies
   */
  clearAllCookies(req: Request, res: Response): void {
    // Get all cookies
    const cookies = req.cookies;
    if (!cookies) return;
    
    // Clear each cookie that belongs to our application
    Object.keys(cookies).forEach(name => {
      if (name.startsWith(this.cookiePrefix)) {
        // Pass the full cookie name to clearCookie
        res.clearCookie(name, { 
          ...this.defaultOptions,
          maxAge: 0,
          expires: new Date(0),
          path: '/' 
        } as any);
      }
    });
  }

  /**
   * Get the cookie prefix
   */
  getPrefix(): string {
    return this.cookiePrefix;
  }
}

// Export a singleton instance
export const cookieManager = new CookieManager();

// Export the class for testing or custom instances
export default CookieManager; 