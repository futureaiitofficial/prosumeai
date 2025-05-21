import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  File,
  FileEdit,
  FileText, 
  Clipboard, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  // Set up mobile and tablet detection
  useEffect(() => {
    const checkMobileOrTablet = () => {
      setIsMobileOrTablet(window.innerWidth < 768);
    };
    
    checkMobileOrTablet();
    window.addEventListener('resize', checkMobileOrTablet);
    
    return () => {
      window.removeEventListener('resize', checkMobileOrTablet);
    };
  }, []);

  // Don't render sidebar at all on mobile
  if (isMobileOrTablet) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/resumes", label: "Resumes", icon: File },
    { href: "/cover-letters", label: "Cover Letters", icon: FileText },
    { href: "/job-applications", label: "Job Applications", icon: Clipboard },
    { href: "/keyword-generator", label: "Keyword Generator", icon: Sparkles },
    { href: "/user/subscription", label: "Subscription", icon: CreditCard },
    { href: "/profile", label: "Profile", icon: User },
  ];
  
  // Admin links that will be displayed only if the user is an admin
  const adminLinks = user?.isAdmin ? [
    { href: "/admin", label: "Admin Dashboard", icon: Settings },
  ] : [];

  return (
    <aside 
      className={cn(
        "fixed h-screen border-r border-slate-200 bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 z-40 hidden md:block",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex justify-end p-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCollapsed}
            className="h-6 w-6 rounded-full"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {/* Regular navigation links */}
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link href={link.href} key={link.href}>
                  <div
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 transition-all cursor-pointer",
                      location === link.href
                        ? "bg-slate-100 text-primary-900 dark:bg-slate-800 dark:text-primary-50"
                        : "text-slate-900 hover:text-primary-900 dark:text-slate-50 dark:hover:text-primary-400",
                      isCollapsed ? "justify-center" : "gap-3"
                    )}
                    title={isCollapsed ? link.label : ""}
                  >
                    <Icon className="h-4 w-4" />
                    {!isCollapsed && <span>{link.label}</span>}
                  </div>
                </Link>
              );
            })}
            
            {/* Admin links (only shown if user is admin) */}
            {adminLinks.length > 0 && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold text-slate-500">
                    Admin
                  </div>
                )}
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link href={link.href} key={link.href}>
                      <div
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2 transition-all cursor-pointer",
                          location.startsWith(link.href)
                            ? "bg-slate-100 text-primary-900 dark:bg-slate-800 dark:text-primary-50"
                            : "text-slate-900 hover:text-primary-900 dark:text-slate-50 dark:hover:text-primary-400",
                          isCollapsed ? "justify-center" : "gap-3"
                        )}
                        title={isCollapsed ? link.label : ""}
                      >
                        <Icon className="h-4 w-4" />
                        {!isCollapsed && <span>{link.label}</span>}
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>
        <div className="mt-auto border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50",
              isCollapsed ? "justify-center w-full" : "w-full gap-3"
            )}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
