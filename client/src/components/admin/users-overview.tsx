import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MoreHorizontal, 
  User, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  ShieldCheck,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string;
}

// Form schema for creating/editing users
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(), // Make optional for edit
  role: z.enum(["user", "support", "admin"]),
});

// Mock data for demonstration (Removed plan/planId)
const mockUsers: User[] = [
  {
    id: 1,
    username: "johndoe",
    email: "john.doe@example.com",
    role: "user",
    status: "active",
    createdAt: "2023-01-15",
    lastLogin: "2023-05-22",
  },
  {
    id: 2,
    username: "janedoe",
    email: "jane.doe@example.com",
    role: "user",
    status: "active",
    createdAt: "2023-02-21",
    lastLogin: "2023-05-20",
  },
  {
    id: 3,
    username: "adminuser",
    email: "admin@example.com",
    role: "admin",
    status: "active",
    createdAt: "2022-12-01",
    lastLogin: "2023-05-23",
  },
  {
    id: 4,
    username: "susansmith",
    email: "susan.smith@example.com",
    role: "user",
    status: "inactive",
    createdAt: "2023-03-05",
    lastLogin: "2023-04-15",
  },
  {
    id: 5,
    username: "michaeljones",
    email: "michael.jones@example.com",
    role: "user",
    status: "active",
    createdAt: "2023-01-20",
    lastLogin: "2023-05-21",
  },
  {
    id: 6,
    username: "lisawalters",
    email: "lisa.walters@example.com",
    role: "support",
    status: "active",
    createdAt: "2023-02-10",
    lastLogin: "2023-05-22",
  },
];

