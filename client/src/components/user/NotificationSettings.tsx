import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, Volume2, VolumeX, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useNotifications, type NotificationPreferences } from '@/contexts/notification-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function NotificationSettings() {
  const { toast } = useToast();
  const { 
    preferences, 
    updatePreferences, 
    fetchPreferences,
    playNotificationSound,
    setSoundEnabled,
    setSoundVolume,
    isSoundEnabled,
    getSoundVolume
  } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences>>({});

  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      await fetchPreferences();
      setIsLoading(false);
    };
    
    loadPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleToggleChange = (key: keyof NotificationPreferences, value: boolean) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: value,
      // If master toggle is turned off, turn all others off
      ...(key === 'enableInAppNotifications' && !value 
        ? {
            accountNotifications: false,
            resumeNotifications: false,
            coverLetterNotifications: false,
            jobApplicationNotifications: false,
            subscriptionNotifications: false,
            systemNotifications: false,
          }
        : {}),
    }));
    
    // Handle sound notifications immediately
    if (key === 'enableSoundNotifications') {
      setSoundEnabled(value);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const volume = value[0] / 100; // Convert from 0-100 to 0-1
    setLocalPreferences((prev) => ({
      ...prev,
      soundVolume: volume,
    }));
    setSoundVolume(volume);
  };

  const handleTimeChange = (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const testNotificationSound = async () => {
    try {
      await playNotificationSound();
      toast({
        title: 'Sound Test',
        description: 'Notification sound played successfully!',
      });
    } catch (error) {
      toast({
        title: 'Sound Test Failed',
        description: 'Could not play notification sound. Please check your audio settings.',
        variant: 'destructive',
      });
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    
    try {
      await updatePreferences(localPreferences);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
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

  if (!localPreferences) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load notification preferences</p>
        <Button onClick={fetchPreferences} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Configure notifications that appear within the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable In-App Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Master toggle for all in-app notifications
              </p>
            </div>
            <Switch
              checked={localPreferences.enableInAppNotifications || false}
              onCheckedChange={(value) => handleToggleChange('enableInAppNotifications', value)}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4 pl-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Account Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Security alerts, password changes, and account updates
                </p>
              </div>
              <Switch
                checked={localPreferences.accountNotifications && localPreferences.enableInAppNotifications}
                onCheckedChange={(value) => handleToggleChange('accountNotifications', value)}
                disabled={!localPreferences.enableInAppNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Resume Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Updates about your resumes and resume building
                </p>
              </div>
              <Switch
                checked={localPreferences.resumeNotifications && localPreferences.enableInAppNotifications}
                onCheckedChange={(value) => handleToggleChange('resumeNotifications', value)}
                disabled={!localPreferences.enableInAppNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Cover Letter Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Updates about your cover letters
                </p>
              </div>
              <Switch
                checked={localPreferences.coverLetterNotifications && localPreferences.enableInAppNotifications}
                onCheckedChange={(value) => handleToggleChange('coverLetterNotifications', value)}
                disabled={!localPreferences.enableInAppNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Job Application Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Get notified about your job application status changes
                </p>
              </div>
              <Switch
                checked={localPreferences.jobApplicationNotifications && localPreferences.enableInAppNotifications}
                onCheckedChange={(value) => handleToggleChange('jobApplicationNotifications', value)}
                disabled={!localPreferences.enableInAppNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Subscription Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Billing updates, subscription renewals, and plan changes
                </p>
              </div>
              <Switch
                checked={localPreferences.subscriptionNotifications && localPreferences.enableInAppNotifications}
                onCheckedChange={(value) => handleToggleChange('subscriptionNotifications', value)}
                disabled={!localPreferences.enableInAppNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">System Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Platform updates, maintenance notices, and new features
                </p>
              </div>
              <Switch
                checked={localPreferences.systemNotifications && localPreferences.enableInAppNotifications}
                onCheckedChange={(value) => handleToggleChange('systemNotifications', value)}
                disabled={!localPreferences.enableInAppNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sound Notifications</CardTitle>
          <CardDescription>
            Configure audio alerts for new notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable Sound Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Play a sound when new notifications arrive
              </p>
            </div>
            <Switch
              checked={localPreferences.enableSoundNotifications || false}
              onCheckedChange={(value) => handleToggleChange('enableSoundNotifications', value)}
            />
          </div>
          
          {localPreferences.enableSoundNotifications && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="volume">Volume</Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((localPreferences.soundVolume || 0.3) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      id="volume"
                      min={0}
                      max={100}
                      step={5}
                      value={[(localPreferences.soundVolume || 0.3) * 100]}
                      onValueChange={handleVolumeChange}
                      className="flex-1"
                    />
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testNotificationSound}
                    className="flex items-center space-x-2"
                  >
                    <Play className="h-4 w-4" />
                    <span>Test Sound</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Do Not Disturb</CardTitle>
          <CardDescription>
            Configure quiet hours when notifications will be muted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable Quiet Hours</h4>
              <p className="text-sm text-muted-foreground">
                Mute all notifications during specified hours
              </p>
            </div>
            <Switch
              checked={localPreferences.quietHoursEnabled || false}
              onCheckedChange={(value) => handleToggleChange('quietHoursEnabled', value)}
            />
          </div>
          
          {localPreferences.quietHoursEnabled && (
            <>
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={localPreferences.quietHoursStart || '22:00'}
                    onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End Time</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={localPreferences.quietHoursEnd || '08:00'}
                    onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                  />
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                During quiet hours, notifications will still appear but without sound alerts.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
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
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  );
} 