import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, MoreHorizontal, Search, Loader2, ShieldAlert, ShieldCheck, UserX, Crown, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type for user data
type User = {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
  status: string;
};

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  isFeatured: boolean;
  isFreemium: boolean;
  active: boolean;
}

export function UsersManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showDemoteDialog, setShowDemoteDialog] = useState(false);
  const [showAssignPlanDialog, setShowAssignPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  
  // Number of users per page
  const PAGE_SIZE = 10;
  
  // Fetch users
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  }) as { data: User[], isLoading: boolean, error: unknown, refetch: () => void };
  
  // Fetch subscription plans
  const { data: plans = [] } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: getQueryFn({ on401: "throw" }),
  }) as { data: SubscriptionPlan[] };
  
  // Get user's active subscription
  const { data: userSubscriptions = [] } = useQuery({
    queryKey: ["/api/admin/user-subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Log the plans and subscriptions for debugging
  useEffect(() => {
    console.log("Admin view - Fetched subscription plans:", plans);
    console.log("Admin view - Fetched user subscriptions:", userSubscriptions);
  }, [plans, userSubscriptions]);
  
  // Find user's active subscription
  const getUserSubscription = (userId: number) => {
    const subscription = (userSubscriptions as any[]).find(
      sub => sub.userId === userId && sub.status === "ACTIVE"
    );
    
    if (subscription) {
      console.log(`Found active subscription for user ${userId}:`, subscription);
    } else {
      console.log(`No active subscription found for user ${userId}`);
    }
    
    return subscription;
  };
  
  // Mutation for promoting a user to admin
  const promoteMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", "/api/admin/promote", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User has been promoted to admin successfully",
        variant: "default",
      });
      setShowPromoteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to promote user",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for demoting an admin to regular user
  const demoteMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", "/api/admin/demote", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Admin privileges have been removed from user",
        variant: "default",
      });
      setShowDemoteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to demote user",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for assigning a subscription plan to a user
  const assignPlanMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: number; planId: number }) => {
      return await apiRequest("POST", "/api/admin/user/assign-plan", { userId, planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-subscriptions"] });
      toast({
        title: "Success",
        description: "Subscription plan assigned successfully",
        variant: "default",
      });
      setShowAssignPlanDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign subscription plan",
        variant: "destructive",
      });
    },
  });
  
  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    return (users as User[]).filter((user: User) => {
      const query = searchQuery.toLowerCase();
      return (
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.status && user.status.toLowerCase().includes(query))
      );
    });
  }, [users, searchQuery]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredUsers, currentPage]);
  
  // Handle promotion
  const handlePromote = (user: User) => {
    setSelectedUser(user);
    setShowPromoteDialog(true);
  };
  
  // Handle demotion
  const handleDemote = (user: User) => {
    setSelectedUser(user);
    setShowDemoteDialog(true);
  };

  // Handle assigning a plan
  const handleAssignPlan = (user: User) => {
    console.log("Assigning plan to user:", user.username);
    setSelectedUser(user);
    // Check if user already has an active subscription and pre-select that plan
    const subscription = getUserSubscription(user.id);
    if (subscription) {
      console.log(`Pre-selecting current plan: ${subscription.planId} for user ${user.id}`);
    }
    setSelectedPlan(subscription?.planId || null);
    setShowAssignPlanDialog(true);
  };
  
  const handleConfirmAssignPlan = () => {
    if (!selectedUser || !selectedPlan) {
      console.error("Cannot assign plan: Missing user or plan", { user: selectedUser?.username, planId: selectedPlan });
      return;
    }
    
    console.log("Confirming plan assignment:", { 
      user: selectedUser.username, 
      userId: selectedUser.id, 
      planId: selectedPlan 
    });
    
    assignPlanMutation.mutate({
      userId: selectedUser.id,
      planId: selectedPlan
    });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };
  
  // Get subscription plan name
  const getPlanName = (userId: number) => {
    const subscription = getUserSubscription(userId);
    if (!subscription) return null;
    
    // Check if the subscription already has planName (from join query)
    if (subscription.planName) {
      return subscription.planName;
    }
    
    // Otherwise find the plan from the plans array
    const plan = (plans as SubscriptionPlan[]).find(p => p.id === subscription.planId);
    if (!plan) {
      console.log(`Plan not found for user ${userId} with planId ${subscription.planId}`);
      return `Unknown (ID: ${subscription.planId})`;
    }
    
    return plan!.name;
  };
  
  useEffect(() => {
    if (users.length > 0) {
      console.log('Users loaded, dropdowns should be rendered for:', users.map(u => u.username));
    }
  }, [users]);
  
  useEffect(() => {
    console.log('Subscription plans loaded:', plans);
  }, [plans]);
  
  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
          <CardDescription>
            Manage users and control admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load users"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>
              Manage users and control admin access
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="w-full sm:w-[200px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Registered Date</TableHead>
                  <TableHead>Subscription Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-500 flex w-fit items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="w-fit">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      {getPlanName(user.id) ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex w-fit items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {getPlanName(user.id)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 w-fit">
                          No plan
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.status === "active" ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex w-fit items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex w-fit items-center gap-1">
                          <UserX className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAssignPlan(user)}
                          className="h-8 flex items-center gap-1"
                        >
                          <CreditCard className="h-3 w-3" />
                          Assign Plan
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {!user.isAdmin ? (
                              <DropdownMenuItem onClick={() => handlePromote(user)}>
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Promote to Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleDemote(user)}>
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                Remove Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleAssignPlan(user)}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Assign Plan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
      {totalPages > 1 && (
        <CardFooter>
          <Pagination className="w-full">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                let pageNumber;
                
                // Display a different range of page numbers depending on current page position
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (currentPage <= 3) {
                  pageNumber = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = currentPage - 2 + index;
                }
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === currentPage}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
      
      {/* Promote User Dialog */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote User to Admin</DialogTitle>
            <DialogDescription>
              This will grant admin privileges to this user. Admin users have full access to the
              admin dashboard and can manage all aspects of the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Username:</span>
                  <span>{selectedUser.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{selectedUser.email}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromoteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedUser && promoteMutation.mutate(selectedUser.id)}
              className="gap-2"
              disabled={promoteMutation.isPending}
            >
              {promoteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Demote Admin Dialog */}
      <Dialog open={showDemoteDialog} onOpenChange={setShowDemoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Admin Privileges</DialogTitle>
            <DialogDescription>
              This will remove admin privileges from this user. They will no longer
              have access to the admin dashboard or be able to manage platform settings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Username:</span>
                  <span>{selectedUser.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{selectedUser.email}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDemoteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedUser && demoteMutation.mutate(selectedUser.id)}
              className="gap-2"
              disabled={demoteMutation.isPending}
            >
              {demoteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Removal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Plan Dialog */}
      <Dialog open={showAssignPlanDialog} onOpenChange={setShowAssignPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subscription Plan</DialogTitle>
            <DialogDescription>
              Assign a subscription plan to this user. This will override any existing subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <>
                <div className="flex flex-col space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Username:</span>
                    <span>{selectedUser.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plan-select">Select Subscription Plan</Label>
                  <Select
                    value={selectedPlan?.toString() || ""}
                    onValueChange={(value) => setSelectedPlan(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {(plans as SubscriptionPlan[])
                        .filter(plan => plan.active)
                        .map((plan) => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.name}
                            {plan.isFreemium && " (Freemium)"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignPlanDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAssignPlan}
              className="gap-2"
              disabled={!selectedPlan || assignPlanMutation.isPending}
            >
              {assignPlanMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}