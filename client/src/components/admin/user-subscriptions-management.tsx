import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { 
  AlertCircle, 
  CheckCircle, 
  MoreHorizontal, 
  Search, 
  Loader2,
  XCircle,
  UserCog,
  Clock
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

// Type definitions
type UserSubscription = {
  id: number;
  userId: number;
  username: string;
  email: string;
  planId: number;
  planName: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
};

type SubscriptionPlan = {
  id: number;
  name: string;
  currency: string;
  price: number;
  interval: string;
};

export function UserSubscriptionsManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [newPlanId, setNewPlanId] = useState<number | null>(null);
  const [newEndDate, setNewEndDate] = useState<string>("");
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  
  // Number of items per page
  const PAGE_SIZE = 10;
  
  // Fetch user subscriptions
  const { data: subscriptions = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/user-subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch subscription plans for the update dialog
  const { data: plans = [] } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Update subscription mutation
  const updateMutation = useMutation({
    mutationFn: async ({ userId, planId, currentPeriodEnd }: { userId: number; planId?: number; currentPeriodEnd?: string }) => {
      const payload: Record<string, any> = {};
      if (planId) payload.planId = planId;
      if (currentPeriodEnd) payload.currentPeriodEnd = currentPeriodEnd;
      
      return await apiRequest("PUT", `/api/admin/users/${userId}/subscription`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-subscriptions"] });
      toast({
        title: "Success",
        description: "User subscription updated successfully",
        variant: "default",
      });
      setShowUpdateDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user subscription",
        variant: "destructive",
      });
    },
  });
  
  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ userId, cancelAtPeriodEnd }: { userId: number; cancelAtPeriodEnd: boolean }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/cancel-subscription`, { cancelAtPeriodEnd });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-subscriptions"] });
      toast({
        title: "Success",
        description: cancelAtPeriodEnd 
          ? "Subscription will be cancelled at the end of the billing period" 
          : "Subscription has been cancelled immediately",
        variant: "default",
      });
      setShowCancelDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });
  
  // Filter subscriptions based on search query
  const filteredSubscriptions = (subscriptions as UserSubscription[]).filter((subscription) => {
    const query = searchQuery.toLowerCase();
    return (
      subscription.username.toLowerCase().includes(query) ||
      subscription.email.toLowerCase().includes(query) ||
      subscription.planName.toLowerCase().includes(query) ||
      subscription.status.toLowerCase().includes(query)
    );
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredSubscriptions.length / PAGE_SIZE);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  
  // Handle update subscription
  const handleUpdateSubscription = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setNewPlanId(subscription.planId);
    // Set default end date as one month from now for the date input
    const defaultDate = new Date(subscription.currentPeriodEnd);
    setNewEndDate(format(defaultDate, "yyyy-MM-dd"));
    setShowUpdateDialog(true);
  };
  
  // Handle cancel subscription
  const handleCancelSubscription = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setCancelAtPeriodEnd(true);
    setShowCancelDialog(true);
  };
  
  // Submit update subscription
  const handleUpdateSubmit = () => {
    if (!selectedSubscription) return;
    
    const payload: Record<string, any> = {
      userId: selectedSubscription.userId
    };
    
    if (newPlanId && newPlanId !== selectedSubscription.planId) {
      payload.planId = newPlanId;
    }
    
    if (newEndDate) {
      const currentEnd = new Date(selectedSubscription.currentPeriodEnd);
      const newEnd = new Date(newEndDate);
      
      // Only update if date has changed
      if (currentEnd.toDateString() !== newEnd.toDateString()) {
        payload.currentPeriodEnd = newEnd.toISOString();
      }
    }
    
    // Only send update if there are changes
    if (Object.keys(payload).length > 1) {
      updateMutation.mutate(payload as any);
    } else {
      setShowUpdateDialog(false);
      toast({
        title: "No changes",
        description: "No changes were made to the subscription",
        variant: "default",
      });
    }
  };
  
  // Submit cancel subscription
  const handleCancelSubmit = () => {
    if (!selectedSubscription) return;
    
    cancelMutation.mutate({
      userId: selectedSubscription.userId,
      cancelAtPeriodEnd,
    });
  };
  
  // Format dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PP");
    } catch (e) {
      return dateString;
    }
  };
  
  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Subscriptions</CardTitle>
          <CardDescription>
            Manage user subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load user subscriptions"}
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
            <CardTitle>User Subscriptions</CardTitle>
            <CardDescription>
              Manage user subscription plans and billing cycles
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
              className="w-full sm:w-[280px] pl-8"
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
        ) : filteredSubscriptions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No subscriptions found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Period</TableHead>
                  <TableHead>Auto Renew</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{subscription.username}</TableCell>
                    <TableCell>{subscription.email}</TableCell>
                    <TableCell>{subscription.planName}</TableCell>
                    <TableCell>
                      {subscription.status === "active" ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200 flex w-fit items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : subscription.status === "trialing" ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 flex w-fit items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Trial
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-200 flex w-fit items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">From: {formatDate(subscription.currentPeriodStart)}</span>
                        <span className="text-xs text-muted-foreground">To: {formatDate(subscription.currentPeriodEnd)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription.cancelAtPeriodEnd ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex w-fit items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Cancelling
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex w-fit items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Auto-renew
                        </Badge>
                      )}
                    </TableCell>
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUpdateSubscription(subscription)}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Update Subscription
                          </DropdownMenuItem>
                          {subscription.status === "active" && !subscription.cancelAtPeriodEnd && (
                            <DropdownMenuItem 
                              onClick={() => handleCancelSubscription(subscription)}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <CardFooter>
          <Pagination className="w-full">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                let pageNumber;
                
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
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
      
      {/* Update Subscription Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Subscription</DialogTitle>
            <DialogDescription>
              Update the plan or billing cycle for this user.
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user-info">User</Label>
                <div id="user-info" className="flex flex-col p-2 border rounded-md">
                  <span className="font-medium">{selectedSubscription.username}</span>
                  <span className="text-sm text-muted-foreground">{selectedSubscription.email}</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select 
                  defaultValue={String(selectedSubscription.planId)} 
                  onValueChange={(value) => setNewPlanId(parseInt(value))}
                >
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {(plans as SubscriptionPlan[]).map((plan) => (
                      <SelectItem 
                        key={plan.id} 
                        value={String(plan.id)}
                      >
                        {plan.name} ({plan.currency} {plan.price}/{plan.interval})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="period-end">Period End Date</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Current end date: {formatDate(selectedSubscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateSubmit}
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this user's subscription?
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cancel-user-info">User</Label>
                <div id="cancel-user-info" className="flex flex-col p-2 border rounded-md">
                  <span className="font-medium">{selectedSubscription.username}</span>
                  <span className="text-sm text-muted-foreground">{selectedSubscription.email}</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cancel-plan-info">Current Plan</Label>
                <div id="cancel-plan-info" className="flex flex-col p-2 border rounded-md">
                  <span className="font-medium">{selectedSubscription.planName}</span>
                  <span className="text-sm text-muted-foreground">
                    Current period ends: {formatDate(selectedSubscription.currentPeriodEnd)}
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-start space-x-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="cancel-end-period"
                      name="cancel-option"
                      checked={cancelAtPeriodEnd}
                      onChange={() => setCancelAtPeriodEnd(true)}
                    />
                    <div>
                      <Label htmlFor="cancel-end-period">Cancel at period end</Label>
                      <p className="text-sm text-muted-foreground">
                        The subscription will remain active until the end of the current billing period
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="cancel-immediately"
                      name="cancel-option"
                      checked={!cancelAtPeriodEnd}
                      onChange={() => setCancelAtPeriodEnd(false)}
                    />
                    <div>
                      <Label htmlFor="cancel-immediately">Cancel immediately</Label>
                      <p className="text-sm text-muted-foreground">
                        The subscription will be cancelled immediately and access will be revoked
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSubmit}
              disabled={cancelMutation.isPending}
              className="gap-2"
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 