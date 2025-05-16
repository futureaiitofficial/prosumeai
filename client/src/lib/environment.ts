/**
 * Client-side safe environment variables
 * 
 * This file provides a safe way to access environment variables on the client
 * without using process.env, which is not available in the browser.
 * 
 * Add any client-side accessible environment variables here.
 */

export const environment = {
  // App info
  appName: 'ATScribe',
  appVersion: '1.0.0',
  isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  // In development mode, use the proxy configured in Vite, 
  // which means API requests can be relative paths when using the Vite dev server,
  // or direct to port 4000 when accessing the API directly
  apiBaseUrl: import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? '' : ''),
};

// Safely determine environment for client-side code
export const getEnvironment = () => {
  return {
    NODE_ENV: environment.isDevelopment ? 'development' : 'production'
  };
}; 