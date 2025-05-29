import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Users, 
  User, 
  Globe,
  ArrowLeft,
  AlertCircle,
  Calendar,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { AdminLayout } from '@/components/admin/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
}

export default function CreateNotificationPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [notificationType, setNotificationType] = useState<'system' | 'group' | 'broadcast'>('system');
  const [formData, setFormData] = useState({
    type: 'system_announcement',
    title: '',
    message: '',
    category: 'system',
    priority: 'normal',
    expiresAt: '',
    userIds: [] as number[],
    excludeUserIds: [] as number[]
  });
  
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // Fetch users for group notifications
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', userSearch],
    queryFn: async (): Promise<User[]> => {
      const params = new URLSearchParams();
      if (userSearch) params.append('search', userSearch);
      params.append('limit', '20');
      
      const response = await axios.get(`/api/admin/users?${params.toString()}`);
      return response.data.data.users || [];
    },
    enabled: notificationType === 'group'
  });

  // Create notification mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      let endpoint = '';
      let payload: any = {
        type: data.type,
        title: data.title,
        message: data.message,
        category: data.category,
        priority: data.priority,
        expiresAt: data.expiresAt || undefined
      };

      switch (notificationType) {
        case 'system':
          endpoint = '/api/admin/notifications/system';
          break;
        case 'group':
          endpoint = '/api/admin/notifications/group';
          payload = { ...payload, userIds: data.userIds };
          break;
        case 'broadcast':
          endpoint = '/api/admin/notifications/broadcast';
          payload = { ...payload, excludeUserIds: data.excludeUserIds };
          break;
      }

      const response = await axios.post(endpoint, payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      });
      setLocation('/admin/notifications');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send notification',
        variant: 'destructive',
      });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user]);
      setFormData(prev => ({ 
        ...prev, 
        userIds: [...prev.userIds, user.id] 
      }));
    }
  };

  const handleUserRemove = (userId: number) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
    setFormData(prev => ({ 
      ...prev, 
      userIds: prev.userIds.filter(id => id !== userId) 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (notificationType === 'group' && formData.userIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one user for group notifications',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const getTypeIcon = () => {
    switch (notificationType) {
      case 'system':
        return <Users className="h-5 w-5" />;
      case 'group':
        return <User className="h-5 w-5" />;
      case 'broadcast':
        return <Globe className="h-5 w-5" />;
    }
  };

  const getTypeDescription = () => {
    switch (notificationType) {
      case 'system':
        return 'Send to all users in the system';
      case 'group':
        return 'Send to specific users';
      case 'broadcast':
        return 'Send to all users except excluded ones';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/admin/notifications')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create Notification</h1>
              <p className="text-muted-foreground">Send notifications to users</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Notification Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Type</CardTitle>
                <CardDescription>
                  Choose who should receive this notification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['system', 'group', 'broadcast'] as const).map((type) => (
                    <div
                      key={type}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        notificationType === type
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setNotificationType(type)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          notificationType === type ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          {type === 'system' && <Users className="h-4 w-4" />}
                          {type === 'group' && <User className="h-4 w-4" />}
                          {type === 'broadcast' && <Globe className="h-4 w-4" />}
                        </div>
                        <div>
                          <h3 className="font-medium capitalize">{type}</h3>
                          <p className="text-xs text-muted-foreground">
                            {type === 'system' && 'All users'}
                            {type === 'group' && 'Selected users'}
                            {type === 'broadcast' && 'All except excluded'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getTypeIcon()}
                  Notification Details
                </CardTitle>
                <CardDescription>
                  {getTypeDescription()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Notification Type</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system_announcement">System Announcement</SelectItem>
                        <SelectItem value="custom_notification">Custom Notification</SelectItem>
                        <SelectItem value="security_alert">Security Alert</SelectItem>
                        <SelectItem value="account_update">Account Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter notification title..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Enter notification message..."
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* User Selection for Group Notifications */}
            {notificationType === 'group' && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Recipients</CardTitle>
                  <CardDescription>
                    Choose which users should receive this notification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userSearch">Search Users</Label>
                      <Input
                        id="userSearch"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by username or email..."
                      />
                    </div>

                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Users ({selectedUsers.length})</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedUsers.map((user) => (
                            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                              {user.fullName || user.username}
                              <button
                                type="button"
                                onClick={() => handleUserRemove(user.id)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Available Users */}
                    {users && users.length > 0 && (
                      <div className="space-y-2">
                        <Label>Available Users</Label>
                        <div className="border rounded-md max-h-48 overflow-y-auto">
                          {users
                            .filter(user => !selectedUsers.find(u => u.id === user.id))
                            .map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                onClick={() => handleUserSelect(user)}
                              >
                                <div>
                                  <div className="font-medium">{user.fullName || user.username}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  Select
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {usersLoading && (
                      <div className="text-center py-4 text-muted-foreground">
                        Loading users...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {createMutation.isPending ? 'Sending...' : 'Send Notification'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/admin/notifications')}
                  >
                    Cancel
                  </Button>
                </div>

                {formData.title && formData.message && (
                  <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">Preview</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium">{formData.title}</div>
                      <div className="text-sm text-muted-foreground">{formData.message}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {formData.category}
                        </Badge>
                        <Badge variant={formData.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {formData.priority}
                        </Badge>
                        {notificationType === 'group' && (
                          <span>{selectedUsers.length} recipients</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
} 