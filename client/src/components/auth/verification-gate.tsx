import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

interface VerificationGateProps {
  children: React.ReactNode;
}

export function VerificationGate({ children }: VerificationGateProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Only redirect if user is loaded and not verified
    if (!isLoading && user && user.emailVerified === false) {
      navigate('/verify-email');
    }
  }, [user, isLoading, navigate]);

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is verified or verification is not required, show children
  if (!user || user.emailVerified !== false) {
    return <>{children}</>;
  }

  // This should not be rendered as the useEffect will redirect
  return null;
} 