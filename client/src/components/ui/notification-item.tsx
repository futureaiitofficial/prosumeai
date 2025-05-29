import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Check, 
  Trash2, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  FileText,
  User,
  CreditCard,
  Settings,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, type NotificationData } from '@/contexts/notification-context';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationData;
  compact?: boolean;
  showActions?: boolean;
}

export function NotificationItem({ 
  notification, 
  compact = false, 
  showActions = true 
}: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  const handleActionClick = () => {
    if (notification.action?.url) {
      // Mark as read and navigate
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
      window.location.href = notification.action.url;
    }
  };

  const getIcon = () => {
    switch (notification.category) {
      case 'account':
        return <User className="h-4 w-4" />;
      case 'resume':
      case 'cover_letter':
        return <FileText className="h-4 w-4" />;
      case 'subscription':
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high':
        return 'text-red-500';
      case 'normal':
        return 'text-blue-500';
      case 'low':
        return 'text-gray-500';
      default:
        return 'text-blue-500';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
          !notification.isRead && "bg-blue-50/50 hover:bg-blue-50/70"
        )}
        onClick={handleActionClick}
      >
        <div className={cn("flex-shrink-0 mt-0.5", getPriorityColor())}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm leading-tight",
                !notification.isRead ? "font-medium" : "text-muted-foreground"
              )}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {notification.message}
              </p>
            </div>
            
            {!notification.isRead && (
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {formatTime(notification.createdAt)}
            </span>
            
            {showActions && (
              <div className="flex items-center gap-1">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleMarkAsRead}
                    title="Mark as read"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full notification item (for notifications page)
  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-colors",
        !notification.isRead 
          ? "bg-blue-50/50 border-blue-200" 
          : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("flex-shrink-0 mt-1", getPriorityColor())}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  "text-sm",
                  !notification.isRead ? "font-semibold" : "font-medium"
                )}>
                  {notification.title}
                </h4>
                
                {notification.isSystem && (
                  <Badge variant="outline" className="text-xs">
                    System
                  </Badge>
                )}
                
                {!notification.isRead && (
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {notification.message}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{formatTime(notification.createdAt)}</span>
                <span className="capitalize">{notification.category}</span>
                <span className="capitalize">{notification.priority} priority</span>
              </div>
            </div>
            
            {showActions && (
              <div className="flex items-center gap-2">
                {!notification.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAsRead}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark read
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {notification.action && (
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleActionClick}
                className="w-auto"
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 