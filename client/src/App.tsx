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
import AdminUsersPage from "./pages/admin/users";
import AdminTemplatesPage from "./pages/admin/templates";
import { LocationProvider } from "./hooks/use-location";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/resumes" component={Resumes} />
      <ProtectedRoute path="/resume-builder" component={ResumeBuilder} />
      <ProtectedRoute path="/cover-letters" component={CoverLetters} />
      <ProtectedRoute path="/cover-letter-builder" component={CoverLetterBuilder} />
      <ProtectedRoute path="/job-applications" component={JobApplicationsEnhanced} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/preview-generator" component={PreviewGenerator} />
      <ProtectedRoute path="/keyword-generator" component={KeywordGenerator} />
      
      {/* Admin Routes */}
      <AdminRoute path="/admin" component={AdminPage} />
      <AdminRoute path="/admin/dashboard" component={AdminDashboard} />
      
      {/* Admin feature routes */}
      <AdminRoute path="/admin/users" component={AdminUsersPage} />
      <AdminRoute path="/admin/templates" component={AdminTemplatesPage} />
      <AdminRoute path="/admin/analytics" component={AdminDashboard} />
      <AdminRoute path="/admin/settings" component={AdminDashboard} />
      
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
