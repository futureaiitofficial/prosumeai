/**
 * Authentication utilities to handle common auth scenarios
 */

import { authLogger } from './logger';

/**
 * Silently fetch user data without logging 401 errors to console
 * This is used for checking authentication status where 401 is expected
 */
export async function silentFetchUser(): Promise<Response> {
  // Temporarily override console.error to suppress 401 logs
  const originalError = console.error;
  let response: Response;
  
  try {
    // Suppress console errors during this fetch
    console.error = (...args: any[]) => {
      // Only suppress network-related errors that mention 401 or /api/user
      const message = args.join(' ');
      if (message.includes('401') && message.includes('/api/user')) {
        return; // Suppress this error
      }
      originalError.apply(console, args);
    };
    
    response = await fetch('/api/user', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      mode: 'cors',
      cache: 'no-store'
    });
  } finally {
    // Always restore the original console.error
    console.error = originalError;
  }
  
  return response;
}

/**
 * Check if user is authenticated without throwing errors or logging 401s
 */
export async function checkAuthStatus(): Promise<{ isAuthenticated: boolean; user?: any }> {
  try {
    const response = await silentFetchUser();
    
    if (response.ok) {
      const user = await response.json();
      return { isAuthenticated: true, user };
    } else if (response.status === 401) {
      // 401 is expected for non-authenticated users
      return { isAuthenticated: false };
    } else {
      authLogger.warn('Unexpected response status during auth check:', response.status);
      return { isAuthenticated: false };
    }
  } catch (error) {
    // Network errors or other issues
    authLogger.log('Auth check failed (network error):', error);
    return { isAuthenticated: false };
  }
} 