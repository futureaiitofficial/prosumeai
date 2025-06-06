// Make sure templates are registered immediately
import { registerTemplates } from "./templates/registerTemplates";
import { registerCoverLetterTemplates } from "./templates/registerCoverLetterTemplates";

// Register both template types
registerTemplates();
registerCoverLetterTemplates();

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Resumes from "@/pages/resumes-new";
import CoverLetters from "@/pages/cover-letters-new";
import CoverLetterBuilder from "@/pages/cover-letter-builder";
import JobApplicationsEnhanced from "@/pages/job-applications-enhanced";
import Profile from "@/pages/profile";
import ResumeBuilder from "@/pages/resume-builder";
import AdminPage from "@/pages/admin/index";
import PreviewGenerator from "@/pages/preview-generator";
import KeywordGenerator from "@/pages/keyword-generator";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import { AuthProvider } from "./hooks/use-auth";
import { SidebarProvider } from "./hooks/use-sidebar";
import React, { useEffect, lazy, Suspense } from "react";
import AdminDashboard from "./pages/admin/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import AdminTemplatesPage from "@/pages/admin/templates";
import SystemStatusPage from "@/pages/admin/system-status";
import BackupsPage from "@/pages/admin/backups";
import ApiKeysPage from "@/pages/admin/api-keys";
import { LocationProvider } from "./hooks/use-location";
import AdminSubscriptionsPage from "@/pages/admin/subscriptions";
import UserSubscriptionPage from "@/pages/user/subscription";
import UserSettingsPage from "@/pages/user/settings";
import CheckoutPage from "@/pages/checkout";
import { AdminPaymentPage } from '@/components/admin/AdminPaymentPage';
import LandingPage from '@/pages/landing';
import AboutPage from '@/pages/about';
import PricingPage from '@/pages/pricing';
import ContactPage from '@/pages/contact';
import AuthenticatedRedirect from '@/components/auth/authenticated-redirect';
import AdminToolsPage from '@/pages/admin/tools';
import AdminSecurityPage from '@/pages/admin/security';
import AdminSettingsPage from '@/pages/admin/settings';
import AdminTaxPage from '@/pages/admin/tax';
import ForgotPasswordPage from '@/pages/forgot-password';
import ResetPasswordPage from '@/pages/reset-password';
import TermsOfServicePage from '@/pages/terms';
import PrivacyPolicyPage from '@/pages/privacy';
import RegisterPage from '@/pages/register';
import VerifyEmailPage from '@/pages/verify-email';
import { BrandingProvider } from '@/components/branding/branding-provider';
import VerifyTwoFactorPage from '@/pages/verify-2fa';
import { NotificationProvider } from '@/contexts/notification-context';
import NotificationsPage from '@/pages/user/notifications';
import AdminNotificationsPage from '@/pages/admin/notifications/index';
import CreateNotificationPage from '@/pages/admin/notifications/create';
import AdminBlog from '@/pages/admin/blog';
import BlogNew from '@/pages/admin/blog-new';
import BlogPage from '@/pages/blog';
import BlogPostPage from '@/pages/blog-post';
import ResumeBuilderAI from '@/pages/resume-builder-ai';
import CoverLetterAI from '@/pages/cover-letter-ai';
import CareersPage from '@/pages/careers';
import { checkAuthStatus } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import ScrollToTop from '@/components/ScrollToTop';

