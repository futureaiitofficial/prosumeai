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
import { motion } from "framer-motion";

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
        "fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white/80 backdrop-blur-md shadow-lg transition-all duration-300 ease-in-out dark:bg-slate-900/90 z-30 hidden md:block",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Toggle Button Header */}
        <div className={cn(
          "flex items-center h-12 px-4 border-b border-slate-100 dark:border-slate-800",
          isCollapsed ? "justify-center" : "justify-end"
        )}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCollapsed}
            className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            )}
          </Button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-auto py-6">
          <nav className="grid gap-1 px-3">
            {/* Regular navigation links */}
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              
              return (
                <Link href={link.href} key={link.href}>
                  <div
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 transition-all cursor-pointer relative group",
                      isActive
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-300"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50",
                      isCollapsed ? "justify-center" : "gap-3"
                    )}
                    title={isCollapsed ? link.label : ""}
                  >
                    <div className={cn(
                      "flex items-center justify-center",
                      isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    {!isCollapsed && (
                      <span className={cn(
                        "font-medium text-sm",
                        isActive ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"
                      )}>
                        {link.label}
                      </span>
                    )}
                    
                    {isActive && (
                      <motion.div 
                        className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
                        layoutId="sidebar-indicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
            
            {/* Admin links (only shown if user is admin) */}
            {adminLinks.length > 0 && (
              <>
                <div className={cn(
                  "mt-6 mb-2",
                  isCollapsed ? "border-t border-slate-200 dark:border-slate-700 pt-4" : ""
                )}>
                  {!isCollapsed && (
                    <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Admin
                    </div>
                  )}
                </div>
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.startsWith(link.href);
                  
                  return (
                    <Link href={link.href} key={link.href}>
                      <div
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2.5 transition-all cursor-pointer relative group",
                          isActive
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-300"
                            : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50",
                          isCollapsed ? "justify-center" : "gap-3"
                        )}
                        title={isCollapsed ? link.label : ""}
                      >
                        <div className={cn(
                          "flex items-center justify-center",
                          isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        {!isCollapsed && (
                          <span className={cn(
                            "font-medium text-sm",
                            isActive ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"
                          )}>
                            {link.label}
                          </span>
                        )}
                        
                        {isActive && (
                          <motion.div 
                            className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
                            layoutId="sidebar-indicator-admin"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>

        {/* Logout button */}
        <div className="mt-auto border-t border-slate-100 dark:border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50 transition-colors w-full",
              isCollapsed ? "justify-center" : "gap-3"
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
