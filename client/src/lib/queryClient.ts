import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Define API base URL - usually empty for same-domain APIs
const API_BASE_URL = '';

// Global state to manage feature access modal
// This avoids circular dependencies with importing React components directly
export const featureAccessModal = {
  isOpen: false,
  feature: "",
  showModal: (feature: string) => {
    featureAccessModal.isOpen = true;
    featureAccessModal.feature = feature;
    // Trigger custom event that components can listen for
    window.dispatchEvent(new CustomEvent('featureAccessDenied', { 
      detail: { feature } 
    }));
  },
  closeModal: () => {
    featureAccessModal.isOpen = false;
    featureAccessModal.feature = "";
  }
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();

    // Check if this is a feature access error (usually 403 with specific message)
    if (res.status === 403 && 
        (text.includes("Access denied") || 
         text.includes("feature") || 
         text.includes("upgrade") || 
         text.includes("subscription"))) {
      try {
        // Try to parse the error as JSON
        const errorData = JSON.parse(text);
        
        // Extract feature name from the error message
        let feature = "this_feature";
        
        // Try multiple patterns to extract the feature key
        const patterns = [
          /feature ['"]([^'"]+)['"]/i,          // feature 'name' or feature "name"
          /access to ['"]([^'"]+)['"]/i,        // access to 'name' or access to "name"
          /feature ([a-z_]+) requires/i,        // feature name_with_underscores requires
          /feature: ['"]?([a-z_]+)['"]?/i       // feature: 'name' or feature: "name" or feature: name
        ];
        
        for (const pattern of patterns) {
          const match = errorData.message.match(pattern);
          if (match && match[1]) {
            feature = match[1];
            break;
          }
        }
        
        // Show the feature access modal
        featureAccessModal.showModal(feature);
      } catch (e) {
        // If JSON parsing fails, still try to handle the error
        let feature = "this_feature";
        
        // Try to find a feature key in the plain text
        const patterns = [
          /feature ['"]([^'"]+)['"]/i,
          /access to ['"]([^'"]+)['"]/i,
          /feature ([a-z_]+) requires/i,
          /feature: ['"]?([a-z_]+)['"]?/i
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            feature = match[1];
            break;
          }
        }
        
        featureAccessModal.showModal(feature);
      }
      
      // Throw a more user-friendly error
      throw new Error("This feature requires a subscription upgrade");
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
