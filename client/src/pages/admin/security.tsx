import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { AdminLayout } from '@/components/admin/layout';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Check, Shield, Database, Key, LockKeyhole, Clock, Users } from 'lucide-react';
import axios from 'axios';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

// Type definitions
type EncryptionFieldConfig = {
  [model: string]: {
    fields: string[];
    enabled: boolean;
  }
};

type EncryptionConfig = {
  config: EncryptionFieldConfig;
  enabled: boolean;
};

type PasswordPolicy = {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  preventReuseCount: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
};

type SessionConfig = {
  maxAge: number;
  inactivityTimeout: number;
  absoluteTimeout: number;
  singleSession: boolean;
  regenerateAfterLogin: boolean;
  rotateSecretInterval: number;
};

type FreemiumRestrictions = {
  enabled: boolean;
  maxAccountsPerIp: number;
  maxAccountsPerDevice: number;
  trackIpAddresses: boolean;
  trackDevices: boolean;
};

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState('encryption');
  const [loading, setLoading] = useState(true);
  const [encryptionConfig, setEncryptionConfig] = useState<EncryptionConfig | null>(null);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy | null>(null);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [freemiumRestrictions, setFreemiumRestrictions] = useState<FreemiumRestrictions | null>(null);
  const [rotateKeyLoading, setRotateKeyLoading] = useState(false);

  const { toast } = useToast();

  // Load encryption configuration
  useEffect(() => {
    fetchEncryptionConfig();
    fetchPasswordPolicy();
    fetchSessionConfig();
    fetchFreemiumRestrictions();
  }, []);

  const fetchEncryptionConfig = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/admin/security/encryption');
      setEncryptionConfig(data);
    } catch (error) {
      console.error('Error fetching encryption configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load encryption configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPasswordPolicy = async () => {
    try {
      const { data } = await axios.get('/api/admin/security/password-policy');
      setPasswordPolicy(data);
    } catch (error) {
      console.error('Error fetching password policy:', error);
      toast({
        title: "Error",
        description: "Failed to load password policy",
        variant: "destructive"
      });
    }
  };

  const fetchSessionConfig = async () => {
    try {
      const { data } = await axios.get('/api/admin/security/session-config');
      setSessionConfig(data);
    } catch (error) {
      console.error('Error fetching session configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load session configuration",
        variant: "destructive"
      });
    }
  };

  const fetchFreemiumRestrictions = async () => {
    try {
      const { data } = await axios.get('/api/admin/security/session-config');
      // Extract freemiumRestrictions from session config
      if (data && data.freemiumRestrictions) {
        setFreemiumRestrictions(data.freemiumRestrictions);
      } else {
        setFreemiumRestrictions({
          enabled: true,
          maxAccountsPerIp: 1,
          maxAccountsPerDevice: 1,
          trackIpAddresses: true,
          trackDevices: true
        });
      }
    } catch (error) {
      console.error('Error fetching freemium restrictions:', error);
      toast({
        title: "Error",
        description: "Failed to load freemium restrictions",
        variant: "destructive"
      });
    }
  };

  const toggleEncryption = async (enabled: boolean) => {
    try {
      const { data } = await axios.post('/api/admin/security/encryption/toggle', { enabled });
      setEncryptionConfig(prev => prev ? { ...prev, enabled } : null);
      toast({
        title: "Success",
        description: `Encryption ${enabled ? 'enabled' : 'disabled'} successfully`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error toggling encryption:', error);
      toast({
        title: "Error",
        description: "Failed to toggle encryption",
        variant: "destructive"
      });
    }
  };

  const toggleModelEncryption = async (modelName: string, enabled: boolean) => {
    if (!encryptionConfig) return;
    
    try {
      // Update local state first for immediate feedback
      const updatedConfig = {
        ...encryptionConfig,
        config: {
          ...encryptionConfig.config,
          [modelName]: {
            ...encryptionConfig.config[modelName],
            enabled
          }
        }
      };
      
      setEncryptionConfig(updatedConfig);
      
      // Send update to server
      await axios.put('/api/admin/security/encryption/config', {
        config: updatedConfig.config
      });
      
      toast({
        title: "Success",
        description: `Encryption for ${modelName} ${enabled ? 'enabled' : 'disabled'}`,
        variant: "default"
      });
    } catch (error) {
      console.error(`Error toggling encryption for ${modelName}:`, error);
      toast({
        title: "Error",
        description: `Failed to update encryption settings for ${modelName}`,
        variant: "destructive"
      });
      
      // Revert local state on error
      fetchEncryptionConfig();
    }
  };

  const rotateEncryptionKeys = async () => {
    if (confirm('Are you sure you want to rotate encryption keys? This operation will re-encrypt all sensitive data and may take some time.')) {
      try {
        setRotateKeyLoading(true);
        await axios.post('/api/admin/security/encryption/rotate-keys');
        toast({
          title: "Success",
          description: "Encryption keys rotated successfully",
          variant: "default"
        });
      } catch (error) {
        console.error('Error rotating encryption keys:', error);
        toast({
          title: "Error",
          description: "Failed to rotate encryption keys",
          variant: "destructive"
        });
      } finally {
        setRotateKeyLoading(false);
      }
    }
  };

  const updatePasswordPolicy = async (updatedPolicy: PasswordPolicy) => {
    try {
      await axios.put('/api/admin/security/password-policy', updatedPolicy);
      setPasswordPolicy(updatedPolicy);
      toast({
        title: "Success",
        description: "Password policy updated successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating password policy:', error);
      toast({
        title: "Error",
        description: "Failed to update password policy",
        variant: "destructive"
      });
    }
  };

  const updateSessionConfig = async (updatedConfig: SessionConfig) => {
    try {
      await axios.put('/api/admin/security/session-config', updatedConfig);
      setSessionConfig(updatedConfig);
      toast({
        title: "Success",
        description: "Session configuration updated successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating session configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update session configuration",
        variant: "destructive"
      });
    }
  };

  const updateFreemiumRestrictions = async (updatedRestrictions: FreemiumRestrictions) => {
    try {
      await axios.post('/api/admin/freemium-restrictions', updatedRestrictions);
      setFreemiumRestrictions(updatedRestrictions);
      toast({
        title: "Success",
        description: "Freemium restrictions updated successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating freemium restrictions:', error);
      toast({
        title: "Error",
        description: "Failed to update freemium restrictions",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Security Settings</h1>
            <p className="text-muted-foreground">
              Manage security settings and data protection for your application
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="encryption" className="flex items-center gap-2">
              <LockKeyhole size={16} />
              <span>Data Encryption</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Key size={16} />
              <span>Password Policy</span>
            </TabsTrigger>
            <TabsTrigger value="session" className="flex items-center gap-2">
              <Clock size={16} />
              <span>Session Security</span>
            </TabsTrigger>
            <TabsTrigger value="freemium" className="flex items-center gap-2">
              <Users size={16} />
              <span>Freemium Restrictions</span>
            </TabsTrigger>
          </TabsList>

          {/* Data Encryption Tab */}
          <TabsContent value="encryption">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database size={18} />
                  <span>Data Encryption</span>
                </CardTitle>
                <CardDescription>
                  Configure encryption for sensitive user data stored in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="h-8 w-8" />
                  </div>
                ) : encryptionConfig ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div className="space-y-0.5">
                        <h3 className="font-semibold">Global Encryption</h3>
                        <p className="text-sm text-muted-foreground">
                          Enable or disable encryption for all sensitive data
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={encryptionConfig.enabled}
                          onCheckedChange={toggleEncryption}
                          aria-label="Toggle global encryption"
                        />
                        <Label htmlFor="encryption">
                          {encryptionConfig.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={rotateEncryptionKeys}
                      disabled={!encryptionConfig.enabled || rotateKeyLoading}
                      className="flex items-center gap-2"
                    >
                      {rotateKeyLoading ? <Spinner className="h-4 w-4" /> : <Key size={16} />}
                      <span>Rotate Encryption Keys</span>
                    </Button>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Encryption Configuration</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data Model</TableHead>
                            <TableHead>Encrypted Fields</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(encryptionConfig.config).map(([modelName, modelConfig]) => (
                            <TableRow key={modelName}>
                              <TableCell className="font-medium">
                                {modelName.charAt(0).toUpperCase() + modelName.slice(1)}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1.5">
                                  {modelConfig.fields.map((field) => (
                                    <span 
                                      key={field} 
                                      className={`px-2 py-0.5 text-xs rounded-full ${
                                        encryptionConfig.enabled && modelConfig.enabled
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {field}
                                    </span>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  encryptionConfig.enabled && modelConfig.enabled
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {encryptionConfig.enabled && modelConfig.enabled
                                    ? 'Encrypted'
                                    : 'Not Encrypted'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Switch
                                  checked={modelConfig.enabled}
                                  onCheckedChange={(enabled) => toggleModelEncryption(modelName, enabled)}
                                  disabled={!encryptionConfig.enabled}
                                  aria-label={`Enable encryption for ${modelName}`}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Important Note
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              Enabling encryption will protect sensitive data at rest, but may slightly impact performance. 
                              Key rotation should be performed during low-traffic periods as it requires re-encrypting all data.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-8 text-red-500">
                    Failed to load encryption configuration
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Policy Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key size={18} />
                  <span>Password Policy</span>
                </CardTitle>
                <CardDescription>
                  Configure password requirements and security policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordPolicy ? (
                  <div className="space-y-6">
                    {/* Password policy settings UI here */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minLength">Minimum Password Length</Label>
                        <input
                          id="minLength"
                          type="number"
                          min="6"
                          max="32"
                          value={passwordPolicy.minLength}
                          onChange={(e) => setPasswordPolicy({
                            ...passwordPolicy,
                            minLength: parseInt(e.target.value)
                          })}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="passwordExpiryDays">Password Expiry (Days)</Label>
                        <input
                          id="passwordExpiryDays"
                          type="number"
                          min="0"
                          max="365"
                          value={passwordPolicy.passwordExpiryDays}
                          onChange={(e) => setPasswordPolicy({
                            ...passwordPolicy,
                            passwordExpiryDays: parseInt(e.target.value)
                          })}
                          className="w-full p-2 border rounded-md"
                        />
                        <p className="text-xs text-muted-foreground">
                          Set to 0 for no expiration
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h3 className="font-semibold">Require Uppercase Letters</h3>
                          <p className="text-sm text-muted-foreground">
                            Passwords must contain at least one uppercase letter
                          </p>
                        </div>
                        <Switch
                          checked={passwordPolicy.requireUppercase}
                          onCheckedChange={(checked) => setPasswordPolicy({
                            ...passwordPolicy,
                            requireUppercase: checked
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h3 className="font-semibold">Require Lowercase Letters</h3>
                          <p className="text-sm text-muted-foreground">
                            Passwords must contain at least one lowercase letter
                          </p>
                        </div>
                        <Switch
                          checked={passwordPolicy.requireLowercase}
                          onCheckedChange={(checked) => setPasswordPolicy({
                            ...passwordPolicy,
                            requireLowercase: checked
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h3 className="font-semibold">Require Numbers</h3>
                          <p className="text-sm text-muted-foreground">
                            Passwords must contain at least one number
                          </p>
                        </div>
                        <Switch
                          checked={passwordPolicy.requireNumbers}
                          onCheckedChange={(checked) => setPasswordPolicy({
                            ...passwordPolicy,
                            requireNumbers: checked
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h3 className="font-semibold">Require Special Characters</h3>
                          <p className="text-sm text-muted-foreground">
                            Passwords must contain at least one special character
                          </p>
                        </div>
                        <Switch
                          checked={passwordPolicy.requireSpecialChars}
                          onCheckedChange={(checked) => setPasswordPolicy({
                            ...passwordPolicy,
                            requireSpecialChars: checked
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="preventReuseCount">Prevent Password Reuse</Label>
                        <input
                          id="preventReuseCount"
                          type="number"
                          min="0"
                          max="10"
                          value={passwordPolicy.preventReuseCount}
                          onChange={(e) => setPasswordPolicy({
                            ...passwordPolicy,
                            preventReuseCount: parseInt(e.target.value)
                          })}
                          className="w-full p-2 border rounded-md"
                        />
                        <p className="text-xs text-muted-foreground">
                          Number of previous passwords that cannot be reused
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxFailedAttempts">Max Failed Login Attempts</Label>
                        <input
                          id="maxFailedAttempts"
                          type="number"
                          min="1"
                          max="10"
                          value={passwordPolicy.maxFailedAttempts}
                          onChange={(e) => setPasswordPolicy({
                            ...passwordPolicy,
                            maxFailedAttempts: parseInt(e.target.value)
                          })}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lockoutDurationMinutes">Account Lockout Duration (Minutes)</Label>
                        <input
                          id="lockoutDurationMinutes"
                          type="number"
                          min="5"
                          max="1440"
                          value={passwordPolicy.lockoutDurationMinutes}
                          onChange={(e) => setPasswordPolicy({
                            ...passwordPolicy,
                            lockoutDurationMinutes: parseInt(e.target.value)
                          })}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => updatePasswordPolicy(passwordPolicy)}
                      className="flex items-center gap-2"
                    >
                      <Check size={16} />
                      <span>Save Password Policy</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <Spinner className="h-8 w-8" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Session Security Tab */}
          <TabsContent value="session">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>Session Security</span>
                </CardTitle>
                <CardDescription>
                  Configure session timeouts and security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionConfig ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxAge">Session Maximum Age</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="maxAge"
                            type="number"
                            min="60000"
                            step="60000"
                            value={sessionConfig.maxAge}
                            onChange={(e) => setSessionConfig({
                              ...sessionConfig,
                              maxAge: parseInt(e.target.value)
                            })}
                            className="w-full p-2 border rounded-md"
                          />
                          <span className="text-sm text-muted-foreground">
                            ({formatDuration(sessionConfig.maxAge)})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Maximum duration of a session in milliseconds
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="inactivityTimeout">Inactivity Timeout</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="inactivityTimeout"
                            type="number"
                            min="60000"
                            step="60000"
                            value={sessionConfig.inactivityTimeout}
                            onChange={(e) => setSessionConfig({
                              ...sessionConfig,
                              inactivityTimeout: parseInt(e.target.value)
                            })}
                            className="w-full p-2 border rounded-md"
                          />
                          <span className="text-sm text-muted-foreground">
                            ({formatDuration(sessionConfig.inactivityTimeout)})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Time after which an inactive session expires
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h3 className="font-semibold">Single Active Session</h3>
                          <p className="text-sm text-muted-foreground">
                            Limit users to one active session at a time
                          </p>
                        </div>
                        <Switch
                          checked={sessionConfig.singleSession}
                          onCheckedChange={(checked) => setSessionConfig({
                            ...sessionConfig,
                            singleSession: checked
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h3 className="font-semibold">Regenerate After Login</h3>
                          <p className="text-sm text-muted-foreground">
                            Create a new session ID after successful login
                          </p>
                        </div>
                        <Switch
                          checked={sessionConfig.regenerateAfterLogin}
                          onCheckedChange={(checked) => setSessionConfig({
                            ...sessionConfig,
                            regenerateAfterLogin: checked
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="rotateSecretInterval">Secret Rotation Interval</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="rotateSecretInterval"
                            type="number"
                            min="3600000"
                            step="3600000"
                            value={sessionConfig.rotateSecretInterval}
                            onChange={(e) => setSessionConfig({
                              ...sessionConfig,
                              rotateSecretInterval: parseInt(e.target.value)
                            })}
                            className="w-full p-2 border rounded-md"
                          />
                          <span className="text-sm text-muted-foreground">
                            ({formatDuration(sessionConfig.rotateSecretInterval)})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Interval for rotating session secrets
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => updateSessionConfig(sessionConfig)}
                      className="flex items-center gap-2"
                    >
                      <Check size={16} />
                      <span>Save Session Configuration</span>
                    </Button>

                    <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Note
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              Some session configuration changes may require a server restart to take full effect.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <Spinner className="h-8 w-8" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Freemium Restrictions Tab */}
          <TabsContent value="freemium">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={18} />
                  <span>Freemium Account Restrictions</span>
                </CardTitle>
                <CardDescription>
                  Configure restrictions for freemium accounts to prevent fraud
                </CardDescription>
              </CardHeader>
              <CardContent>
                {freemiumRestrictions ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h3 className="font-semibold">Enable Freemium Restrictions</h3>
                          <p className="text-sm text-muted-foreground">
                            Enable or disable all freemium account restrictions
                          </p>
                        </div>
                        <Switch
                          checked={freemiumRestrictions.enabled}
                          onCheckedChange={(checked) => setFreemiumRestrictions({
                            ...freemiumRestrictions,
                            enabled: checked
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxAccountsPerIp">Max Accounts Per IP</Label>
                        <input
                          id="maxAccountsPerIp"
                          type="number"
                          min="1"
                          max="10"
                          value={freemiumRestrictions.maxAccountsPerIp}
                          onChange={(e) => setFreemiumRestrictions({
                            ...freemiumRestrictions,
                            maxAccountsPerIp: parseInt(e.target.value)
                          })}
                          disabled={!freemiumRestrictions.enabled}
                          className="w-full p-2 border rounded-md"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum number of freemium accounts allowed per IP address
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h3 className="font-semibold">Track IP Addresses</h3>
                          <p className="text-sm text-muted-foreground">
                            Track and limit freemium accounts by IP address
                          </p>
                        </div>
                        <Switch
                          checked={freemiumRestrictions.trackIpAddresses}
                          onCheckedChange={(checked) => setFreemiumRestrictions({
                            ...freemiumRestrictions,
                            trackIpAddresses: checked
                          })}
                          disabled={!freemiumRestrictions.enabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxAccountsPerDevice">Max Accounts Per Device</Label>
                        <input
                          id="maxAccountsPerDevice"
                          type="number"
                          min="1"
                          max="10"
                          value={freemiumRestrictions.maxAccountsPerDevice}
                          onChange={(e) => setFreemiumRestrictions({
                            ...freemiumRestrictions,
                            maxAccountsPerDevice: parseInt(e.target.value)
                          })}
                          disabled={!freemiumRestrictions.enabled}
                          className="w-full p-2 border rounded-md"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum number of freemium accounts allowed per device
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h3 className="font-semibold">Track Devices</h3>
                          <p className="text-sm text-muted-foreground">
                            Track and limit freemium accounts by device fingerprint
                          </p>
                        </div>
                        <Switch
                          checked={freemiumRestrictions.trackDevices}
                          onCheckedChange={(checked) => setFreemiumRestrictions({
                            ...freemiumRestrictions,
                            trackDevices: checked
                          })}
                          disabled={!freemiumRestrictions.enabled}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => updateFreemiumRestrictions(freemiumRestrictions)}
                      className="flex items-center gap-2"
                      disabled={!freemiumRestrictions.enabled}
                    >
                      <Check size={16} />
                      <span>Save Freemium Restrictions</span>
                    </Button>

                    <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Information
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>
                              These restrictions help prevent users from creating multiple freemium accounts to bypass limitations.
                              Freemium accounts do not reset feature usage counts and do not show billing cycles.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <Spinner className="h-8 w-8" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 