import { useState } from 'react';
import axios from 'axios';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface NotificationPreferences {
  emailNotifications: boolean;
  marketingEmails: boolean;
  applicationUpdates: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
}

export default function NotificationSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    marketingEmails: false,
    applicationUpdates: true,
    securityAlerts: true,
    productUpdates: false,
  });

  // In a real app, you would fetch the user's current notification preferences
  // useEffect(() => {
  //   const fetchPreferences = async () => {
  //     try {
  //       setIsLoading(true);
  //       const response = await axios.get('/api/user/notification-preferences');
  //       setPreferences(response.data);
  //     } catch (error) {
  //       console.error('Error fetching notification preferences:', error);
  //       toast({
  //         title: 'Failed to load preferences',
  //         description: 'Could not load your notification preferences',
  //         variant: 'destructive',
  //       });
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   
  //   fetchPreferences();
  // }, [toast]);

  // For demo purposes, simulate loading
  useState(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  });

  const handleToggleChange = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
      // If master toggle is turned off, turn all others off
      ...(key === 'emailNotifications' && prev.emailNotifications 
        ? {
            marketingEmails: false,
            applicationUpdates: false,
            securityAlerts: false,
            productUpdates: false,
          }
        : {}),
    }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    
    try {
      // In a real app, you would save to your API
      // await axios.post('/api/user/notification-preferences', preferences);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated',
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: 'Failed to save preferences',
        description: 'Could not save your notification preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Email Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Master toggle for all email notifications
            </p>
          </div>
          <Switch
            checked={preferences.emailNotifications}
            onCheckedChange={() => handleToggleChange('emailNotifications')}
          />
        </div>
        
        <Separator />
        
        <div className="space-y-4 pl-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Security Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Get notified about security related events like login attempts
              </p>
            </div>
            <Switch
              checked={preferences.securityAlerts && preferences.emailNotifications}
              onCheckedChange={() => handleToggleChange('securityAlerts')}
              disabled={!preferences.emailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Application Updates</h4>
              <p className="text-sm text-muted-foreground">
                Get notified about your job application status changes
              </p>
            </div>
            <Switch
              checked={preferences.applicationUpdates && preferences.emailNotifications}
              onCheckedChange={() => handleToggleChange('applicationUpdates')}
              disabled={!preferences.emailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Product Updates</h4>
              <p className="text-sm text-muted-foreground">
                Receive notifications about new features and improvements
              </p>
            </div>
            <Switch
              checked={preferences.productUpdates && preferences.emailNotifications}
              onCheckedChange={() => handleToggleChange('productUpdates')}
              disabled={!preferences.emailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Marketing Emails</h4>
              <p className="text-sm text-muted-foreground">
                Receive promotional content and special offers
              </p>
            </div>
            <Switch
              checked={preferences.marketingEmails && preferences.emailNotifications}
              onCheckedChange={() => handleToggleChange('marketingEmails')}
              disabled={!preferences.emailNotifications}
            />
          </div>
        </div>
      </div>
      
      <Button 
        onClick={savePreferences} 
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Preferences"
        )}
      </Button>
    </div>
  );
} 