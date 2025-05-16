import { useState, useEffect, useCallback } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, Check, X, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import axios from 'axios';
import { Progress } from "@/components/ui/progress";

// Initialize with basic requirements, will be updated from server
const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};

// Create a dynamic registerSchema
function createRegisterSchema(passwordReqs: typeof passwordRequirements) {
  return z.object({
    username: z.string().min(3, {
      message: "Username must be at least 3 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: z.string()
      .min(passwordReqs.minLength, {
        message: `Password must be at least ${passwordReqs.minLength} characters.`,
      })
      .refine(value => !passwordReqs.requireUppercase || /[A-Z]/.test(value), {
        message: "Password must contain at least one uppercase letter",
      })
      .refine(value => !passwordReqs.requireLowercase || /[a-z]/.test(value), {
        message: "Password must contain at least one lowercase letter",
      })
      .refine(value => !passwordReqs.requireNumbers || /[0-9]/.test(value), {
        message: "Password must contain at least one number",
      })
      .refine(value => !passwordReqs.requireSpecialChars || /[^A-Za-z0-9]/.test(value), {
        message: "Password must contain at least one special character",
      }),
    fullName: z.string().min(2, {
      message: "Full name must be at least 2 characters.",
    }).optional(),
  });
}

// Start with default schema
let registerSchema = createRegisterSchema(passwordRequirements);

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  selectedPlanId?: string | null;
}

// Calculate password strength
function calculatePasswordStrength(password: string, requirements: typeof passwordRequirements): number {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length check - up to 40% of strength
  const lengthFactor = Math.min(password.length / (requirements.minLength * 2), 1);
  strength += lengthFactor * 40;
  
  // Character variety - 60% of strength
  if (/[A-Z]/.test(password)) strength += 15; // uppercase
  if (/[a-z]/.test(password)) strength += 15; // lowercase
  if (/[0-9]/.test(password)) strength += 15; // numbers
  if (/[^A-Za-z0-9]/.test(password)) strength += 15; // special chars
  
  return Math.min(strength, 100);
}

// Function to get color based on strength
function getStrengthColor(strength: number): string {
  if (strength < 30) return 'bg-red-500';
  if (strength < 60) return 'bg-orange-500';
  if (strength < 80) return 'bg-yellow-500';
  return 'bg-green-500';
}

// Function to get strength label
function getStrengthLabel(strength: number): string {
  if (strength < 30) return 'Weak';
  if (strength < 60) return 'Fair';
  if (strength < 80) return 'Good';
  return 'Strong';
}

export default function RegisterForm({ selectedPlanId }: RegisterFormProps) {
  const { registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordField, setIsPasswordField] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; message: string } | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ disposable: boolean; message: string } | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [passwordRequirementsText, setPasswordRequirementsText] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [currentRequirements, setCurrentRequirements] = useState(passwordRequirements);

  // Fetch password requirements on component mount
  useEffect(() => {
    axios.get('/api/password-requirements')
      .then(response => {
        const { requirements, text } = response.data;
        setCurrentRequirements(requirements);
        setPasswordRequirementsText(text);
        
        // Update schema with new requirements
        registerSchema = createRegisterSchema(requirements);
        
        // Revalidate form with new schema
        form.reset(form.getValues());
      })
      .catch(error => {
        console.error('Error fetching password requirements:', error);
      });
  }, []);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
    },
    mode: "onChange"
  });

  // Update password strength when password changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'password' || name === undefined) {
        const password = value.password as string || '';
        const strength = calculatePasswordStrength(password, currentRequirements);
        setPasswordStrength(strength);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, currentRequirements]);

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

  // Debounce function for username availability check
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return function (this: any, ...args: Parameters<T>): void {
      const later = () => {
        timeoutId = null;
        func.apply(this, args);
      };
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(later, delay);
    };
  }, []);

  // Function to check username availability
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      setIsCheckingUsername(false);
      return;
    }
    
    setIsCheckingUsername(true);
    try {
      const response = await axios.get(`/api/check-username`, {
        params: { username },
      });
      setUsernameStatus(response.data);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus({ available: false, message: 'Error checking username availability' });
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  // Function to check email disposability
  const checkEmailDisposability = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailStatus(null);
      setIsCheckingEmail(false);
      return;
    }
    
    setIsCheckingEmail(true);
    try {
      const response = await axios.get(`/api/check-email`, {
        params: { email },
      });
      setEmailStatus(response.data);
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailStatus({ disposable: true, message: 'Error checking email validity' });
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Debounced version of the check functions
  const debouncedCheckUsername = useCallback(
    debounce(checkUsernameAvailability, 500),
    [checkUsernameAvailability, debounce]
  );

  const debouncedCheckEmail = useCallback(
    debounce(checkEmailDisposability, 500),
    [checkEmailDisposability, debounce]
  );

  useEffect(() => {
    return () => {
      // Cleanup comment updated - no need to cancel debounced calls as debounce handles it internally
      // No action needed for cleanup
    };
  }, [debouncedCheckUsername, debouncedCheckEmail]);

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
                  <div className="relative">
                    <Input 
                      placeholder="Choose a username" 
                      {...field}
                      value={field.value.toLowerCase()}
                      className="h-9 rounded-lg border-gray-300 bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                      disabled={registerMutation.isPending}
                      onChange={(e) => {
                        const lowercaseValue = e.target.value.toLowerCase();
                        field.onChange(lowercaseValue);
                        debouncedCheckUsername(lowercaseValue);
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
                    {isCheckingUsername && (
                      <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-500" />
                    )}
                    {usernameStatus && !isCheckingUsername && (
                      <span className="absolute right-3 top-2.5 h-4 w-4 text-gray-500">
                        {usernameStatus.available ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </span>
                    )}
                  </div>
                </FormControl>
                {usernameStatus && !isCheckingUsername && (
                  <p className={`text-xs mt-1 ${usernameStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                    {usernameStatus.message}
                  </p>
                )}
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
                  <div className="relative">
                    <Input 
                      type="email"
                      placeholder="your.email@example.com" 
                      {...field}
                      className="h-9 rounded-lg border-gray-300 bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                      disabled={registerMutation.isPending}
                      onChange={(e) => {
                        field.onChange(e);
                        debouncedCheckEmail(e.target.value);
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
                    {isCheckingEmail && (
                      <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-500" />
                    )}
                    {emailStatus && !isCheckingEmail && (
                      <span className="absolute right-3 top-2.5 h-4 w-4 text-gray-500">
                        {emailStatus.disposable ? (
                          <X className="h-4 w-4 text-red-500" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </span>
                    )}
                  </div>
                </FormControl>
                {emailStatus && !isCheckingEmail && (
                  <p className={`text-xs mt-1 ${emailStatus.disposable ? 'text-red-600' : 'text-green-600'}`}>
                    {emailStatus.message}
                  </p>
                )}
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
                
                {/* Password strength indicator */}
                {field.value && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        Password Strength: {getStrengthLabel(passwordStrength)}
                      </span>
                      <span className="text-xs flex items-center">
                        {passwordStrength < 60 && <AlertTriangle size={12} className="text-amber-500 mr-1" />}
                        {passwordStrength >= 60 && <Check size={12} className="text-green-500 mr-1" />}
                        {passwordStrength < 60 ? 'Make it stronger' : 'Good password'}
                      </span>
                    </div>
                    <Progress value={passwordStrength} className={`h-1 ${getStrengthColor(passwordStrength)}`} />
                  </div>
                )}
                
                {/* Password requirements */}
                {passwordRequirementsText && (
                  <FormDescription className="text-xs mt-2">
                    {passwordRequirementsText}
                  </FormDescription>
                )}
                
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
              I agree to the <a href="/terms" className="text-indigo-600 hover:text-indigo-500" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" className="text-indigo-600 hover:text-indigo-500" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
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