export function UsersOverview() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const itemsPerPage = 5;
  
  // Initialize create user form
  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      role: "user",
    },
  });

  // Initialize edit user form
  const editUserForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "", // Keep empty for edit
      role: "user",
    },
  });
  
  // Fetch users
  const { data: users = mockUsers as User[], isLoading: isUsersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof userFormSchema>) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      refetchUsers();
      toast({
        title: "User Created",
        description: "The user has been created successfully.",
      });
      setIsAddUserOpen(false);
      userForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof userFormSchema>> }) => { // Use Partial for update
      // Filter out password if it's empty
      const updateData = { ...data };
      if (updateData.password === "") {
        delete updateData.password;
      }
      
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      refetchUsers();
      toast({
        title: "User Updated",
        description: "The user has been updated successfully.",
      });
      setIsEditUserOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      refetchUsers();
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter and paginate users
  const filteredUsers = (users as User[])
    .filter((user: User) => {
      const matchesSearch = 
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle user deletion
  const handleDeleteUser = (userId: number) => {
    setSelectedUserId(userId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteUser = () => {
    if (selectedUserId !== null) {
      deleteUserMutation.mutate(selectedUserId);
    }
  };
  
  // Handle user edit
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    // Fetch full user details if needed, or use existing mock/fetched data
    // For now, use username as fullName placeholder
    editUserForm.reset({
      username: user.username,
      email: user.email,
      fullName: user.username, // Placeholder, use actual fullName if available
      password: "", // Keep password empty for edit form
      role: user.role as any,
    });
    setIsEditUserOpen(true);
  };
  
  // Form submission handlers
  const onCreateUser = (values: z.infer<typeof userFormSchema>) => {
    // Ensure password is provided for creation
    if (!values.password) {
        userForm.setError("password", { type: "manual", message: "Password is required for new users." });
        return;
    }
    createUserMutation.mutate(values);
  };
  
  const onUpdateUser = (values: z.infer<typeof userFormSchema>) => {
    if (selectedUser) {
      // Send only changed fields, make password optional in schema if needed for update
      const updatedValues: Partial<z.infer<typeof userFormSchema>> = {};
      if (values.username !== selectedUser.username) updatedValues.username = values.username;
      if (values.email !== selectedUser.email) updatedValues.email = values.email;
      if (values.fullName !== selectedUser.username) updatedValues.fullName = values.fullName; // Assuming username is placeholder
      if (values.password) updatedValues.password = values.password; // Only send if changed
      if (values.role !== selectedUser.role) updatedValues.role = values.role;
      
      if (Object.keys(updatedValues).length > 0) {
          updateUserMutation.mutate({ id: selectedUser.id, data: updatedValues });
      } else {
          toast({ title: "No Changes", description: "No information was changed." });
          setIsEditUserOpen(false);
      }
    }
  };
  
  // Handle role update (mock, replace with API call if needed)
  const handleUpdateRole = (userId: number, newRole: string) => {
    toast({
      title: "Role Updated (Mock)",
      description: `User role changed to ${newRole}. Refresh to see changes in real app.`,
    });
    // Example: updateUserMutation.mutate({ id: userId, data: { role: newRole } });
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">User Management</CardTitle>
              <CardDescription>
                Manage users, roles, and permissions
              </CardDescription>
            </div>
            <div className="mt-4 md:mt-0">
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(onCreateUser)} className="space-y-4">
                      <FormField
                        control={userForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Roles</SelectLabel>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="support">Support</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter className="pt-4">
                        <Button 
                          variant="outline" 
                          type="button" 
                          onClick={() => setIsAddUserOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createUserMutation.isPending}
                        >
                          {createUserMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create User
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Role filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isUsersLoading ? (
                    <TableRow> <TableCell colSpan={6} className="text-center py-8"> Loading... </TableCell> </TableRow>
                  ) : paginatedUsers.length === 0 ? (
                    <TableRow> <TableCell colSpan={6} className="text-center py-8"> No users found. </TableCell> </TableRow>
                  ) : (
                    paginatedUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {user.role === "admin" ? (
                              <ShieldCheck className="h-4 w-4 text-primary" />
                            ) : user.role === "support" ? (
                              <Shield className="h-4 w-4 text-blue-500" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="capitalize">{user.role}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.status === "active" 
                              ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400" 
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                          }`}>
                            {user.status}
                          </div>
                        </TableCell>
                        <TableCell>{user.createdAt}</TableCell>
                        <TableCell>{user.lastLogin || "Never"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleUpdateRole(user.id, "user")}>
                                <User className="mr-2 h-4 w-4" />
                                <span>User</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateRole(user.id, "support")}>
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Support</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateRole(user.id, "admin")}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                <span>Admin</span>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                  />
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(index + 1); }}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user account information.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onUpdateUser)} className="space-y-4">
               {/* Full Name */}
               <FormField
                 control={editUserForm.control}
                 name="fullName"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Full Name</FormLabel>
                     <FormControl>
                       <Input placeholder="John Doe" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               
               {/* Username */}
               <FormField
                 control={editUserForm.control}
                 name="username"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Username</FormLabel>
                     <FormControl>
                       <Input placeholder="johndoe" {...field} disabled />
                     </FormControl>
                     <FormDescription>Username cannot be changed.</FormDescription>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               
               {/* Email */}
               <FormField
                 control={editUserForm.control}
                 name="email"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Email</FormLabel>
                     <FormControl>
                       <Input type="email" placeholder="john.doe@example.com" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               
               {/* Password */}
               <FormField
                 control={editUserForm.control}
                 name="password"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>New Password (Optional)</FormLabel>
                     <FormControl>
                       <Input type="password" placeholder="Leave blank to keep current password" {...field} />
                     </FormControl>
                     <FormDescription>Enter a new password to update it.</FormDescription>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               
               {/* Role */}
               <FormField
                 control={editUserForm.control}
                 name="role"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Role</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Select a role" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectGroup>
                           <SelectLabel>Roles</SelectLabel>
                           <SelectItem value="user">User</SelectItem>
                           <SelectItem value="support">Support</SelectItem>
                           <SelectItem value="admin">Admin</SelectItem>
                         </SelectGroup>
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               
               <DialogFooter className="pt-4">
                 <Button 
                   variant="outline" 
                   type="button" 
                   onClick={() => setIsEditUserOpen(false)}
                 >
                   Cancel
                 </Button>
                 <Button 
                   type="submit"
                   disabled={updateUserMutation.isPending}
                 >
                   {updateUserMutation.isPending && (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   )}
                   Update User
                 </Button>
               </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}