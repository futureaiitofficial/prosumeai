import React, { useRef, useState, useEffect } from 'react';
import Head from 'next/head';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';
import { useAuth } from '@/hooks/use-auth';
import { useRegion } from '@/hooks/use-region';
import { PaymentService } from '@/services/payment-service';

// Reuse the interfaces from the subscription page
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
}

// Add user region interface
interface UserRegion {
  region: 'GLOBAL' | 'INDIA';
  currency: 'USD' | 'INR';
  country?: string;
}

const PricingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const branding = useBranding();
  const featuresRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null);
  
  // Use the region hook instead of direct state and API calls
  const { 
    userRegion, 
    isLoading: isRegionLoading,
    formatCurrency 
  } = useRegion();

  // Fetch available plans
  const { data: plansData, isLoading: isPlansLoading, error: plansError } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/public/subscription-plans');
      const data = await response.json();
      console.log('Fetched subscription plans:', data);
      return data;
    }
  });

  // Fetch all plan features
  const { data: allPlanFeatures, isLoading: isAllFeaturesLoading } = useQuery({
    queryKey: ['allPlanFeatures'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/public/plan-features');
      const data = await response.json();
      
      // Transform the data into a map by planId for easier lookup
      const featuresByPlan: { [key: number]: PlanFeature[] } = {};
      // Check if data is an array or nested
      const featuresArray = Array.isArray(data) ? data : data.features || [];
      featuresArray.forEach((feature: any) => {
        const planId = feature.planId || feature.plan_id;
        if (planId) {
          if (!featuresByPlan[planId]) {
            featuresByPlan[planId] = [];
          }
          featuresByPlan[planId].push(feature);
        }
      });
      return { featuresByPlan };
    }
  });

  // Effect to scroll to the features section when URL has #features
  useEffect(() => {
    if (location.includes('#features') && featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);

  // Get price display based on user region
  const getPriceDisplay = (plan: any) => {
    // Only show as free if the plan is explicitly marked as freemium
    if (plan.isFreemium) {
      return 'Free';
    }
    
    // Check if the plan has displayPrice and displayCurrency fields from the server
    if (plan.displayPrice && plan.displayCurrency) {
      return formatCurrency(parseFloat(plan.displayPrice));
    }
    
    // Try to get pricing for user's region first
    const regionPricing = plan.pricing?.find((p: any) => p.targetRegion === userRegion.region);
    if (regionPricing) {
      return formatCurrency(parseFloat(regionPricing.price));
    }
    
    // Fallback to global pricing
    const pricing = plan.pricing?.find((p: any) => p.targetRegion === 'GLOBAL');
    if (pricing) {
      return formatCurrency(parseFloat(pricing.price));
    }
    
    // Only if we can't find any pricing information, check the plan's base price
    // If it's 0, then show as Free
    if (plan.price === '0' || plan.price === '0.00' || 
        (typeof plan.price === 'number' && plan.price === 0) || 
        !plan.pricing || plan.pricing.length === 0) {
      return 'Free';
    }
    
    // Default fallback to plan price
    return formatCurrency(parseFloat(plan.price || '0'));
  };

  const handlePlanSelection = (plan: SubscriptionPlan) => {
    // Store the selected plan ID for reference in subscription page
    sessionStorage.setItem('selectedPlanId', plan.id.toString());
    
    if (user) {
      // If logged in, redirect to subscription page
      navigate('/user/subscription');
    } else {
      // If not logged in, redirect to register page first with redirect param
      navigate('/register?redirect=/user/subscription');
    }
  };

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

  const isLoading = isPlansLoading || isAllFeaturesLoading;
  const plans = plansData || [];
  const allFeaturesByPlan = allPlanFeatures?.featuresByPlan || {};

  // Filter plans by active status and prioritize monthly plans
  const filteredPlans = plans.filter((plan: SubscriptionPlan) => 
    plan.active && (plan.isFreemium || plan.billingCycle === 'MONTHLY')
  );

  // Sort plans by price (from lowest to highest)
  const sortedPlans = React.useMemo(() => {
    return [...filteredPlans].sort((a, b) => {
      // Free plans should come first
      if (a.isFreemium && !b.isFreemium) return -1;
      if (!a.isFreemium && b.isFreemium) return 1;
      
      // Compare prices for paid plans based on user region
      const aPrice = a.pricing?.find((p: any) => p.targetRegion === userRegion.region)?.price || 
                    a.pricing?.find((p: any) => p.targetRegion === 'GLOBAL')?.price || 
                    a.price || '0';
      
      const bPrice = b.pricing?.find((p: any) => p.targetRegion === userRegion.region)?.price || 
                    b.pricing?.find((p: any) => p.targetRegion === 'GLOBAL')?.price || 
                    b.price || '0';
      
      const aNumericPrice = parseFloat(aPrice);
      const bNumericPrice = parseFloat(bPrice);
      
      return aNumericPrice - bNumericPrice;
    });
  }, [filteredPlans, userRegion.region]);

  // Get unique features across all plans
  const uniqueFeatures = React.useMemo(() => {
    return Object.entries(allFeaturesByPlan).reduce((features: PlanFeature[], [planId, planFeatures]) => {
      planFeatures.forEach(feature => {
        if (!features.some(f => f.featureId === feature.featureId)) {
          features.push(feature);
        }
      });
      return features;
    }, []);
  }, [allFeaturesByPlan]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      <Head>
        <title>Pricing | {branding.appName} | AI-Powered Resume Builder for Students</title>
        <meta name="description" content="Choose the perfect plan for your needs. {branding.appName} offers affordable pricing options for students and career professionals." />
        <meta name="keywords" content="resume pricing, affordable resume tools, resume builder plans, student pricing" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://${branding.appName}.com/pricing`} />
        <meta property="og:title" content={`Pricing | ${branding.appName} | AI-Powered Resume Builder`} />
        <meta property="og:description" content={`Choose the perfect plan for your needs. ${branding.appName} offers affordable pricing options for students and career professionals.`} />
        <meta property="og:image" content={`https://${branding.appName}.com/images/pricing-og-image.jpg`} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://${branding.appName}.com/pricing`} />
        <meta property="twitter:title" content={`Pricing | ${branding.appName} | AI-Powered Resume Builder`} />
        <meta property="twitter:description" content={`Choose the perfect plan for your needs. ${branding.appName} offers affordable pricing options for students and career professionals.`} />
        <meta property="twitter:image" content={`https://${branding.appName}.com/images/pricing-og-image.jpg`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://${branding.appName}.com/pricing`} />
      </Head>
      
      {/* Header */}
      <SharedHeader />
      
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
            Simple, Transparent <span className="text-indigo-400">Pricing</span>
          </h1>
          <p className="text-lg md:text-xl text-indigo-200 mb-6">
            Choose the plan that works best for you. All plans include our core features to help you land your dream job.
          </p>
          <p className="text-md md:text-lg text-white bg-green-600/80 mx-auto rounded-full py-2 px-4 max-w-max">
            <span className="font-semibold">No credit card required</span> to get started
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-white py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <div className="animate-pulse">Loading pricing information...</div>
            </div>
          ) : (
            <>
              {/* Add region indication */}
              {userRegion.region && (
                <div className="text-center mb-6 text-sm text-gray-500">
                  {userRegion.region === 'INDIA' ? 'Showing prices for India (INR)' : 'Showing international prices (USD)'}
                </div>
              )}
              {/* Pricing Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                {sortedPlans.map((plan: SubscriptionPlan) => {
                  const priceDisplay = getPriceDisplay(plan);
                  const isFreePlan = plan.isFreemium;
                  
                  return (
                    <Card key={plan.id} className={`${plan.isFeatured ? 'border-primary border-2 shadow-lg' : ''} flex flex-col min-h-[480px] relative group hover:shadow-lg transition-all duration-300`}>
                      {isFreePlan && (
                        <div className="absolute -top-3 left-0 right-0 mx-auto w-max px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                          No Credit Card Required
                        </div>
                      )}
                      <CardHeader className={`${plan.isFeatured ? 'bg-indigo-50' : ''} text-center pb-6`}>
                        {plan.isFeatured && (
                          <Badge className="w-fit mx-auto mb-2 bg-indigo-600 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Most Popular
                          </Badge>
                        )}
                        <CardTitle className="text-2xl text-indigo-900">{plan.name}</CardTitle>
                        <CardDescription className="text-sm mt-2">{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-8 flex-grow flex flex-col items-center px-6">
                        <div className="mb-8 text-center">
                          <p className="text-4xl font-bold text-indigo-900">
                            {priceDisplay}
                          </p>
                          {!plan.isFreemium && (
                            <p className="text-sm text-muted-foreground mt-1">per {plan.billingCycle.toLowerCase()}</p>
                          )}
                        </div>
                        
                        <Separator className="my-4 w-full" />
                        
                        <div className="space-y-3 w-full mt-2">
                          {allFeaturesByPlan[plan.id] && allFeaturesByPlan[plan.id].length > 0 ? (
                            allFeaturesByPlan[plan.id].map((feature: any, index: number) => (
                              <div key={index} className="flex items-start">
                                {feature.limitType === 'BOOLEAN' && !feature.isEnabled ? (
                                  <X className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                )}
                                <span className="text-sm">
                                  {feature.featureName || feature.name || 'Unnamed Feature'}
                                  {(feature.limitType === 'COUNT' || feature.limitType === 'UNLIMITED') && (
                                    <span className="text-sm text-muted-foreground ml-1">
                                      ({getFeatureValueDisplay(feature)})
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">No features available for this plan.</div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="mt-auto pb-6 px-6">
                        <Button 
                          className={`w-full py-6 group-hover:scale-105 transition-transform ${plan.isFeatured ? "bg-indigo-600 hover:bg-indigo-700" : plan.isFreemium ? "bg-green-600 hover:bg-green-700" : "border-2 border-indigo-200 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50"}`}
                          variant={plan.isFeatured ? "default" : "outline"}
                          onClick={() => handlePlanSelection(plan)}
                        >
                          {plan.isFreemium ? 'Sign Up for Free' : 'Get Started'}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            
              {/* Key Benefits Section - Added to highlight value */}
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
                <h2 className="text-3xl font-bold text-center mb-16">Why Choose {branding.appName}?</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group hover:-translate-y-1 duration-300">
                    <div className="bg-indigo-100 p-3 rounded-full mb-4 group-hover:bg-indigo-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-indigo-900">AI-Powered Resume Builder</h3>
                    <p className="text-gray-600">Our advanced AI analyzes job descriptions and tailors your resume to highlight relevant skills and experiences, increasing your chances of getting past ATS systems.</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group hover:-translate-y-1 duration-300">
                    <div className="bg-indigo-100 p-3 rounded-full mb-4 group-hover:bg-indigo-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-indigo-900">Professional Templates</h3>
                    <p className="text-gray-600">Choose from dozens of professionally designed templates that stand out to recruiters while remaining ATS-friendly. Customize colors, fonts, and layouts with ease.</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group hover:-translate-y-1 duration-300">
                    <div className="bg-indigo-100 p-3 rounded-full mb-4 group-hover:bg-indigo-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-indigo-900">ATS Scanner</h3>
                    <p className="text-gray-600">Test your resume against the same ATS technology that employers use. Get instant feedback on compatibility and suggestions for improvement.</p>
                  </div>
                </div>
                
                <div className="flex justify-center mt-12">
                  <div className="inline-flex items-center px-5 py-3 bg-indigo-100 text-indigo-800 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="font-medium">Your data is secure with our enterprise-grade encryption</span>
                  </div>
                </div>
              </div>
            
              {/* Feature Comparison Section - Made Mobile Responsive */}
              <div className="mt-24 bg-gray-50 py-12">
                <h2 className="text-3xl font-bold text-center mb-10 text-indigo-900">Compare All Features</h2>
                
                {/* Mobile Feature Comparison - Horizontal Scrollable Table */}
                <div className="block md:hidden">
                  <div className="overflow-x-auto pb-6 -mx-4 px-4">
                    <div className="min-w-[640px]">
                      <table className="w-full border-collapse border">
                        <thead className="bg-indigo-50 sticky top-0">
                          <tr>
                            <th className="p-3 text-left text-sm font-medium text-indigo-700 border-b border-r">Feature</th>
                            {sortedPlans.map((plan: SubscriptionPlan) => (
                              <th key={plan.id} className="p-3 text-center text-sm font-medium text-indigo-700 border-b border-r">
                                <div className="font-medium">{plan.name}</div>
                                <div className="text-xs mt-1">{getPriceDisplay(plan)}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {uniqueFeatures.map(feature => (
                            <tr key={feature.featureId} className="border-b">
                              <td className="p-3 text-sm border-r">{feature.featureName}</td>
                              {sortedPlans.map((plan: SubscriptionPlan) => {
                                const planFeature = allFeaturesByPlan[plan.id]?.find(
                                  f => f.featureId === feature.featureId
                                );
                                
                                return (
                                  <td key={`${plan.id}-${feature.featureId}`} className="p-3 text-center text-sm border-r">
                                    {planFeature ? (
                                      planFeature.limitType === 'BOOLEAN' ? (
                                        planFeature.isEnabled ? (
                                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                                        ) : (
                                          <X className="h-5 w-5 text-red-600 mx-auto" />
                                        )
                                      ) : (
                                        <span>{getFeatureValueDisplay(planFeature)}</span>
                                      )
                                    ) : (
                                      <X className="h-5 w-5 text-red-600 mx-auto" />
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-xs text-gray-500 mt-2 text-center italic">Swipe horizontally to view all plan features</div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop Feature Comparison Table (hidden on mobile) */}
                <div className="hidden md:block overflow-x-auto max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-indigo-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider border-r w-1/5">
                          Feature
                        </th>
                        {sortedPlans.map((plan: SubscriptionPlan) => (
                          <th key={plan.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-indigo-700 uppercase tracking-wider border-r last:border-r-0 w-1/5">
                            {plan.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uniqueFeatures.map((feature: PlanFeature) => (
                        <tr key={feature.featureId}>
                          <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 border-r w-1/5">
                            {feature.featureName}
                          </td>
                          {sortedPlans.map((plan: SubscriptionPlan) => {
                            const planFeature = allFeaturesByPlan[plan.id]?.find(
                              (f: PlanFeature) => f.featureId === feature.featureId
                            );
                            
                            return (
                              <td key={`${plan.id}-${feature.featureId}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center border-r last:border-r-0 w-1/5">
                                {planFeature ? (
                                  planFeature.limitType === 'BOOLEAN' ? (
                                    planFeature.isEnabled ? (
                                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                                    ) : (
                                      <X className="h-5 w-5 text-red-600 mx-auto" />
                                    )
                                  ) : (
                                    <span>{getFeatureValueDisplay(planFeature)}</span>
                                  )
                                ) : (
                                  <X className="h-5 w-5 text-red-600 mx-auto" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Launch Announcement Section */}
      <div className="py-16 bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-3 py-1 bg-indigo-500/30 rounded-full text-sm font-medium mb-6">
            🚀 New Launch
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Be Among the First to Experience {branding.appName}</h2>
          <p className="text-xl text-indigo-200 max-w-3xl mx-auto mb-8">
            We're excited to introduce {branding.appName} - our AI-powered platform designed to help students and early career professionals land their dream jobs with ATS-optimized resumes and cover letters.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Early Access</h3>
              <p className="text-indigo-200 text-sm">Get exclusive access to all features as one of our first users</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Special Launch Pricing</h3>
              <p className="text-indigo-200 text-sm">Take advantage of our introductory pricing plans</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Priority Support</h3>
              <p className="text-indigo-200 text-sm">Direct access to our team for feedback and assistance</p>
            </div>
          </div>
          
          <div className="inline-flex items-center justify-center">
            <div className="flex space-x-1 items-center mr-2 text-sm">
              <span className="text-yellow-400">★</span>
              <span className="text-yellow-400">★</span>
              <span className="text-yellow-400">★</span>
              <span className="text-yellow-400">★</span>
              <span className="text-yellow-400">★</span>
            </div>
            <p className="text-indigo-200 text-sm">Be the first to rate our product!</p>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="bg-indigo-50 py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-2 text-indigo-900">Frequently Asked Questions</h2>
          <p className="text-center text-gray-600 mb-10">Everything you need to know about our plans and pricing</p>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-indigo-900">Do I need a credit card to get started?</h3>
              <p className="text-gray-600">No! You can start with our Entry plan completely free, no credit card required. You only need to provide payment details when you're ready to upgrade to a paid plan.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-indigo-900">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, PayPal, and local payment methods depending on your region. Our payment process is secure and encrypted.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-indigo-900">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600">Absolutely! You can cancel your subscription at any time with just a few clicks. You'll continue to have access to your plan until the end of your billing period, no questions asked.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-indigo-900">Is there a refund policy?</h3>
              <p className="text-gray-600">Yes, we offer a 14-day money-back guarantee if you're not satisfied with our service. Simply contact our support team within 14 days of your purchase to request a refund.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-indigo-900">How do I upgrade my plan?</h3>
              <p className="text-gray-600">Upgrading is simple! Just log in to your account, go to your subscription settings, and select the plan you want to upgrade to. The price difference will be prorated for the remainder of your billing cycle.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-indigo-900">Do you offer discounts for students?</h3>
              <p className="text-gray-600">Yes! Our plans are already designed to be affordable for students, but we also offer special educational discounts. Contact our support team with your student ID for more information.</p>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-gray-600 mb-4">Still have questions? We're here to help!</p>
            <a href={`mailto:support@${branding.appName}.com`} className="text-indigo-600 hover:text-indigo-800 font-medium">
              Contact our support team →
            </a>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-900 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to boost your career prospects?</h2>
          <p className="text-xl text-indigo-200 mb-8">Join thousands of students and professionals who have transformed their job search with {branding.appName}.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            {user ? (
              <Button 
                onClick={() => navigate('/user/subscription')} 
                className="px-8 py-6 bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl rounded-lg font-medium transition-all duration-300 text-lg flex-1 max-w-xs mx-auto sm:mx-0"
              >
                Manage Subscription
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/register?redirect=/user/subscription')} 
                className="px-8 py-6 bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl rounded-lg font-medium transition-all duration-300 text-lg group flex-1 max-w-xs mx-auto sm:mx-0"
              >
                <div>
                  <span className="group-hover:translate-x-1 inline-block transition-transform duration-300">Get Started for Free</span>
                  <p className="text-xs mt-1 font-normal opacity-90">No Credit Card Required</p>
                </div>
              </Button>
            )}
            <Button
              variant="outline"
              className="px-8 py-6 bg-transparent border-2 border-white/60 hover:border-white hover:bg-white/10 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex-1 max-w-xs mx-auto sm:mx-0"
              onClick={() => window.location.href = `mailto:contact@${branding.appName}.com`}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <SharedFooter />
    </div>
  );
};

export default PricingPage; 