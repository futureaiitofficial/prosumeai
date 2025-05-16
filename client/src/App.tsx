// Make sure templates are registered immediately
import { registerTemplates } from "./templates/registerTemplates";
import { registerCoverLetterTemplates } from "./templates/registerCoverLetterTemplates";

// Register both template types
registerTemplates();
registerCoverLetterTemplates();

import { Switch, Route } from "wouter";
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
import { useEffect } from "react";
import AdminDashboard from "./pages/admin/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import AdminTemplatesPage from "@/pages/admin/templates";
import SystemStatusPage from "@/pages/admin/system-status";
import BackupsPage from "@/pages/admin/backups";
import ApiKeysPage from "@/pages/admin/api-keys";
import { LocationProvider } from "./hooks/use-location";
import AdminSubscriptionsPage from "@/pages/admin/subscriptions";
import UserSubscriptionPage from "@/pages/user/subscription";
import CheckoutPage from "@/pages/checkout";
import { AdminPaymentPage } from '@/components/admin/AdminPaymentPage';
import LandingPage from '@/pages/landing';
import AboutPage from '@/pages/about';
import PricingPage from '@/pages/pricing';
import ContactPage from '@/pages/contact';
import AuthenticatedRedirect from '@/components/auth/authenticated-redirect';
import AdminToolsPage from '@/pages/admin/tools';
import AdminSecurityPage from '@/pages/admin/security';
import ForgotPasswordPage from '@/pages/forgot-password';
import ResetPasswordPage from '@/pages/reset-password';

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
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
      <ProtectedRoute path="/checkout" component={() => <CheckoutPage />} />
      
      {/* Admin Routes */}
      <AdminRoute path="/admin" component={AdminPage} />
      <AdminRoute path="/admin/dashboard" component={AdminDashboard} />
      
      {/* Admin feature routes */}
      <AdminRoute path="/admin/users" component={AdminUsersPage} />
      <AdminRoute path="/admin/templates" component={AdminTemplatesPage} />
      <AdminRoute path="/admin/analytics" component={AdminDashboard} />
      <AdminRoute path="/admin/settings" component={AdminDashboard} />
      <AdminRoute path="/admin/system-status" component={SystemStatusPage} />
      <AdminRoute path="/admin/backups" component={BackupsPage} />
      <AdminRoute path="/admin/api-keys" component={ApiKeysPage} />
      <AdminRoute path="/admin/subscriptions" component={() => <AdminSubscriptionsPage />} />
      <AdminRoute path="/admin/payment" component={() => <AdminPaymentPage />} />
      <AdminRoute path="/admin/tools" component={AdminToolsPage} />
      <AdminRoute path="/admin/security" component={AdminSecurityPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
            <SidebarProvider>
              <Router />
              <Toaster />
            </SidebarProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
