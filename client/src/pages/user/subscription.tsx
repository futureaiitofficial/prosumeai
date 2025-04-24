import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Check, X, AlertCircle, Calendar, ChevronsUpDown, Sparkles } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DefaultLayout from '@/components/layouts/default-layout';

interface UserSubscription {
  id: number;
  planId: number;
  userId: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'CANCELLED';
  autoRenew: boolean;
  planName: string;
  planDescription: string;
  billingCycle: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  currency: 'USD' | 'INR';
  billingCycle: 'MONTHLY' | 'YEARLY';
  targetRegion: 'GLOBAL' | 'INDIA';
  isFeatured: boolean;
  isFreemium: boolean;
  active: boolean;
  pricing?: { price: string; currency: string }[];
}

interface PlanFeature {
  id: number;
  planId: number;
  featureId: number;
  featureName: string;
  featureCode: string;
  description: string;
  limitType: 'UNLIMITED' | 'COUNT' | 'BOOLEAN';
  limitValue: number;
  isEnabled: boolean;
  resetFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'NEVER';
  currentUsage?: number;
  isTokenBased?: boolean;
  aiTokenCount?: number;
}

const UserSubscriptionPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'current' | 'features' | 'plans'>('current');

  // Fetch current subscription
  const { data: subscriptionData, isLoading: isSubscriptionLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/user/subscription');
        const data = await response.json();
        console.log("Fetched subscription data:", data);
        
        // If we have active subscription data, return it
        if (data && data.length > 0) {
          return data[0];
        }
        
        // If no active subscription found, check all subscriptions
        console.log("No active subscription found, checking all subscriptions");
        const allSubsResponse = await apiRequest('GET', '/api/user/all-subscriptions');
        const allSubs = await allSubsResponse.json();
        console.log("All subscriptions:", allSubs);
        
        // If there are any subscriptions at all (even cancelled), log them for debugging
        if (allSubs && allSubs.length > 0) {
          console.log(`Found ${allSubs.length} total subscriptions. Latest status: ${allSubs[allSubs.length - 1].status}`);
          
          // Try to find the most recent active subscription
          const activeSubscription = allSubs.find((sub: UserSubscription) => sub.status === 'ACTIVE');
          if (activeSubscription) {
            console.log("Found an active subscription:", activeSubscription);
            return activeSubscription;
          }
          
          // If no active subscription but there's a cancelled one that just ended, show it
          const recentCancelled = allSubs
            .filter((sub: UserSubscription) => sub.status === 'CANCELLED')
            .sort((a: UserSubscription, b: UserSubscription) => {
              const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
              const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
              return dateB - dateA;
            })[0];
            
          if (recentCancelled) {
            console.log("No active subscription, but found a recently cancelled one:", recentCancelled);
            // If it was cancelled less than 1 hour ago, it might be a temporary issue
            const cancelledTime = recentCancelled.updatedAt ? new Date(recentCancelled.updatedAt).getTime() : Date.now();
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            if (cancelledTime > oneHourAgo) {
              console.log("Recent cancellation detected, this might be a transitional state");
              
              // Wait a moment and try to refetch
              setTimeout(() => {
                console.log("Attempting to refetch subscription after delay");
                refetchSubscription();
              }, 2000);
            }
          }
        }
        
        return null;
      } catch (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }
    }
  });

  // Fetch available plans
  const { data: plansData, isLoading: isPlansLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/public/subscription-plans');
      const data = await response.json();
      console.log("Fetched plans data:", data);
      return data;
    }
  });

  // Fetch plan features for current subscription
  const { data: featuresData, isLoading: isFeaturesLoading, refetch: refetchFeatures } = useQuery({
    queryKey: ['planFeatures', subscriptionData?.planId],
    queryFn: async () => {
      // Add timestamp to force cache busting
      const response = await apiRequest('GET', `/api/user/features?t=${Date.now()}`);
      const data = await response.json();
      console.log("Fetched features data:", data);
      
      // Add more detailed debug information about each feature
      if (data && Array.isArray(data)) {
        data.forEach(feature => {
          console.log(`Feature ${feature.featureName} (${feature.featureCode}):`, {
            limitType: feature.limitType,
            limitValue: feature.limitValue,
            currentUsage: feature.currentUsage,
            isTokenBased: feature.isTokenBased,
            aiTokenCount: feature.aiTokenCount
          });
        });
      }
      
      return data;
    },
    enabled: !!subscriptionData?.planId
  });

  // Fetch usage data for all features to ensure it's mapped correctly
  const { data: featureUsageData, isLoading: isFeatureUsageLoading } = useQuery({
    queryKey: ['featureUsage'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/token-usage');
      const data = await response.json();
      console.log("Fetched feature usage data:", data);
      return data.features || [];
    },
    refetchInterval: 60000 // Refetch every 60 seconds
  });

  // Combine features data with usage data
  const combinedFeatures = React.useMemo(() => {
    if (!featuresData || !featureUsageData) return featuresData || [];
    
    return featuresData.map((feature: PlanFeature) => {
      const usage = featureUsageData.find((fu: any) => fu.featureId === feature.featureId);
      if (usage) {
        return {
          ...feature,
          currentUsage: usage.usageCount || 0,
          aiTokenCount: usage.tokenUsage || 0
        };
      }
      return feature;
    });
  }, [featuresData, featureUsageData]);

  // Fetch all plan features for displaying in Available Plans tab
  const { data: allPlanFeatures, isLoading: isAllFeaturesLoading } = useQuery({
    queryKey: ['allPlanFeatures'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/public/plan-features');
      const data = await response.json();
      console.log("Fetched all plan features raw data:", data);
      // Transform the data into a map by planId for easier lookup
      const featuresByPlan: { [key: number]: PlanFeature[] } = {};
      // Check if data is an array or nested
      const featuresArray = Array.isArray(data) ? data : data.features || [];
      console.log("Features array for transformation:", featuresArray);
      featuresArray.forEach((feature: any) => {
        const planId = feature.planId || feature.plan_id;
        if (planId) {
          if (!featuresByPlan[planId]) {
            featuresByPlan[planId] = [];
          }
          featuresByPlan[planId].push(feature);
        }
      });
      console.log("Transformed features by plan:", featuresByPlan);
      return { featuresByPlan };
    }
  });

  // Handle subscription upgrade
  const upgradeMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest('POST', '/api/user/subscription/upgrade', { planId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['planFeatures'] });
      toast({
        title: 'Subscription Upgraded',
        description: 'Your subscription has been upgraded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upgrade Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle subscription cancellation  
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/user/subscription/cancel');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled. You can still use the features until the end of your billing period.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle directing users to contact support for subscription date issues
  const contactSupportForDates = () => {
    // Get subscription details for the support request
    const subscriptionId = subscriptionData?.id || 'unknown';
    const planName = subscriptionData?.planName || 'unknown';
    const startDate = subscriptionData?.startDate ? formatDate(subscriptionData.startDate) : 'unknown';
    const endDate = subscriptionData?.endDate ? formatDate(subscriptionData.endDate) : 'unknown';
    
    toast({
      title: 'Contact Support',
      description: 'Please email support@example.com with the subject "Monthly Subscription Date Correction" and include your subscription details.',
      duration: 6000, // Show for longer
    });
    
    // Show a more detailed toast with the information they should include
    setTimeout(() => {
      toast({
        title: 'Information to Include',
        description: `Subscription ID: ${subscriptionId}, Plan: ${planName}, Start: ${startDate}, End: ${endDate}`,
        duration: 8000, // Show for even longer
      });
    }, 1000);
    
    // You could optionally open a support form or email client here
    // window.open(`mailto:support@example.com?subject=Monthly Subscription Date Correction&body=Please fix my subscription dates. Subscription ID: ${subscriptionId}`);
  };

  const subscription = subscriptionData || null;
  const plans = plansData || [];
  const features = featuresData || [];
  console.log("Features for display:", features);
  const allFeaturesByPlan = allPlanFeatures?.featuresByPlan || {};
  
  // We already have the plan name from the API in the subscription object
  const planName = subscription?.planName || null;
  const planDescription = subscription?.planDescription || null;
  const billingCycle = subscription?.billingCycle || null;
  
  // For backward compatibility, still find the complete plan object if needed
  const userPlan = subscription ? (
    plans.find((p: SubscriptionPlan) => p.id === subscription.planId) || 
    {
      name: planName,
      description: planDescription,
      billingCycle: billingCycle
    }
  ) : null;

  const isLoading = isSubscriptionLoading || isPlansLoading || isFeaturesLoading || isAllFeaturesLoading || isFeatureUsageLoading;

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status badge with appropriate styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'GRACE_PERIOD':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Grace Period</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Add log statements
  useEffect(() => {
    if (subscription) {
      console.log("Current subscription:", subscription);
      console.log("Available plans:", plans);
      console.log("Matching plan for ID", subscription.planId, ":", userPlan);
      
      // Log specific fields for debugging
      console.log("Subscription status:", subscription.status);
      console.log("Start date:", subscription.startDate);
      console.log("End date:", subscription.endDate);
      
      // Check if there are multiple subscriptions
      apiRequest('GET', '/api/user/all-subscriptions')
        .then(response => response.json())
        .then(data => {
          console.log("All user subscriptions:", data);
        })
        .catch(error => {
          console.error("Error fetching all subscriptions:", error);
        });
    }
  }, [subscription, plans, userPlan]);

  // Refetch features data when switching to the Features tab
  useEffect(() => {
    if (activeTab === 'features') {
      refetchFeatures();
    }
  }, [activeTab, refetchFeatures]);

  const setTab = (value: string) => {
    setActiveTab(value as 'current' | 'features' | 'plans');
  };

  // Map subscription features with usage data for Current Plan tab using featuresData
  const subscriptionFeaturesWithUsage = React.useMemo(() => {
    if (!featuresData || !featureUsageData) {
      console.log("Missing data for mapping in Current Plan tab:", { featuresData, featureUsageData });
      return featuresData || [];
    }
    console.log("Mapping features with usage data in Current Plan tab:", { features: featuresData, usageData: featureUsageData });
    return featuresData.map((feature: any) => {
      console.log("Processing feature:", feature);
      const usage = featureUsageData.find((fu: any) => {
        console.log("Checking usage data:", fu);
        return fu.featureId === feature.featureId || fu.featureId === feature.id || fu.featureId === feature.feature_id;
      });
      if (usage) {
        console.log("Found matching usage for feature:", { feature: feature.featureName || feature.name, usage });
        return {
          ...feature,
          currentUsage: usage.usageCount || 0,
          aiTokenCount: usage.tokenUsage || 0
        };
      } else {
        console.log("No matching usage found for feature:", feature.featureName || feature.name);
      }
      return feature;
    });
  }, [featuresData, featureUsageData]);

  // Check if monthly subscription has incorrect end date (more than 60 days)
  const hasIncorrectDates = React.useMemo(() => {
    if (!subscription) return false;
    
    if (userPlan?.billingCycle === 'MONTHLY') {
      const startDate = new Date(subscription.startDate);
      const endDate = new Date(subscription.endDate);
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 60; // More than 60 days suggests incorrect annual end date
    }
    
    return false;
  }, [subscription, userPlan]);

  if (isLoading) {
    return (
      <DefaultLayout pageTitle="My Subscription" pageDescription="Manage your subscription and view your available features">
        <div className="w-full h-64 flex items-center justify-center">
          <div className="animate-pulse">Loading subscription information...</div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout pageTitle="My Subscription" pageDescription="Manage your subscription and view your available features">
      <Tabs defaultValue={activeTab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="features">Features & Limits</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
        </TabsList>
        
        {/* Current Plan Tab */}
        <TabsContent value="current">
          {subscription ? (
            <Card className="border-2 border-primary/10">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <CreditCard className="h-6 w-6 text-primary" />
                      {userPlan?.name || 'Current Subscription'}
                    </CardTitle>
                    <CardDescription>{userPlan?.description}</CardDescription>
                  </div>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Subscription Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium">
                          {userPlan?.name || `Unknown (ID: ${subscription?.planId})`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span>{getStatusBadge(subscription.status)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Billing Cycle</span>
                        <span className="font-medium">{userPlan?.billingCycle.charAt(0) + userPlan?.billingCycle.slice(1).toLowerCase()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Auto-renew</span>
                        <span>{subscription.autoRenew ? 'Yes' : 'No'}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Start Date</span>
                        <span>{formatDate(subscription.startDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">End Date</span>
                        <span>{formatDate(subscription.endDate)}</span>
                      </div>
                      {hasIncorrectDates && (
                        <div className="text-xs text-amber-500 text-right mt-1">
                          Note: Your monthly plan shows an incorrect end date. This is a known issue with some monthly subscriptions. Please contact our support team and reference "monthly subscription date correction" in your message.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Feature Usage Summary</h3>
                    <div className="space-y-3">
                      {subscriptionFeaturesWithUsage
                        .filter((feature: any) => feature.limitType !== 'BOOLEAN')
                        .map((feature: any) => {
                          const isTokenFeature = feature.isTokenBased === true;
                          const usageValue = isTokenFeature 
                            ? (feature.aiTokenCount !== undefined ? feature.aiTokenCount : 0)
                            : (feature.currentUsage !== undefined ? feature.currentUsage : 0);
                          const limitValue = feature.limitValue || 0;
                          const usagePercentage = limitValue > 0 ? (usageValue / limitValue) * 100 : 0;

                          return (
                            <div key={`summary-${feature.featureId || feature.id}`} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{feature.featureName}</span>
                                <span>
                                  {usageValue} / {limitValue} {isTokenFeature ? 'tokens' : ''}
                                </span>
                              </div>
                              <Progress
                                value={Math.min(usagePercentage, 100)}
                                className={`h-1.5 ${usagePercentage > 80 ? 'bg-red-200 dark:bg-red-900' : ''}`}
                              />
                              {feature.resetFrequency && feature.resetFrequency !== 'NEVER' && (
                                <div className="text-xs text-muted-foreground text-right">
                                  Resets {feature.resetFrequency.toLowerCase()}
                                  {feature.nextResetDate && (
                                    <span className="block">Next reset: {formatDate(feature.nextResetDate)}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      {subscriptionFeaturesWithUsage
                        .filter((feature: any) => feature.limitType === 'BOOLEAN')
                        .map((feature: any) => (
                          <div key={`summary-bool-${feature.featureId || feature.id}`} className="flex justify-between text-sm border-t pt-2 first:border-t-0 first:pt-0">
                            <span>{feature.featureName}</span>
                            <Badge variant={feature.isEnabled ? "default" : "outline"}>
                              {feature.isEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-muted/10 border-t">
                <div>
                  {subscription.status === 'ACTIVE' && (
                    <p className="text-sm text-muted-foreground">Your subscription will {subscription.autoRenew ? 'automatically renew' : 'expire'} on {formatDate(subscription.endDate)}.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {hasIncorrectDates && (
                    <div className="flex flex-col">
                      <Button 
                        variant="outline"
                        onClick={contactSupportForDates}
                      >
                        Contact Support
                      </Button>
                      <span className="text-xs text-muted-foreground mt-1 text-center">
                        Our administrators will fix this for you
                      </span>
                    </div>
                  )}
                  <Button 
                    variant="destructive" 
                    onClick={() => cancelMutation.mutate()} 
                    disabled={subscription.status !== 'ACTIVE' || cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? 'Processing...' : 'Cancel Subscription'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Active Subscription</CardTitle>
                <CardDescription>You don't have an active subscription plan. Choose a plan to unlock premium features.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-6">Subscribe to a plan to gain access to advanced features.</p>
                  <Button onClick={() => setTab('plans')}>View Available Plans</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Features & Limits Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Features & Usage Limits</CardTitle>
              <CardDescription>
                {userPlan 
                  ? `Features available with your ${userPlan.name} subscription`
                  : 'Subscribe to a plan to access these features'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {combinedFeatures.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead>Reset</TableHead>
                      <TableHead>Usage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedFeatures.map((feature: PlanFeature) => (
                      <TableRow key={feature.featureId || feature.id}>
                        <TableCell className="font-medium">{feature.featureName}</TableCell>
                        <TableCell>{feature.description}</TableCell>
                        <TableCell>
                          {feature.limitType === 'UNLIMITED' 
                            ? 'Unlimited' 
                            : feature.limitType === 'BOOLEAN' 
                              ? (feature.isEnabled ? 'Enabled' : 'Disabled')
                              : `${feature.limitValue} ${feature.isTokenBased ? 'tokens' : 'uses'}`}
                        </TableCell>
                        <TableCell>{feature.resetFrequency}</TableCell>
                        <TableCell>
                          {feature.limitType === 'BOOLEAN' 
                            ? (feature.isEnabled ? 'Enabled' : 'Disabled')
                            : feature.isTokenBased 
                              ? `${feature.aiTokenCount || 0} / ${feature.limitValue || 0}` 
                              : `${feature.currentUsage || 0} / ${feature.limitValue || 'Unlimited'}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : subscription ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No features available for your current plan.</p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">Subscribe to a plan to see available features.</p>
                  <Button className="mt-4" onClick={() => setTab('plans')}>Browse Plans</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Available Plans Tab */}
        <TabsContent value="plans">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans
                .filter((plan: SubscriptionPlan) => plan.active)
                .map((plan: SubscriptionPlan) => {
                  const isCurrentPlan = subscription && subscription.planId === plan.id;
                  return (
                    <Card key={plan.id} className={`${isCurrentPlan ? 'border-primary border-2' : ''} ${plan.isFeatured ? 'shadow-md' : ''}`}>
                      <CardHeader className={`${isCurrentPlan ? 'bg-primary/5' : ''} ${plan.isFeatured ? 'bg-muted/50' : ''}`}>
                        {plan.isFeatured && (
                          <Badge className="w-fit mb-2 bg-primary">Featured</Badge>
                        )}
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="mb-6">
                          <p className="text-3xl font-bold">
                            {plan.pricing && plan.pricing.length > 0 
                              ? `${plan.pricing[0].price} ${plan.pricing[0].currency}` 
                              : plan.price && plan.price !== '0.00' 
                                ? `${plan.price} ${plan.currency}` 
                                : 'Free'}
                          </p>
                          <p className="text-sm text-muted-foreground">per {plan.billingCycle.toLowerCase()}</p>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="space-y-2">
                          {allFeaturesByPlan[plan.id] && allFeaturesByPlan[plan.id].length > 0 ? (
                            allFeaturesByPlan[plan.id].map((feature: any, index: number) => (
                              <div key={index} className="flex items-start">
                                {feature.limitType === 'BOOLEAN' && !feature.isEnabled ? (
                                  <X className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                                )}
                                <span className="text-sm">
                                  {feature.featureName || feature.name || 'Unnamed Feature'}
                                  {feature.limitType === 'COUNT' && feature.limitValue && (
                                    <span className="text-sm text-muted-foreground ml-1">
                                      ({feature.limitValue})
                                    </span>
                                  )}
                                  {feature.limitType === 'UNLIMITED' && (
                                    <span className="text-sm text-muted-foreground ml-1">
                                      (Unlimited)
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">No features available for this plan. (Plan ID: {plan.id})</div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          variant={isCurrentPlan ? "outline" : "default"}
                          onClick={() => !isCurrentPlan && upgradeMutation.mutate(plan.id)}
                          disabled={isCurrentPlan || upgradeMutation.isPending}
                        >
                          {isCurrentPlan 
                            ? 'Current Plan' 
                            : upgradeMutation.isPending 
                              ? 'Processing...' 
                              : plan.isFreemium 
                                ? 'Select Free Plan' 
                                : 'Upgrade Plan'
                          }
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DefaultLayout>
  );
};

export default UserSubscriptionPage; 