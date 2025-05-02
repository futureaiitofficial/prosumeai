import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const AuthenticatedRedirect: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect to appropriate page based on user role
        if (user.isAdmin) {
          setLocation('/admin/dashboard');
        } else {
          setLocation('/dashboard');
        }
      } else {
        setLocation('/');
      }
    }
  }, [user, isLoading, setLocation]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AuthenticatedRedirect; 