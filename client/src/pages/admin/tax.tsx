import { useAuth } from "../../hooks/use-auth";
import { useAdmin } from "../../hooks/use-admin";
import { Redirect } from "wouter";
import { AdminLayout } from "../../components/admin/layout";
import TaxSettings from "../../components/admin/tax-settings";

export default function AdminTaxPage() {
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
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="text-2xl font-bold">Tax & Invoice Management</h1>
          <p className="text-muted-foreground">
            Configure tax settings, company information, and invoice appearance
          </p>
        </div>
        
        <TaxSettings />
      </div>
    </AdminLayout>
  );
} 