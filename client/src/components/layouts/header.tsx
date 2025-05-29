import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBranding } from "@/components/branding/branding-provider";
import { Moon, Sun, Bell, User, ChevronDown, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const { toggleMobileOpen } = useSidebar();
  const branding = useBranding();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('darkMode', (!darkMode).toString());
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side - Mobile menu and branding */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button - only visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={toggleMobileOpen}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          
          {/* App Branding - now takes the complete left side */}
          <Link href="/dashboard">
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:from-indigo-700 hover:to-purple-700 transition-all">
              {branding.appName}
            </span>
          </Link>
        </div>
        
        {/* Center section - could add breadcrumbs or search later */}
        <div className="hidden lg:flex flex-1 justify-center max-w-md mx-8">
          {/* Future: Add search bar or breadcrumbs here */}
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-9 w-9 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {user && (
            <NotificationDropdown className="h-9 w-9 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" />
          )}
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2 h-9 rounded-lg px-2 hover:bg-slate-100 dark:hover:bg-slate-800 ml-1">
                  <Avatar className="h-7 w-7">
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} 
                      alt={user.username} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden xl:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                    {user.fullName || user.username}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-500 transition-transform hidden xl:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {user.fullName || user.username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuItem asChild className="focus:bg-slate-50 dark:focus:bg-slate-800">
                  <Link href="/profile">
                    <div className="flex w-full cursor-pointer items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
