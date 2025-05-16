import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Create a custom event system for session notifications
export const SESSION_INVALIDATED_EVENT = 'session_invalidated';

// Global flag to prevent additional API calls after session invalidation
let isSessionInvalidated = false;

// Reset the session invalidation flag (called after successful login)
export function resetSessionInvalidation() {
  isSessionInvalidated = false;
  console.log('Session invalidation flag reset');
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

export async function apiRequest(
  method: string, 
  endpoint: string, 
  data?: any, 
  options?: { responseType?: 'json' | 'blob' | 'text' }
): Promise<Response> {
  // If session is already invalidated, don't make additional requests
  if (isSessionInvalidated) {
    throw new Error('Session invalidated, request aborted');
  }
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };
  
  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    try {
      // Try to get error data as JSON
      const errorData = await response.json().catch(() => ({}));
      
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
      
      const error: any = new Error(errorData.message || 'An error occurred');
      error.statusCode = response.status;
      error.data = errorData;
      throw error;
    } catch (jsonError) {
      // If JSON parsing fails, throw a standard error with status code
      const error: any = new Error(`Request failed with status ${response.status}`);
      error.statusCode = response.status;
      throw error;
    }
  }
  
  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // If session is already invalidated, don't make additional requests
    if (isSessionInvalidated) {
      console.log('Prevented additional request after session invalidation:', queryKey[0]);
      return null;
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    // Check for 401 responses
    if (res.status === 401) {
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
