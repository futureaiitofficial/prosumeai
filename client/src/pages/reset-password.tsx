import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { motion } from "framer-motion";
import AuthHero from "@/components/auth/auth-hero";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";

function useSearch() {
  const [location] = useLocation();
  return location.split("?")[1] || "";
}

export default function ResetPasswordPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  console.log("Search query:", search); // Debug: full search string
  const params = new URLSearchParams(search);
  const token = params.get("token");
  const userId = params.get("userId");
  console.log("Token:", token); // Debug: token value
  console.log("UserId:", userId); // Debug: userId value
  
  // Redirect to dashboard if already logged in - but not if password expired
  useEffect(() => {
    if (!isLoading && user && !(user as any).passwordExpired) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);
  
  // Don't render anything until we check auth status
  if (isLoading) {
    return null;
  }
  
  // If user is logged in with expired password, redirect to change password page
  if (user && (user as any).passwordExpired) {
    setLocation("/change-password");
    return null;
  }
  
  // Only redirect if user is authenticated and password is not expired
  if (user && !(user as any).passwordExpired) {
    return null;
  }
  
  // Check if token and userId are provided
  const validResetRequest = token && userId;
  console.log("Valid reset request:", validResetRequest); // Debug: validation result
  
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
            {validResetRequest ? (
              <ResetPasswordForm token={token!} userId={userId!} />
            ) : (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-slate-900 text-center">Invalid Reset Link</h1>
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-medium">Invalid Request</AlertTitle>
                  <AlertDescription className="text-xs">
                    This password reset link is invalid or has expired. Please request a new password reset link.
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