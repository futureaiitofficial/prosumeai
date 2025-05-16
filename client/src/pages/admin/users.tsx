import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Redirect } from "wouter";
import { AdminLayout } from "@/components/admin/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User, 
  Users, 
  Search, 
  Plus, 
  Trash,
  Edit,
  Shield,
  ShieldOff,
  MoreHorizontal, 
  RefreshCw, 
  Loader2,
  FileText,
  UserPlus,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type UserData = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserStats = {
  resumeCount: number;
  coverLetterCount: number;
  jobAppCount: number;
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminCheckLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isUserStatsLoading, setIsUserStatsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isDemoteDialogOpen, setIsDemoteDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isAssignPlanDialogOpen, setIsAssignPlanDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  const { toast } = useToast();
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // If not admin, redirect to home
  if (!adminCheckLoading && !isAdmin) {
    return <Redirect to="/" />;
  }
  
  // Fetch users
  const fetchUsers = async () => {
    console.log("Fetching users...");
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      console.log("Fetched users:", data);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch user stats
  const fetchUserStats = async (userId: number) => {
    setIsUserStatsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/stats`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }
      
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user statistics",
        variant: "destructive",
      });
    } finally {
      setIsUserStatsLoading(false);
    }
  };
  
  // Filter users based on search query and active tab
  const filterUsers = () => {
    let filtered = users;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply tab filter
    if (activeTab === 'admin') {
      filtered = filtered.filter(user => user.isAdmin);
    } else if (activeTab === 'regular') {
      filtered = filtered.filter(user => !user.isAdmin);
    }
    
    setFilteredUsers(filtered);
  };
  
  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await apiRequest('DELETE', `/api/admin/users/${selectedUser.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      toast({
        title: "Success",
        description: `User ${selectedUser.username} has been deleted`,
      });
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };
  
  // Handle promoting user to admin
  const handlePromoteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await apiRequest('POST', '/api/admin/promote', { userId: selectedUser.id });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to promote user');
      }
      
      toast({
        title: "Success",
        description: `User ${selectedUser.username} has been promoted to admin`,
      });
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to promote user",
        variant: "destructive",
      });
    } finally {
      setIsPromoteDialogOpen(false);
      setSelectedUser(null);
    }
  };
  
  // Handle demoting admin to regular user
  const handleDemoteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await apiRequest('POST', '/api/admin/demote', { userId: selectedUser.id });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to demote user');
      }
      
      toast({
        title: "Success",
        description: `User ${selectedUser.username} has been demoted to regular user`,
      });
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error demoting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to demote user",
        variant: "destructive",
      });
    } finally {
      setIsDemoteDialogOpen(false);
      setSelectedUser(null);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // New function to create a user
  const handleCreateUser = async (userData: {
    username: string,
    email: string,
    password: string,
    fullName: string,
    isAdmin: boolean
  }) => {
    console.log("Creating user with data:", userData);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      console.log("Create user response status:", response.status);
      
      const responseData = await response.json();
      console.log("Create user response data:", responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create user');
      }
      
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
      
      // Refresh user list
      console.log("Refreshing user list after creation");
      await fetchUsers();
      
      // Close dialog
      setIsCreateUserDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    }
  };
  
  // Fetch subscription plans
  const fetchSubscriptionPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await fetch('/api/admin/subscription-plans', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      
      const data = await response.json();
      console.log("Fetched subscription plans:", data);
      setSubscriptionPlans(data);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Handle assigning subscription plan to user
  const handleAssignPlan = async () => {
    if (!selectedUser || !selectedPlan) {
      toast({
        title: "Error",
        description: "Please select a subscription plan",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest('POST', '/api/admin/user/assign-plan', { 
        userId: selectedUser.id, 
        planId: selectedPlan 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign subscription plan');
      }
      
      toast({
        title: "Success",
        description: `Subscription plan assigned to ${selectedUser.username}`,
      });
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error assigning plan:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign subscription plan",
        variant: "destructive",
      });
    } finally {
      setIsAssignPlanDialogOpen(false);
      setSelectedPlan(null);
    }
  };
  
  // Handle reset password
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    // Reset error state
    setResetPasswordError("");
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setResetPasswordError("Passwords do not match");
      return;
    }
    
    // Validate password is not empty
    if (!newPassword) {
      setResetPasswordError("Password cannot be empty");
      return;
    }
    
    setIsResettingPassword(true);
    
    try {
      const response = await apiRequest('POST', '/api/admin/reset-password', { 
        userId: selectedUser.id, 
        newPassword 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
      
      toast({
        title: "Success",
        description: `Password for ${selectedUser.username} has been reset`,
      });
      
      // Close dialog and clear form
      setIsResetPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setSelectedUser(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      setResetPasswordError(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsResettingPassword(false);
    }
  };
  
  // Effects
  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  // Add an effect to refetch users when the create dialog is closed
  useEffect(() => {
    if (!isCreateUserDialogOpen) {
      fetchUsers();
    }
  }, [isCreateUserDialogOpen]);
  
  useEffect(() => {
    filterUsers();
  }, [searchQuery, activeTab, users]);
  
  useEffect(() => {
    if (isDialogOpen && selectedUser) {
      fetchUserStats(selectedUser.id);
    }
  }, [isDialogOpen, selectedUser]);
  
  // Effect to fetch subscription plans when the assignment dialog opens
  useEffect(() => {
    if (isAssignPlanDialogOpen) {
      fetchSubscriptionPlans();
    }
  }, [isAssignPlanDialogOpen]);
  
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">View and manage users of your application</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setIsCreateUserDialogOpen(true)}
            className="mr-2"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search" 
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="admin">Admins</TabsTrigger>
              <TabsTrigger value="regular">Regular Users</TabsTrigger>
            </TabsList>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Users Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term" : "No users match the current filter"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-sm text-muted-foreground">@{user.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge variant="default">Admin</Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <User className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {user.isAdmin ? (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsDemoteDialogOpen(true);
                                  }}
                                >
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  Remove Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsPromoteDialogOpen(true);
                                  }}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  fetchSubscriptionPlans();
                                  setIsAssignPlanDialogOpen(true);
                                }}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Assign Subscription Plan
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsResetPasswordDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className="border-t px-6 py-3">
          <div className="text-xs text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardFooter>
      </Card>
      
      {/* User Profile Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Complete information about the user account
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.fullName}</h3>
                  <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.isAdmin ? (
                      <Badge variant="default">Admin</Badge>
                    ) : (
                      <Badge variant="outline">Regular User</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">User Statistics</h4>
                
                {isUserStatsLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : userStats ? (
                  <div className="grid grid-cols-1 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Documents</p>
                            <div className="flex gap-4 mt-1">
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">{userStats.resumeCount} Resumes</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">{userStats.coverLetterCount} Cover Letters</span>
                              </div>
                            </div>
                            <div className="mt-1">
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">{userStats.jobAppCount} Job Applications</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No stats available</p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user account? This action cannot be undone.
              {selectedUser && (
                <div className="mt-2 font-medium">
                  {selectedUser.fullName} (@{selectedUser.username})
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Promote User Dialog */}
      <AlertDialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to grant admin privileges to this user? They will have full access to all administrative features.
              {selectedUser && (
                <div className="mt-2 font-medium">
                  {selectedUser.fullName} (@{selectedUser.username})
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromoteUser}>
              Promote to Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Demote User Dialog */}
      <AlertDialog open={isDemoteDialogOpen} onOpenChange={setIsDemoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Privileges</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin privileges from this user? They will no longer have access to administrative features.
              {selectedUser && (
                <div className="mt-2 font-medium">
                  {selectedUser.fullName} (@{selectedUser.username})
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDemoteUser}>
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user account.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            
            handleCreateUser({
              username: formData.get('username') as string,
              email: formData.get('email') as string,
              password: formData.get('password') as string,
              fullName: formData.get('fullName') as string,
              isAdmin: formData.get('isAdmin') === 'on'
            });
          }} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isAdmin" className="text-right">
                Admin Access
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox id="isAdmin" name="isAdmin" />
                <label
                  htmlFor="isAdmin"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Grant admin privileges
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsCreateUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Assign Subscription Plan Dialog */}
      <Dialog open={isAssignPlanDialogOpen} onOpenChange={setIsAssignPlanDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Subscription Plan</DialogTitle>
            <DialogDescription>
              Assign a subscription plan to this user. This will override any existing subscription.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex flex-col space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Username:</span>
                  <span>@{selectedUser.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Full Name:</span>
                  <span>{selectedUser.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{selectedUser.email}</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <Label htmlFor="plan-select">Select Subscription Plan</Label>
                {isLoadingPlans ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading subscription plans...</span>
                  </div>
                ) : subscriptionPlans.length === 0 ? (
                  <div className="text-center p-4 border rounded-md">
                    No subscription plans available
                  </div>
                ) : (
                  <Select 
                    value={selectedPlan?.toString() || ""}
                    onValueChange={(value) => setSelectedPlan(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionPlans
                        .filter(plan => plan.active)
                        .map((plan) => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.name}
                            {plan.isFreemium && " (Freemium)"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAssignPlanDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignPlan}
                  disabled={!selectedPlan || isLoadingPlans}
                  className="gap-2"
                >
                  {isLoadingPlans && <Loader2 className="h-4 w-4 animate-spin" />}
                  Assign Plan
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this user. They will need to use this password for their next login.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleResetPassword();
            }} className="py-4 space-y-4">
              <div className="flex flex-col space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Username:</span>
                  <span>@{selectedUser.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Full Name:</span>
                  <span>{selectedUser.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{selectedUser.email}</span>
                </div>
              </div>
              
              {resetPasswordError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm mb-4">
                  {resetPasswordError}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsResetPasswordDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isResettingPassword}
                  className="gap-2"
                >
                  {isResettingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 