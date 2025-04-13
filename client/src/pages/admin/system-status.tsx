import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Redirect } from "wouter";
import { AdminLayout } from "@/components/admin/layout";
import ServerStatus from "@/components/admin/server-status";

export default function SystemStatusPage() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminCheckLoading } = useAdmin();
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // If not admin, redirect to home
  if (!adminCheckLoading && !isAdmin) {
    return <Redirect to="/" />;
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System Status</h1>
          <p className="text-muted-foreground">
            View detailed information about the server and application status
          </p>
        </div>
        
        <ServerStatus isAdmin={!!isAdmin} />
      </div>
    </AdminLayout>
  );
} 