import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Send, 
  Users, 
  BarChart3, 
  Settings, 
  Plus,
  Filter,
  Calendar,
  Download,
  Trash2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/layout';

interface NotificationAnalytics {
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByCategory: Array<{ category: string; count: number }>;
  notificationsByType: Array<{ type: string; count: number }>;
  dailyStats: Array<{ date: string; count: number; unread: number }>;
}

interface NotificationLogEntry {
  id: number;
  type: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  isRead: boolean;
  isSystem: boolean;
  createdAt: string;
  recipientId: number;
  recipientUsername: string;
  recipientEmail: string;
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [analyticsDateRange, setAnalyticsDateRange] = useState('30');
  const [logFilters, setLogFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin', 'notifications', 'analytics', analyticsDateRange],
    queryFn: async (): Promise<NotificationAnalytics> => {
      const response = await axios.get(`/api/admin/notifications/analytics?days=${analyticsDateRange}`);
      return response.data.data;
    }
  });

  // Fetch activity log
  const { data: activityLog, isLoading: logLoading, error: logError } = useQuery({
    queryKey: ['admin', 'notifications', 'log', logFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (logFilters.type) params.append('type', logFilters.type);
      if (logFilters.category) params.append('category', logFilters.category);
      if (logFilters.startDate) params.append('startDate', logFilters.startDate);
      if (logFilters.endDate) params.append('endDate', logFilters.endDate);
      
      const response = await axios.get(`/api/admin/notifications/log?${params.toString()}`);
      return response.data.data;
    }
  });

  // Cleanup expired notifications
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete('/api/admin/notifications/cleanup');
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expired notifications have been cleaned up"
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to cleanup notifications",
        variant: "destructive"
      });
    }
  });

  const handleFilterChange = (key: keyof typeof logFilters, value: string) => {
    setLogFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setLogFilters({
      type: '',
      category: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Notification Management</h1>
              <p className="text-muted-foreground">
                Monitor notification activity and manage system notifications
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => setLocation('/admin/notifications/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
              <Button 
                variant="outline" 
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Expired
              </Button>
            </div>
          </div>

          <Tabs defaultValue="analytics" className="space-y-4">
            <TabsList>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Notification Analytics</CardTitle>
                    <CardDescription>
                      Overview of notification activity and engagement
                    </CardDescription>
                  </div>
                  <Select value={analyticsDateRange} onValueChange={setAnalyticsDateRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : analytics ? (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center">
                              <Bell className="h-4 w-4 text-blue-500" />
                              <div className="ml-2">
                                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                                <div className="text-2xl font-bold">{analytics.totalNotifications}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center">
                              <Bell className="h-4 w-4 text-orange-500" />
                              <div className="ml-2">
                                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                                <div className="text-2xl font-bold">{analytics.unreadNotifications}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center">
                              <BarChart3 className="h-4 w-4 text-green-500" />
                              <div className="ml-2">
                                <p className="text-sm font-medium text-muted-foreground">Read Rate</p>
                                <div className="text-2xl font-bold">
                                  {analytics.totalNotifications > 0
                                    ? Math.round(((analytics.totalNotifications - analytics.unreadNotifications) / analytics.totalNotifications) * 100)
                                    : 0}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 text-purple-500" />
                              <div className="ml-2">
                                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                                <div className="text-2xl font-bold">{analytics.notificationsByCategory.length}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Category Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">By Category</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {analytics.notificationsByCategory.map((item) => (
                                <div key={item.category} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="capitalize">
                                      {item.category}
                                    </Badge>
                                  </div>
                                  <span className="font-medium">{item.count}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">By Type</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {analytics.notificationsByType.map((item) => (
                                <div key={item.type} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Badge variant="secondary" className="text-xs">
                                      {item.type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <span className="font-medium">{item.count}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No analytics data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Log Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>
                    Track all notification activity and user engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filters:</span>
                    </div>
                    
                    <Select value={logFilters.category || "all"} onValueChange={(value) => handleFilterChange('category', value === "all" ? "" : value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="resume">Resume</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor="startDate" className="text-sm">From:</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={logFilters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-40"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor="endDate" className="text-sm">To:</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={logFilters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-40"
                      />
                    </div>
                    
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                  </div>

                  {/* Activity Table */}
                  {logLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : logError ? (
                    <div className="text-center py-8 text-red-500">
                      <p>Error loading activity log: {(logError as any)?.message || 'Unknown error'}</p>
                    </div>
                  ) : activityLog && activityLog.notifications && activityLog.notifications.length > 0 ? (
                    <div className="space-y-4">
                      {activityLog.notifications.map((notification: NotificationLogEntry) => (
                        <div key={notification.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={notification.isSystem ? "default" : "secondary"}>
                                  {notification.category}
                                </Badge>
                                <Badge variant={notification.priority === 'high' ? "destructive" : "outline"}>
                                  {notification.priority}
                                </Badge>
                                {!notification.isRead && (
                                  <Badge variant="secondary">Unread</Badge>
                                )}
                              </div>
                              <h4 className="font-medium">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>To: {notification.recipientUsername}</span>
                                <span>•</span>
                                <span>{format(new Date(notification.createdAt), 'PPp')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No activity found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Templates</CardTitle>
                  <CardDescription>
                    Manage notification templates for automated messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Template management coming soon</p>
                    <Button className="mt-4" onClick={() => setLocation('/admin/notifications/templates')}>
                      Manage Templates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
} 