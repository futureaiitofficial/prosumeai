import { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { NotificationItem } from '@/components/ui/notification-item';
import DefaultLayout from '@/components/layouts/default-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCheck, Filter, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAllAsRead, 
    fetchNotifications 
  } = useNotifications();
  
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    fetchNotifications({
      unreadOnly: value === 'unread',
      category: category === 'all' ? undefined : category
    });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    fetchNotifications({
      unreadOnly: filter === 'unread',
      category: value === 'all' ? undefined : value
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.isRead) return false;
    if (category !== 'all' && notification.category !== category) return false;
    return true;
  });

  return (
    <DefaultLayout 
      pageTitle="Notifications" 
      pageDescription="Manage your notifications and preferences"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay up to date with your account activity and updates
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All notifications</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="resume">Resume</SelectItem>
                  <SelectItem value="cover_letter">Cover Letter</SelectItem>
                  <SelectItem value="job_application">Job Application</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              
              {(filter !== 'all' || category !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setFilter('all');
                    setCategory('all');
                    fetchNotifications();
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-muted-foreground">
                {filter === 'unread' ? (
                  <p>No unread notifications</p>
                ) : (
                  <p>No notifications found</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact={false}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </DefaultLayout>
  );
} 