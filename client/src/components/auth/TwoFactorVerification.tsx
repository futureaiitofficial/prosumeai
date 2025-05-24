import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { getOrCreateDeviceId } from '../../utils/device-utils';
import { Loader2 } from 'lucide-react';

interface TwoFactorVerificationProps {
  userId: number;
  preferredMethod: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TwoFactorVerification({ 
  userId, 
  preferredMethod, 
  onSuccess, 
  onCancel 
}: TwoFactorVerificationProps) {
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [method, setMethod] = useState<string>(preferredMethod || 'EMAIL');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [showBackupCodeForm, setShowBackupCodeForm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Send email verification code automatically on mount if email is the method
  useEffect(() => {
    if (method === 'EMAIL') {
      handleResendCode();
    }
    setIsInitializing(false);
  }, [method]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get device ID for "remember this device" functionality
      const deviceId = getOrCreateDeviceId();

      // Determine which code to use based on active form
      const codeToSubmit = showBackupCodeForm ? backupCode : verificationCode;
      const methodToSubmit = showBackupCodeForm ? 'BACKUP_CODE' : method;
      
      const response = await axios.post('/api/two-factor/verify', {
        method: methodToSubmit,
        code: codeToSubmit,
        rememberDevice,
        deviceId
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Verification successful',
          variant: 'default',
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setResendingCode(true);
    try {
      // Get device ID for consistent tracking
      const deviceId = getOrCreateDeviceId();
      
      // Send request to generate a new code
      const response = await axios.post('/api/two-factor/email/send-code', {
        deviceId
      });
      
      if (response.data.success) {
        toast({
          title: 'Code Sent',
          description: 'A new verification code has been sent to your email.',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Error resending code:', error);
      toast({
        title: 'Failed to Send Code',
        description: error.response?.data?.message || 'Could not send verification code',
        variant: 'destructive',
      });
    } finally {
      setResendingCode(false);
    }
  };

  if (isInitializing) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Preparing verification...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (showBackupCodeForm) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter a backup code to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-code">Backup Code</Label>
              <Input
                id="backup-code"
                type="text"
                placeholder="Enter your backup code"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter a backup code from your list of recovery codes.
              </p>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="remember-device-backup"
                checked={rememberDevice}
                onCheckedChange={(checked) => 
                  setRememberDevice(checked as boolean)
                }
              />
              <Label htmlFor="remember-device-backup" className="text-sm">
                Remember this device for 30 days
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Verify'}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => setShowBackupCodeForm(false)}
            >
              Back to {method === 'EMAIL' ? 'email' : 'authenticator'} verification
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render verification form based on selected method
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {method === 'EMAIL' 
            ? 'Enter the verification code sent to your email' 
            : 'Enter the code from your authenticator app'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">
              {method === 'EMAIL' ? 'Email Verification Code' : 'Authenticator App Code'}
            </Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="Enter the 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              autoComplete="one-time-code"
            />
            
            {method === 'EMAIL' && (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendingCode}
                className="text-sm text-blue-600 hover:underline mt-1"
              >
                {resendingCode ? 'Sending...' : 'Resend Code'}
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="remember-device"
              checked={rememberDevice}
              onCheckedChange={(checked) => 
                setRememberDevice(checked as boolean)
              }
            />
            <Label htmlFor="remember-device" className="text-sm">
              Remember this device for 30 days
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify'}
          </Button>
          
          <div className="mt-4 pt-4 border-t">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setShowBackupCodeForm(true)}
            >
              Use a backup code instead
            </button>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
} 