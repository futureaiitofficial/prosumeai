import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertCircle, 
  CheckCircle, 
  MoreHorizontal, 
  PlusCircle, 
  Trash2, 
  Edit,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Type definitions
type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: FeatureLimits;
  isActive: boolean;
  trialDays: number;
};

type FeatureLimits = {
  maxResumes: number;
  maxCoverLetters: number;
  maxJobApplications: number;
  aiTokensPerMonth: number;
  customTemplates: boolean;
  advancedAiFeatures: boolean;
  priority: boolean;
  exportFormats: string[];
};

export function SubscriptionPlansManagement() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [activeTab, setActiveTab] = useState<string>("USD");

  // Fetch subscription plans
  const { data: plans = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Filter plans by currency
  const filteredPlans = (plans as SubscriptionPlan[]).filter(
    (plan) => plan.currency === activeTab
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (planData: Omit<SubscriptionPlan, "id">) => {
      return await apiRequest("POST", "/api/admin/subscription-plans", planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Success",
        description: "Subscription plan created successfully",
        variant: "default",
      });
      setShowCreateDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription plan",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (planData: SubscriptionPlan) => {
      return await apiRequest("PUT", `/api/admin/subscription-plans/${planData.id}`, planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
        variant: "default",
      });
      setShowEditDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription plan",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest("DELETE", `/api/admin/subscription-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully",
        variant: "default",
      });
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription plan",
        variant: "destructive",
      });
    },
  });

  // Initialize new plan form
  const [newPlan, setNewPlan] = useState<Omit<SubscriptionPlan, "id">>({
    name: "",
    description: "",
    price: 0,
    currency: "USD",
    interval: "monthly",
    isActive: true,
    trialDays: 0,
    features: {
      maxResumes: 1,
      maxCoverLetters: 1,
      maxJobApplications: 5,
      aiTokensPerMonth: 1000,
      customTemplates: false,
      advancedAiFeatures: false,
      priority: false,
      exportFormats: ["pdf"],
    },
  });

  // Handle edit plan
  const handleEditPlan = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    setShowEditDialog(true);
  };

  // Handle delete plan
  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    setShowDeleteDialog(true);
  };

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewPlan((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  // Handle edit form input change
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (!currentPlan) return;
    
    setCurrentPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: name === "price" ? parseFloat(value) : value,
      };
    });
  };

  // Handle feature change (for numeric values)
  const handleFeatureChange = (feature: keyof FeatureLimits, value: string | number | boolean) => {
    setNewPlan((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: typeof value === 'string' && !isNaN(Number(value)) ? parseInt(value) : value,
      },
    }));
  };

  // Handle feature change for edit (for numeric values)
  const handleEditFeatureChange = (feature: keyof FeatureLimits, value: string | number | boolean) => {
    if (!currentPlan) return;
    
    setCurrentPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        features: {
          ...prev.features,
          [feature]: typeof value === 'string' && !isNaN(Number(value)) ? parseInt(value) : value,
        },
      };
    });
  };

  // Handle create plan submit
  const handleCreatePlan = () => {
    createMutation.mutate(newPlan);
  };

  // Handle update plan submit
  const handleUpdatePlan = () => {
    if (!currentPlan) return;
    updateMutation.mutate(currentPlan);
  };

  // Handle delete plan submit
  const handleDeletePlanConfirm = () => {
    if (!currentPlan) return;
    deleteMutation.mutate(currentPlan.id);
  };

  // Format price
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  // Show empty state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            Manage subscription plans and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load subscription plans"}
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
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>
              Manage subscription plans and pricing
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="USD" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="USD">USD Plans</TabsTrigger>
            <TabsTrigger value="INR">INR Plans</TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No subscription plans found for this currency</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setNewPlan((prev) => ({...prev, currency: activeTab}));
                  setShowCreateDialog(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create {activeTab} Plan
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{plan.name}</div>
                          <div className="text-sm text-muted-foreground">{plan.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(plan.price, plan.currency)}</TableCell>
                      <TableCell className="capitalize">{plan.interval}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="whitespace-nowrap">
                            {plan.features.maxResumes === -1 ? 'Unlimited' : plan.features.maxResumes} Resumes
                          </Badge>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {plan.features.maxCoverLetters === -1 ? 'Unlimited' : plan.features.maxCoverLetters} Cover Letters
                          </Badge>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {plan.features.maxJobApplications === -1 ? 'Unlimited' : plan.features.maxJobApplications} Applications
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan.isActive ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200 flex w-fit items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex w-fit items-center gap-1">
                            Inactive
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
                            <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeletePlan(plan)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Plan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </Tabs>
      </CardContent>

      {/* Create Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>
              Add a new subscription plan to your pricing structure.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="grid gap-6 py-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newPlan.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Basic, Pro, Premium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={newPlan.price}
                    onChange={handleInputChange}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newPlan.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the plan"
                  className="min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={newPlan.currency}
                    onValueChange={(value) =>
                      setNewPlan((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Billing Interval</Label>
                  <Select
                    value={newPlan.interval}
                    onValueChange={(value) =>
                      setNewPlan((prev) => ({ ...prev, interval: value }))
                    }
                  >
                    <SelectTrigger id="interval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trialDays">Trial Days</Label>
                  <Input
                    id="trialDays"
                    name="trialDays"
                    type="number"
                    value={newPlan.trialDays}
                    onChange={handleInputChange}
                    min={0}
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newPlan.isActive}
                      onCheckedChange={(checked) =>
                        setNewPlan((prev) => ({ ...prev, isActive: checked }))
                      }
                    />
                    <Label>Active Plan</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-lg">Feature Limits</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxResumes">Max Resumes</Label>
                    <Input
                      id="maxResumes"
                      type="number"
                      value={newPlan.features.maxResumes === -1 ? "Unlimited" : newPlan.features.maxResumes}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase() === 'unlimited' ? -1 : parseInt(e.target.value);
                        handleFeatureChange("maxResumes", value);
                      }}
                      placeholder="Enter limit or 'Unlimited'"
                    />
                    <p className="text-xs text-muted-foreground">Enter -1 for unlimited</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxCoverLetters">Max Cover Letters</Label>
                    <Input
                      id="maxCoverLetters"
                      type="number"
                      value={newPlan.features.maxCoverLetters === -1 ? "Unlimited" : newPlan.features.maxCoverLetters}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase() === 'unlimited' ? -1 : parseInt(e.target.value);
                        handleFeatureChange("maxCoverLetters", value);
                      }}
                      placeholder="Enter limit or 'Unlimited'"
                    />
                    <p className="text-xs text-muted-foreground">Enter -1 for unlimited</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxJobApplications">Max Job Applications</Label>
                    <Input
                      id="maxJobApplications"
                      type="number"
                      value={newPlan.features.maxJobApplications === -1 ? "Unlimited" : newPlan.features.maxJobApplications}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase() === 'unlimited' ? -1 : parseInt(e.target.value);
                        handleFeatureChange("maxJobApplications", value);
                      }}
                      placeholder="Enter limit or 'Unlimited'"
                    />
                    <p className="text-xs text-muted-foreground">Enter -1 for unlimited</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aiTokensPerMonth">AI Tokens Per Month</Label>
                    <Input
                      id="aiTokensPerMonth"
                      type="number"
                      value={newPlan.features.aiTokensPerMonth === -1 ? "Unlimited" : newPlan.features.aiTokensPerMonth}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase() === 'unlimited' ? -1 : parseInt(e.target.value);
                        handleFeatureChange("aiTokensPerMonth", value);
                      }}
                      placeholder="Enter limit or 'Unlimited'"
                    />
                    <p className="text-xs text-muted-foreground">Enter -1 for unlimited</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Additional Features</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newPlan.features.customTemplates}
                        onCheckedChange={(checked) => handleFeatureChange("customTemplates", checked)}
                      />
                      <Label>Custom Templates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newPlan.features.advancedAiFeatures}
                        onCheckedChange={(checked) => handleFeatureChange("advancedAiFeatures", checked)}
                      />
                      <Label>Advanced AI Features</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newPlan.features.priority}
                        onCheckedChange={(checked) => handleFeatureChange("priority", checked)}
                      />
                      <Label>Priority Support</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePlan}
              disabled={createMutation.isPending}
              className="gap-2"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          {currentPlan && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Subscription Plan</DialogTitle>
                <DialogDescription>
                  Update details for the {currentPlan.name} plan.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="grid gap-6 py-4 px-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Plan Name</Label>
                      <Input
                        id="edit-name"
                        name="name"
                        value={currentPlan.name}
                        onChange={handleEditInputChange}
                        placeholder="e.g. Basic, Pro, Premium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Price</Label>
                      <Input
                        id="edit-price"
                        name="price"
                        type="number"
                        value={currentPlan.price}
                        onChange={handleEditInputChange}
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      value={currentPlan.description}
                      onChange={handleEditInputChange}
                      placeholder="Brief description of the plan"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-currency">Currency</Label>
                      <Select
                        value={currentPlan.currency}
                        onValueChange={(value) =>
                          setCurrentPlan((prev) => prev ? { ...prev, currency: value } : null)
                        }
                      >
                        <SelectTrigger id="edit-currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-interval">Billing Interval</Label>
                      <Select
                        value={currentPlan.interval}
                        onValueChange={(value) =>
                          setCurrentPlan((prev) => prev ? { ...prev, interval: value } : null)
                        }
                      >
                        <SelectTrigger id="edit-interval">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-trialDays">Trial Days</Label>
                      <Input
                        id="edit-trialDays"
                        name="trialDays"
                        type="number"
                        value={currentPlan.trialDays}
                        onChange={handleEditInputChange}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2 flex items-end">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={currentPlan.isActive}
                          onCheckedChange={(checked) =>
                            setCurrentPlan((prev) => prev ? { ...prev, isActive: checked } : null)
                          }
                        />
                        <Label>Active Plan</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Feature Limits</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-maxResumes">Max Resumes</Label>
                        <Input
                          id="edit-maxResumes"
                          type="number"
                          value={currentPlan.features.maxResumes === -1 ? "Unlimited" : currentPlan.features.maxResumes}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase() === 'unlimited' ? -1 : parseInt(e.target.value);
                            handleEditFeatureChange("maxResumes", value);
                          }}
                          placeholder="Enter limit or 'Unlimited'"
                        />
                        <p className="text-xs text-muted-foreground">Enter -1 for unlimited</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-maxCoverLetters">Max Cover Letters</Label>
                        <Input
                          id="edit-maxCoverLetters"
                          type="number"
                          value={currentPlan.features.maxCoverLetters === -1 ? "Unlimited" : currentPlan.features.maxCoverLetters}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase() === 'unlimited' ? -1 : parseInt(e.target.value);
                            handleEditFeatureChange("maxCoverLetters", value);
                          }}
                          placeholder="Enter limit or 'Unlimited'"
                        />
                        <p className="text-xs text-muted-foreground">Enter -1 for unlimited</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-maxJobApplications">Max Job Applications</Label>
                        <Input
                          id="edit-maxJobApplications"
                          type="number"
                          value={currentPlan.features.maxJobApplications === -1 ? "Unlimited" : currentPlan.features.maxJobApplications}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase() === 'unlimited' ? -1 : parseInt(e.target.value);
                            handleEditFeatureChange("maxJobApplications", value);
                          }}
                          placeholder="Enter limit or 'Unlimited'"
                        />
                        <p className="text-xs text-muted-foreground">Enter -1 for unlimited</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-aiTokensPerMonth">AI Tokens Per Month</Label>
                        <Input
                          id="edit-aiTokensPerMonth"
                          type="number"
                          value={currentPlan.features.aiTokensPerMonth === -1 ? "Unlimited" : currentPlan.features.aiTokensPerMonth}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase() === 'unlimited' ? -1 : parseInt(e.target.value);
                            handleEditFeatureChange("aiTokensPerMonth", value);
                          }}
                          placeholder="Enter limit or 'Unlimited'"
                        />
                        <p className="text-xs text-muted-foreground">Enter -1 for unlimited</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Additional Features</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={currentPlan.features.customTemplates}
                            onCheckedChange={(checked) => handleEditFeatureChange("customTemplates", checked)}
                          />
                          <Label>Custom Templates</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={currentPlan.features.advancedAiFeatures}
                            onCheckedChange={(checked) => handleEditFeatureChange("advancedAiFeatures", checked)}
                          />
                          <Label>Advanced AI Features</Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={currentPlan.features.priority}
                            onCheckedChange={(checked) => handleEditFeatureChange("priority", checked)}
                          />
                          <Label>Priority Support</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdatePlan}
                  disabled={updateMutation.isPending}
                  className="gap-2"
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update Plan
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Plan Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentPlan && (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Plan Name:</span>
                  <span>{currentPlan.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Price:</span>
                  <span>{formatPrice(currentPlan.price, currentPlan.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Billing Interval:</span>
                  <span className="capitalize">{currentPlan.interval}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeletePlanConfirm}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 