import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

/**
 * AdminRoute component that checks if a user is an admin before rendering the protected route
 * Otherwise, it redirects to the dashboard
 */
export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useAdmin();

  return (
    <Route path={path}>
      {() => {
        // If auth is still loading
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        // If not authenticated, redirect to login
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // If authenticated but not admin, redirect to dashboard
        if (!isAdmin) {
          return <Redirect to="/dashboard" />;
        }

        // If user is admin, show the admin component
        return <Component />;
      }}
    </Route>
  );
}