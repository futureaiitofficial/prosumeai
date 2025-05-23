import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { motion } from "framer-motion";
import AuthHero from "@/components/auth/auth-hero";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";

function useSearch() {
  // Get full URL from window.location instead of wouter's location
  // This ensures we get the complete URL with query parameters
  return window.location.search.substring(1);
}

export default function ResetPasswordPage() {
  // These hooks MUST be called in every render path
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  
  // Parse URL parameters
  const [tokenParams, setTokenParams] = useState({ 
    token: null as string | null, 
    userId: null as string | null,
    validRequest: false 
  });
  
  // Parse URL params - do this in useEffect to avoid hook ordering issues
  useEffect(() => {
    console.log("Full URL:", window.location.href);
    console.log("Search query:", search);
    console.log("Raw search part:", window.location.search);
    
    const params = new URLSearchParams(search);
    const token = params.get("token");
    const userId = params.get("userId");
    
         // Check if there's a # fragment in the URL that might be affecting parameter parsing
     if (window.location.hash && !token) {
       console.log("Hash fragment detected, trying to extract params from it");
       // Try to extract parameters from hash fragment if present
       const hashParams = window.location.hash.substring(1).split('&').reduce((acc, item) => {
         const [key, value] = item.split('=');
         if (key && value) acc[key] = value;
         return acc;
       }, {} as Record<string, string>);
       
       console.log("Params from hash:", hashParams);
     }
     
     // If we still don't have parameters, try a more direct approach
     let finalToken = token;
     let finalUserId = userId;
     
     if (!finalToken || !finalUserId) {
       // Last resort: try to extract directly from URL
       const url = window.location.href;
       console.log("Trying direct URL parsing as last resort");
       
       const tokenMatch = url.match(/[?&]token=([^&#]*)/);
       const userIdMatch = url.match(/[?&]userId=([^&#]*)/);
       
       if (tokenMatch && tokenMatch[1]) finalToken = decodeURIComponent(tokenMatch[1]);
       if (userIdMatch && userIdMatch[1]) finalUserId = decodeURIComponent(userIdMatch[1]);
       
       console.log("Direct URL parsing results - Token:", finalToken, "UserId:", finalUserId);
     }
     
          console.log("Final Token:", finalToken);
     console.log("Final UserId:", finalUserId);
     
     // Validate request
     const validRequest = !!finalToken && !!finalUserId;
     console.log("Valid reset request:", validRequest);
     
     setTokenParams({ token: finalToken, userId: finalUserId, validRequest });
    
         // Debug token validation if we have valid params
     if (finalToken && finalUserId) {
       console.log(`Reset attempt with token: ${finalToken.substring(0, 10)}... and userId: ${finalUserId}`);
       
       // Call debug endpoint to verify the token
       fetch(`/api/debug/verify-token?token=${encodeURIComponent(finalToken)}&userId=${encodeURIComponent(finalUserId)}`)
         .then(response => response.json())
         .then(data => {
           console.log('Token validation debug info:', data);
         })
         .catch(error => {
           console.error('Error validating token:', error);
         });
     }
  }, [search]);
  
  // Handle auth redirects - keep this separate from the token validation
  useEffect(() => {
    // Redirect to dashboard if already logged in - but not if password expired
    if (!isLoading && user && !(user as any).passwordExpired) {
      setLocation("/dashboard");
    }
    
    // If user is logged in with expired password, redirect to change password page
    if (user && (user as any).passwordExpired) {
      setLocation("/change-password");
    }
  }, [user, isLoading, setLocation]);

  // Wait for loading
  if (isLoading) {
    return null;
  }
  
  // Skip rendering if authenticated with unexpired password
  if (user && !(user as any).passwordExpired) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row">
        {/* Left Side - Hero Image/Animation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full md:w-1/2 py-8 px-4 hidden md:flex items-center justify-center"
        >
          <AuthHero />
        </motion.div>
        
        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 py-8 px-4 md:px-8 flex items-center">
          <div className="w-full max-w-md mx-auto bg-white p-6 md:p-8 rounded-lg shadow-sm border border-slate-100">
            {tokenParams.validRequest && tokenParams.token && tokenParams.userId ? (
              <ResetPasswordForm token={tokenParams.token} userId={tokenParams.userId} />
            ) : (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-slate-900 text-center">Invalid Reset Link</h1>
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-medium">Invalid Request</AlertTitle>
                  <AlertDescription className="text-xs">
                    This password reset link is invalid or has expired. This can happen if:
                    <ul className="list-disc pl-4 mt-2">
                      <li>You've already reset your password</li>
                      <li>You've requested multiple reset emails (only the latest is valid)</li>
                      <li>The link has expired (valid for 24 hours)</li>
                    </ul>
                    Please request a new password reset link.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center mt-4">
                  <Link href="/forgot-password">
                    <a className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors text-sm">
                      Request New Reset Link
                    </a>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 