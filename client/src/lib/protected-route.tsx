import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./queryClient";
import { VerificationGate } from "@/components/auth/verification-gate";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  // Force refresh authentication status when route changes
  useEffect(() => {
    // Refetch user data when accessing protected routes
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    
    // Directly verify session if user is null but not loading
    if (!isLoading && !user) {
      const verifySession = async () => {
        setVerifyingSession(true);
        try {
          console.log("Checking session status manually");
          
          // Make sure to include proper headers for cross-origin requests
          const response = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include', // Critical for cookies
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            mode: 'cors',
            cache: 'no-store'
          });
          
          console.log("Session check response status:", response.status);
          console.log("Session check response headers:", 
            Array.from(response.headers.entries())
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
          );
          
          // Log document cookie - helpful for debugging
          console.log("Document cookies:", document.cookie);
          
          if (response.ok) {
            // Session is valid, but user data wasn't loaded properly
            console.log("Session valid but user data missing, trying to restore");
            try {
              const userData = await response.json();
              console.log("Retrieved user data:", userData);
              queryClient.setQueryData(["/api/user"], userData);
              setSessionValid(true);
              
              // Force refetch all relevant data
              queryClient.invalidateQueries();
            } catch (parseError) {
              console.error("Error parsing user data:", parseError);
              setSessionValid(false);
            }
          } else {
            console.log("Session verification failed, status:", response.status);
            // Try a login refresh if needed
            setSessionValid(false);
          }
        } catch (error) {
          console.error("Error verifying session:", error);
          setSessionValid(false);
        } finally {
          setVerifyingSession(false);
        }
      };
      
      verifySession();
    } else if (user) {
      setSessionValid(true);
    }
  }, [location, user, isLoading]);

  return (
    <Route path={path}>
      {() => {
        if (isLoading || verifyingSession) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user && sessionValid === false) {
          console.log("User not authenticated, redirecting to /auth");
          return <Redirect to="/auth" />;
        }

        // Allow authenticated users or those with valid sessions to access protected routes
        if (user || sessionValid === true) {
          return (
            <VerificationGate>
              <Component />
            </VerificationGate>
          );
        }
        
        // Fallback loading state while waiting for session check
        return (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
      }}
    </Route>
  );
}
