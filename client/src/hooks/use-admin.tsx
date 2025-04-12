import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect } from "react";
import { useToast } from "./use-toast";

/**
 * Custom hook to check if the current user has admin privileges
 * This hook checks both client-side and server-side admin status
 */
export function useAdmin() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  // Log the user object to see if isAdmin flag is present
  useEffect(() => {
    if (user) {
      console.log("User object:", user);
      console.log("Is user admin from user object?", !!user.isAdmin);
    }
  }, [user]);
  
  // Query the admin status from the server
  const {
    data: isAdmin,
    isLoading: isAdminCheckLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Only run this query if the user is logged in and has the isAdmin flag
    enabled: !!user && !!user.isAdmin,
    retry: false
  });
  
  // Log the admin check result
  useEffect(() => {
    if (!isAdminCheckLoading) {
      console.log("Admin check result:", isAdmin);
    }
  }, [isAdmin, isAdminCheckLoading]);
  
  // Show error toast when admin check fails
  useEffect(() => {
    if (error) {
      console.error("Admin check error:", error);
      toast({
        title: "Admin check failed",
        description: error instanceof Error ? error.message : "Error checking admin status",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // If the user is isAdmin on the user object, but we failed the admin check API
  // this means the server-side isAdmin check failed (possibly middleware issues)
  useEffect(() => {
    if (!!user?.isAdmin && !isAdminCheckLoading && !isAdmin && !error) {
      console.warn("User has admin flag but server admin check failed");
    }
  }, [user, isAdmin, isAdminCheckLoading, error]);
  
  return {
    isAdmin: !!isAdmin,
    isLoading: isAuthLoading || isAdminCheckLoading,
    error,
    // Additional debug information
    userHasAdminFlag: !!user?.isAdmin
  };
}