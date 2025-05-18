import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";

const loginSchema = z.object({
  username: z.string().min(6, {
    message: "Username must be at least 6 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordField, setIsPasswordField] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    console.log(`[LOGIN DEBUG] Submitting login form for username: ${data.username}`);
    console.log(`[LOGIN DEBUG] Password length: ${data.password.length}`);
    
    try {
      loginMutation.mutate(data);
      console.log('[LOGIN DEBUG] Login mutation triggered');
    } catch (error) {
      console.error('[LOGIN DEBUG] Error triggering login mutation:', error);
    }
  };

  // Track focus on password field to coordinate with mascot animation
  const handlePasswordFocus = (focused: boolean) => {
    setIsPasswordField(focused);
    // Update global state for mascot
    if (window.authMascot?.setPasswordMode) {
      window.authMascot.setPasswordMode(focused);
    }
  };

  // Handle key press in form fields
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      {/* Error message from login attempt */}
      {loginMutation.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-medium">Login failed</AlertTitle>
          <AlertDescription className="text-xs">
            {(() => {
              const error = loginMutation.error;
              // Handle different error formats
              if (error instanceof Error) {
                try {
                  // Try to parse JSON from error message
                  const errorData = JSON.parse(error.message);
                  return errorData.message || "Invalid username or password. Please try again.";
                } catch {
                  // If not JSON, return the error message directly
                  return error.message || "Invalid username or password. Please try again.";
                }
              } else if (typeof error === 'object' && error !== null) {
                // Handle error object
                return (error as any).message || "Invalid username or password. Please try again.";
              } else if (typeof error === 'string') {
                // Handle string error
                try {
                  const errorData = JSON.parse(error);
                  return errorData.message || "Invalid username or password. Please try again.";
                } catch {
                  return error || "Invalid username or password. Please try again.";
                }
              }
              // Default error message
              return "Invalid username or password. Please try again.";
            })()}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Your username" 
                    {...field}
                    className="h-9 rounded-lg border-gray-300 bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={loginMutation.isPending}
                    onChange={(e) => {
                      field.onChange(e);
                      // Trigger keydown event to make mascot react to typing
                      const customEvent = new KeyboardEvent('keydown', { bubbles: true });
                      window.dispatchEvent(customEvent);
                      
                      // Manually trigger selection change to update cursor position
                      setTimeout(() => {
                        e.target.dispatchEvent(new Event('select', { bubbles: true }));
                      }, 10);
                    }}
                    onFocus={(e) => {
                      // Force cursor tracking to update immediately on focus
                      const customEvent = new KeyboardEvent('keydown', { bubbles: true });
                      window.dispatchEvent(customEvent);
                      // Ensure cursor is tracked
                      setTimeout(() => {
                        e.target.dispatchEvent(new Event('select', { bubbles: true }));
                      }, 10);
                    }}
                    onMouseUp={(e) => {
                      // Update cursor tracking when user clicks to position cursor
                      setTimeout(() => {
                        e.target.dispatchEvent(new Event('select', { bubbles: true }));
                      }, 10);
                    }}
                    onKeyPress={handleKeyPress}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Your password" 
                      {...field}
                      className="h-9 rounded-lg border-gray-300 bg-white/50 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                      disabled={loginMutation.isPending}
                      onFocus={(e) => {
                        handlePasswordFocus(true);
                        // Force cursor tracking to update immediately on focus
                        const customEvent = new KeyboardEvent('keydown', { bubbles: true });
                        window.dispatchEvent(customEvent);
                      }}
                      onBlur={() => handlePasswordFocus(false)}
                      onChange={(e) => {
                        field.onChange(e);
                        // Trigger keydown event to make mascot react to typing
                        const customEvent = new KeyboardEvent('keydown', { bubbles: true });
                        window.dispatchEvent(customEvent);
                        
                        // Manually trigger selection change to update cursor position
                        setTimeout(() => {
                          e.target.dispatchEvent(new Event('select', { bubbles: true }));
                        }, 10);
                      }}
                      onMouseUp={(e) => {
                        // Update cursor tracking when user clicks to position cursor
                        setTimeout(() => {
                          e.target.dispatchEvent(new Event('select', { bubbles: true }));
                        }, 10);
                      }}
                      onKeyPress={handleKeyPress}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Remember me
              </label>
            </div>
            <Link href="/forgot-password">
              <a className="text-xs text-indigo-600 hover:text-indigo-800">
                Forgot password?
              </a>
            </Link>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white h-10 rounded-lg font-medium" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}

// Make TypeScript happy with global state for mascot
declare global {
  interface Window {
    authMascot?: {
      isPasswordField: boolean;
      setPasswordMode: (focused: boolean) => void;
    };
  }
}
