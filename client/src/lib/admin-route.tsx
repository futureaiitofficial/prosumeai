import { useAdmin } from "@/hooks/use-admin";
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
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/dashboard" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}