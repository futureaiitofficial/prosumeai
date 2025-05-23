import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// Schema for reset password form
const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
  userId: string;
}

export default function ResetPasswordForm({ token, userId }: ResetPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Fetch password requirements
  useEffect(() => {
    const fetchPasswordRequirements = async () => {
      try {
        const res = await apiRequest("GET", "/api/password-requirements");
        const data = await res.json();
        setPasswordRequirements(data.text);
      } catch (error) {
        console.error("Failed to fetch password requirements:", error);
      }
    };

    fetchPasswordRequirements();
  }, []);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    setPasswordErrors([]);

    try {
      console.log(`Submitting reset request with token: ${token.substring(0, 10)}... and userId: ${userId}`);
      
      // Add a delay to ensure we can see the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Log the exact data we're sending to the server
      const requestData = {
        token,
        userId, 
        newPassword: data.newPassword,
      };
      
      // Additional logging to inspect token format
      console.log('Token details:', {
        token: token,
        tokenType: typeof token,
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 10) + '...'
      });
      
      console.log('UserId details:', {
        userId: userId,
        userIdType: typeof userId,
      });
      
      console.log('Sending reset password request with data:', {
        ...requestData,
        newPassword: '[REDACTED]' // Don't log the actual password
      });
      
      // Use fetch directly for better debug info
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });
      
      console.log('Reset password response status:', response.status);
      
      const result = await response.json();
      console.log('Reset password response data:', result);
      
      if (response.ok) {
        setSuccess(true);
        form.reset();
      } else {
        // Handle validation errors from the server
        if (result.errors && Array.isArray(result.errors)) {
          setPasswordErrors(result.errors);
        } else {
          setError(result.message || "Failed to reset password");
        }
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reset Your Password</h1>
        <p className="text-slate-600 mt-2">
          Enter a new password for your account
        </p>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-medium">Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Password policy errors */}
      {passwordErrors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-medium">Password Requirements</AlertTitle>
          <AlertDescription className="text-xs">
            <ul className="list-disc pl-4 mt-1 space-y-1">
              {passwordErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-sm font-medium text-green-800">Password Reset Successful</AlertTitle>
          <AlertDescription className="text-xs text-green-700">
            Your password has been reset successfully.
            <div className="mt-2">
              <Link href="/auth">
                <a className="text-green-800 underline font-medium">
                  Return to login
                </a>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Display password requirements */}
      {!success && passwordRequirements && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <AlertTitle className="text-sm font-medium text-blue-800">Password Requirements</AlertTitle>
          <AlertDescription className="text-xs text-blue-700">
            {passwordRequirements}
          </AlertDescription>
        </Alert>
      )}

      {!success && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        {...field}
                        autoComplete="new-password"
                        className="h-10 text-sm pr-10"
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        {...field}
                        autoComplete="new-password"
                        className="h-10 text-sm pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex flex-col space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white h-10 rounded-lg font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="flex justify-center">
                <Link href="/auth">
                  <a className="text-sm text-indigo-600 hover:text-indigo-800">
                    Return to login
                  </a>
                </Link>
              </div>
            </div>
          </form>
        </Form>
      )}
    </motion.div>
  );
} 