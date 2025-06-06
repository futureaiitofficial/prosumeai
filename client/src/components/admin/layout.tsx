import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBranding } from "@/components/branding/branding-provider";
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
  LucideIcon,
  Wrench,
  User,
  ArrowLeft,
  BookOpen
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
import { NotificationDropdown } from "@/components/ui/notification-dropdown";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isCollapsed, toggleCollapsed, isMobileOpen, toggleMobileOpen } = useSidebar();
  const branding = useBranding();

  // Close mobile menu on location change
  useEffect(() => {
    if (isMobileOpen) {
      toggleMobileOpen();
    }
  }, [location, isMobileOpen, toggleMobileOpen]);

  // Close mobile menu on large screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024 && isMobileOpen) {
        toggleMobileOpen();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileOpen, toggleMobileOpen]);

  if (!user) {
    return null;
  }

  // Navigation items
  const navigationItems: NavigationItem[] = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Blog", href: "/admin/blog", icon: BookOpen },
    { name: "Templates", href: "/admin/templates", icon: FileText },
    { name: "Email Templates", href: "/admin/email-templates", icon: Mail },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Backups", href: "/admin/backups", icon: Database },
    { name: "API Keys", href: "/admin/api-keys", icon: Key },
    { name: "Integrations", href: "/admin/integrations", icon: Plug2 },
    { name: "Payment Gateways", href: "/admin/payment", icon: DollarSign },
    { name: "Security", href: "/admin/security", icon: Shield },
    { name: "System Status", href: "/admin/system-status", icon: Server },
    { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
    { name: "Tax Settings", href: "/admin/tax", icon: ScrollText },
    { name: "Tools", href: "/admin/tools", icon: Wrench },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const logout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Sidebar header */}
        <div className={cn(
          "flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed ? (
            <Link href="/" className="font-bold text-lg flex items-center">
              {branding.appName}
              <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
            </Link>
          ) : (
            <Link href="/" className="font-bold text-lg">
              {branding.appName.charAt(0)}
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleCollapsed}
            className={cn(isCollapsed && "rotate-180")}
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
                    location === item.href ? "bg-accent" : "transparent",
                    isCollapsed && "justify-center"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className={cn(
          "flex items-center border-t border-gray-200 dark:border-gray-800 p-4",
          isCollapsed && "flex-col"
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
                {!isCollapsed && (
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
                  href="/dashboard" 
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
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={toggleMobileOpen}
        />
      )}

      {/* Mobile sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4">
          <Link href="/" className="font-bold text-lg flex items-center">
            {branding.appName}
            <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
          </Link>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleMobileOpen}
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
            onClick={logout}
            className="text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={toggleMobileOpen}
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
            <NotificationDropdown />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/admin')}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to App
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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