import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export default function PasswordChangeForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: PasswordChangeFormValues) => {
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      // Call your API endpoint to change password
      await axios.post('/api/user/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setIsSuccess(true);
      form.reset();
      
      toast({
        title: 'Password changed successfully',
        description: 'Your password has been updated',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      if (error.response?.status === 401) {
        form.setError('currentPassword', {
          type: 'manual',
          message: 'Current password is incorrect',
        });
        
        toast({
          title: 'Password change failed',
          description: 'Your current password is incorrect',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password change failed',
          description: error.response?.data?.message || 'An error occurred while changing your password',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Change Password</h3>
        <p className="text-sm text-muted-foreground">
          Update your password to keep your account secure
        </p>
      </div>

      {isSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-md p-4 mb-6">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium">Password changed successfully</p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 