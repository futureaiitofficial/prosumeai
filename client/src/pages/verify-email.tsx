import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Head from 'next/head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';
import { useAuth } from '@/hooks/use-auth';
import axios from 'axios';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const branding = useBranding();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email...');
  const [isResending, setIsResending] = useState(false);
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token and userId from URL parameters
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userId = params.get('userId');
        
        // If we have a token and userId, we can verify the email even if not logged in
        if (token && userId) {
          try {
            const response = await axios.post('/api/verify-email', { token, userId });
            
            if (response.status === 200) {
              setStatus('success');
              // Handle different success messages
              const successMessage = response.data?.message || 'Your email has been successfully verified! You can now use all features of your account.';
              setMessage(successMessage);
              
              // Show success toast
              toast({
                title: "Email Verified",
                description: response.data?.message === "Email is already verified" 
                  ? "Your email is already verified." 
                  : "Your email address has been successfully verified.",
                variant: "default",
              });
              return;
            }
          } catch (error: any) {
            console.error('Error verifying email:', error);
            
            // Special handling for already verified case
            if (error.response?.data?.message === "Email is already verified") {
              setStatus('success');
              setMessage('Your email is already verified! You can now use all features of your account.');
              toast({
                title: "Email Already Verified",
                description: "Your email address is already verified.",
                variant: "default",
              });
              return;
            }
            
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to verify your email. The link may have expired or is invalid.');
            
            // Show error toast
            toast({
              title: "Verification Failed",
              description: error.response?.data?.message || "Failed to verify your email. Please try again.",
              variant: "destructive",
            });
            return;
          }
        }
        
        // Wait for user data to load
        if (isLoading) {
          return;
        }
        
        // If user is not authenticated and no token/userId in URL, redirect to home page
        if (!user && (!token || !userId)) {
          navigate('/');
          return;
        }
        
        // If user is already verified, show success state
        if (user && user.emailVerified === true) {
          setStatus('success');
          setMessage('Your email has been successfully verified! You can now use all features of your account.');
          return;
        }
        
        // If user is logged in but not verified and no token/userId in URL
        if (user && user.emailVerified === false && (!token || !userId)) {
          setStatus('pending');
          setMessage('Please check your email for a verification link. Click the link to verify your email address.');
          return;
        }
      } catch (error: any) {
        console.error('Error in verify email process:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again later.');
        
        // Show error toast
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      }
    };
    
    verifyEmail();
  }, [toast, user, navigate, isLoading]);
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleRequestNewLink = async () => {
    try {
      setIsResending(true);
      const response = await axios.post('/api/request-email-verification');
      
      if (response.status === 200) {
        toast({
          title: "New Verification Email Sent",
          description: "Please check your email for the new verification link.",
          variant: "default",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error.response?.data?.message || "Failed to send a new verification email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Verify Email | {branding.appName}</title>
        <meta name="description" content={`Verify your email address for ${branding.appName}`} />
      </Head>
      
      {/* Header with fixed position */}
      <SharedHeader isLandingPage={false} forceBackground={true} />
      
      {/* Empty space to prevent overlap with fixed header */}
      <div className="pt-16 md:pt-20"></div>
      
      {/* Brand Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-900 py-4 text-center">
        <h1 className="text-white text-2xl md:text-3xl font-bold">{branding.appName}</h1>
        <p className="text-indigo-200 text-sm md:text-base mt-1">{branding.appTagline}</p>
      </div>
      
      <div className="bg-white flex-grow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="shadow-lg border border-indigo-100">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
              <CardTitle className="text-2xl text-indigo-900">Email Verification</CardTitle>
              <CardDescription className="text-indigo-700">
                Verify your email address to access all features
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-8 text-center">
              {status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mb-4" />
                  <p className="text-lg text-indigo-900 font-medium">{message}</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a moment...</p>
                </div>
              )}
              
              {status === 'pending' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Mail className="h-16 w-16 text-indigo-600 mb-4" />
                  <p className="text-lg text-indigo-900 font-medium">Verification Email Sent</p>
                  <p className="text-gray-600 mt-2 max-w-md mx-auto">
                    We've sent a verification email to <span className="font-medium text-indigo-700">{user?.email}</span>.
                    Please check your inbox and click the verification link to complete the process.
                  </p>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 max-w-md mx-auto">
                    <p className="text-sm text-blue-800">
                      <AlertTriangle className="inline-block h-4 w-4 mr-1 mb-1" />
                      Don't see the email? Check your spam folder or request a new verification link.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleRequestNewLink}
                      disabled={isResending}
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Resend Verification Email'
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {status === 'success' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
                  <p className="text-lg text-green-700 font-medium">Email Verified!</p>
                  <p className="text-gray-600 mt-2 max-w-md mx-auto">{message}</p>
                  {user ? (
                    <Button 
                      className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleGoToDashboard}
                    >
                      Go to Dashboard
                    </Button>
                  ) : (
                    <Button 
                      className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => navigate('/auth')}
                    >
                      Log In
                    </Button>
                  )}
                </div>
              )}
              
              {status === 'error' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <XCircle className="h-16 w-16 text-red-600 mb-4" />
                  <p className="text-lg text-red-700 font-medium">Verification Failed</p>
                  <p className="text-gray-600 mt-2 max-w-md mx-auto">{message}</p>
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleRequestNewLink}
                      disabled={isResending}
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Request New Verification Link'
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => navigate('/auth')}
                    >
                      Go to Login
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-10 text-center text-sm text-gray-500">
            <p>Need help? <a href="/contact" className="text-indigo-600 hover:text-indigo-800">Contact our support team</a>.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <SharedFooter />
    </div>
  );
} 