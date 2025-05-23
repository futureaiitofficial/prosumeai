import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileNav from "./mobile-nav";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { 
  Home, 
  File, 
  FileText, 
  Clipboard, 
  User, 
  LogOut, 
  Settings,
  Sparkles,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

interface DefaultLayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageDescription?: string;
}

export default function DefaultLayout({ 
  children, 
  pageTitle, 
  pageDescription 
}: DefaultLayoutProps) {
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    closeMobileSidebar();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Full Width Header */}
      <Header />
      
      {/* Layout Container */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Mobile Sidebar Overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMobileSidebar}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div 
          className={cn(
            "fixed top-16 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 z-50 shadow-xl transition-transform duration-300 md:hidden",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto p-4">
              <nav className="grid gap-1">
                {/* Regular navigation links */}
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = location === link.href;
                  
                  return (
                    <Link 
                      href={link.href} 
                      key={link.href} 
                      onClick={closeMobileSidebar}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all cursor-pointer relative group",
                          isActive
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-300"
                            : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center",
                          isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <span className={cn(
                          "font-medium text-sm",
                          isActive ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"
                        )}>
                          {link.label}
                        </span>
                        
                        {isActive && (
                          <motion.div 
                            className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
                            layoutId="mobile-sidebar-indicator"
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
                    <div className="mt-6 mb-2">
                      <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Admin
                      </div>
                    </div>
                    {adminLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = location.startsWith(link.href);
                      
                      return (
                        <Link 
                          href={link.href} 
                          key={link.href}
                          onClick={closeMobileSidebar}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all cursor-pointer relative group",
                              isActive
                                ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-300"
                                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center",
                              isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            
                            <span className={cn(
                              "font-medium text-sm",
                              isActive ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"
                            )}>
                              {link.label}
                            </span>
                            
                            {isActive && (
                              <motion.div 
                                className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
                                layoutId="mobile-sidebar-indicator-admin"
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
            <div className="border-t border-slate-100 dark:border-slate-800 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50 transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <main className={cn(
          "flex-1 px-4 md:px-8 py-6 md:py-10 pb-20 md:pb-10",
          isCollapsed ? "md:ml-20" : "md:ml-64"
        )}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{pageTitle}</h1>
              {pageDescription && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {pageDescription}
                </p>
              )}
            </div>
            
            {/* Page Content */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
