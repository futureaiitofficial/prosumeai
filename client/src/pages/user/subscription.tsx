import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Check, X, AlertCircle, Calendar, ChevronsUpDown, Sparkles, FileText, InfoIcon, Loader2, Package } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DefaultLayout from '@/components/layouts/default-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import axios from 'axios';
import { useLocation, useRoute } from "wouter";
import ErrorBoundary from '@/components/error-boundary';
import { useRegion, UserRegion } from '@/hooks/use-region';
import { useLocationContext } from '@/hooks/use-location';
import { SubscriptionInvoices } from '@/components/checkout/subscription-invoices';
import { PaymentService } from '@/services/payment-service';
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState<'current' | 'features' | 'plans' | 'invoices'>('current');
  const [pendingPlanName, setPendingPlanName] = useState<string | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [location] = useLocation();
  const [expandedPlans, setExpandedPlans] = useState<Set<number>>(new Set());
  
  // Function to format token counts with "K" for thousands
  const formatTokenCount = (count: number | string): string => {
    if (typeof count === 'string') {
      count = parseInt(count, 10);
    }
    
    if (isNaN(count)) return '0 tokens';
    
    if (count >= 1000) {
      return `${(count / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K tokens`;
    }
    
    return `${count} tokens`;
  };

  // Function to format feature value display
  const getFeatureValueDisplay = (feature: PlanFeature): string => {
    // For token-related features, format with K and add "tokens"
    if (feature.featureName.toLowerCase().includes('token') || 
        feature.featureName.toLowerCase().includes('generation') || 
        feature.featureName.toLowerCase().includes('ai')) {
      return formatTokenCount(feature.limitValue);
    }
    
    // Special handling for Resume, Cover Letter, and Job Application counts
    if (feature.featureName.includes('Resume') && feature.limitType === 'COUNT') {
      return feature.limitValue === 1 ? '1 resume' : `${feature.limitValue} resumes`;
    }
    
    if (feature.featureName.includes('Cover letter') && feature.limitType === 'COUNT') {
      return feature.limitValue === 1 ? '1 cover letter' : `${feature.limitValue} cover letters`;
    }
    
    if (feature.featureName.includes('Job Application') && feature.limitType === 'COUNT') {
      return feature.limitValue === 1 ? '1 application' : `${feature.limitValue} applications`;
    }
    
    // For other COUNT features
    if (feature.limitType === 'COUNT') {
      return feature.limitValue.toString();
    }
    
    // For UNLIMITED features
    if (feature.limitType === 'UNLIMITED') {
      return 'Unlimited';
    }
    
    return '';
  };

  // Use location context for regional preferences
  const locationContext = useLocationContext();
  
  // Use the centralized region hook instead of direct handling
  const { 
    userRegion, 
    isLoading: isRegionLoading, 
    setRegion,
    formatCurrency 
  } = useRegion();

  // Add state for billing details
  const [billingCountry, setBillingCountry] = useState<string | null>(null);
  const [billingRegion, setBillingRegion] = useState<'GLOBAL' | 'INDIA'>('GLOBAL');

  // Fetch user's billing details
  const { data: billingDetails, isLoading: isBillingLoading } = useQuery({
    queryKey: ['userBillingDetails'],
    queryFn: async () => {
      try {
        const details = await PaymentService.getBillingDetails();
        console.log("Fetched billing details:", details);
        return details;
      } catch (error) {
        console.error("Error fetching billing details:", error);
        return null;
      }
    }
  });

  // Update region based on billing details or IP location
  useEffect(() => {
    if (billingDetails && billingDetails.country) {
      console.log("Using billing address country for region:", billingDetails.country);
      setBillingCountry(billingDetails.country);
      
      // Determine region based on country
      const region = billingDetails.country === 'IN' ? 'INDIA' : 'GLOBAL';
      setBillingRegion(region);
      
      // Override the detected region with billing address
      setRegion({
        region: region,
        currency: region === 'INDIA' ? 'INR' : 'USD',
        country: billingDetails.country,
        countryName: billingDetails.country === 'IN' ? 'India' : undefined,
        source: 'billing-details'
      });
    } else {
      console.log("No billing details found, using IP-based region detection");
      // Region is already handled by useRegion hook from IP
    }
  }, [billingDetails, setRegion]);

  // Check for tab query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam && ['current', 'features', 'plans', 'invoices'].includes(tabParam)) {
      setActiveTab(tabParam as 'current' | 'features' | 'plans' | 'invoices');
    }
  }, [location]);

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
      
      // Use formatCurrency from useRegion hook for consistent currency formatting
      const formatAmount = (amount: number, currency: string) => {
        return formatCurrency(amount, currency);
      };
      
      // Get the amount from pricing data rather than plan.price
      const selectedNewPlan = plansData.find((p: SubscriptionPlan) => p.id === planId);
      const selectedCurrentPlan = subscriptionData ? plansData.find((p: SubscriptionPlan) => p.id === subscriptionData.planId) : null;
      
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
      } else if (data.subscription) {
        // Subscription was created/updated without payment (free plan)
        toast({
          title: "Success",
          description: "Your subscription has been upgraded successfully",
        });
        refetchSubscription();
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

  const isLoading = isSubscriptionLoading || isPlansLoading || isFeaturesLoading || isAllFeaturesLoading || isFeatureUsageLoading || isRegionLoading || isPendingChangeLoading || isBillingLoading;

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
    if (value === 'current' || 
        value === 'features' || 
        value === 'plans' || 
        value === 'invoices') {
      
      // Update state
      setActiveTab(value);
      
      // Update URL query parameter to reflect the current tab
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('tab', value);
      
      // Update the URL without causing a full page reload
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.pushState({}, '', newUrl);
    }
    
    // If switching to features tab, refresh feature data
    if (value === 'features') {
      refetchFeatures();
    }
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
    // Log region information for debugging
    console.log("Getting price display for plan:", plan.name, 
      "Billing country:", billingCountry,
      "Billing region:", billingRegion,
      "IP region:", userRegion.region);
    
    // For freemium plans
    if (plan.isFreemium || !plan.pricing || plan.pricing.length === 0) {
      return 'Free';
    }
    
    // Check if the plan has displayPrice and displayCurrency fields from the server
    if (plan.displayPrice && plan.displayCurrency) {
      console.log("Using display price from server:", plan.displayPrice, plan.displayCurrency);
      return formatCurrency(parseFloat(plan.displayPrice), plan.displayCurrency);
    }
    
    // Determine which region to use for pricing (prefer billing region over IP region)
    const effectiveRegion = billingRegion || userRegion.region;
    
    // Find pricing for the user's region
    const userRegionPricing = plan.pricing.find((p: { targetRegion: string }) => p.targetRegion === effectiveRegion);
    
    // If found, use it
    if (userRegionPricing) {
      console.log("Found pricing for effective region:", effectiveRegion, userRegionPricing);
      return formatCurrency(parseFloat(userRegionPricing.price), userRegionPricing.currency);
    }
    
    // Fallback to global pricing
    const globalPricing = plan.pricing.find((p: { targetRegion: string }) => p.targetRegion === 'GLOBAL');
    if (globalPricing) {
      console.log("Using fallback global pricing:", globalPricing);
      return formatCurrency(parseFloat(globalPricing.price), globalPricing.currency);
    }
    
    // Last resort fallback
    console.log("Using last resort fallback pricing:", plan.price);
    return plan.price && plan.price !== '0.00' ? formatCurrency(parseFloat(plan.price), 'USD') : 'Free';
  };

  // Helper function to get plan price as a number for comparison
  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (plan.isFreemium) return 0;
    
    // If we have displayPrice from the server, use that
    if (plan.displayPrice) {
      return parseFloat(plan.displayPrice);
    }
    
    // Determine which region to use (prefer billing region over IP region)
    const effectiveRegion = billingRegion || userRegion.region;
    
    if (plan.pricing && plan.pricing.length > 0) {
      // Try to get pricing for the effective region first
      const regionPricing = plan.pricing.find((p: { targetRegion: string }) => p.targetRegion === effectiveRegion);
      if (regionPricing) {
        return parseFloat(regionPricing.price);
      }
      
      const globalPricing = plan.pricing.find((p: { targetRegion: string }) => p.targetRegion === 'GLOBAL');
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
          
          // Use the formatCurrency function from useRegion hook for consistent formatting
          const formatAmount = (amount: number, currency: string) => {
            return formatCurrency(amount, currency);
          };
          
          // Extract proration information
          const prorationAmount = data.proration.prorationAmount || 0;
          // Attempt to get remaining value from diagnosticInfo if available
          const remainingValue = data.proration.remainingValue || 
                             (data.proration.diagnosticInfo?.remainingValue || 0);
          const newPlanPrice = data.proration.newPlanPrice || 
                            (data.proration.diagnosticInfo?.newPrice || 
                            (selectedNewPlan?.pricing?.length ? parseFloat(selectedNewPlan.pricing[0].price) : 0));
          
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
            prorationMessage = `You'll be charged ${formatAmount(newPlanPrice, currency)} for this upgrade.`;
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
          
          // Get pricing from the plan's pricing object
          // First check for region-specific pricing
          const regionPricing = selectedPlan?.pricing?.find((p: { targetRegion: string }) => p.targetRegion === userRegion.region);
          
          // Determine currency from multiple sources in order of priority
          const currency = regionPricing?.currency ||                       // 1. Region-specific pricing
                         (selectedPlan?.pricing?.length > 0 ? selectedPlan.pricing[0].currency : null) || // 2. First pricing entry
                         selectedPlan?.displayCurrency ||                   // 3. Display currency from server
                         locationContext.currency ||                       // 4. Location context currency
                         userRegion.currency ||                            // 5. Region currency
                         'USD';                                            // 6. Default fallback
                         
          // Get price from appropriate source
          const price = regionPricing ? parseFloat(regionPricing.price) :
                       (selectedPlan?.pricing?.length > 0 ? parseFloat(selectedPlan.pricing[0].price) : 
                       (selectedPlan?.displayPrice ? parseFloat(selectedPlan.displayPrice) : 0));
          
          // Format the price for display using the useRegion's formatCurrency function
          const formattedPrice = formatCurrency(price, currency);
          
          // For new users, show a simpler confirmation
          const confirmed = window.confirm(
            `You're about to subscribe to the ${planName} plan.\n\n` +
            `You'll be charged ${formattedPrice} for this subscription.\n\n` +
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

  // Fetch user invoices
  const { data: userInvoices, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['userInvoices'],
    queryFn: async () => {
      try {
        const response = await PaymentService.getUserInvoices();
        console.log("Fetched user invoices:", response);
        return response;
      } catch (error) {
        console.error("Error fetching invoices:", error);
        return [];
      }
    },
    enabled: activeTab === 'invoices'
  });

  // Function to toggle plan feature expansion
  const togglePlanExpansion = (planId: number) => {
    setExpandedPlans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  return (
    <ErrorBoundary>
      <DefaultLayout pageTitle="Subscription Management" pageDescription="View and manage your subscription details, features, and plans.">
        {isLoading ? (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">Loading subscription information...</p>
                <p className="text-sm text-muted-foreground">Please wait while we fetch your data</p>
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setTab} className="space-y-4 md:space-y-6">
            {/* Mobile-First Tab Navigation */}
            <div className="mb-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                <TabsTrigger 
                  value="current"
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-2 sm:px-4 text-sm font-medium rounded-lg transition-all",
                    "data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm",
                    "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-blue-300",
                    "hover:bg-white/50 dark:hover:bg-slate-800",
                    "mb-1 sm:mb-0"
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden xs:inline">{subscription ? 'Current Plan' : 'No Subscription'}</span>
                  <span className="xs:hidden">Current</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="features"
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-2 sm:px-4 text-sm font-medium rounded-lg transition-all",
                    "data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm",
                    "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-purple-300",
                    "hover:bg-white/50 dark:hover:bg-slate-800",
                    "mb-1 sm:mb-0"
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden xs:inline">Features & Limits</span>
                  <span className="xs:hidden">Features</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="plans"
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-2 sm:px-4 text-sm font-medium rounded-lg transition-all",
                    "data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm",
                    "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-green-300",
                    "hover:bg-white/50 dark:hover:bg-slate-800",
                    "mb-1 sm:mb-0"
                  )}
                >
                  <Package className="h-4 w-4" />
                  <span className="hidden xs:inline">{subscription ? 'Available Plans' : 'Choose a Plan'}</span>
                  <span className="xs:hidden">Plans</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="invoices"
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-2 sm:px-4 text-sm font-medium rounded-lg transition-all",
                    "data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm",
                    "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-orange-300",
                    "hover:bg-white/50 dark:hover:bg-slate-800"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden xs:inline">Invoices</span>
                  <span className="xs:hidden">Bills</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Current Plan Tab */}
            <TabsContent value="current" className="mt-0">
              {subscription ? (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-t-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-blue-600" />
                          {userPlan?.name || 'Current Subscription'}
                        </CardTitle>
                        <CardDescription className="mt-1">{userPlan?.description}</CardDescription>
                      </div>
                      <div className="flex justify-start sm:justify-end">
                        {getStatusBadge(subscription.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <InfoIcon className="h-5 w-5 text-blue-600" />
                          Subscription Details
                        </h3>
                        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Plan</span>
                            <span className="font-semibold">
                              {userPlan?.name || `Unknown (ID: ${subscription?.planId})`}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Status</span>
                            <span>{getStatusBadge(subscription.status)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Billing Cycle</span>
                            <span className="font-semibold">
                              {userPlan?.billingCycle ? 
                                (userPlan.billingCycle.charAt(0) + userPlan.billingCycle.slice(1).toLowerCase()) : 
                                'Not specified'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Auto-renew</span>
                            <Badge variant={subscription.autoRenew ? "default" : "outline"}>
                              {subscription.autoRenew ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Start Date</span>
                            <span className="font-semibold">{formatDate(subscription.startDate)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">End Date</span>
                            <span className="font-semibold">{formatDate(subscription.endDate)}</span>
                          </div>
                          {hasIncorrectDates && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-center">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              Monthly plan shows incorrect end date. Contact support for correction.
                            </div>
                          )}
                          
                          {/* Add pending change information */}
                          {hasPendingChange && pendingChange && (
                            <>
                              <Separator className="my-3" />
                              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="flex items-start gap-3">
                                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                      Scheduled Plan Change
                                    </h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                      Your subscription will change to{' '}
                                      <span className="font-semibold">{pendingPlanName || `Plan ID: ${pendingChange.pendingPlanChangeTo}`}</span>{' '}
                                      on {formatDate(pendingChange.pendingPlanChangeDate || pendingChange.endDate)}
                                    </p>
                                    <div className="mt-3">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="h-8 text-xs bg-white dark:bg-slate-800" 
                                        onClick={() => cancelPendingChangeMutation.mutate()}
                                        disabled={cancelPendingChangeMutation.isPending}
                                      >
                                        {cancelPendingChangeMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                            Cancelling...
                                          </>
                                        ) : (
                                          'Cancel Change'
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          Feature Usage Summary
                        </h3>
                        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg max-h-80 overflow-y-auto">
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
                                <div key={`summary-${feature.featureId || feature.id || Math.random().toString(36).substring(7)}`} className="space-y-2 p-3 bg-white dark:bg-slate-700/50 rounded-lg">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-medium">{feature.featureName || 'Unknown Feature'}</span>
                                    <span className="text-muted-foreground">
                                      {usageValue} / {isTokenFeature ? formatTokenCount(limitValue) : `${limitValue} uses`}
                                    </span>
                                  </div>
                                  <Progress
                                    value={Math.min(usagePercentage, 100)}
                                    className={`h-2 ${usagePercentage > 80 ? 'bg-red-200 dark:bg-red-900' : ''}`}
                                  />
                                  {feature.resetFrequency && feature.resetFrequency !== 'NEVER' && (
                                    <div className="text-xs text-muted-foreground">
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
                              <div key={`summary-bool-${feature.featureId || feature.id || Math.random().toString(36).substring(7)}`} className="flex justify-between items-center text-sm p-3 bg-white dark:bg-slate-700/50 rounded-lg">
                                <span className="font-medium">{feature.featureName || 'Unknown Feature'}</span>
                                <Badge variant={feature.isEnabled ? "default" : "outline"}>
                                  {feature.isEnabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 bg-slate-50 dark:bg-slate-800/20 rounded-b-lg p-4 md:p-6">
                    <div className="text-center sm:text-left">
                      {subscription.status === 'ACTIVE' && (
                        <p className="text-sm text-muted-foreground">
                          Your subscription will {subscription.autoRenew ? 'automatically renew' : 'expire'} on {formatDate(subscription.endDate)}.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {hasIncorrectDates && (
                        <div className="flex flex-col items-center">
                          <Button 
                            variant="outline"
                            onClick={contactSupportForDates}
                            className="w-full sm:w-auto"
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
                        className="w-full sm:w-auto"
                      >
                        {cancelMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Cancel Subscription'
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-t-lg">
                      <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                        No Active Subscription
                      </CardTitle>
                      <CardDescription>Choose a subscription plan to unlock premium features and maximize your experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-4 w-16 h-16 mb-4">
                          <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Unlock Premium Features</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                          Get started with a subscription to access AI-powered resume building, ATS optimization, and advanced career tools.
                        </p>
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            setTab('plans');
                          }}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md px-8"
                          size="lg"
                        >
                          View Available Plans
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-t-lg">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        Benefits of Upgrading
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                      <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1 mt-0.5">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <span className="font-semibold">AI-powered resume optimization</span>
                            <p className="text-sm text-muted-foreground mt-1">Get tailored suggestions to improve your resume's ATS compatibility</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1 mt-0.5">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <span className="font-semibold">Expanded content generation</span>
                            <p className="text-sm text-muted-foreground mt-1">Create more high-quality resumes, cover letters, and applications</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1 mt-0.5">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <span className="font-semibold">Advanced customization</span>
                            <p className="text-sm text-muted-foreground mt-1">Access premium templates and personalization options</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1 mt-0.5">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <span className="font-semibold">Priority support</span>
                            <p className="text-sm text-muted-foreground mt-1">Get faster responses and dedicated assistance</p>
                          </div>
                        </li>
                      </ul>
                      <div className="mt-6 text-center">
                        <Button 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            setTab('plans');
                          }}
                          className="w-full border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
                        >
                          Compare All Plans
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            {/* Features & Limits Tab */}
            <TabsContent value="features" className="mt-0">
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Features & Usage Limits
                  </CardTitle>
                  <CardDescription>
                    {userPlan 
                      ? `Features available with your ${userPlan.name} subscription`
                      : 'Subscribe to a plan to access these features'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {combinedFeatures.length > 0 ? (
                    <div className="space-y-4">
                      {/* Mobile-First Feature Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {combinedFeatures.map((feature: PlanFeature) => {
                          const isTokenFeature = feature.isTokenBased === true;
                          const usageValue = isTokenFeature 
                            ? (feature.aiTokenCount !== undefined ? feature.aiTokenCount : 0)
                            : (feature.currentUsage !== undefined ? feature.currentUsage : 0);
                          const limitValue = feature.limitValue || 0;
                          const usagePercentage = limitValue > 0 ? (usageValue / limitValue) * 100 : 0;

                          return (
                            <Card key={feature.featureId || feature.id} className="p-4 bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
                              <div className="space-y-3">
                                {/* Feature Header */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-sm md:text-base text-slate-900 dark:text-slate-100">
                                      {feature.featureName}
                                    </h3>
                                    <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {feature.description}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {feature.resetFrequency}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Feature Limit & Usage */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Limit</span>
                                    <span className="font-semibold">
                                      {feature.limitType === 'UNLIMITED' 
                                        ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">Unlimited</Badge>
                                        : feature.limitType === 'BOOLEAN' 
                                          ? <Badge variant={feature.isEnabled ? "default" : "outline"}>{feature.isEnabled ? 'Enabled' : 'Disabled'}</Badge>
                                          : getFeatureValueDisplay(feature)}
                                    </span>
                                  </div>
                                  
                                  {feature.limitType !== 'BOOLEAN' && feature.limitType !== 'UNLIMITED' && (
                                    <>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">Usage</span>
                                        <span className="font-semibold">
                                          {isTokenFeature 
                                            ? `${feature.aiTokenCount || 0} / ${formatTokenCount(feature.limitValue || 0)}` 
                                            : `${feature.currentUsage || 0} / ${feature.limitValue || 'Unlimited'} uses`}
                                        </span>
                                      </div>
                                      
                                      {limitValue > 0 && (
                                        <div className="space-y-1">
                                          <Progress
                                            value={Math.min(usagePercentage, 100)}
                                            className={`h-2 ${usagePercentage > 80 ? 'bg-red-200 dark:bg-red-900' : usagePercentage > 60 ? 'bg-yellow-200 dark:bg-yellow-900' : 'bg-green-200 dark:bg-green-900'}`}
                                          />
                                          <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{Math.round(usagePercentage)}% used</span>
                                            {feature.resetFrequency && feature.resetFrequency !== 'NEVER' && (
                                              <span>Resets {feature.resetFrequency.toLowerCase()}</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  
                                  {feature.limitType === 'BOOLEAN' && (
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground font-medium">Status</span>
                                      <Badge variant={feature.isEnabled ? "default" : "outline"} className={feature.isEnabled ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" : ""}>
                                        {feature.isEnabled ? 'Enabled' : 'Disabled'}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Desktop Table View - Hidden on Mobile */}
                      <div className="hidden lg:block mt-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <InfoIcon className="h-5 w-5 text-purple-600" />
                          Detailed View
                        </h3>
                        <div className="overflow-x-auto bg-white dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                                <TableHead className="font-semibold">Feature</TableHead>
                                <TableHead className="font-semibold">Description</TableHead>
                                <TableHead className="font-semibold">Limit</TableHead>
                                <TableHead className="font-semibold">Reset</TableHead>
                                <TableHead className="font-semibold">Usage</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {combinedFeatures.map((feature: PlanFeature) => (
                                <TableRow key={feature.featureId || feature.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                  <TableCell className="font-semibold">{feature.featureName}</TableCell>
                                  <TableCell className="text-sm max-w-xs">{feature.description}</TableCell>
                                  <TableCell>
                                    {feature.limitType === 'UNLIMITED' 
                                      ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Unlimited</Badge>
                                      : feature.limitType === 'BOOLEAN' 
                                        ? <Badge variant={feature.isEnabled ? "default" : "outline"}>{feature.isEnabled ? 'Enabled' : 'Disabled'}</Badge>
                                        : getFeatureValueDisplay(feature)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {feature.resetFrequency}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {feature.limitType === 'BOOLEAN' 
                                      ? <Badge variant={feature.isEnabled ? "default" : "outline"}>{feature.isEnabled ? 'Enabled' : 'Disabled'}</Badge>
                                      : feature.isTokenBased 
                                        ? `${feature.aiTokenCount || 0} / ${formatTokenCount(feature.limitValue || 0)}` 
                                        : `${feature.currentUsage || 0} / ${feature.limitValue || 'Unlimited'}`}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  ) : subscription ? (
                    <div className="py-12 text-center">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No features available</h3>
                      <p className="text-muted-foreground">No features are currently available for your plan.</p>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                        <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No subscription found</h3>
                      <p className="text-muted-foreground mb-6">Subscribe to a plan to see available features.</p>
                      <Button 
                        onClick={(e) => {
                          e.preventDefault();
                          setTab('plans');
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                      >
                        Browse Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Available Plans Tab */}
            <TabsContent value="plans" className="mt-0">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-green-800 dark:text-green-300">
                      <span className="font-medium">Price Display: </span>
                      {billingCountry ? (
                        <>Showing prices based on your billing address: {billingRegion === 'INDIA' ? 'India' : billingCountry}</>
                      ) : userRegion.country ? (
                        <>Showing prices based on your location: {userRegion.region === 'INDIA' ? 'India' : userRegion.country}</>
                      ) : (
                        <>Showing global prices</>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                  {plans
                    .filter((plan: SubscriptionPlan) => plan && plan.active)
                    .map((plan: SubscriptionPlan) => {
                      const isCurrentPlan = subscription && plan ? subscription.planId === plan.id : false;
                      const isPendingPlan = hasPendingChange && pendingChange && plan ? pendingChange.pendingPlanChangeTo === plan.id : false;
                      
                      // Determine if this is an upgrade or downgrade
                      const isUpgrade = subscription && plan && getPlanPrice(plan) > getPlanPrice(plans.find((p: SubscriptionPlan) => p && p.id === subscription.planId) || {} as SubscriptionPlan);
                      
                      return (
                        <Card key={plan.id} className={`flex flex-col h-full transition-all hover:shadow-xl ${isCurrentPlan ? 'border-blue-500 border-2 ring-2 ring-blue-100 dark:ring-blue-900/30' : ''} ${isPendingPlan ? 'border-amber-500 border-2 ring-2 ring-amber-100 dark:ring-amber-900/30' : ''} ${plan.isFeatured ? 'shadow-lg ring-2 ring-green-100 dark:ring-green-900/30 border-green-200 dark:border-green-800' : 'border-slate-200 dark:border-slate-700'}`}>
                          <CardHeader className={`p-4 md:p-6 ${isCurrentPlan ? 'bg-blue-50 dark:bg-blue-900/10' : ''} ${isPendingPlan ? 'bg-amber-50 dark:bg-amber-900/10' : ''} ${plan.isFeatured ? 'bg-green-50 dark:bg-green-900/10' : ''} rounded-t-lg`}>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {plan.isFeatured && (
                                <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm">
                                  ⭐ Featured
                                </Badge>
                              )}
                              {isPendingPlan && (
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                                  📅 Scheduled
                                </Badge>
                              )}
                              {isCurrentPlan && (
                                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                                  ✓ Current
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg md:text-xl font-bold">{plan.name}</CardTitle>
                            <CardDescription className="line-clamp-3 min-h-[60px] text-sm">{plan.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4 flex-grow min-h-[280px] p-4 md:p-6">
                            <div className="mb-4 text-center p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                              <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                                {getPriceDisplay(plan)}
                              </p>
                              <p className="text-sm text-muted-foreground">per {plan?.billingCycle ? plan.billingCycle.toLowerCase() : 'month'}</p>
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <div className={`space-y-2 overflow-y-auto transition-all duration-200 ${expandedPlans.has(plan.id) ? 'max-h-96' : 'max-h-48'}`}>
                              {allFeaturesByPlan[plan.id] && allFeaturesByPlan[plan.id].length > 0 ? (
                                <>
                                  {/* Show either first 8 features or all features based on expansion state */}
                                  {(expandedPlans.has(plan.id) 
                                    ? allFeaturesByPlan[plan.id] 
                                    : allFeaturesByPlan[plan.id].slice(0, 8)
                                  ).map((feature: any, index: number) => (
                                    <div key={index} className="flex items-start">
                                      {feature.limitType === 'BOOLEAN' && !feature.isEnabled ? (
                                        <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                      ) : (
                                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      )}
                                      <span className="text-sm">
                                        {feature.featureName || feature.name || 'Unnamed Feature'}
                                        {feature.limitType === 'COUNT' && feature.limitValue && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            ({getFeatureValueDisplay(feature)})
                                          </span>
                                        )}
                                        {feature.limitType === 'UNLIMITED' && (
                                          <span className="text-xs text-green-600 ml-1 font-medium">
                                            (Unlimited)
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                  {/* Show expand/collapse button if there are more than 8 features */}
                                  {allFeaturesByPlan[plan.id].length > 8 && (
                                    <div className="mt-2 text-center">
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="text-xs h-6 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          togglePlanExpansion(plan.id);
                                        }}
                                      >
                                        {expandedPlans.has(plan.id) 
                                          ? 'Show less features' 
                                          : `+${allFeaturesByPlan[plan.id].length - 8} more features`}
                                      </Button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                  No features available for this plan. (Plan ID: {plan.id})
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="mt-auto pt-4 p-4 md:p-6">
                            <Button 
                              className={`w-full transition-all font-medium h-12 ${
                                isCurrentPlan 
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300' 
                                  : isPendingPlan 
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300' 
                                    : plan.isFeatured 
                                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md' 
                                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white'
                              }`}
                              size="lg"
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
                              disabled={isCurrentPlan || isPendingPlan || upgradeMutation.isPending || downgradeMutation.isPending || isChangingPlan}
                            >
                              {isCurrentPlan 
                                ? '✓ Current Plan' 
                                : isPendingPlan
                                  ? `📅 Scheduled`
                                  : (upgradeMutation.isPending || downgradeMutation.isPending || isChangingPlan)
                                    ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                      </>
                                    ) 
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
            
            {/* Invoices Tab */}
            <TabsContent value="invoices" className="mt-0">
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Billing History
                  </CardTitle>
                  <CardDescription>
                    View and download your invoices and payment history
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {subscriptionData ? (
                    <SubscriptionInvoices subscriptionId={subscriptionData.id.toString()} />
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                        <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No subscription found</h3>
                      <p className="text-muted-foreground mb-6">Subscribe to a plan to view billing history.</p>
                      <Button 
                        onClick={(e) => {
                          e.preventDefault();
                          setTab('plans');
                        }}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-md"
                      >
                        Browse Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DefaultLayout>
    </ErrorBoundary>
  );
};

export default UserSubscriptionPage; 