import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Head from 'next/head';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import RegisterForm from '@/components/auth/register-form';
import { useToast } from '@/hooks/use-toast';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';

export default function RegisterPage() {
  const branding = useBranding();
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Create an Account | {branding.appName}</title>
        <meta name="description" content={`Sign up for ${branding.appName} and start creating professional resumes that get you noticed.`} />
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
              <CardTitle className="text-2xl text-indigo-900">Create Your Account</CardTitle>
              <CardDescription className="text-indigo-700">
                Fill in your details to get started with {branding.appName}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-indigo-600">Loading registration form...</p>
                  </div>
                </div>
              ) : (
                <>
                  <RegisterForm />
                  
                  <div className="mt-6 pt-6 border-t border-indigo-100 text-center">
                    <p className="text-indigo-700">
                      Already have an account?{" "}
                      <a href="/auth" className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                        Sign in
                      </a>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-10 text-center text-sm text-gray-500">
            <p>By creating an account, you agree to our <a href="/terms" className="text-indigo-600 hover:text-indigo-800">Terms of Service</a> and <a href="/privacy" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</a>.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <SharedFooter />
    </div>
  );
} 