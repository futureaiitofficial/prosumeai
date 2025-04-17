import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckIcon, 
  Save,
  Upload,
  RefreshCw
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Settings type
interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  defaultUserRole: string;
  termsAndConditions: string;
  privacyPolicy: string;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  enableEmailNotifications: boolean;
  welcomeEmailTemplate: string;
  resetPasswordTemplate: string;
  verificationEmailTemplate: string;
}

interface IntegrationSettings {
  enableOpenAI: boolean;
  openAIApiKey: string;
  enableGoogleAnalytics: boolean;
  googleAnalyticsId: string;
  enableReCaptcha: boolean;
  reCaptchaSiteKey: string;
  reCaptchaSecretKey: string;
  enableStripe: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  enableRazorpay: boolean;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
}

interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  loginMaxAttempts: number;
  loginLockoutDuration: number;
  sessionTimeout: number;
  enableTwoFactorAuth: boolean;
  requireStrongPasswords: boolean;
}

// Mock settings data
const mockGeneralSettings: GeneralSettings = {
  siteName: "Prosume",
  siteDescription: "Professional Resume and Job Application Management Platform",
  contactEmail: "support@prosume.app",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  primaryColor: "#0070f3",
  allowUserRegistration: true,
  requireEmailVerification: true,
  defaultUserRole: "user",
  termsAndConditions: "# Terms and Conditions\n\nThese are the terms and conditions for using the Prosume platform...",
  privacyPolicy: "# Privacy Policy\n\nThis privacy policy describes how we collect, use, and share your personal information..."
};

const mockEmailSettings: EmailSettings = {
  smtpHost: "smtp.example.com",
  smtpPort: 587,
  smtpUsername: "no-reply@prosume.app",
  smtpPassword: "••••••••••••",
  smtpFromEmail: "no-reply@prosume.app",
  smtpFromName: "Prosume Support",
  enableEmailNotifications: true,
  welcomeEmailTemplate: "Welcome to Prosume! We're excited to have you on board...",
  resetPasswordTemplate: "You have requested to reset your password. Click the link below to proceed...",
  verificationEmailTemplate: "Please verify your email address by clicking the link below..."
};

const mockIntegrationSettings: IntegrationSettings = {
  enableOpenAI: true,
  openAIApiKey: "••••••••••••••••••••••••••••••••••",
  enableGoogleAnalytics: true,
  googleAnalyticsId: "G-EXAMPLE123",
  enableReCaptcha: true,
  reCaptchaSiteKey: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
  reCaptchaSecretKey: "••••••••••••••••••••••••••••••••",
  enableStripe: true,
  stripePublishableKey: "pk_test_example",
  stripeSecretKey: "••••••••••••••••••••••••••••••••",
  enableRazorpay: false,
  razorpayKeyId: "",
  razorpayKeySecret: "••••••••••••••••••••••••••••••••",
  razorpayWebhookSecret: "••••••••••••••••••••••••••••••••"
};

const mockSecuritySettings: SecuritySettings = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: false,
  loginMaxAttempts: 5,
  loginLockoutDuration: 30,
  sessionTimeout: 60,
  enableTwoFactorAuth: false,
  requireStrongPasswords: true
};

