import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
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

// Schema for forgot password form
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    setResetToken(null);
    setUserId(null);

    try {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      const result = await res.json();
      
      setSuccess(true);
      
      // In development, store the reset token for easy testing
      if (result.resetToken) {
        setResetToken(result.resetToken);
        setUserId(result.userId);
      }
    } catch (error: any) {
      setError(error.message || "Failed to send password reset request");
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
          Enter your email address and we'll send you a link to reset your password.
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

      {/* Success message */}
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-sm font-medium text-green-800">Password Reset Email Sent</AlertTitle>
          <AlertDescription className="text-xs text-green-700">
            If an account with that email exists, we've sent instructions to reset your password.
            Please check your email.
          </AlertDescription>
        </Alert>
      )}

      {/* In development mode, show the token for easy testing */}
      {resetToken && userId && process.env.NODE_ENV === 'development' && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <AlertTitle className="text-sm font-medium text-blue-800">Development Info</AlertTitle>
          <AlertDescription className="text-xs text-blue-700">
            <p className="mb-1">Reset Token: {resetToken}</p>
            <p>User ID: {userId}</p>
            <Link href={`/reset-password?token=${resetToken}&userId=${userId}`}>
              <a className="text-blue-800 underline">Click here to reset password</a>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-slate-700">Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    {...field}
                    autoComplete="email"
                    className="h-10 text-sm"
                  />
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
                  Sending...
                </>
              ) : (
                "Send Reset Link"
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
    </motion.div>
  );
} 