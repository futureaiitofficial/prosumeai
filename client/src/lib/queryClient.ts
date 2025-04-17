import { QueryClient, QueryFunction } from "@tanstack/react-query";

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

export async function apiRequest(method: string, endpoint: string, data?: any): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.message || 'An error occurred');
    error.statusCode = response.status;
    error.data = errorData;
    throw error;
  }
  
  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
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
