import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./queryClient";
import { VerificationGate } from "@/components/auth/verification-gate";
import { checkAuthStatus } from "./auth-utils";
import { authLogger } from "./logger";

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
          authLogger.log("Checking session status manually");
          
          // Use silent auth check to avoid console errors
          const authStatus = await checkAuthStatus();
          
          if (authStatus.isAuthenticated && authStatus.user) {
            // Session is valid, but user data wasn't loaded properly
            authLogger.log("Session valid but user data missing, trying to restore");
            queryClient.setQueryData(["/api/user"], authStatus.user);
            setSessionValid(true);
            
            // Force refetch all relevant data
            queryClient.invalidateQueries();
          } else {
            authLogger.log("Session verification failed - user not authenticated");
            setSessionValid(false);
          }
        } catch (error) {
          authLogger.error("Error verifying session:", error);
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
          authLogger.log("User not authenticated, redirecting to /auth");
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
