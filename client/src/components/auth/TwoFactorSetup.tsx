import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, Mail, Shield, KeyRound, AlertTriangle, QrCode, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TwoFactorSetupProps {
  className?: string;
}

interface TwoFactorStatus {
  enabled: boolean;
  preferredMethod: string | null;
  emailSetup: boolean;
  authenticatorSetup: boolean;
  required: boolean;
  backupCodes?: string[];
  appName: string;
}

interface BackupCode {
  code: string;
  used: boolean;
  createdAt: string;
}

export default function TwoFactorSetup({ className }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');
  
  // Setup method selection
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'authenticator' | null>(null);
  
  // Email setup states
  const [emailCode, setEmailCode] = useState('');
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false);
  
  // Authenticator setup states
  const [authenticatorSetupData, setAuthenticatorSetupData] = useState<{
    secret: string;
    qrCode: string;
  } | null>(null);
  const [authenticatorToken, setAuthenticatorToken] = useState('');
  const [verifyingAuthenticator, setVerifyingAuthenticator] = useState(false);
  
  // Backup codes state
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [loadingBackupCodes, setLoadingBackupCodes] = useState(false);
  
  // Disabling 2FA state
  const [disabling2FA, setDisabling2FA] = useState(false);

  // Fetch 2FA status on component mount
  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const fetchTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/two-factor/status');
      setStatus(response.data);
      
      // If 2FA is already set up, set active tab to status
      if (response.data.enabled) {
        setActiveTab('status');
      } else {
        // Otherwise, suggest a setup method
        setActiveTab('setup');
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load two-factor authentication status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmailCode = async () => {
    try {
      setSendingEmailCode(true);
      await axios.post('/api/two-factor/email/setup', { 
        email: status?.appName // The email should be pre-filled from the user's account
      });
      
      toast({
        title: 'Verification Code Sent',
        description: 'Please check your email for the verification code',
      });
    } catch (error) {
      console.error('Error sending email code:', error);
      toast({
        title: 'Error',
        description: 'Failed to send verification code',
        variant: 'destructive',
      });
    } finally {
      setSendingEmailCode(false);
    }
  };

  const verifyEmailCode = async () => {
    try {
      setVerifyingEmailCode(true);
      await axios.post('/api/two-factor/email/verify', { code: emailCode });
      
      // Refresh status after successful verification
      await fetchTwoFactorStatus();
      
      toast({
        title: 'Email Verification Successful',
        description: 'Email-based two-factor authentication has been enabled',
      });
      
      // Reset input field
      setEmailCode('');
      
      // Switch to status tab
      setActiveTab('status');
    } catch (error) {
      console.error('Error verifying email code:', error);
      toast({
        title: 'Verification Failed',
        description: 'Invalid or expired verification code',
        variant: 'destructive',
      });
    } finally {
      setVerifyingEmailCode(false);
    }
  };

  const setupAuthenticator = async () => {
    try {
      const response = await axios.post('/api/two-factor/authenticator/setup');
      setAuthenticatorSetupData(response.data);
    } catch (error) {
      console.error('Error setting up authenticator:', error);
      toast({
        title: 'Error',
        description: 'Failed to set up authenticator app',
        variant: 'destructive',
      });
    }
  };

  const verifyAuthenticator = async () => {
    try {
      setVerifyingAuthenticator(true);
      const response = await axios.post('/api/two-factor/authenticator/verify', { 
        token: authenticatorToken 
      });
      
      // Store backup codes if provided
      if (response.data.backupCodes) {
        setBackupCodes(response.data.backupCodes);
      }
      
      // Refresh status
      await fetchTwoFactorStatus();
      
      toast({
        title: 'Authenticator Setup Successful',
        description: 'Authenticator app has been set up successfully',
      });
      
      // Reset input field
      setAuthenticatorToken('');
      
      // If backup codes were provided, show them
      if (response.data.backupCodes) {
        setActiveTab('backup-codes');
      } else {
        // Otherwise, go back to status
        setActiveTab('status');
      }
    } catch (error) {
      console.error('Error verifying authenticator token:', error);
      toast({
        title: 'Verification Failed',
        description: 'Invalid verification token',
        variant: 'destructive',
      });
    } finally {
      setVerifyingAuthenticator(false);
    }
  };

  const getBackupCodes = async () => {
    try {
      setLoadingBackupCodes(true);
      const response = await axios.get('/api/two-factor/backup-codes');
      setBackupCodes(response.data);
      setActiveTab('backup-codes');
    } catch (error) {
      console.error('Error getting backup codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to retrieve backup codes',
        variant: 'destructive',
      });
    } finally {
      setLoadingBackupCodes(false);
    }
  };

  const disable2FA = async () => {
    try {
      setDisabling2FA(true);
      await axios.post('/api/two-factor/disable');
      
      await fetchTwoFactorStatus();
      
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled',
      });
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      
      // Special handling for policy requirement
      if (error.response?.data?.error === 'Cannot disable 2FA') {
        toast({
          title: 'Cannot Disable 2FA',
          description: 'Two-factor authentication is required by your organization\'s policy',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to disable two-factor authentication',
          variant: 'destructive',
        });
      }
    } finally {
      setDisabling2FA(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex justify-center items-center py-12", className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading two-factor authentication settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        // Reset selected method when navigating to setup tab
        if (value === 'setup') {
          setSelectedMethod(null);
        }
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="backup-codes">Backup Codes</TabsTrigger>
        </TabsList>
        
        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Two-Factor Authentication Status
              </CardTitle>
              <CardDescription>
                View and manage your current two-factor authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status?.required && (
                <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Required by organization policy</AlertTitle>
                  <AlertDescription>
                    Two-factor authentication is required by your organization's security policy and cannot be disabled.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">
                    {status?.enabled 
                      ? "Your account is protected with two-factor authentication" 
                      : "Enable two-factor authentication to add an extra layer of security"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {status?.enabled ? (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      Enabled
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setActiveTab('setup')}
                      variant="default"
                      size="sm"
                    >
                      Enable 2FA
                    </Button>
                  )}
                </div>
              </div>
              
              {status?.enabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Active Methods</h3>
                    
                    <div className="grid gap-4">
                      {status?.emailSetup && (
                        <div className="flex items-center gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-800/50">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <div className="font-medium text-sm">Email Verification</div>
                            <div className="text-xs text-muted-foreground">
                              Verification codes will be sent to your email
                            </div>
                          </div>
                          {status?.preferredMethod === 'EMAIL' && (
                            <div className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                              Primary
                            </div>
                          )}
                        </div>
                      )}
                      
                      {status?.authenticatorSetup && (
                        <div className="flex items-center gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-800/50">
                          <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                            <KeyRound className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <div className="font-medium text-sm">Authenticator App</div>
                            <div className="text-xs text-muted-foreground">
                              Generate codes with your authenticator app
                            </div>
                          </div>
                          {status?.preferredMethod === 'AUTHENTICATOR_APP' && (
                            <div className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 rounded-full">
                              Primary
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={getBackupCodes}
                      variant="outline"
                      disabled={loadingBackupCodes}
                      className="flex-1"
                    >
                      {loadingBackupCodes ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "View Backup Codes"
                      )}
                    </Button>
                    
                    {!status?.required && (
                      <Button
                        onClick={disable2FA}
                        variant="destructive"
                        disabled={disabling2FA}
                        className="flex-1"
                      >
                        {disabling2FA ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disabling...
                          </>
                        ) : (
                          "Disable 2FA"
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Set Up Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Secure your account with an additional layer of protection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedMethod ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your preferred verification method to protect your account.
                    Two-factor authentication adds an extra security layer by requiring
                    a verification code in addition to your password.
                  </p>
                  
                  <div className="grid gap-4">
                    <Button
                      onClick={() => setSelectedMethod('email')}
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-4 px-4"
                      disabled={status?.emailSetup}
                    >
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-sm">Email Verification</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Receive verification codes via email
                        </p>
                      </div>
                      {status?.emailSetup && (
                        <div className="ml-auto">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => setSelectedMethod('authenticator')}
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-4 px-4"
                      disabled={status?.authenticatorSetup}
                    >
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                        <KeyRound className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-sm">Authenticator App</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Use an app like Google Authenticator or Authy
                        </p>
                      </div>
                      {status?.authenticatorSetup && (
                        <div className="ml-auto">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </Button>
                  </div>
                  
                  {(status?.emailSetup || status?.authenticatorSetup) && (
                    <div className="mt-4 text-sm text-center">
                      <p className="text-muted-foreground">
                        {status?.emailSetup && status?.authenticatorSetup 
                          ? "You've already set up both verification methods." 
                          : "You've already set up one verification method."}
                        <br />
                        You can add another method or go back to the Status tab.
                      </p>
                      <Button 
                        onClick={() => setActiveTab('status')} 
                        variant="link" 
                        className="mt-2"
                      >
                        Go to Status
                      </Button>
                    </div>
                  )}
                </>
              ) : selectedMethod === 'email' ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => setSelectedMethod(null)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      <span className="sr-only">Back</span>
                    </Button>
                    <h3 className="font-medium">Email Verification Setup</h3>
                  </div>
                
                  {status?.emailSetup ? (
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Email verification is already set up
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-300">
                        <Mail className="h-4 w-4" />
                        <AlertTitle>Email Verification</AlertTitle>
                        <AlertDescription>
                          We'll send a verification code to your email address.
                          Enter the code below to complete setup.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Button
                          onClick={sendEmailCode}
                          disabled={sendingEmailCode}
                          className="w-full"
                        >
                          {sendingEmailCode ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending Code...
                            </>
                          ) : (
                            "Send Verification Code"
                          )}
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email-code">Verification Code</Label>
                        <Input
                          id="email-code"
                          placeholder="Enter the 6-digit code"
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value)}
                          maxLength={6}
                        />
                      </div>
                      
                      <Button
                        onClick={verifyEmailCode}
                        disabled={verifyingEmailCode || emailCode.length !== 6}
                        className="w-full"
                        variant="default"
                      >
                        {verifyingEmailCode ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify Code"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : selectedMethod === 'authenticator' && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => setSelectedMethod(null)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      <span className="sr-only">Back</span>
                    </Button>
                    <h3 className="font-medium">Authenticator App Setup</h3>
                  </div>
                
                  {status?.authenticatorSetup ? (
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Authenticator app is already set up
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert variant="default" className="bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800/30 dark:text-purple-300">
                        <KeyRound className="h-4 w-4" />
                        <AlertTitle>Authenticator App Setup</AlertTitle>
                        <AlertDescription>
                          Use an app like Google Authenticator, Authy, or Microsoft Authenticator to generate verification codes.
                        </AlertDescription>
                      </Alert>
                      
                      {authenticatorSetupData ? (
                        <div className="space-y-4">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="bg-white p-2 rounded-lg">
                              <img
                                src={authenticatorSetupData.qrCode}
                                alt="QR Code for Authenticator App"
                                className="h-48 w-48"
                              />
                            </div>
                            <div className="text-xs text-center text-muted-foreground max-w-xs">
                              Scan this QR code with your authenticator app or enter the secret key manually:
                            </div>
                            <code className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-sm font-mono">
                              {authenticatorSetupData.secret}
                            </code>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="authenticator-token">Verification Code</Label>
                            <Input
                              id="authenticator-token"
                              placeholder="Enter the 6-digit code"
                              value={authenticatorToken}
                              onChange={(e) => setAuthenticatorToken(e.target.value)}
                              maxLength={6}
                            />
                          </div>
                          
                          <Button
                            onClick={verifyAuthenticator}
                            disabled={verifyingAuthenticator || authenticatorToken.length !== 6}
                            className="w-full"
                            variant="default"
                          >
                            {verifyingAuthenticator ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              "Verify Code"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={setupAuthenticator}
                          className="w-full"
                          variant="default"
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          Set Up Authenticator App
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Backup Codes Tab */}
        <TabsContent value="backup-codes" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Backup Codes
              </CardTitle>
              <CardDescription>
                Save these backup codes in a secure place to use when you don't have access to your primary 2FA method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {backupCodes.length > 0 ? (
                <div className="space-y-4">
                  <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900/50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Store these securely</AlertTitle>
                    <AlertDescription>
                      Each backup code can only be used once. Store them somewhere safe and accessible.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {backupCodes.map((codeData, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-2 rounded-md text-center font-mono text-sm", 
                          codeData.used 
                            ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 line-through"
                            : "bg-slate-100 dark:bg-slate-800"
                        )}
                      >
                        {codeData.code}
                        {codeData.used && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Used</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => {
                      const unusedCodes = backupCodes
                        .filter(codeData => !codeData.used)
                        .map(codeData => codeData.code);
                      
                      if (unusedCodes.length === 0) {
                        toast({
                          title: 'No Unused Codes',
                          description: 'All backup codes have been used. Please generate new codes.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      const text = unusedCodes.join('\n');
                      navigator.clipboard.writeText(text);
                      toast({
                        title: 'Copied to Clipboard',
                        description: 'Backup codes have been copied to your clipboard',
                      });
                    }}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Copy Unused Codes
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 mb-4">
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                      <KeyRound className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No backup codes available</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                      Backup codes are generated when you set up an authenticator app. They allow you to sign in when you don't have access to your primary 2FA method.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveTab('status')}
              >
                Back to Status
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 