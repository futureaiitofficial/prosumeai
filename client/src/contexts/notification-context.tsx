import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { notificationSoundService } from '@/services/notification-sound';

export interface NotificationData {
  id: number;
  recipientId: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  isSystem: boolean;
  createdAt: string;
  expiresAt?: string;
  priority: 'low' | 'normal' | 'high';
  category: string;
  action?: {
    type: 'link' | 'button';
    label: string;
    url?: string;
    payload?: Record<string, any>;
  };
}

export interface NotificationPreferences {
  id: number;
  userId: number;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  enableInAppNotifications: boolean;
  enableSoundNotifications: boolean;
  soundVolume: number;
  accountNotifications: boolean;
  resumeNotifications: boolean;
  coverLetterNotifications: boolean;
  jobApplicationNotifications: boolean;
  subscriptionNotifications: boolean;
  systemNotifications: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  loading: boolean;
  
  // Actions
  fetchNotifications: (options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: string;
    type?: string;
  }) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  refreshNotificationsNow: () => Promise<void>;
  
  // Sound controls
  playNotificationSound: () => Promise<void>;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  isSoundEnabled: () => boolean;
  getSoundVolume: () => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Track previous unread count to detect new notifications
  const previousUnreadCount = useRef<number>(0);
  const hasInteracted = useRef<boolean>(false);
  const isInitialLoad = useRef<boolean>(true);
  
  // Dynamic polling control
  const pollIntervalRef = useRef<number>(3000); // Start with 3 seconds
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const notificationPollCountRef = useRef<number>(0); // Track polling cycles

  // Check if user is authenticated
  const isAuthenticated = Boolean(user);

  // Enable audio after user interaction (required for browser autoplay policy)
  const enableAudio = useCallback(async () => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      await notificationSoundService.enableAudioAfterUserInteraction();
    }
  }, []);

  // Sound control functions
  const playNotificationSound = useCallback(async () => {
    if (!isAuthenticated) return;
    
    // Check if sound notifications are enabled in preferences
    const soundEnabled = preferences?.enableSoundNotifications ?? true;
    if (!soundEnabled) return;

    await enableAudio();
    await notificationSoundService.playNotificationSound();
  }, [isAuthenticated, preferences?.enableSoundNotifications, enableAudio]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!isAuthenticated) return;
    try {
      const response = await axios.put('/api/notifications/preferences', newPreferences);
      if (response.data.success) {
        setPreferences(response.data.data);
        toast({
          title: 'Success',
          description: 'Notification preferences updated',
        });
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences',
        variant: 'destructive',
      });
    }
  }, [toast, isAuthenticated]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    notificationSoundService.setEnabled(enabled);
    // Update preferences on server
    if (preferences) {
      updatePreferences({ enableSoundNotifications: enabled });
    }
  }, [preferences, updatePreferences]);

  const setSoundVolume = useCallback((volume: number) => {
    notificationSoundService.setVolume(volume);
    // Update preferences on server
    if (preferences) {
      updatePreferences({ soundVolume: volume });
    }
  }, [preferences, updatePreferences]);

  const isSoundEnabled = useCallback(() => {
    return notificationSoundService.isAudioEnabled() && (preferences?.enableSoundNotifications ?? true);
  }, [preferences?.enableSoundNotifications]);

  const getSoundVolume = useCallback(() => {
    return preferences?.soundVolume ?? notificationSoundService.getVolume();
  }, [preferences?.soundVolume]);

  // Fetch notifications with options
  const fetchNotifications = useCallback(async (options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: string;
    type?: string;
  }) => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      if (options?.category) params.append('category', options.category);
      if (options?.type) params.append('type', options.type);

      const response = await axios.get(`/api/notifications?${params.toString()}`);
      
      if (response.data.success) {
        if (options?.offset && options.offset > 0) {
          // If it's a pagination request, append to existing notifications
          setNotifications(prev => [...prev, ...response.data.data]);
        } else {
          // If it's a fresh request, replace all notifications
          setNotifications(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Only show toast errors for actual network issues, not auth failures
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        toast({
          title: 'Error',
          description: 'Failed to fetch notifications',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, isAuthenticated]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await axios.get('/api/notifications/unread-count');
      if (response.data.success) {
        const newUnreadCount = response.data.data.unreadCount;
        
        console.log('[NOTIFICATION SOUND] Unread count check:', {
          previous: previousUnreadCount.current,
          new: newUnreadCount,
          hasIncreased: previousUnreadCount.current < newUnreadCount,
          isInitialized: previousUnreadCount.current >= 0
        });
        
        // Check if there are new notifications (unread count increased)
        // Fixed: Allow sound on first notification (when previous was 0)
        if (previousUnreadCount.current < newUnreadCount && !isInitialLoad.current) {
          const newNotificationCount = newUnreadCount - previousUnreadCount.current;
          
          console.log('[NOTIFICATION SOUND] New notifications detected:', newNotificationCount);
          console.log('[NOTIFICATION SOUND] Sound preferences:', {
            soundEnabled: preferences?.enableSoundNotifications,
            volume: preferences?.soundVolume,
            hasInteracted: hasInteracted.current
          });
          
          // Reset polling to fast mode when new notifications arrive
          pollIntervalRef.current = 3000;
          notificationPollCountRef.current = 0; // Reset polling counter
          
          // Immediately fetch updated notifications when new ones arrive
          fetchNotifications({ limit: 20 }).catch(console.error);
          
          // Play notification sound for new notifications
          try {
            await playNotificationSound();
            console.log('[NOTIFICATION SOUND] ✅ Sound played successfully');
          } catch (soundError) {
            console.error('[NOTIFICATION SOUND] ❌ Failed to play sound:', soundError);
          }
          
          // Show a toast notification
          toast({
            title: 'New Notification',
            description: `You have ${newNotificationCount} new notification${newNotificationCount > 1 ? 's' : ''}`,
          });
        } else {
          console.log('[NOTIFICATION SOUND] No new notifications or initial load');
        }
        
        // Update the unread count
        setUnreadCount(newUnreadCount);
        previousUnreadCount.current = newUnreadCount;
        
        // Mark that initial load is complete
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
          console.log('[NOTIFICATION SOUND] Initial load complete, future notifications will trigger sounds');
        }
      }
    } catch (error) {
      // Silently fail for unauthenticated users, only log for debugging
      if (isAuthenticated) {
        console.error('Error fetching unread count:', error);
      }
    }
  }, [isAuthenticated, playNotificationSound, toast, preferences?.enableSoundNotifications, preferences?.soundVolume, fetchNotifications]);

  // Force immediate notification check (for when user performs actions that might create notifications)
  const refreshNotificationsNow = useCallback(async () => {
    // Reset to fast polling
    pollIntervalRef.current = 3000;
    notificationPollCountRef.current = 0; // Reset polling counter
    
    // Fetch both unread count and notifications
    await Promise.all([
      refreshUnreadCount(),
      fetchNotifications({ limit: 20 })
    ]);
  }, [refreshUnreadCount, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: number) => {
    if (!isAuthenticated) return;
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  }, [toast, isAuthenticated]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await axios.patch('/api/notifications/mark-all-read');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  }, [toast, isAuthenticated]);

  // Delete notification
  const deleteNotification = useCallback(async (id: number) => {
    if (!isAuthenticated) return;
    try {
      await axios.delete(`/api/notifications/${id}`);
      
      // Update local state
      const notificationToDelete = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Update unread count if the deleted notification was unread
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  }, [notifications, toast, isAuthenticated]);

  // Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await axios.get('/api/notifications/preferences');
      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Only show toast errors for actual network issues, not auth failures
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        toast({
          title: 'Error',
          description: 'Failed to fetch notification preferences',
          variant: 'destructive',
        });
      }
    }
  }, [toast, isAuthenticated]);

  // Initial data fetch - only when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      refreshUnreadCount();
      fetchPreferences();
    } else {
      // Clear notification data when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      previousUnreadCount.current = 0;
      isInitialLoad.current = true; // Reset for next login
    }
  }, [isAuthenticated, fetchNotifications, refreshUnreadCount, fetchPreferences]);

  // Set up click handler to enable audio after user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      enableAudio();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [enableAudio]);

  // Sync sound settings with preferences when they change
  useEffect(() => {
    if (preferences) {
      if (preferences.enableSoundNotifications !== undefined) {
        notificationSoundService.setEnabled(preferences.enableSoundNotifications);
      }
      if (preferences.soundVolume !== undefined) {
        notificationSoundService.setVolume(preferences.soundVolume);
      }
    }
  }, [preferences?.enableSoundNotifications, preferences?.soundVolume]);

  // Poll for new notifications with dynamic intervals for better real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const setupNextPoll = () => {
      intervalIdRef.current = setTimeout(async () => {
        // Always refresh unread count
        await refreshUnreadCount();
        
        // Every 3rd poll cycle (roughly every 30-60 seconds depending on interval), 
        // also refresh the notification list to ensure it stays in sync
        notificationPollCountRef.current += 1;
        if (notificationPollCountRef.current % 3 === 0) {
          await fetchNotifications({ limit: 20 });
        }
        
        // Gradually increase interval but cap at 20 seconds
        pollIntervalRef.current = Math.min(pollIntervalRef.current + 2000, 20000);
        
        // Continue polling
        setupNextPoll();
      }, pollIntervalRef.current);
    };
    
    // Start polling
    setupNextPoll();

    return () => {
      if (intervalIdRef.current) {
        clearTimeout(intervalIdRef.current);
      }
    };
  }, [refreshUnreadCount, fetchNotifications, isAuthenticated]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences,
    refreshUnreadCount,
    refreshNotificationsNow,
    playNotificationSound,
    setSoundEnabled,
    setSoundVolume,
    isSoundEnabled,
    getSoundVolume,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
} 