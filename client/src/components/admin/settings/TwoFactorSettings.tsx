import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Button } from '../../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../ui/pagination';
import { Checkbox } from '../../ui/checkbox';
import { useToast } from '../../../hooks/use-toast';
import { Skeleton } from '../../ui/skeleton';
import { Input } from '../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

interface TwoFactorPolicy {
  id: number;
  enforceForAdmins: boolean;
  enforceForAllUsers: boolean;
  allowedMethods: string[];
  rememberDeviceDays: number;
  createdAt: string;
  updatedAt: string;
}

interface TwoFactorUser {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  twoFactorEnabled: boolean | null;
  twoFactorMethod: string | null;
  lastLogin: string | null;
  createdAt: string;
}

interface TwoFactorStats {
  totalUsers: number;
  enabledUsers: number;
  enabledPercentage: number;
  byMethod: {
    email: number;
    authenticator: number;
  };
  admins: {
    total: number;
    withTwoFactor: number;
    percentage: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UsersResponse {
  users: TwoFactorUser[];
  pagination: Pagination;
}

export function TwoFactorSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('policy');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<TwoFactorPolicy | null>(null);
  const [stats, setStats] = useState<TwoFactorStats | null>(null);
  const [users, setUsers] = useState<TwoFactorUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (activeTab === 'policy') {
      loadPolicy();
    } else if (activeTab === 'stats') {
      loadStats();
    } else if (activeTab === 'users') {
      loadUsers(1);
    }
  }, [activeTab]);

  const loadPolicy = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/2fa/policy');
      if (!response.ok) throw new Error('Failed to load 2FA policy');
      const data = await response.json();
      setPolicy(data);
    } catch (error) {
      console.error('Error loading 2FA policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load 2FA policy. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/2fa/stats');
      if (!response.ok) throw new Error('Failed to load 2FA stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading 2FA stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load 2FA statistics. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page: number, filter: string = selectedFilter, search: string = searchTerm) => {
    setLoading(true);
    try {
      let url = `/api/admin/2fa/users?page=${page}&limit=${pagination.limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filter !== 'all') url += `&filter=${filter}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load users');
      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const savePolicy = async () => {
    if (!policy) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/2fa/policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enforceForAdmins: policy.enforceForAdmins,
          enforceForAllUsers: policy.enforceForAllUsers,
          allowedMethods: policy.allowedMethods,
          rememberDeviceDays: policy.rememberDeviceDays
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save policy');
      }
      
      toast({
        title: 'Success',
        description: '2FA policy saved successfully.',
        variant: 'default'
      });
      
      // Refresh the policy data
      await loadPolicy();
    } catch (error) {
      console.error('Error saving 2FA policy:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save 2FA policy',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const resetUserTwoFactor = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to reset 2FA for user ${username}? This will disable 2FA and delete all their 2FA settings.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/2fa/users/${userId}/reset`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset 2FA');
      }
      
      toast({
        title: 'Success',
        description: `2FA reset successfully for user ${username}`,
        variant: 'default'
      });
      
      // Refresh the users list
      await loadUsers(pagination.page);
    } catch (error) {
      console.error('Error resetting 2FA:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset 2FA',
        variant: 'destructive'
      });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1, selectedFilter, searchTerm);
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    loadUsers(1, value, searchTerm);
  };

  const renderPolicyForm = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      );
    }

    if (!policy) {
      return (
        <Alert variant="destructive">
          <CrossCircledIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load 2FA policy.</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-2 border rounded-md">
          <div>
            <Label htmlFor="enforce-admins" className="font-medium">
              Require 2FA for Administrators
            </Label>
            <p className="text-sm text-muted-foreground">
              All users with admin privileges will be required to set up 2FA
            </p>
          </div>
          <Switch
            id="enforce-admins"
            checked={policy.enforceForAdmins}
            onCheckedChange={(checked) => setPolicy({ ...policy, enforceForAdmins: checked })}
            aria-label="Require 2FA for administrators"
          />
        </div>

        <div className="flex items-center justify-between p-2 border rounded-md">
          <div>
            <Label htmlFor="enforce-all" className="font-medium">
              Require 2FA for All Users
            </Label>
            <p className="text-sm text-muted-foreground">
              Every user will be required to set up 2FA before accessing the system
            </p>
          </div>
          <Switch
            id="enforce-all"
            checked={policy.enforceForAllUsers}
            onCheckedChange={(checked) => setPolicy({ ...policy, enforceForAllUsers: checked })}
            aria-label="Require 2FA for all users"
          />
        </div>

        <div className="space-y-2 p-2 border rounded-md">
          <Label htmlFor="remember-days" className="font-medium">
            Remember Device For (Days)
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Number of days a device will be remembered after successful 2FA verification
          </p>
          <Input
            id="remember-days"
            type="number"
            min="0"
            max="365"
            value={policy.rememberDeviceDays}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 0 && value <= 365) {
                setPolicy({ ...policy, rememberDeviceDays: value });
              }
            }}
            className="max-w-[200px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Set to 0 to disable the "remember this device" feature
          </p>
        </div>

        <div className="space-y-2 p-2 border rounded-md">
          <Label className="font-medium">Allowed 2FA Methods</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Select which 2FA methods users can choose from
          </p>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="method-email"
                checked={policy.allowedMethods.includes('EMAIL')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setPolicy({
                      ...policy,
                      allowedMethods: [...policy.allowedMethods, 'EMAIL'],
                    });
                  } else {
                    // Ensure at least one method is selected
                    if (policy.allowedMethods.length > 1) {
                      setPolicy({
                        ...policy,
                        allowedMethods: policy.allowedMethods.filter(m => m !== 'EMAIL'),
                      });
                    }
                  }
                }}
              />
              <Label htmlFor="method-email" className="font-normal">
                Email-based 2FA
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="method-app"
                checked={policy.allowedMethods.includes('AUTHENTICATOR_APP')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setPolicy({
                      ...policy,
                      allowedMethods: [...policy.allowedMethods, 'AUTHENTICATOR_APP'],
                    });
                  } else {
                    // Ensure at least one method is selected
                    if (policy.allowedMethods.length > 1) {
                      setPolicy({
                        ...policy,
                        allowedMethods: policy.allowedMethods.filter(m => m !== 'AUTHENTICATOR_APP'),
                      });
                    }
                  }
                }}
              />
              <Label htmlFor="method-app" className="font-normal">
                Authenticator App (TOTP)
              </Label>
            </div>
          </div>
        </div>

        <Button onClick={savePolicy} disabled={saving}>
          {saving ? 'Saving...' : 'Save Policy'}
        </Button>
      </div>
    );
  };

  const renderStats = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      );
    }

    if (!stats) {
      return (
        <Alert variant="destructive">
          <CrossCircledIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load 2FA statistics.</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>General Usage</CardTitle>
              <CardDescription>Overall 2FA adoption</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enabledPercentage}%</div>
              <p className="text-sm text-muted-foreground">
                {stats.enabledUsers} out of {stats.totalUsers} users have enabled 2FA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Admin Adoption</CardTitle>
              <CardDescription>2FA usage by administrators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins.percentage}%</div>
              <p className="text-sm text-muted-foreground">
                {stats.admins.withTwoFactor} out of {stats.admins.total} admins have enabled 2FA
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>2FA Methods</CardTitle>
            <CardDescription>Distribution of 2FA methods in use</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Email-based 2FA</span>
                  <span className="text-sm font-medium">{stats.byMethod.email}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${stats.totalUsers ? (stats.byMethod.email / stats.totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Authenticator App</span>
                  <span className="text-sm font-medium">{stats.byMethod.authenticator}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${stats.totalUsers ? (stats.byMethod.authenticator / stats.totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderUsers = () => {
    if (loading && !users.length) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              placeholder="Search by username or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:w-[300px]"
            />
            <Button type="submit">Search</Button>
          </form>

          <Select value={selectedFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="enabled">2FA Enabled</SelectItem>
              <SelectItem value="disabled">2FA Disabled</SelectItem>
              <SelectItem value="admins">Administrators</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>2FA Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No users found. Try adjusting your search or filter.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.isAdmin ? 'Admin' : 'User'}</TableCell>
                    <TableCell>
                      {user.twoFactorEnabled ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircledIcon className="mr-1 h-4 w-4" />
                          Enabled
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <CrossCircledIcon className="mr-1 h-4 w-4" />
                          Disabled
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.twoFactorMethod ? 
                        (user.twoFactorMethod === 'EMAIL' ? 'Email' : 
                         user.twoFactorMethod === 'AUTHENTICATOR_APP' ? 'App' : 
                         user.twoFactorMethod) : 
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      {user.twoFactorEnabled && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => resetUserTwoFactor(user.id, user.username)}
                        >
                          Reset 2FA
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination.pages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => pagination.page > 1 && loadUsers(pagination.page - 1)}
                  className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                // Show first page, last page, current page, and pages around current page
                let pageToShow: number | null = null;
                
                if (pagination.pages <= 5) {
                  // If 5 or fewer pages, show all
                  pageToShow = i + 1;
                } else if (pagination.page <= 3) {
                  // If near start, show first 5 pages
                  if (i < 4) {
                    pageToShow = i + 1;
                  } else {
                    pageToShow = pagination.pages;
                  }
                } else if (pagination.page >= pagination.pages - 2) {
                  // If near end, show last 5 pages
                  if (i === 0) {
                    pageToShow = 1;
                  } else {
                    pageToShow = pagination.pages - 4 + i;
                  }
                } else {
                  // Show pages around current
                  if (i === 0) {
                    pageToShow = 1;
                  } else if (i === 4) {
                    pageToShow = pagination.pages;
                  } else {
                    pageToShow = pagination.page - 1 + i;
                  }
                }
                
                // If we need to show ellipsis
                if ((pagination.pages > 5 && i === 1 && pagination.page > 3) ||
                    (pagination.pages > 5 && i === 3 && pagination.page < pagination.pages - 2)) {
                  return (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                if (pageToShow !== null) {
                  return (
                    <PaginationItem key={pageToShow}>
                      <PaginationLink
                        isActive={pagination.page === pageToShow}
                        onClick={() => loadUsers(pageToShow!)}
                      >
                        {pageToShow}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => pagination.page < pagination.pages && loadUsers(pagination.page + 1)}
                  className={pagination.page >= pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Two-Factor Authentication Settings</CardTitle>
        <CardDescription>
          Configure and manage two-factor authentication for your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="policy">Policy Settings</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          <TabsContent value="policy" className="mt-6">
            {renderPolicyForm()}
          </TabsContent>
          <TabsContent value="stats" className="mt-6">
            {renderStats()}
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            {renderUsers()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 