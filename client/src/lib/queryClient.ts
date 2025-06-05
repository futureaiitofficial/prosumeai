import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Create a custom event system for session notifications
export const SESSION_INVALIDATED_EVENT = 'session_invalidated';

// Global flag to prevent additional API calls after session invalidation
let isSessionInvalidated = false;

// Reset the session invalidation flag (called after successful login)
import { logger, authLogger } from './logger';

export function resetSessionInvalidation() {
  isSessionInvalidated = false;
  authLogger.log('Session invalidation flag reset');
}

// Define a function to emit session invalidation events
export function emitSessionInvalidated(message: string) {
  if (typeof window !== 'undefined' && !isSessionInvalidated) {
    // Set flag to prevent additional calls
    isSessionInvalidated = true;
    
    // Clear user data immediately
    queryClient.setQueryData(["/api/user"], null);
    queryClient.clear();
    
    // Create and dispatch a custom event
    const event = new CustomEvent(SESSION_INVALIDATED_EVENT, { 
      detail: { message }
    });
    window.dispatchEvent(event);
    
    // Also set localStorage for cross-tab communication
    localStorage.setItem('session_invalidated', message);
    
    // Store the logout reason in sessionStorage for the login page to display
    sessionStorage.setItem('logout_reason', message);
    sessionStorage.setItem('logout_time', Date.now().toString());
    
    // Force immediate redirect to auth page to prevent additional API calls
    window.location.href = '/auth';
  }
}

// Define API base URL - usually empty for same-domain APIs
const API_BASE_URL = '';

// Global feature access modal has been removed

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    
    try {
      // Try to parse as JSON
      const data = JSON.parse(text);
      
      // Handle general errors
      if (data.message) {
        throw new Error(data.message);
      }
    } catch (e) {
      // If JSON parsing fails, just throw a general error
    }
    
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

/**
 * Enhanced API request function with better error handling and logging
 */
export async function apiRequest(
  method: string, 
  endpoint: string, 
  data?: any, 
  options?: { 
    responseType?: 'json' | 'blob' | 'text',
    isFormData?: boolean,
    signal?: AbortSignal
  }
): Promise<Response> {
  // If session is already invalidated, don't make additional requests
  if (isSessionInvalidated) {
    throw new Error('Session invalidated, request aborted');
  }
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };
  
  // Add AbortSignal if provided
  if (options?.signal) {
    fetchOptions.signal = options.signal;
  }
  
  if (data) {
    // Handle FormData differently
    if (options?.isFormData) {
      // For FormData, don't set Content-Type as the browser will set it with the boundary
      delete headers['Content-Type'];
      fetchOptions.body = data;
    } else {
      fetchOptions.body = JSON.stringify(data);
    }
  }
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // Log failed requests for debugging
    if (!response.ok) {
      console.error(`API request failed: ${method} ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        url: url
      });
      
      try {
        // Try to get error data as JSON
        const errorData = await response.clone().json().catch(() => ({}));
        console.error('Error response data:', errorData);
        
        // Special handling for single session enforcement
        if (response.status === 401 && errorData.message?.includes('logged in elsewhere')) {
          // Emit session invalidated event - this handles all the cleanup and redirect
          emitSessionInvalidated(errorData.message || "Your account has been logged in elsewhere. Please log in again.");
          
          // Throw an error that makes it clear what happened
          const error: any = new Error(errorData.message || 'Session invalidated due to login elsewhere');
          error.statusCode = response.status;
          error.sessionInvalidated = true;
          throw error;
        }
        
        // Create detailed error object with validation details
        const errorMessage = errorData.message || errorData.details || 'An error occurred';
        const error: any = new Error(errorMessage);
        error.statusCode = response.status;
        error.data = errorData; // Include full error data for validation details
        throw error;
      } catch (jsonError) {
        // Only log JSON parsing errors if they're actual parsing errors
        if (jsonError instanceof SyntaxError) {
          console.error('Could not parse error response as JSON:', jsonError);
        } else {
          // Re-throw our custom errors
          throw jsonError;
        }
        
        // If JSON parsing fails, throw a standard error with status code
        const error: any = new Error(`Request failed with status ${response.status}`);
        error.statusCode = response.status;
        throw error;
      }
    }
    
    return response;
  } catch (error) {
    console.error(`API request exception: ${method} ${endpoint}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // If session is already invalidated, don't make additional requests
    if (isSessionInvalidated) {
      authLogger.log('Prevented additional request after session invalidation:', queryKey[0]);
      return null;
    }

    logger.debug('Making API request to:', queryKey[0]);

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      mode: "cors",
      cache: "no-store"
    });

    // Check for 401 responses
    if (res.status === 401) {
      // For /api/user endpoint, 401 is expected when not logged in
      if ((queryKey[0] as string).includes('/api/user') && unauthorizedBehavior === "returnNull") {
        authLogger.log('User not authenticated (expected for public pages)');
        return null;
      }
      
      // Try to check if this is a session invalidation due to another login
      try {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.message?.includes('logged in elsewhere')) {
          // Emit session invalidated event - this handles all the cleanup and redirect
          emitSessionInvalidated(errorData.message || "Your account has been logged in elsewhere. Please log in again.");
          return null;
        }
      } catch (e) {
        // If we couldn't parse the response, proceed with normal 401 handling
        console.error("Error parsing 401 response:", e);
      }
      
      // Normal 401 handling
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
