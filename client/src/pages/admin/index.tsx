import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Redirect, useLocation } from "wouter";
import { AdminLayout } from "@/components/admin/layout";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Users,
  FileText,
  Activity,
  Settings,
  Database,
  ListIcon,
} from "lucide-react";

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

export function AdminDashboardPage() {
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
  
  const adminLinks = [
    {
      title: "Dashboard",
      description: "View key metrics and statistics",
      icon: <BarChart className="h-5 w-5" />,
      href: "/admin/dashboard",
      color: "bg-blue-500"
    },
    {
      title: "Users",
      description: "Manage user accounts",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users",
      color: "bg-green-500"
    },
    {
      title: "Templates",
      description: "Edit resume and cover letter templates",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/templates",
      color: "bg-amber-500"
    },
    {
      title: "System Status",
      description: "View server and application health",
      icon: <Activity className="h-5 w-5" />,
      href: "/admin/system-status",
      color: "bg-purple-500"
    },
    {
      title: "Backups",
      description: "Manage database backups",
      icon: <Database className="h-5 w-5" />,
      href: "/admin/backups",
      color: "bg-teal-500"
    },
    {
      title: "Settings",
      description: "Configure application settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/settings",
      color: "bg-indigo-500"
    },
    {
      title: "Subscriptions",
      description: "Manage subscription plans and features",
      icon: <ListIcon className="h-5 w-5" />,
      href: "/admin/subscriptions",
      color: "bg-cyan-500"
    },
  ];
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage all aspects of the Prosume application
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button 
                variant="outline" 
                className="w-full h-auto p-4 justify-between items-start text-left flex flex-col hover:border-primary hover:shadow-md transition-all"
              >
                <div className={`p-2 rounded-md ${link.color} text-white mb-3`}>
                  {link.icon}
                </div>
                <div className="w-full">
                  <h3 className="font-medium">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}