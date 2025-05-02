import { useState } from "react";
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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }).optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  selectedPlanId?: string | null;
}

export default function RegisterForm({ selectedPlanId }: RegisterFormProps) {
  const { registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordField, setIsPasswordField] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    // Make sure fullName is always a string, even if it's optional in the schema
    const processedData = {
      ...data,
      fullName: data.fullName || "", // Provide empty string as default
    };
    
    const registerData = selectedPlanId 
      ? { ...processedData, selectedPlanId } 
      : processedData;
    
    registerMutation.mutate(registerData);
  };

  // Track focus on password field to coordinate with mascot animation
  const handlePasswordFocus = (focused: boolean) => {
    setIsPasswordField(focused);
    // Update global state for mascot
    if (window.authMascot?.setPasswordMode) {
      window.authMascot.setPasswordMode(focused);
    }
  };

  // Common event handlers for all fields (except password)
  const addCursorTracking = (e: React.FocusEvent<HTMLInputElement>) => {
    // Force cursor tracking to update immediately on focus
    const customEvent = new KeyboardEvent('keydown', { bubbles: true });
    window.dispatchEvent(customEvent);
    // Ensure cursor is tracked
    setTimeout(() => {
      e.target.dispatchEvent(new Event('select', { bubbles: true }));
    }, 10);
  };

  const updateCursorPosition = (e: React.MouseEvent<HTMLInputElement>) => {
    // Update cursor tracking when user clicks to position cursor
    setTimeout(() => {
      e.target.dispatchEvent(new Event('select', { bubbles: true }));
    }, 10);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Your full name" 
                    {...field}
                    className="h-9 rounded-lg border-gray-300 bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={registerMutation.isPending}
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
                    onFocus={addCursorTracking}
                    onMouseUp={updateCursorPosition}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Choose a username" 
                    {...field}
                    className="h-9 rounded-lg border-gray-300 bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={registerMutation.isPending}
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
                    onFocus={addCursorTracking}
                    onMouseUp={updateCursorPosition}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="your.email@example.com" 
                    {...field}
                    className="h-9 rounded-lg border-gray-300 bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={registerMutation.isPending}
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
                    onFocus={addCursorTracking}
                    onMouseUp={updateCursorPosition}
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
                      placeholder="Create a password" 
                      {...field}
                      className="h-9 rounded-lg border-gray-300 bg-white/50 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                      disabled={registerMutation.isPending}
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
                      onMouseUp={updateCursorPosition}
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
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              required
            />
            <label htmlFor="terms" className="text-xs text-gray-600">
              I agree to the <a href="/terms" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a> and <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white h-10 rounded-lg font-medium"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
