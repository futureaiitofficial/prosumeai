import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  CreditCard,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

// Types
type Subscription = {
  id: number;
  planId: number;
  planName: string;
  planFeatures: FeatureLimits;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
};

type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: FeatureLimits;
  isActive: boolean;
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

type FeatureUsage = {
  feature: string;
  used: number;
  limit: number;
  resetDate: string;
};

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  
  // Fetch current subscription
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } = useQuery<Subscription>({
    queryKey: ["/api/user/subscription"],
    queryFn: getQueryFn(),
  });
  
  // Fetch available plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: getQueryFn(),
  });
  
  // Fetch feature usage
  const { data: featureUsage = [], isLoading: usageLoading } = useQuery<FeatureUsage[]>({
    queryKey: ["/api/user/feature-usage"],
    queryFn: getQueryFn(),
    enabled: !!subscription,
  });
  
  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/user/cancel-subscription");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the current billing period.",
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
  
  // Upgrade subscription mutation
  const upgradeMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest("POST", "/api/user/change-plan", { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
      toast({
        title: "Plan Changed",
        description: "Your subscription has been updated successfully.",
        variant: "default",
      });
      setShowUpgradeDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change subscription plan",
        variant: "destructive",
      });
    },
  });
  
  // Filter plans by currency
  const filteredPlans = plans.filter(
    (plan) => plan.currency === selectedCurrency && plan.isActive
  );
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return dateString;
    }
  };
  
  // Format price
  const formatPrice = (price: number, currency: string, interval: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    
    return `${formatter.format(price)}/${interval.replace('ly', '')}`;
  };
  
  // Handle plan selection
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };
  
  // Subscription Feature List Component
  const FeatureList = ({ features }: { features: FeatureLimits }) => (
    <ul className="space-y-2 my-4">
      <li className="flex items-center">
        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
        {features.maxResumes === -1 ? "Unlimited" : features.maxResumes} Resumes
      </li>
      <li className="flex items-center">
        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
        {features.maxCoverLetters === -1 ? "Unlimited" : features.maxCoverLetters} Cover Letters
      </li>
      <li className="flex items-center">
        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
        {features.maxJobApplications === -1 ? "Unlimited" : features.maxJobApplications} Job Applications
      </li>
      <li className="flex items-center">
        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
        {features.aiTokensPerMonth === -1 ? "Unlimited" : `${features.aiTokensPerMonth.toLocaleString()}`} AI Tokens per month
      </li>
      {features.customTemplates && (
        <li className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          Custom Templates
        </li>
      )}
      {features.advancedAiFeatures && (
        <li className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          Advanced AI Features
        </li>
      )}
      {features.priority && (
        <li className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          Priority Support
        </li>
      )}
    </ul>
  );
  
  if (subscriptionError) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {subscriptionError instanceof Error
              ? subscriptionError.message
              : "Failed to load subscription data"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing details
          </p>
        </div>
        
        {subscriptionLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : subscription ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your current subscription details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{subscription.planName}</h3>
                  {subscription.status === "active" ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  ) : subscription.status === "trialing" ? (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      Trial
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm space-y-2">
                  <p className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    Current period ends: {formatDate(subscription.currentPeriodEnd)}
                  </p>
                  {subscription.cancelAtPeriodEnd && (
                    <p className="flex items-center text-amber-600">
                      <XCircle className="h-4 w-4 mr-2" />
                      Your subscription will cancel at the end of the current period
                    </p>
                  )}
                </div>
                
                <div className="pt-4">
                  <h4 className="font-medium mb-2">Features</h4>
                  <FeatureList features={subscription.planFeatures} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {!subscription.cancelAtPeriodEnd && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCancelDialog(true)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Cancel Subscription
                  </Button>
                )}
                <Button onClick={() => window.location.href = '#upgrade'}>
                  Upgrade Plan
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Usage</CardTitle>
                <CardDescription>Your current feature usage</CardDescription>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : featureUsage.length > 0 ? (
                  <div className="space-y-4">
                    {featureUsage.map((item) => (
                      <div key={item.feature} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {item.feature.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm">
                            {item.used} / {item.limit === -1 ? '∞' : item.limit}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ 
                              width: item.limit === -1 
                                ? '5%' 
                                : `${Math.min(100, (item.used / item.limit) * 100)}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Resets on {formatDate(item.resetDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-4">No usage data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                You don't have an active subscription. Choose a plan below to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Upgrade to a paid plan to unlock additional features and usage limits.</p>
            </CardContent>
          </Card>
        )}
        
        <div id="upgrade" className="mt-12 pt-4">
          <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
          
          <Tabs defaultValue="USD" onValueChange={setSelectedCurrency}>
            <TabsList className="mb-6">
              <TabsTrigger value="USD">USD</TabsTrigger>
              <TabsTrigger value="INR">INR</TabsTrigger>
            </TabsList>
            
            {plansLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPlans.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No plans available</AlertTitle>
                <AlertDescription>
                  There are no subscription plans available in {selectedCurrency} at this time.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {filteredPlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={
                      subscription?.planId === plan.id 
                        ? "border-primary" 
                        : ""
                    }
                  >
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-4">
                        {formatPrice(plan.price, plan.currency, plan.interval)}
                      </div>
                      <FeatureList features={plan.features} />
                    </CardContent>
                    <CardFooter>
                      {subscription?.planId === plan.id ? (
                        <Button disabled className="w-full">
                          Current Plan
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => handleSelectPlan(plan)}
                        >
                          {subscription ? "Switch Plan" : "Choose Plan"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </Tabs>
        </div>
      </div>
      
      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Your subscription will remain active until the end of your current billing period on{" "}
              <strong>{subscription ? formatDate(subscription.currentPeriodEnd) : ""}</strong>.
            </p>
            <p>
              After this date, you'll be downgraded to the free plan with limited features.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="gap-2"
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upgrade Plan Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          {selectedPlan && (
            <>
              <DialogHeader>
                <DialogTitle>Change Subscription Plan</DialogTitle>
                <DialogDescription>
                  Review your plan change before confirming
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {subscription && (
                  <div className="flex items-center justify-between mb-4 p-3 border rounded-md">
                    <div>
                      <p className="font-semibold">Current Plan</p>
                      <p className="text-sm text-muted-foreground">{subscription.planName}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">New Plan</p>
                      <p className="text-sm text-muted-foreground">{selectedPlan.name}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <p className="font-medium">New Plan Details:</p>
                  <p className="text-sm flex justify-between">
                    <span>Price:</span>
                    <span className="font-semibold">
                      {formatPrice(selectedPlan.price, selectedPlan.currency, selectedPlan.interval)}
                    </span>
                  </p>
                  <div className="text-sm flex justify-between">
                    <span>Features:</span>
                    <div className="text-right">
                      <p>{selectedPlan.features.maxResumes === -1 ? "Unlimited" : selectedPlan.features.maxResumes} Resumes</p>
                      <p>{selectedPlan.features.maxCoverLetters === -1 ? "Unlimited" : selectedPlan.features.maxCoverLetters} Cover Letters</p>
                      <p>{selectedPlan.features.maxJobApplications === -1 ? "Unlimited" : selectedPlan.features.maxJobApplications} Job Applications</p>
                    </div>
                  </div>
                </div>
                
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {subscription 
                      ? "Your plan will be updated immediately. Prorated charges may apply."
                      : "You will be charged immediately upon confirming this subscription."}
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => upgradeMutation.mutate(selectedPlan.id)}
                  disabled={upgradeMutation.isPending}
                  className="gap-2"
                >
                  {upgradeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {subscription ? "Change Plan" : "Subscribe"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 