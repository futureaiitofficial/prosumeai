import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Redirect, useLocation } from "wouter";
import { AdminLayout } from "@/components/admin/layout";
import { TemplatesOverview } from "@/components/admin/templates-overview";
import { Loader2 } from "lucide-react";

export default function AdminTemplatesPage() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminCheckLoading } = useAdmin();
  const [location] = useLocation();

  console.log("Rendering AdminTemplatesPage at location:", location);

  // If not authenticated, redirect to login
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // If not admin, redirect to home
  if (!adminCheckLoading && !isAdmin) {
    return <Redirect to="/" />;
  }

  // Show loading spinner while checking admin status
  if (adminCheckLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Checking permissions...</p>
        </div>
      </AdminLayout>
    );
  }

  // Render the templates management component
  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Template Management</h1>
        <p className="text-muted-foreground">Manage and organize resume and cover letter templates.</p>
        <TemplatesOverview />
      </div>
    </AdminLayout>
  );
} 