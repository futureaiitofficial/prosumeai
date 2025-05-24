import { useState, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import DefaultLayout from "@/components/layouts/default-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, Fingerprint, BellRing, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

import BillingDetailsForm from "@/components/checkout/billing-details-form";
import TwoFactorSetup from "@/components/auth/TwoFactorSetup";
import { PaymentService } from "@/services/payment-service";

// Use lazy loading to work around TypeScript module resolution issues
const PasswordChangeForm = lazy(() => import("@/components/auth/PasswordChangeForm"));
const NotificationSettings = lazy(() => import("@/components/user/NotificationSettings"));

export default function UserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get tab from URL query parameter or default to security
  const [activeTab, setActiveTab] = useState<string>('security');
  
  // Query to fetch billing details
  const billingDetailsQuery = useQuery({
    queryKey: ['billingDetails'],
    queryFn: async () => {
      try {
        const details = await PaymentService.getBillingDetails();
        return details;
      } catch (error) {
        console.error('Error fetching billing details:', error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 60 * 60 * 1000,
    gcTime: Infinity,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Handle tab navigation
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL when tab changes
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url.toString());
    
    // Prefetch data when navigating to billing tab
    if (value === 'billing' && !billingDetailsQuery.data && !billingDetailsQuery.isLoading) {
      billingDetailsQuery.refetch().catch(err => {
        console.error('Error fetching billing details:', err);
      });
    }
  };

  // Loading fallback component for lazy-loaded components
  const LoadingFallback = () => (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <DefaultLayout pageTitle="Account Settings" pageDescription="Manage your account settings, security, and billing preferences">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 lg:w-72 shrink-0 mb-4 md:mb-0">
            <div className="sticky top-20">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">Settings</CardTitle>
                  <CardDescription>
                    Manage your account preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="flex flex-col">
                    <Link href="/profile">
                      <button
                        className={cn(
                          "flex items-center gap-3 py-3 px-4 text-sm font-medium border-l-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                          "border-l-transparent"
                        )}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </button>
                    </Link>
                    
                    <button
                      onClick={() => handleTabChange('security')}
                      className={cn(
                        "flex items-center gap-3 py-3 px-4 text-sm font-medium border-l-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                        activeTab === 'security' 
                          ? "border-l-primary text-primary bg-slate-50 dark:bg-slate-800/50" 
                          : "border-l-transparent"
                      )}
                    >
                      <Shield className="h-4 w-4" />
                      <span>Security</span>
                    </button>
                    
                    <button
                      onClick={() => handleTabChange('2fa')}
                      className={cn(
                        "flex items-center gap-3 py-3 px-4 text-sm font-medium border-l-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                        activeTab === '2fa' 
                          ? "border-l-primary text-primary bg-slate-50 dark:bg-slate-800/50" 
                          : "border-l-transparent"
                      )}
                    >
                      <Fingerprint className="h-4 w-4" />
                      <span>Two-Factor Auth</span>
                    </button>
                    
                    <button
                      onClick={() => handleTabChange('notifications')}
                      className={cn(
                        "flex items-center gap-3 py-3 px-4 text-sm font-medium border-l-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                        activeTab === 'notifications' 
                          ? "border-l-primary text-primary bg-slate-50 dark:bg-slate-800/50" 
                          : "border-l-transparent"
                      )}
                    >
                      <BellRing className="h-4 w-4" />
                      <span>Notifications</span>
                    </button>
                    
                    <button
                      onClick={() => handleTabChange('billing')}
                      className={cn(
                        "flex items-center gap-3 py-3 px-4 text-sm font-medium border-l-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                        activeTab === 'billing' 
                          ? "border-l-primary text-primary bg-slate-50 dark:bg-slate-800/50" 
                          : "border-l-transparent"
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Billing</span>
                    </button>
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* Security Settings */}
              {activeTab === 'security' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account security and password
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <Suspense fallback={<LoadingFallback />}>
                        <PasswordChangeForm />
                      </Suspense>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Two-Factor Authentication */}
              {activeTab === '2fa' && (
                <TwoFactorSetup />
              )}
              
              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BellRing className="h-5 w-5 text-primary" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Control which notifications you receive and how
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <Suspense fallback={<LoadingFallback />}>
                        <NotificationSettings />
                      </Suspense>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Billing Information */}
              {activeTab === 'billing' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Billing Information
                    </CardTitle>
                    <CardDescription>
                      Manage your billing details and payment information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {billingDetailsQuery.isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="h-8 w-8 animate-spin text-primary mx-auto mb-4">
                            {/* Spinner SVG */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          </div>
                          <p className="text-sm text-muted-foreground">Loading billing information...</p>
                        </div>
                      </div>
                    ) : (
                      <BillingDetailsForm
                        existingDetails={billingDetailsQuery.data || null}
                        onDetailsSubmitted={(details) => {
                          billingDetailsQuery.refetch();
                          toast({
                            title: 'Billing details updated',
                            description: 'Your billing information has been updated successfully.'
                          });
                        }}
                        onCancel={() => {
                          // No action needed when canceling in this context
                          console.log('Billing details form canceled');
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
} 