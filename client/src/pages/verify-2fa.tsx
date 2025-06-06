import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import TwoFactorVerification from '@/components/auth/TwoFactorVerification';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/components/branding/branding-provider';
import { getOrCreateDeviceId } from '@/utils/device-utils';

export default function VerifyTwoFactorPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const branding = useBranding();
  const [userId, setUserId] = useState<number | null>(null);
  const [preferredMethod, setPreferredMethod] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // If user is already fully authenticated, redirect to dashboard
    if (!isLoading && user && !isInitializing) {
      // Make sure we don't have pending verification (checking local storage)
      const pendingUserId = localStorage.getItem('pendingTwoFactorUserId');
      if (!pendingUserId) {
        setLocation('/dashboard');
      }
    }
  }, [user, isLoading, isInitializing, setLocation]);

  useEffect(() => {
    // Get pending two-factor authentication details from local storage
    const storedUserId = localStorage.getItem('pendingTwoFactorUserId');
    const storedMethod = localStorage.getItem('pendingTwoFactorMethod');
    
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
      setPreferredMethod(storedMethod);
    } else {
      // No pending 2FA, redirect to login
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      setLocation('/auth');
    }
    setIsInitializing(false);
  }, [setLocation, toast]);

  const handleVerificationSuccess = () => {
    // Clear the pending verification data
    localStorage.removeItem('pendingTwoFactorUserId');
    localStorage.removeItem('pendingTwoFactorMethod');
    
    // Ensure device ID is properly stored for future recognition
    const deviceId = getOrCreateDeviceId();
    console.log('[2FA DEBUG] Device ID on verification success:', deviceId);
    
    // Show success message
    toast({
      title: "Verification successful",
      description: "You have been successfully authenticated.",
    });
    
    // Redirect to dashboard
    setLocation('/dashboard');
  };

  const handleCancel = () => {
    // Clear the pending verification data
    localStorage.removeItem('pendingTwoFactorUserId');
    localStorage.removeItem('pendingTwoFactorMethod');
    
    // Show cancel message
    toast({
      title: "Authentication cancelled",
      description: "You have cancelled the two-factor authentication.",
    });
    
    // Redirect to login page
    setLocation('/auth');
  };

  if (isLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-slate-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Your session has expired or was not found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/auth')} 
              className="w-full"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="flex flex-col md:flex-row w-full">
        {/* Info column - shown on medium screens and up */}
        <div className="hidden md:flex md:w-1/2 bg-primary items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary-pattern opacity-10"></div>
          
          <div className="relative z-10 p-8 md:p-12 lg:p-16 max-w-lg">
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Two-Factor Authentication
            </h1>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Protect your {branding.appName} account with an additional layer of security.
            </p>
            
            <div className="flex flex-col space-y-8 items-center">
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="w-16 h-16 text-white" />
              </div>
              
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-white text-xl font-medium mb-3">Why we use 2FA</h3>
                <ul className="space-y-2 text-primary-foreground/80">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Protects your account even if your password is compromised</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Adds an extra layer of verification when logging in</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Secures your personal and career information</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Verification column */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-6 md:hidden">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-10 w-10 text-primary" />
              </div>
            </div>
            
            <div className="text-center mb-8 md:hidden">
              <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
              <p className="text-slate-600 mt-2">
                Enter your verification code to continue
              </p>
            </div>
            
            <TwoFactorVerification
              userId={userId}
              preferredMethod={preferredMethod}
              onSuccess={handleVerificationSuccess}
              onCancel={handleCancel}
            />
            
            <div className="mt-8 text-center text-sm text-slate-500">
              <p>Having trouble? <a className="text-primary hover:underline" href="mailto:support@atscribe.com">Contact Support</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 