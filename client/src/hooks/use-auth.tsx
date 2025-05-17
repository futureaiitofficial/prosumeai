import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import {
  getQueryFn,
  apiRequest,
  queryClient,
  SESSION_INVALIDATED_EVENT,
  resetSessionInvalidation
} from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<SelectUser, "password">, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<SelectUser, "password">, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Add a global listener for session invalidation events
  useEffect(() => {
    // Handler for custom session invalidation events
    const handleSessionInvalidated = (event: CustomEvent<{ message: string }>) => {
      console.log('[AUTH DEBUG] Detected session invalidation event', event.detail);
      
      // Clear user data
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
      
      // Show toast notification
      toast({
        title: "Session Expired",
        description: event.detail.message || "Your account has been logged in elsewhere. Only one active session is allowed.",
        variant: "destructive"
      });
      
      // Redirect to login page
      setLocation("/auth");
    };
    
    // Handler for localStorage events (cross-tab communication)
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'session_invalidated' && event.newValue) {
        console.log('[AUTH DEBUG] Detected session invalidation from another tab');
        
        // Clear session invalidation flag
        localStorage.removeItem('session_invalidated');
        
        // Clear user data
        queryClient.setQueryData(["/api/user"], null);
        queryClient.invalidateQueries();
        
        // Show toast notification
        toast({
          title: "Session Expired",
          description: event.newValue || "Your account has been logged in elsewhere. Only one active session is allowed.",
          variant: "destructive"
        });
        
        // Redirect to login page
        setLocation("/auth");
      }
    };
    
    // Add event listeners
    window.addEventListener(SESSION_INVALIDATED_EVENT, handleSessionInvalidated as EventListener);
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      // Cleanup
      window.removeEventListener(SESSION_INVALIDATED_EVENT, handleSessionInvalidated as EventListener);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [toast, setLocation]);
  
  // Add session ping to keep session alive
  useEffect(() => {
    // Create a ping function that makes a lightweight request to the server
    const pingSession = async () => {
      try {
        // Use a simple API endpoint that doesn't return much data
        await fetch('/api/health', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        console.log('[AUTH DEBUG] Session ping successful');
      } catch (error) {
        console.error('[AUTH DEBUG] Session ping failed:', error);
      }
    };
    
    // Set up a timer to ping every 5 minutes (300000ms)
    const pingInterval = setInterval(pingSession, 300000);
    
    // Ping immediately on mount
    pingSession();
    
    // Clean up interval on unmount
    return () => clearInterval(pingInterval);
  }, []);

  const {
    data: rawUser,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true, // Refetch on window focus to maintain session
    refetchInterval: 1000 * 60 * 10, // Refresh every 10 minutes to keep session alive
  });

  // Preserve user data as is, including passwordExpired flag
  const user = rawUser;
  console.log("[AUTH DEBUG] User data from API:", user);
  if (user) {
    console.log("[AUTH DEBUG] passwordExpired flag:", (user as any).passwordExpired);
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("[AUTH DEBUG] Login attempt for:", credentials.username);
      try {
        // Reset session invalidation flag before attempting login
        resetSessionInvalidation();
        
        // Explicitly stringify the body to ensure it's sent correctly
        const requestBody = JSON.stringify(credentials);
        console.log("[AUTH DEBUG] Request body:", requestBody);
        
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          body: requestBody,
          credentials: 'include', // Important for cookies
          cache: 'no-store', // Prevent caching
          mode: 'cors', // Ensure CORS mode is set
        });
        
        console.log("[AUTH DEBUG] Login response status:", res.status);
        console.log("[AUTH DEBUG] Login response headers:", 
          Array.from(res.headers.entries())
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        );
        
        // Log document cookie
        console.log("[AUTH DEBUG] Document cookies:", document.cookie);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("[AUTH DEBUG] Login error response:", errorText);
          throw new Error(errorText || "Login failed");
        }
        
        const userData = await res.json();
        console.log("[AUTH DEBUG] Login response data:", userData);
        return userData;
      } catch (error) {
        console.error("[AUTH DEBUG] Login fetch error:", error);
        throw error;
      }
    },
    onSuccess: (userData) => {
      console.log("[AUTH DEBUG] Login success, user data:", userData);
      console.log("[AUTH DEBUG] passwordExpired flag in response:", (userData as any).passwordExpired);
      
      queryClient.setQueryData(["/api/user"], userData);
      
      // Check if password is expired
      if ((userData as any).passwordExpired === true) {
        console.log("[AUTH DEBUG] Password expired, redirecting to change password");
        toast({
          title: "Password expired",
          description: "Your password has expired. Please reset it now.",
        });
        setLocation("/change-password");
        return;
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
      
      // Redirect to appropriate page based on user role
      if (userData.isAdmin) {
        console.log("[AUTH DEBUG] Admin user, redirecting to admin dashboard");
        setLocation("/admin/dashboard");
      } else {
        console.log("[AUTH DEBUG] Regular user, redirecting to dashboard");
        setLocation("/dashboard");
      }

      // Reset session invalidation flag
      resetSessionInvalidation();
    },
    onError: (error: Error) => {
      console.error("[AUTH DEBUG] Login error:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Registration successful",
        description: `Welcome to ATScribe, ${userData.username}!`,
      });
      // Redirect based on user role
      if (userData.isAdmin) {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/logout");
      } catch (error) {
        console.error("Logout error:", error);
        // Even if server-side logout fails, clear client-side state
      }
      // Clear user data regardless of server response to ensure client-side logout
      return;
    },
    onSuccess: () => {
      // Clear user data from query client cache
      queryClient.setQueryData(["/api/user"], null);
      // Invalidate all queries to force refresh on next data fetch
      queryClient.invalidateQueries();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      console.error("Logout client error:", error);
      // Even on error, we should clear user data and redirect
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
      
      toast({
        title: "Logout status",
        description: "You have been logged out, but there may have been an issue with the server.",
      });
      setLocation("/");
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
