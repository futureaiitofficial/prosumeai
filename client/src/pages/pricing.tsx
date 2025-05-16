import React, { useRef } from 'react';
import Head from 'next/head';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import SharedHeader from '@/components/layouts/shared-header';

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

const PricingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch available plans
  const { data: plansData, isLoading: isPlansLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/public/subscription-plans');
      const data = await response.json();
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
    
    // Fallback to default pricing
    const pricing = plan.pricing.find(p => p.targetRegion === 'GLOBAL');
    if (pricing) {
      return `${pricing.price} ${pricing.currency}`;
    }
    
    // Last resort fallback
    return plan.price && plan.price !== '0.00' ? `${plan.price} USD` : 'Free';
  };

  const handlePlanSelection = (plan: SubscriptionPlan) => {
    // Store the selected plan ID in session storage
    sessionStorage.setItem('selectedPlanId', plan.id.toString());
    
    // Redirect to sign up page with pricing info
    window.location.href = `/auth?signup=true&planId=${plan.id}`;
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
        <title>Pricing | ATScribe | AI-Powered Resume Builder for Students</title>
        <meta name="description" content="Choose the perfect plan for your needs. ATScribe offers affordable pricing options for students and career professionals." />
        <meta name="keywords" content="resume pricing, affordable resume tools, resume builder plans, student pricing" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ATScribe.com/pricing" />
        <meta property="og:title" content="Pricing | ATScribe | AI-Powered Resume Builder" />
        <meta property="og:description" content="Choose the perfect plan for your needs. ATScribe offers affordable pricing options for students and career professionals." />
        <meta property="og:image" content="https://ATScribe.com/images/pricing-og-image.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://ATScribe.com/pricing" />
        <meta property="twitter:title" content="Pricing | ATScribe | AI-Powered Resume Builder" />
        <meta property="twitter:description" content="Choose the perfect plan for your needs. ATScribe offers affordable pricing options for students and career professionals." />
        <meta property="twitter:image" content="https://ATScribe.com/images/pricing-og-image.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://ATScribe.com/pricing" />
      </Head>
      
      {/* Header */}
      <SharedHeader />
      
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
            Simple, Transparent <span className="text-indigo-400">Pricing</span>
          </h1>
          <p className="text-lg md:text-xl text-indigo-200 mb-6">
            Choose the plan that works best for you. All plans include our core features to help you create stunning resumes.
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
              {/* Pricing Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                {filteredPlans.map((plan: SubscriptionPlan) => {
                  const priceDisplay = getPriceDisplay(plan);
                  
                  return (
                    <Card key={plan.id} className={`${plan.isFeatured ? 'border-primary border-2 shadow-lg' : ''} flex flex-col min-h-[480px]`}>
                      <CardHeader className={`${plan.isFeatured ? 'bg-primary/5' : ''} text-center pb-6`}>
                        {plan.isFeatured && (
                          <Badge className="w-fit mx-auto mb-2 bg-primary flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Most Popular
                          </Badge>
                        )}
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <CardDescription className="text-sm mt-2">{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-8 flex-grow flex flex-col items-center px-6">
                        <div className="mb-8 text-center">
                          <p className="text-4xl font-bold">
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
                          className="w-full py-6" 
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
            
              {/* Feature Comparison Section - Made Mobile Responsive */}
              <div className="mt-24">
                <h2 className="text-3xl font-bold text-center mb-10">Compare All Features</h2>
                
                {/* Mobile Feature Comparison - Horizontal Scrollable Table */}
                <div className="block md:hidden">
                  <div className="overflow-x-auto pb-6 -mx-4 px-4">
                    <div className="min-w-[640px]">
                      <table className="w-full border-collapse border">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="p-3 text-left text-sm font-medium text-gray-500 border-b border-r">Feature</th>
                            {filteredPlans.map((plan: SubscriptionPlan) => (
                              <th key={plan.id} className="p-3 text-center text-sm font-medium text-gray-500 border-b border-r">
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
                              {filteredPlans.map((plan: SubscriptionPlan) => {
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
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r w-1/5">
                          Feature
                        </th>
                        {filteredPlans.map((plan: SubscriptionPlan) => (
                          <th key={plan.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r last:border-r-0 w-1/5">
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
                          {filteredPlans.map((plan: SubscriptionPlan) => {
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
      
      {/* FAQ Section */}
      <div className="bg-gray-50 py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, PayPal, and local payment methods depending on your region.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. You'll continue to have access to your plan until the end of your billing period.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Is there a refund policy?</h3>
              <p className="text-gray-600">We offer a 14-day money-back guarantee if you're not satisfied with our service. Contact our support team to request a refund.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">How do I upgrade my plan?</h3>
              <p className="text-gray-600">You can upgrade your plan at any time from your account settings. The price difference will be prorated for the remainder of your billing cycle.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Do you offer discounts for students?</h3>
              <p className="text-gray-600">Yes! Our plans are already designed to be affordable for students, but we also offer special educational discounts. Contact our support team with your student ID for more information.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-indigo-900 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to boost your career prospects?</h2>
          <p className="text-xl text-indigo-200 mb-8">Join thousands of students and professionals who have transformed their job search with ATScribe.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth?signup=true">
              <a className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md font-medium transition-colors inline-block">
                Get Started for Free
              </a>
            </Link>
            <a href="mailto:contact@ATScribe.com" className="px-8 py-3 bg-transparent border border-white hover:bg-white/10 text-white font-medium rounded-md transition-colors inline-block">
              Contact Sales
            </a>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between mb-6 md:mb-8">
            <div className="mb-8 md:mb-0">
              <div className="text-xl md:text-2xl font-bold mb-3 md:mb-4">ATScribe</div>
              <p className="text-slate-400 max-w-xs text-sm md:text-base">
                AI-powered resume and cover letter builder to help students and early career professionals land their dream jobs.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Product</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/landing"><a className="text-slate-400 hover:text-white transition-colors">Features</a></Link></li>
                  <li><Link href="/pricing"><a className="text-slate-400 hover:text-white transition-colors">Pricing</a></Link></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Templates</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Company</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/about"><a className="text-slate-400 hover:text-white transition-colors">About Us</a></Link></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Support</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} ATScribe. All rights reserved.
            </p>
            
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="https://twitter.com/ATScribe" className="text-slate-500 hover:text-indigo-400 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              
              <a href="https://linkedin.com/company/ATScribe" className="text-slate-500 hover:text-indigo-400 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage; 