// Session Recovery component to handle network disconnections
function SessionRecovery() {
  const [lastOnline, setLastOnline] = React.useState<number | null>(null);
  
  useEffect(() => {
    // Function to handle going offline
    const handleOffline = () => {
      logger.debug('Network disconnected');
      setLastOnline(Date.now());
    };
    
    // Function to handle coming back online
    const handleOnline = async () => {
      logger.debug('Network reconnected');
      
      // If we were offline for more than 1 minute, verify session
      if (lastOnline && (Date.now() - lastOnline > 60000)) {
        logger.debug('Checking session after network reconnection');
        
        try {
          // Check auth status without logging 401 errors
          const authStatus = await checkAuthStatus();
          
          if (authStatus.isAuthenticated && authStatus.user) {
            // Session is valid, refresh user data
            queryClient.setQueryData(["/api/user"], authStatus.user);
            logger.debug('Session recovered after network reconnection');
            
            // Refresh other essential data
            queryClient.invalidateQueries();
          } else {
            // No active session (401 or other issue)
            logger.debug('No active session found after network reconnection');
            queryClient.setQueryData(["/api/user"], null);
          }
        } catch (error) {
          // Network errors are expected when offline/reconnecting - don't log as error
          logger.debug('Network error during session verification (expected):', error);
        }
      }
      
      setLastOnline(null);
    };
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection check
    if (!navigator.onLine) {
      setLastOnline(Date.now());
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lastOnline]);
  
  // This component doesn't render anything
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/resume-builder-ai" component={ResumeBuilderAI} />
      <Route path="/cover-letter-ai" component={CoverLetterAI} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/verify-2fa" component={VerifyTwoFactorPage} />
      <Route path="/terms" component={TermsOfServicePage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/careers" component={CareersPage} />
      
      {/* Public Blog Routes */}
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/resumes" component={Resumes} />
      <ProtectedRoute path="/resume-builder" component={ResumeBuilder} />
      <ProtectedRoute path="/cover-letters" component={CoverLetters} />
      <ProtectedRoute path="/cover-letter-builder" component={CoverLetterBuilder} />
      <ProtectedRoute path="/job-applications" component={JobApplicationsEnhanced} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/preview-generator" component={PreviewGenerator} />
      <ProtectedRoute path="/keyword-generator" component={KeywordGenerator} />
      <ProtectedRoute path="/user/subscription" component={() => <UserSubscriptionPage />} />
      <ProtectedRoute path="/user/settings" component={() => <UserSettingsPage />} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <Route path="/checkout" component={() => <CheckoutPage />} />
      
      {/* Admin Routes */}
      <AdminRoute path="/admin" component={AdminPage} />
      <AdminRoute path="/admin/dashboard" component={AdminDashboard} />
      
      {/* Admin feature routes */}
      <AdminRoute path="/admin/users" component={AdminUsersPage} />
      <AdminRoute path="/admin/templates" component={AdminTemplatesPage} />
      <AdminRoute 
  path="/admin/email-templates" 
  component={() => {
    const EmailTemplatesPage = React.lazy(() => import('@/pages/admin/email-templates'));
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <EmailTemplatesPage />
      </Suspense>
    );
  }} 
/>
      <AdminRoute path="/admin/analytics" component={AdminDashboard} />
      <AdminRoute path="/admin/settings" component={AdminSettingsPage} />
      <AdminRoute path="/admin/system-status" component={SystemStatusPage} />
      <AdminRoute path="/admin/backups" component={BackupsPage} />
      <AdminRoute path="/admin/api-keys" component={ApiKeysPage} />
      <AdminRoute path="/admin/subscriptions" component={() => <AdminSubscriptionsPage />} />
      <AdminRoute path="/admin/payment" component={() => <AdminPaymentPage />} />
      <AdminRoute path="/admin/tools" component={AdminToolsPage} />
      <AdminRoute path="/admin/security" component={AdminSecurityPage} />
      <AdminRoute path="/admin/tax" component={() => <AdminTaxPage />} />
      <AdminRoute path="/admin/notifications" component={AdminNotificationsPage} />
      <AdminRoute path="/admin/notifications/create" component={CreateNotificationPage} />
      <AdminRoute path="/admin/blog" component={AdminBlog} />
      <AdminRoute path="/admin/blog/new" component={BlogNew} />
      <AdminRoute 
        path="/admin/blog/edit/:id" 
        component={() => {
          const BlogEdit = React.lazy(() => import('@/pages/admin/blog-edit'));
          return (
            <Suspense fallback={<div>Loading...</div>}>
              <BlogEdit />
            </Suspense>
          );
        }} 
      />
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandingProvider>
          <LocationProvider>
            <SidebarProvider>
              <NotificationProvider>
                <SessionRecovery />
                <ScrollToTop />
                <Router />
                <Toaster />
              </NotificationProvider>
            </SidebarProvider>
          </LocationProvider>
        </BrandingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
