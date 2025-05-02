import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
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

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [isMobileView, setIsMobileView] = useState(false);

  // Check for mobile view on mount and window resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('darkMode', (!darkMode).toString());
    }
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.fullName) return "U";
    
    const names = user.fullName.split(" ");
    if (names.length === 1) return names[0].charAt(0);
    
    return names[0].charAt(0) + names[names.length - 1].charAt(0);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2 md:gap-4">
          {isMobileView && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={toggleCollapsed}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="ATScribe" 
                className="h-8 w-8 rounded-md" 
                onError={(e) => {
                  // Fallback if logo image doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <span className="ml-2 text-xl font-bold">ATScribe</span>
            </div>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-8 w-8 rounded-full"
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.username || "User"} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user && (
                      <>
                        <p className="font-medium">{user.fullName || user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    Settings
                  </Link>
                </DropdownMenuItem>
                {user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}