export function SettingsOverview() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  // Form state for each settings tab
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(mockGeneralSettings);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(mockEmailSettings);
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>(mockIntegrationSettings);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(mockSecuritySettings);
  
  // Fetch settings - replace with real API call in production
  const { isLoading: isLoadingGeneralSettings } = useQuery({
    queryKey: ["/api/admin/settings/general"],
    queryFn: async () => {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockGeneralSettings;
    },
    enabled: false, // Disable for now as we're using mock data
  });
  
  // Save settings mutations - replace with real API calls in production
  const saveGeneralSettingsMutation = useMutation({
    mutationFn: async (settings: GeneralSettings) => {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return settings;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "General settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const saveEmailSettingsMutation = useMutation({
    mutationFn: async (settings: EmailSettings) => {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return settings;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Email settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const saveIntegrationSettingsMutation = useMutation({
    mutationFn: async (settings: IntegrationSettings) => {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return settings;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Integration settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const saveSecuritySettingsMutation = useMutation({
    mutationFn: async (settings: SecuritySettings) => {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return settings;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Security settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Test email connection
  const testEmailConnectionMutation = useMutation({
    mutationFn: async () => {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Connection Successful",
        description: "Email server connection was successful!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: `Email server connection failed: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Fetch Razorpay settings - replace mock data with real API
  const { isLoading: isRazorpayLoading } = useQuery({
    queryKey: ["/api/admin/setting/razorpay"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/setting/razorpay");
        
        if (!response.ok) {
          throw new Error("Failed to fetch Razorpay settings");
        }
        
        const data = await response.json();
        
        // Update integration settings with real Razorpay data
        if (data && data.value) {
          setIntegrationSettings(prev => ({
            ...prev,
            enableRazorpay: data.value.enabled || false,
            razorpayKeyId: data.value.keyId || "",
            razorpayKeySecret: "••••••••••••••••••••••••••••••••", // Don't show real secret
            razorpayWebhookSecret: "••••••••••••••••••••••••••••••••" // Don't show real secret
          }));
        }
        
        return data;
      } catch (error) {
        console.error("Error fetching Razorpay settings:", error);
        return null;
      }
    },
    enabled: true, // Enable fetch on component mount
  });
  
  // Save Razorpay settings mutation
  const saveRazorpaySettingsMutation = useMutation({
    mutationFn: async (settings: {
      enabled: boolean;
      keyId: string;
      keySecret: string;
      webhookSecret: string;
      testMode: boolean;
    }) => {
      const response = await fetch("/api/admin/settings/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save Razorpay settings");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Razorpay settings have been updated successfully.",
      });
      
      // Invalidate the query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/setting/razorpay"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save Razorpay settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submissions
  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeneralSettingsMutation.mutate(generalSettings);
  };
  
  const handleSaveEmailSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailSettingsMutation.mutate(emailSettings);
  };
  
  // Handle saving Razorpay settings separately
  const handleSaveRazorpaySettings = () => {
    saveRazorpaySettingsMutation.mutate({
      enabled: integrationSettings.enableRazorpay,
      keyId: integrationSettings.razorpayKeyId,
      keySecret: integrationSettings.razorpayKeySecret === "••••••••••••••••••••••••••••••••" 
        ? "" // Don't send placeholder, server will keep existing
        : integrationSettings.razorpayKeySecret,
      webhookSecret: integrationSettings.razorpayWebhookSecret === "••••••••••••••••••••••••••••••••"
        ? "" // Don't send placeholder, server will keep existing
        : integrationSettings.razorpayWebhookSecret,
      testMode: true
    });
  };
  
  // Update the handleSaveIntegrationSettings function to call handleSaveRazorpaySettings for Razorpay
  const handleSaveIntegrationSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save Razorpay settings separately
    handleSaveRazorpaySettings();
    
    // Save other integration settings
    saveIntegrationSettingsMutation.mutate(integrationSettings);
  };
  
  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSecuritySettingsMutation.mutate(securitySettings);
  };
  
  // Test email connection
  const handleTestEmailConnection = () => {
    testEmailConnectionMutation.mutate();
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure application settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general">
              <form onSubmit={handleSaveGeneralSettings}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={generalSettings.siteName}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings,
                          siteName: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={generalSettings.contactEmail}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings,
                          contactEmail: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={generalSettings.siteDescription}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        siteDescription: e.target.value
                      })}
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoUpload">Site Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {generalSettings.logoUrl ? (
                            <img
                              src={generalSettings.logoUrl}
                              alt="Logo"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">No logo</span>
                          )}
                        </div>
                        <Button type="button" variant="outline" size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="faviconUpload">Favicon</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {generalSettings.faviconUrl ? (
                            <img
                              src={generalSettings.faviconUrl}
                              alt="Favicon"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">No favicon</span>
                          )}
                        </div>
                        <Button type="button" variant="outline" size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Favicon
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded-full border"
                        style={{ backgroundColor: generalSettings.primaryColor }}
                      />
                      <Input
                        id="primaryColor"
                        type="text"
                        value={generalSettings.primaryColor}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings,
                          primaryColor: e.target.value
                        })}
                        className="w-32"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowUserRegistration"
                          checked={generalSettings.allowUserRegistration}
                          onCheckedChange={(checked) => setGeneralSettings({
                            ...generalSettings,
                            allowUserRegistration: checked === true
                          })}
                        />
                        <Label htmlFor="allowUserRegistration">
                          Allow User Registration
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireEmailVerification"
                          checked={generalSettings.requireEmailVerification}
                          onCheckedChange={(checked) => setGeneralSettings({
                            ...generalSettings,
                            requireEmailVerification: checked === true
                          })}
                        />
                        <Label htmlFor="requireEmailVerification">
                          Require Email Verification
                        </Label>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="defaultUserRole">Default User Role</Label>
                      <Select
                        value={generalSettings.defaultUserRole}
                        onValueChange={(value) => setGeneralSettings({
                          ...generalSettings,
                          defaultUserRole: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select default role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                    <Textarea
                      id="termsAndConditions"
                      value={generalSettings.termsAndConditions}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        termsAndConditions: e.target.value
                      })}
                      rows={5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                    <Textarea
                      id="privacyPolicy"
                      value={generalSettings.privacyPolicy}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        privacyPolicy: e.target.value
                      })}
                      rows={5}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saveGeneralSettingsMutation.isPending}
                  >
                    {saveGeneralSettingsMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Email Settings */}
            <TabsContent value="email">
              <form onSubmit={handleSaveEmailSettings}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={emailSettings.smtpHost}
                        onChange={(e) => setEmailSettings({
                          ...emailSettings,
                          smtpHost: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={emailSettings.smtpPort}
                        onChange={(e) => setEmailSettings({
                          ...emailSettings,
                          smtpPort: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUsername">SMTP Username</Label>
                      <Input
                        id="smtpUsername"
                        value={emailSettings.smtpUsername}
                        onChange={(e) => setEmailSettings({
                          ...emailSettings,
                          smtpUsername: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={emailSettings.smtpPassword}
                        onChange={(e) => setEmailSettings({
                          ...emailSettings,
                          smtpPassword: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpFromEmail">From Email</Label>
                      <Input
                        id="smtpFromEmail"
                        type="email"
                        value={emailSettings.smtpFromEmail}
                        onChange={(e) => setEmailSettings({
                          ...emailSettings,
                          smtpFromEmail: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpFromName">From Name</Label>
                      <Input
                        id="smtpFromName"
                        value={emailSettings.smtpFromName}
                        onChange={(e) => setEmailSettings({
                          ...emailSettings,
                          smtpFromName: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableEmailNotifications"
                      checked={emailSettings.enableEmailNotifications}
                      onCheckedChange={(checked) => setEmailSettings({
                        ...emailSettings,
                        enableEmailNotifications: checked === true
                      })}
                    />
                    <Label htmlFor="enableEmailNotifications">
                      Enable Email Notifications
                    </Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="welcomeEmailTemplate">Welcome Email Template</Label>
                    <Textarea
                      id="welcomeEmailTemplate"
                      value={emailSettings.welcomeEmailTemplate}
                      onChange={(e) => setEmailSettings({
                        ...emailSettings,
                        welcomeEmailTemplate: e.target.value
                      })}
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resetPasswordTemplate">Reset Password Email Template</Label>
                    <Textarea
                      id="resetPasswordTemplate"
                      value={emailSettings.resetPasswordTemplate}
                      onChange={(e) => setEmailSettings({
                        ...emailSettings,
                        resetPasswordTemplate: e.target.value
                      })}
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="verificationEmailTemplate">Email Verification Template</Label>
                    <Textarea
                      id="verificationEmailTemplate"
                      value={emailSettings.verificationEmailTemplate}
                      onChange={(e) => setEmailSettings({
                        ...emailSettings,
                        verificationEmailTemplate: e.target.value
                      })}
                      rows={4}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestEmailConnection}
                    disabled={testEmailConnectionMutation.isPending}
                  >
                    {testEmailConnectionMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={saveEmailSettingsMutation.isPending}
                  >
                    {saveEmailSettingsMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Integration Settings */}
            <TabsContent value="integrations">
              <form onSubmit={handleSaveIntegrationSettings}>
                <div className="space-y-6">
                  {/* OpenAI Integration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">OpenAI Integration</h3>
                        <p className="text-sm text-muted-foreground">
                          Configure OpenAI integration for AI-powered features
                        </p>
                      </div>
                      <Switch
                        checked={integrationSettings.enableOpenAI}
                        onCheckedChange={(checked) => setIntegrationSettings({
                          ...integrationSettings,
                          enableOpenAI: checked
                        })}
                      />
                    </div>
                    
                    {integrationSettings.enableOpenAI && (
                      <div className="space-y-2 ml-6 border-l-2 pl-4">
                        <div className="space-y-2">
                          <Label htmlFor="openAIApiKey">API Key</Label>
                          <Input
                            id="openAIApiKey"
                            type="password"
                            value={integrationSettings.openAIApiKey}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              openAIApiKey: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Google Analytics Integration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Google Analytics</h3>
                        <p className="text-sm text-muted-foreground">
                          Track website usage and user behavior
                        </p>
                      </div>
                      <Switch
                        checked={integrationSettings.enableGoogleAnalytics}
                        onCheckedChange={(checked) => setIntegrationSettings({
                          ...integrationSettings,
                          enableGoogleAnalytics: checked
                        })}
                      />
                    </div>
                    
                    {integrationSettings.enableGoogleAnalytics && (
                      <div className="space-y-2 ml-6 border-l-2 pl-4">
                        <div className="space-y-2">
                          <Label htmlFor="googleAnalyticsId">Tracking ID</Label>
                          <Input
                            id="googleAnalyticsId"
                            value={integrationSettings.googleAnalyticsId}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              googleAnalyticsId: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* reCAPTCHA Integration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Google reCAPTCHA</h3>
                        <p className="text-sm text-muted-foreground">
                          Protect your site from spam and abuse
                        </p>
                      </div>
                      <Switch
                        checked={integrationSettings.enableReCaptcha}
                        onCheckedChange={(checked) => setIntegrationSettings({
                          ...integrationSettings,
                          enableReCaptcha: checked
                        })}
                      />
                    </div>
                    
                    {integrationSettings.enableReCaptcha && (
                      <div className="space-y-4 ml-6 border-l-2 pl-4">
                        <div className="space-y-2">
                          <Label htmlFor="reCaptchaSiteKey">Site Key</Label>
                          <Input
                            id="reCaptchaSiteKey"
                            value={integrationSettings.reCaptchaSiteKey}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              reCaptchaSiteKey: e.target.value
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="reCaptchaSecretKey">Secret Key</Label>
                          <Input
                            id="reCaptchaSecretKey"
                            type="password"
                            value={integrationSettings.reCaptchaSecretKey}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              reCaptchaSecretKey: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Stripe Integration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Stripe Payment</h3>
                        <p className="text-sm text-muted-foreground">
                          Process payments and subscriptions
                        </p>
                      </div>
                      <Switch
                        checked={integrationSettings.enableStripe}
                        onCheckedChange={(checked) => setIntegrationSettings({
                          ...integrationSettings,
                          enableStripe: checked
                        })}
                      />
                    </div>
                    
                    {integrationSettings.enableStripe && (
                      <div className="space-y-4 ml-6 border-l-2 pl-4">
                        <div className="space-y-2">
                          <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                          <Input
                            id="stripePublishableKey"
                            value={integrationSettings.stripePublishableKey}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              stripePublishableKey: e.target.value
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="stripeSecretKey">Secret Key</Label>
                          <Input
                            id="stripeSecretKey"
                            type="password"
                            value={integrationSettings.stripeSecretKey}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              stripeSecretKey: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Razorpay Integration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Razorpay Payment</h3>
                        <p className="text-sm text-muted-foreground">
                          Process payments and subscriptions
                        </p>
                      </div>
                      <Switch
                        checked={integrationSettings.enableRazorpay}
                        onCheckedChange={(checked) => setIntegrationSettings({
                          ...integrationSettings,
                          enableRazorpay: checked
                        })}
                      />
                    </div>
                    
                    {integrationSettings.enableRazorpay && (
                      <div className="space-y-4 ml-6 border-l-2 pl-4">
                        <div className="space-y-2">
                          <Label htmlFor="razorpayKeyId">Key ID</Label>
                          <Input
                            id="razorpayKeyId"
                            value={integrationSettings.razorpayKeyId}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              razorpayKeyId: e.target.value
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="razorpayKeySecret">Key Secret</Label>
                          <Input
                            id="razorpayKeySecret"
                            type="password"
                            value={integrationSettings.razorpayKeySecret}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              razorpayKeySecret: e.target.value
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="razorpayWebhookSecret">Webhook Secret</Label>
                          <Input
                            id="razorpayWebhookSecret"
                            type="password"
                            value={integrationSettings.razorpayWebhookSecret}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              razorpayWebhookSecret: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saveIntegrationSettingsMutation.isPending}
                  >
                    {saveIntegrationSettingsMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Security Settings */}
            <TabsContent value="security">
              <form onSubmit={handleSaveSecuritySettings}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Password Requirements</h3>
                    <div className="space-y-4 ml-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="passwordMinLength">Minimum Length</Label>
                          <Input
                            id="passwordMinLength"
                            type="number"
                            min={6}
                            value={securitySettings.passwordMinLength}
                            onChange={(e) => setSecuritySettings({
                              ...securitySettings,
                              passwordMinLength: parseInt(e.target.value) || 8
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2 flex items-end">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="requireStrongPasswords"
                                checked={securitySettings.requireStrongPasswords}
                                onCheckedChange={(checked) => setSecuritySettings({
                                  ...securitySettings,
                                  requireStrongPasswords: checked === true
                                })}
                              />
                              <Label htmlFor="requireStrongPasswords">
                                Require Strong Passwords
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="passwordRequireUppercase"
                            checked={securitySettings.passwordRequireUppercase}
                            onCheckedChange={(checked) => setSecuritySettings({
                              ...securitySettings,
                              passwordRequireUppercase: checked === true
                            })}
                          />
                          <Label htmlFor="passwordRequireUppercase">
                            Require uppercase letters
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="passwordRequireLowercase"
                            checked={securitySettings.passwordRequireLowercase}
                            onCheckedChange={(checked) => setSecuritySettings({
                              ...securitySettings,
                              passwordRequireLowercase: checked === true
                            })}
                          />
                          <Label htmlFor="passwordRequireLowercase">
                            Require lowercase letters
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="passwordRequireNumbers"
                            checked={securitySettings.passwordRequireNumbers}
                            onCheckedChange={(checked) => setSecuritySettings({
                              ...securitySettings,
                              passwordRequireNumbers: checked === true
                            })}
                          />
                          <Label htmlFor="passwordRequireNumbers">
                            Require numbers
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="passwordRequireSpecialChars"
                            checked={securitySettings.passwordRequireSpecialChars}
                            onCheckedChange={(checked) => setSecuritySettings({
                              ...securitySettings,
                              passwordRequireSpecialChars: checked === true
                            })}
                          />
                          <Label htmlFor="passwordRequireSpecialChars">
                            Require special characters
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Authentication Settings</h3>
                    <div className="space-y-4 ml-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="loginMaxAttempts">Max Login Attempts</Label>
                          <Input
                            id="loginMaxAttempts"
                            type="number"
                            min={1}
                            value={securitySettings.loginMaxAttempts}
                            onChange={(e) => setSecuritySettings({
                              ...securitySettings,
                              loginMaxAttempts: parseInt(e.target.value) || 5
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="loginLockoutDuration">Lockout Duration (minutes)</Label>
                          <Input
                            id="loginLockoutDuration"
                            type="number"
                            min={1}
                            value={securitySettings.loginLockoutDuration}
                            onChange={(e) => setSecuritySettings({
                              ...securitySettings,
                              loginLockoutDuration: parseInt(e.target.value) || 30
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                          <Input
                            id="sessionTimeout"
                            type="number"
                            min={1}
                            value={securitySettings.sessionTimeout}
                            onChange={(e) => setSecuritySettings({
                              ...securitySettings,
                              sessionTimeout: parseInt(e.target.value) || 60
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2 flex items-end">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="enableTwoFactorAuth"
                                checked={securitySettings.enableTwoFactorAuth}
                                onCheckedChange={(checked) => setSecuritySettings({
                                  ...securitySettings,
                                  enableTwoFactorAuth: checked === true
                                })}
                              />
                              <Label htmlFor="enableTwoFactorAuth">
                                Enable Two-Factor Authentication
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saveSecuritySettingsMutation.isPending}
                  >
                    {saveSecuritySettingsMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}