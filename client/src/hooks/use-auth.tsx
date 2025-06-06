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
import { authLogger } from "@/lib/logger";
import { getOrCreateDeviceId } from "@/utils/device-utils";

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
      authLogger.log('Detected session invalidation event', event.detail);
      
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
        authLogger.log('Detected session invalidation from another tab');
        
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
        authLogger.log('Session ping successful');
      } catch (error) {
        authLogger.error('Session ping failed:', error);
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
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    refetchOnMount: true,
    refetchOnReconnect: false, // Reduce unnecessary refetches
    refetchOnWindowFocus: false, // Only refetch when explicitly needed
    refetchInterval: false, // Disable automatic refetching to prevent 401 spam
    retry: (failureCount, error: any) => {
      // Don't retry 401 errors as they're expected for non-authenticated users
      if (error?.statusCode === 401 || error?.status === 401) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });

  // Preserve user data as is, including passwordExpired flag
  const user = rawUser;
  authLogger.log("User data from API:", user);
  if (user) {
    authLogger.log("passwordExpired flag:", (user as any).passwordExpired);
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      authLogger.log("Login attempt for:", credentials.username);
      try {
        // Reset session invalidation flag before attempting login
        resetSessionInvalidation();
        
        // Get device ID for device recognition
        const deviceId = getOrCreateDeviceId();
        
        // Include device ID in login request
        const requestBody = JSON.stringify({
          ...credentials,
          deviceId
        });
        
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
        
        if (!res.ok) {
          let errorMessage = "Login failed";
          try {
            // Get response text first, then try to parse as JSON
            const responseText = await res.text();
            
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorData.error || "Login failed";
            } catch (jsonError) {
              // If JSON parsing fails, use the raw text
              errorMessage = responseText || "Login failed";
            }
          } catch (textError) {
            console.error("[AUTH DEBUG] Could not read error response:", textError);
          }
          throw new Error(errorMessage);
        }
        
        const userData = await res.json();
        return userData;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/user"], userData);
      
      // Check if password is expired
      if ((userData as any).passwordExpired === true) {
        toast({
          title: "Password expired",
          description: "Your password has expired. Please reset it now.",
        });
        setLocation("/change-password");
        return;
      }
      
      // Check if 2FA verification is required
      if ((userData as any).requiresTwoFactor === true) {
        // Store user ID to maintain context across verification
        localStorage.setItem('pendingTwoFactorUserId', userData.id.toString());
        localStorage.setItem('pendingTwoFactorMethod', (userData as any).twoFactorMethod || 'EMAIL');
        
        toast({
          title: "Verification required",
          description: "Please complete two-factor authentication to continue.",
        });
        
        setLocation("/verify-2fa");
        return;
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
      
      // Redirect to appropriate page based on user role
      if (userData.isAdmin) {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/dashboard");
      }

      // Reset session invalidation flag
      resetSessionInvalidation();
    },
    onError: (error: Error) => {
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
        description: "Please check your email to verify your account.",
      });
      // Redirect to email verification page
      setLocation("/verify-email");
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
