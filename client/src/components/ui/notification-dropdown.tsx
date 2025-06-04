import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/notification-context';
import { NotificationItem } from '@/components/ui/notification-item';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAllAsRead, 
    fetchNotifications 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch fresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Fetch notifications with a focus on unread ones first
      fetchNotifications({ limit: 20 });
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleViewAll = () => {
    setIsOpen(false);
    setLocation('/notifications');
  };

  const handleDropdownOpenChange = (open: boolean) => {
    setIsOpen(open);
    // If opening and we have unread notifications, refresh the list to ensure we have the latest
    if (open && unreadCount > 0) {
      fetchNotifications({ limit: 20 });
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).slice(0, 5);
  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
        >
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {hasUnread && (
              <Badge variant="secondary">
                {unreadCount} new
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {hasUnread && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                title="Mark all as read"
              >
                <CheckCheck className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-80">
              <div className="p-2">
                {unreadNotifications.length > 0 ? (
                  <>
                    {unreadNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        compact
                      />
                    ))}
                    
                    {notifications.length > unreadNotifications.length && (
                      <>
                        <Separator className="my-2" />
                        <div className="px-2 py-1">
                          <p className="text-xs text-muted-foreground">Recent</p>
                        </div>
                        {notifications
                          .filter(n => n.isRead)
                          .slice(0, 3)
                          .map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              compact
                            />
                          ))}
                      </>
                    )}
                  </>
                ) : (
                  notifications.slice(0, 8).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      compact
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={handleViewAll}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 