import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Check, X, AlertCircle, Calendar, ChevronsUpDown, Sparkles, Globe } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DefaultLayout from '@/components/layouts/default-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLocation, useRoute } from "wouter";
import ErrorBoundary from '@/components/error-boundary';

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
  pendingPlanChangeTo?: number;
  pendingPlanChangeDate?: string;
  pendingPlanChangeType?: 'UPGRADE' | 'DOWNGRADE';
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
  pricing?: { 
    id: number;
    planId: number;
    targetRegion: 'GLOBAL' | 'INDIA';
    currency: 'USD' | 'INR';
    price: string;
  }[];
  displayPrice?: string;
  displayCurrency?: string;
}

interface UserRegion {
  region: 'GLOBAL' | 'INDIA';
  currency: 'USD' | 'INR';
  country?: string;
  error?: string;
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
  const [userRegion, setUserRegion] = useState<UserRegion>({ region: 'GLOBAL', currency: 'USD' });
  const [manualRegion, setManualRegion] = useState<string>('');
  const [pendingPlanName, setPendingPlanName] = useState<string | null>(null);
  const [pendingChangeLoading, setPendingChangeLoading] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [location] = useLocation();

  // Fetch user's region based on IP
  const { data: regionData, isLoading: isRegionLoading } = useQuery({
    queryKey: ['userRegion'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/user/region');
        const data = await response.json();
        console.log("Detected user region:", data);
        
        // Only set the region if we didn't get an error
        if (!data.error) {
          setUserRegion(data);
        } else {
          console.warn("Using default region due to geolocation error:", data.error);
        }
        return data;
      } catch (error) {
        console.error("Error fetching user region:", error);
        return { region: 'GLOBAL', currency: 'USD', error: 'Failed to detect region' };
      }
    },
    staleTime: 24 * 60 * 60 * 1000 // Cache for 24 hours
  });

  // Apply manual region change when selected
  useEffect(() => {
    if (manualRegion) {
      if (manualRegion === 'INDIA') {
        setUserRegion({ region: 'INDIA', currency: 'INR', country: 'India' });
      } else {
        setUserRegion({ region: 'GLOBAL', currency: 'USD', country: manualRegion === 'GLOBAL' ? 'Global' : manualRegion });
      }
    }
  }, [manualRegion]);

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

  // Fetch pending subscription change
  const { data: pendingChangeData, isLoading: isPendingChangeLoading, refetch: refetchPendingChange } = useQuery({
    queryKey: ['pendingSubscriptionChange'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/user/subscription/pending-change');
        const data = await response.json();
        console.log("Fetched pending change data:", data);
        
        // If we have a pending plan change, fetch the plan name
        if (data.hasPendingChange && data.pendingPlan) {
          setPendingPlanName(data.pendingPlan.name);
        } else {
          setPendingPlanName(null);
        }
        
        return data;
      } catch (error) {
        console.error("Error fetching pending subscription change:", error);
        return { hasPendingChange: false };
      }
    },
    enabled: !!subscriptionData // Only run if we have an active subscription
  });

  // Handle cancellation of pending subscription change
  const cancelPendingChangeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/user/subscription/cancel-pending-change');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['pendingSubscriptionChange'] });
      toast({
        title: 'Change Cancelled',
        description: 'Your pending subscription change has been cancelled.',
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

  // Handle subscription upgrade
  const upgradeMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest('POST', '/api/user/subscription/upgrade', { planId });
      const data = await response.json();
      
      // Check if redirection to payment is required
      if (data.redirectToPayment) {
        // If server provided a payment URL, use it
        if (data.paymentUrl) {
          console.log('Redirecting to checkout using server URL:', data.paymentUrl);
          window.location.href = data.paymentUrl;
        } else {
          // Otherwise, construct the checkout URL with required parameters
          let checkoutUrl = `/checkout?planId=${planId}`;
          
          // Add proration amount if present
          if (data.prorationAmount !== undefined) {
            checkoutUrl += `&prorationAmount=${data.prorationAmount}`;
          }
          
          console.log('Redirecting to checkout:', checkoutUrl);
          window.location.href = checkoutUrl;
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (!data.pendingPayment) {
        // Only invalidate queries if we've completed the upgrade
        // (not if we've redirected to payment)
        queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
        queryClient.invalidateQueries({ queryKey: ['planFeatures'] });
        toast({
          title: 'Subscription Upgraded',
          description: 'Your subscription has been upgraded successfully',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Upgrade Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle subscription downgrade  
  const downgradeMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest('POST', '/api/user/subscription/downgrade', { planId });
      return await response.json();
    },
    onSuccess: (data) => {
      // Check if we need to redirect to upgrade flow instead
      if (data.redirectToUpgrade) {
        toast({
          title: 'This is an Upgrade',
          description: 'This plan change is actually an upgrade. Redirecting to upgrade flow.',
        });
        // Redirect to upgrade flow
        upgradeMutation.mutate(data.planId);
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['planFeatures'] });
      
      // If there's a proration credit, mention it in the toast
      if (data.prorationCredit > 0) {
        toast({
          title: 'Subscription Downgraded',
          description: `Your subscription has been downgraded successfully. A credit of ${data.prorationCredit} will be applied to your next billing cycle.`,
          duration: 6000, // Show for longer
        });
      } else {
        toast({
          title: 'Subscription Downgraded',
          description: 'Your subscription has been downgraded successfully',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Downgrade Failed',
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
        description: 'Your subscription has been cancelled. You can still use all features until the end of your current billing period.',
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
  const userPlan = React.useMemo(() => {
    try {
      if (!subscription) return null;
      
      // First try to find the plan in the plans array
      const foundPlan = plans && Array.isArray(plans) ? 
        plans.find((p: SubscriptionPlan) => p && p.id === subscription.planId) : null;
      
      if (foundPlan) return foundPlan;
      
      // If not found, create a fallback object with subscription data
      return {
        name: planName || 'Unknown Plan',
        description: planDescription || 'No description available',
        billingCycle: billingCycle || 'MONTHLY'
      };
    } catch (error) {
      console.error('Error finding user plan:', error);
      return {
        name: 'Unknown Plan',
        description: 'Error retrieving plan details',
        billingCycle: 'MONTHLY'
      };
    }
  }, [subscription, plans, planName, planDescription, billingCycle]);

  const isLoading = isSubscriptionLoading || isPlansLoading || isFeaturesLoading || isAllFeaturesLoading || isFeatureUsageLoading || isRegionLoading || isPendingChangeLoading;

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Invalid date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
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
      return [];
    }
    
    try {
      console.log("Mapping features with usage data in Current Plan tab:", { 
        features: featuresData, 
        usageData: featureUsageData 
      });
      
      return (featuresData || []).map((feature: any) => {
        if (!feature) return null;
        
        console.log("Processing feature:", feature);
        const usage = featureUsageData.find((fu: any) => {
          if (!fu) return false;
          return fu.featureId === feature.featureId || 
                 fu.featureId === feature.id || 
                 fu.featureId === feature.feature_id;
        });
        
        if (usage) {
          console.log("Found matching usage for feature:", { 
            feature: feature.featureName || feature.name, 
            usage 
          });
          return {
            ...feature,
            currentUsage: usage.usageCount || 0,
            aiTokenCount: usage.tokenUsage || 0
          };
        } else {
          console.log("No matching usage found for feature:", feature.featureName || feature.name);
        }
        return feature;
      }).filter(Boolean); // Remove null entries
    } catch (error) {
      console.error("Error processing features:", error);
      return [];
    }
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

  // Get price display based on user region
  const getPriceDisplay = (plan: SubscriptionPlan) => {
    // For freemium plans
    if (plan.isFreemium || !plan.pricing || plan.pricing.length === 0) {
      return 'Free';
    }
    
    // Check if the plan has displayPrice and displayCurrency fields from the server
    if (plan.displayPrice && plan.displayCurrency) {
      return `${plan.displayPrice} ${plan.displayCurrency}`;
    }
    
    // Find pricing for the user's region
    const userRegionPricing = plan.pricing.find(p => p.targetRegion === userRegion.region);
    
    // If found, use it
    if (userRegionPricing) {
      return `${userRegionPricing.price} ${userRegionPricing.currency}`;
    }
    
    // Fallback to global pricing
    const globalPricing = plan.pricing.find(p => p.targetRegion === 'GLOBAL');
    if (globalPricing) {
      return `${globalPricing.price} ${globalPricing.currency}`;
    }
    
    // Last resort fallback
    return plan.price && plan.price !== '0.00' ? `${plan.price} USD` : 'Free';
  };

  // Helper function to get plan price as a number for comparison
  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (plan.isFreemium) return 0;
    
    // If we have displayPrice from the server, use that
    if (plan.displayPrice) {
      return parseFloat(plan.displayPrice);
    }
    
    if (plan.pricing && plan.pricing.length > 0) {
      const regionPricing = plan.pricing.find(p => p.targetRegion === userRegion.region);
      if (regionPricing) {
        return parseFloat(regionPricing.price);
      }
      
      const globalPricing = plan.pricing.find(p => p.targetRegion === 'GLOBAL');
      if (globalPricing) {
        return parseFloat(globalPricing.price);
      }
    }
    
    return parseFloat(plan.price || '0');
  };

  // Handle plan selection
  const handlePlanSelection = (plan: SubscriptionPlan) => {
    if (!plan) return;
    
    // If user doesn't have a subscription yet, go straight to checkout/upgrade
    if (!subscription) {
      handleUpgrade(plan.id);
      return;
    }
    
    const currentPlanId = subscription.planId;
    if (currentPlanId === plan.id) {
      toast({
        title: "Same Plan Selected",
        description: "You are already subscribed to this plan.",
        variant: "default"
      });
      return;
    }
    
    // Check pricing to determine if this is an upgrade or downgrade
    const currentPlan = plans.find((p: SubscriptionPlan) => p.id === currentPlanId);
    if (!currentPlan) return;
    
    const currentPrice = getPlanPrice(currentPlan);
    const newPrice = getPlanPrice(plan);
    
    if (newPrice > currentPrice) {
      handleUpgrade(plan.id);
    } else {
      handleDowngrade(plan.id);
    }
  };

  // Handle upgrade to a higher plan
  const handleUpgrade = async (planId: number) => {
    setIsChangingPlan(true);
    
    try {
      const response = await axios.post('/api/user/subscription/upgrade', { planId });
      const data = response.data;
      
      if (data.redirectToDowngrade) {
        // This is not an upgrade, it's a downgrade
        toast({
          title: "Plan Change",
          description: "This is actually a downgrade, redirecting...",
          variant: "default"
        });
        handleDowngrade(planId);
        return;
      }
      
      if (data.redirectToPayment) {
        // Show proration details before redirecting if available
        if (data.proration && subscription) {
          // Find plans first to avoid redeclaration issues
          const selectedNewPlan = plans.find((p: SubscriptionPlan) => p.id === planId);
          const selectedCurrentPlan = plans.find((p: SubscriptionPlan) => p.id === subscription?.planId);
          
          // Format amounts for display - handle INR and USD differently
          const formatAmount = (amount: number, currency: string) => {
            if (currency === 'INR') {
              return `₹${amount.toFixed(0)}`; // No decimals for INR
            }
            return `$${amount.toFixed(2)}`; // 2 decimals for USD
          };
          
          // Extract proration information
          const prorationAmount = data.proration.prorationAmount || 0;
          // Attempt to get remaining value from diagnosticInfo if available
          const remainingValue = data.proration.remainingValue || 
                             (data.proration.diagnosticInfo?.remainingValue || 0);
          const newPlanPrice = data.proration.newPlanPrice || 
                            (data.proration.diagnosticInfo?.newPrice || 0);
          const currency = data.proration.currency || 
                       (data.proration.diagnosticInfo?.currency || 
                       (selectedNewPlan?.displayCurrency || 'USD'));
          
          // Create user-friendly proration message
          let prorationMessage = '';
          
          // Only show detailed breakdown if we have all values
          if (prorationAmount > 0 && newPlanPrice > 0 && remainingValue > 0) {
            prorationMessage = `You'll be charged ${formatAmount(prorationAmount, currency)} now (${formatAmount(newPlanPrice, currency)} for the new plan, minus ${formatAmount(remainingValue, currency)} credit from your current plan).`;
          } else if (prorationAmount > 0) {
            prorationMessage = `You'll be charged ${formatAmount(prorationAmount, currency)} for this upgrade.`;
          } else {
            prorationMessage = `You'll be charged for this upgrade immediately.`;
          }
          
          // Confirm with user before redirecting to checkout
          const confirmed = window.confirm(
            `Upgrade from ${selectedCurrentPlan?.name || 'current plan'} to ${selectedNewPlan?.name || 'new plan'}\n\n` +
            `${prorationMessage}\n\n` +
            `Would you like to proceed with this upgrade?`
          );
          
          if (!confirmed) {
            setIsChangingPlan(false);
            return;
          }
        } else if (data.proration) {
          // This is a new subscription, not an upgrade
          const selectedPlan = plans.find((p: SubscriptionPlan) => p.id === planId);
          const planName = selectedPlan?.name || 'selected plan';
          const currency = selectedPlan?.displayCurrency || 'USD';
          const price = selectedPlan?.displayPrice || '0';
          
          // For new users, show a simpler confirmation
          const confirmed = window.confirm(
            `You're about to subscribe to the ${planName} plan.\n\n` +
            `You'll be charged ${currency === 'INR' ? '₹' : '$'}${price} for this subscription.\n\n` +
            `Would you like to proceed?`
          );
          
          if (!confirmed) {
            setIsChangingPlan(false);
            return;
          }
        }
        
        // Redirect to checkout with proration amount if available
        const params = new URLSearchParams();
        params.append('planId', planId.toString());
        
        if (data.proration && data.proration.prorationAmount) {
          params.append('prorationAmount', data.proration.prorationAmount.toString());
        }
        
        params.append('upgradeFlow', 'true');
        
        const url = `/checkout?${params.toString()}`;
        window.location.href = url; // Use direct navigation
      } else if (data.subscription) {
        // Subscription was created/updated without payment (free plan)
        toast({
          title: "Success",
          description: "Your subscription has been upgraded successfully",
          variant: "default"
        });
        refetchSubscription();
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: "Upgrade Failed",
        description: "Failed to upgrade subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Handle downgrade to a lower plan
  const handleDowngrade = async (planId: number) => {
    setIsChangingPlan(true);
    
    try {
      const response = await axios.post('/api/user/subscription/downgrade', { planId });
      const data = response.data;
      
      if (data.redirectToUpgrade) {
        // This is not a downgrade, it's an upgrade
        toast({
          title: "Plan Change",
          description: "This is actually an upgrade, redirecting...",
          variant: "default"
        });
        handleUpgrade(planId);
        return;
      }
      
      if (data.subscription) {
        if (data.scheduledChange) {
          // Downgrade has been scheduled for end of billing cycle
          toast({
            title: "Downgrade Scheduled",
            description: `Your plan will be changed to ${data.scheduledChange.toPlanName} on ${formatDate(data.scheduledChange.effectiveDate)}`,
            variant: "default"
          });
        } else {
          // Immediate downgrade (for free plans)
          toast({
            title: "Success",
            description: "Your subscription has been downgraded successfully",
            variant: "default"
          });
        }
        
        refetchSubscription();
      }
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      toast({
        title: "Downgrade Failed",
        description: "Failed to downgrade subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const hasPendingChange = pendingChangeData?.hasPendingChange || false;
  const pendingChange = pendingChangeData?.subscription;
  const pendingPlan = pendingChangeData?.pendingPlan;

  return (
    <ErrorBoundary>
      <DefaultLayout pageTitle="My Subscription" pageDescription="Manage your subscription and view your available features">
        {isLoading ? (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="animate-pulse">Loading subscription information...</div>
          </div>
        ) : (
          <Tabs defaultValue={activeTab} onValueChange={setTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">{subscription ? 'Current Plan' : 'No Subscription'}</TabsTrigger>
              <TabsTrigger value="features">Features & Limits</TabsTrigger>
              <TabsTrigger value="plans">{subscription ? 'Available Plans' : 'Choose a Plan'}</TabsTrigger>
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
                            <span className="font-medium">
                              {userPlan?.billingCycle ? 
                                (userPlan.billingCycle.charAt(0) + userPlan.billingCycle.slice(1).toLowerCase()) : 
                                'Not specified'
                              }
                            </span>
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
                          
                          {/* Add pending change information */}
                          {hasPendingChange && pendingChange && (
                            <>
                              <Separator className="my-2" />
                              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-200 dark:border-amber-800 mt-3">
                                <div className="flex items-start">
                                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                      Scheduled Plan Change
                                    </h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                      Your subscription will change to{' '}
                                      <span className="font-medium">{pendingPlanName || `Plan ID: ${pendingChange.pendingPlanChangeTo}`}</span>{' '}
                                      on {formatDate(pendingChange.pendingPlanChangeDate || pendingChange.endDate)}
                                    </p>
                                    <div className="mt-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="h-7 text-xs" 
                                        onClick={() => cancelPendingChangeMutation.mutate()}
                                        disabled={cancelPendingChangeMutation.isPending}
                                      >
                                        {cancelPendingChangeMutation.isPending ? 'Cancelling...' : 'Cancel Change'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Feature Usage Summary</h3>
                        <div className="space-y-3">
                          {subscriptionFeaturesWithUsage
                            ?.filter((feature: any) => feature && feature.limitType !== 'BOOLEAN')
                            .map((feature: any) => {
                              if (!feature) return null;
                              const isTokenFeature = feature.isTokenBased === true;
                              const usageValue = isTokenFeature 
                                ? (feature.aiTokenCount !== undefined ? feature.aiTokenCount : 0)
                                : (feature.currentUsage !== undefined ? feature.currentUsage : 0);
                              const limitValue = feature.limitValue || 0;
                              const usagePercentage = limitValue > 0 ? (usageValue / limitValue) * 100 : 0;

                              return (
                                <div key={`summary-${feature.featureId || feature.id || Math.random().toString(36).substring(7)}`} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{feature.featureName || 'Unknown Feature'}</span>
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
                            ?.filter((feature: any) => feature && feature.limitType === 'BOOLEAN')
                            .map((feature: any) => (
                              <div key={`summary-bool-${feature.featureId || feature.id || Math.random().toString(36).substring(7)}`} className="flex justify-between text-sm border-t pt-2 first:border-t-0 first:pt-0">
                                <span>{feature.featureName || 'Unknown Feature'}</span>
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
                        disabled={subscription.status !== 'ACTIVE' || !subscription.autoRenew || cancelMutation.isPending}
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
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {userRegion.country ? (
                      <>Showing prices for {userRegion.region === 'INDIA' ? 'India' : 'your region'} ({userRegion.country})</>
                    ) : (
                      <>Showing global prices</>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Select value={manualRegion} onValueChange={setManualRegion}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GLOBAL">Global (USD)</SelectItem>
                        <SelectItem value="INDIA">India (INR)</SelectItem>
                        <SelectItem value="US">United States (USD)</SelectItem>
                        <SelectItem value="UK">United Kingdom (USD)</SelectItem>
                        <SelectItem value="CA">Canada (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans
                    .filter((plan: SubscriptionPlan) => plan && plan.active)
                    .map((plan: SubscriptionPlan) => {
                      const isCurrentPlan = subscription && plan ? subscription.planId === plan.id : false;
                      const isPendingPlan = hasPendingChange && pendingChange && plan ? pendingChange.pendingPlanChangeTo === plan.id : false;
                      
                      // Determine if this is an upgrade or downgrade
                      const isUpgrade = subscription && plan && getPlanPrice(plan) > getPlanPrice(plans.find((p: SubscriptionPlan) => p && p.id === subscription.planId) || {} as SubscriptionPlan);
                      
                      return (
                        <Card key={plan.id} className={`${isCurrentPlan ? 'border-primary border-2' : ''} ${isPendingPlan ? 'border-amber-500 border-2' : ''} ${plan.isFeatured ? 'shadow-md' : ''}`}>
                          <CardHeader className={`${isCurrentPlan ? 'bg-primary/5' : ''} ${isPendingPlan ? 'bg-amber-500/5' : ''} ${plan.isFeatured ? 'bg-muted/50' : ''}`}>
                            {plan.isFeatured && (
                              <Badge className="w-fit mb-2 bg-primary">Featured</Badge>
                            )}
                            {isPendingPlan && (
                              <Badge className="w-fit mb-2 bg-amber-500">Scheduled</Badge>
                            )}
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="mb-6">
                              <p className="text-3xl font-bold">
                                {getPriceDisplay(plan)}
                              </p>
                              <p className="text-sm text-muted-foreground">per {plan?.billingCycle ? plan.billingCycle.toLowerCase() : 'month'}</p>
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
                              variant={isCurrentPlan ? "outline" : isPendingPlan ? "secondary" : "default"}
                              onClick={() => {
                                if (!isCurrentPlan && !isPendingPlan) {
                                  // For new users with no subscription, always use handleUpgrade
                                  if (!subscription) {
                                    handleUpgrade(plan.id);
                                  } else if (isUpgrade || plan.isFreemium) {
                                    handlePlanSelection(plan);
                                  } else {
                                    handleDowngrade(plan.id);
                                  }
                                }
                              }}
                              disabled={isCurrentPlan || isPendingPlan || upgradeMutation.isPending || downgradeMutation.isPending}
                            >
                              {isCurrentPlan 
                                ? 'Current Plan' 
                                : isPendingPlan
                                  ? `Scheduled for ${pendingChange?.pendingPlanChangeDate ? formatDate(pendingChange.pendingPlanChangeDate) : 'Later'}`
                                  : upgradeMutation.isPending || downgradeMutation.isPending
                                    ? 'Processing...' 
                                    : plan.isFreemium 
                                      ? 'Select Free Plan' 
                                      : subscription 
                                        ? isUpgrade
                                          ? 'Upgrade Now' 
                                          : 'Schedule Downgrade'
                                        : 'Subscribe Now'
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
        )}
      </DefaultLayout>
    </ErrorBoundary>
  );
};

export default UserSubscriptionPage; 