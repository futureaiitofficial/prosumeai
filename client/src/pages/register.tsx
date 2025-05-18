import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Head from 'next/head';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Check, X } from 'lucide-react';
import RegisterForm from '@/components/auth/register-form';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { Progress } from '@/components/ui/progress';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import Link from 'next/link';
import { useBranding } from '@/components/branding/branding-provider';

// Parse URL search params to get the plan ID
const getParamsFromLocation = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    planId: params.get('planId') ? parseInt(params.get('planId')!) : undefined
  };
};

export default function RegisterPage() {
  const branding = useBranding();
  const [location, navigate] = useLocation();
  const { planId } = getParamsFromLocation();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(20); // Start with 20% progress
  const { toast } = useToast();

  // Check if plan ID is provided
  useEffect(() => {
    if (!planId) {
      toast({
        title: "Missing plan information",
        description: "Please select a subscription plan first.",
        variant: "destructive"
      });
      navigate('/pricing');
      return;
    }

    // Initialize loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prev + 5, 80); // Progress up to 80% while loading
      });
    }, 100);

    // Fetch plan data
    const fetchPlanData = async () => {
      try {
        const response = await axios.get(`/api/public/subscription-plans/${planId}`);
        const planData = response.data;
        
        // Get features for this plan
        try {
          const featuresResponse = await axios.get('/api/public/plan-features');
          const data = featuresResponse.data;
          
          // Transform the data into a map by planId for easier lookup
          const featuresByPlan: { [key: number]: any[] } = {};
          const featuresArray = Array.isArray(data) ? data : data.features || [];
          featuresArray.forEach((feature: any) => {
            const featurePlanId = feature.planId || feature.plan_id;
            if (featurePlanId) {
              if (!featuresByPlan[featurePlanId]) {
                featuresByPlan[featurePlanId] = [];
              }
              featuresByPlan[featurePlanId].push(feature);
            }
          });
          
          // If we have features for this plan, update the plan data
          if (featuresByPlan[planId]) {
            const planWithFeatures = { 
              ...planData,
              features: featuresByPlan[planId],
              featureNames: featuresByPlan[planId].map((f: any) => f.featureName || f.name)
            };
            setSelectedPlan(planWithFeatures);
          } else {
            setSelectedPlan(planData);
          }
        } catch (featuresError) {
          console.error('Error fetching plan features:', featuresError);
          setSelectedPlan(planData);
        }
        
        setIsLoading(false);
        setProgress(100); // Complete progress
      } catch (error) {
        console.error('Error fetching plan details:', error);
        toast({
          title: "Couldn't fetch plan details",
          description: "Please try again or contact support.",
          variant: "destructive"
        });
        navigate('/pricing');
      }
    };

    fetchPlanData();
    return () => clearInterval(interval);
  }, [planId, navigate, toast]);

  // Helper function to format the price display
  const getPriceDisplay = (plan: any) => {
    if (!plan) return 'Loading...';
    
    // For freemium plans
    if (plan.isFreemium || !plan.pricing || plan.pricing?.length === 0) {
      return 'Free';
    }
    
    // Check if the plan has displayPrice and displayCurrency fields from the server
    if (plan.displayPrice && plan.displayCurrency) {
      return `${plan.displayPrice} ${plan.displayCurrency}`;
    }
    
    // Fallback to default pricing
    const pricing = plan.pricing?.find((p: any) => p.targetRegion === 'GLOBAL');
    if (pricing) {
      return `${pricing.price} ${pricing.currency}`;
    }
    
    // Last resort fallback
    return plan.price && plan.price !== '0.00' 
      ? `${plan.price} ${plan.currency || 'USD'}` 
      : 'Loading...';
  };

  // Helper function to format token counts with "K" for thousands
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
  const getFeatureValueDisplay = (feature: any): string => {
    if (!feature) return '';

    // For token-related features, format with K and add "tokens"
    if ((feature.featureName?.toLowerCase() || '').includes('token') || 
        (feature.featureName?.toLowerCase() || '').includes('generation') || 
        (feature.featureName?.toLowerCase() || '').includes('ai')) {
      return formatTokenCount(feature.limitValue);
    }
    
    // Special handling for Resume, Cover Letter, and Job Application counts
    if ((feature.featureName || '').includes('Resume') && feature.limitType === 'COUNT') {
      return feature.limitValue === 1 ? '1 resume' : `${feature.limitValue} resumes`;
    }
    
    if ((feature.featureName || '').includes('Cover letter') && feature.limitType === 'COUNT') {
      return feature.limitValue === 1 ? '1 cover letter' : `${feature.limitValue} cover letters`;
    }
    
    if ((feature.featureName || '').includes('Job Application') && feature.limitType === 'COUNT') {
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Create an Account | {branding.appName}</title>
        <meta name="description" content={`Sign up for ${branding.appName} and start creating professional resumes that get you noticed.`} />
      </Head>
      
      {/* Header with fixed position - using forceBackground prop to make it always visible */}
      <SharedHeader isLandingPage={false} forceBackground={true} />
      
      {/* Empty space to prevent overlap with fixed header */}
      <div className="pt-16 md:pt-20"></div>
      
      {/* Brand Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-900 py-4 text-center">
        <h1 className="text-white text-2xl md:text-3xl font-bold">{branding.appName}</h1>
        <p className="text-indigo-200 text-sm md:text-base mt-1">{branding.appTagline}</p>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-medium">1</div>
              <span className="font-medium text-gray-900">Select Plan</span>
            </div>
            <div className="flex-grow mx-4 h-px bg-gray-200"></div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-medium">2</div>
              <span className="font-medium text-indigo-900">Create Account</span>
            </div>
            <div className="flex-grow mx-4 h-px bg-gray-200"></div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500 font-medium">3</div>
              <span className="font-medium text-gray-400">Payment</span>
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-indigo-100" />
        </div>
      </div>
      
      <div className="bg-white flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Registration Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border border-indigo-100">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <CardTitle className="text-2xl text-indigo-900">Create Your Account</CardTitle>
                  <CardDescription className="text-indigo-700">
                    Fill in your details to get started with {branding.appName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-indigo-600">Loading registration form...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <RegisterForm selectedPlanId={planId?.toString()} />
                      
                      <div className="mt-6 pt-6 border-t border-indigo-100 text-center">
                        <p className="text-indigo-700">
                          Already have an account?{" "}
                          <a href="/auth" className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                            Sign in
                          </a>
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column - Plan Details */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border border-indigo-100 h-full">
                <CardHeader className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white">
                  <CardTitle className="text-xl">Your Selected Plan</CardTitle>
                  <CardDescription className="text-indigo-200">
                    Review your plan before continuing
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoading || !selectedPlan ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-indigo-100 rounded"></div>
                      <div className="h-20 bg-indigo-50 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-indigo-50 rounded"></div>
                        <div className="h-4 bg-indigo-50 rounded"></div>
                        <div className="h-4 bg-indigo-50 rounded"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-indigo-700">{selectedPlan.name}</h3>
                        <p className="text-2xl font-bold mt-2 text-indigo-900">{getPriceDisplay(selectedPlan)}</p>
                        {!selectedPlan.isFreemium && (
                          <p className="text-sm text-indigo-600 mt-1">
                            per {selectedPlan.billingCycle?.toLowerCase() || 'month'}
                          </p>
                        )}
                        <p className="text-sm text-indigo-600 mt-2">{selectedPlan.description}</p>
                      </div>
                      
                      <Separator className="bg-indigo-100" />
                      
                      <div>
                        <h4 className="text-sm font-medium mb-3 text-indigo-900">Plan Features:</h4>
                        {selectedPlan.features && selectedPlan.features.length > 0 ? (
                          <ul className="space-y-3">
                            {selectedPlan.features.map((feature: any, index: number) => (
                              <li key={index} className="flex items-start">
                                <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-indigo-700">
                                  {feature.featureName || feature.name || 'Unnamed Feature'}
                                  {(feature.limitType === 'COUNT' || feature.limitType === 'UNLIMITED') && (
                                    <span className="text-sm text-indigo-500 ml-1">
                                      ({getFeatureValueDisplay(feature)})
                                    </span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : selectedPlan.featureNames && selectedPlan.featureNames.length > 0 ? (
                          <ul className="space-y-3">
                            {selectedPlan.featureNames.map((feature: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-indigo-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-indigo-600">Basic features included</p>
                        )}
                      </div>
                      
                      <div className="bg-indigo-50 p-4 rounded-md text-sm text-indigo-700 border border-indigo-100">
                        <p>
                          <strong>Note:</strong> After creating your account, you'll proceed to payment to activate your subscription.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <SharedFooter />
    </div>
  );
} 