import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { motion } from "framer-motion";
import AuthHero from "@/components/auth/auth-hero";

export default function ForgotPasswordPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
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
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
} 