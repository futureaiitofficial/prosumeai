import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  FileText, 
  CreditCard, 
  DollarSign, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  Home,
  TrendingUp,
  Bell,
  Search,
  HelpCircle,
  ChevronRight,
  Server,
  LayoutDashboard,
  ScrollText,
  Database,
  Key,
  Mail,
  Plug2,
  Shield,
  LucideIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on location change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Close mobile menu on large screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!user) {
    return null;
  }

  // Navigation items
  const navigationItems: NavigationItem[] = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Templates", href: "/admin/templates", icon: FileText },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Logs", href: "/admin/logs", icon: ScrollText },
    { name: "Backups", href: "/admin/backups", icon: Database },
    { name: "API Keys", href: "/admin/api-keys", icon: Key },
    { name: "Email Templates", href: "/admin/email-templates", icon: Mail },
    { name: "Integrations", href: "/admin/integrations", icon: Plug2 },
    { name: "Security", href: "/admin/security", icon: Shield },
    { name: "System Status", href: "/admin/system-status", icon: Server },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Sidebar header */}
        <div className={cn(
          "flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-4",
          isSidebarOpen ? "justify-between" : "justify-center"
        )}>
          {isSidebarOpen ? (
            <Link href="/" className="font-bold text-lg flex items-center">
              ProsumeAI
              <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
            </Link>
          ) : (
            <Link href="/" className="font-bold text-lg">
              P
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(!isSidebarOpen && "rotate-180")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="flex flex-col gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                    location === item.href ? "bg-accent" : "transparent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className={cn(
          "flex items-center border-t border-gray-200 dark:border-gray-800 p-4",
          !isSidebarOpen && "flex-col"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto flex items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage 
                    src={`https://avatar.vercel.sh/${user.username || user.email}?size=32`} 
                    alt={user.username || user.email} 
                  />
                  <AvatarFallback>
                    {user.username?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {isSidebarOpen && (
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium">{user.username || user.email}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Admin</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link 
                  href="/" 
                  className="flex w-full cursor-pointer items-center"
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Back to App</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link 
                  href="/settings" 
                  className="flex w-full cursor-pointer items-center"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4">
          <Link href="/" className="font-bold text-lg flex items-center">
            ProsumeAI
            <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
          </Link>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile navigation links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="flex flex-col gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                    location === item.href ? "bg-accent" : "transparent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile user section */}
        <div className="flex items-center border-t border-gray-200 dark:border-gray-800 p-4">
          <Avatar className="h-9 w-9">
            <AvatarImage 
              src={`https://avatar.vercel.sh/${user.username || user.email}?size=32`} 
              alt={user.username || user.email} 
            />
            <AvatarFallback>
              {user.username?.charAt(0) || user.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{user.username || user.email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => logoutMutation.mutate()}
            className="text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "lg:pl-64" : "lg:pl-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Search */}
          <div className="hidden md:flex relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              type="search"
              placeholder="Search..."
              className="h-10 w-full rounded-md border border-gray-200 bg-white pl-8 pr-4 text-sm outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-950"
            />
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    3
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-3 text-sm border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-start gap-4">
                      <span className="rounded-full bg-blue-100 p-2">
                        <Users className="h-4 w-4 text-blue-600" />
                      </span>
                      <div>
                        <p className="font-medium">New user registered</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          A new user just created an account.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          2 minutes ago
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 text-sm border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-start gap-4">
                      <span className="rounded-full bg-green-100 p-2">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </span>
                      <div>
                        <p className="font-medium">Payment successful</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          New subscription payment processed.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          15 minutes ago
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 text-sm">
                    <div className="flex items-start gap-4">
                      <span className="rounded-full bg-red-100 p-2">
                        <FileText className="h-4 w-4 text-red-600" />
                      </span>
                      <div>
                        <p className="font-medium">New template added</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          A new resume template has been added.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          1 hour ago
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2 text-center">
                  <Button variant="ghost" size="sm" className="w-full">
                    View all notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}