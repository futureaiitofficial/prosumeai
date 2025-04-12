import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Redirect, useLocation } from "wouter";
import { AdminLayout } from "@/components/admin/layout";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminCheckLoading } = useAdmin();
  const [location, setLocation] = useLocation();

  // If at /admin, redirect to /admin/dashboard
  useEffect(() => {
    if (location === "/admin" && !adminCheckLoading && isAdmin) {
      setLocation("/admin/dashboard");
    }
  }, [location, adminCheckLoading, isAdmin, setLocation]);

  // If not authenticated, redirect to login
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // If not admin, redirect to home
  if (!adminCheckLoading && !isAdmin) {
    return <Redirect to="/" />;
  }

  // Show loading spinner while redirecting
  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading admin dashboard...</p>
      </div>
    </AdminLayout>
  );
}