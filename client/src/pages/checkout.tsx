import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import DefaultLayout from '@/components/layouts/default-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Loader2, ShieldCheck, DollarSign, Lock, CreditCard, Calendar, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PaymentService, PaymentIntent, BillingDetails, GatewayKeyResponse } from '@/services/payment-service';
import BillingDetailsForm from "@/components/checkout/billing-details-form";
import axios from 'axios';
import { useBranding } from '@/components/branding/branding-provider';
// Import country-state-city package
import { Country, State } from 'country-state-city';
import { useRegion } from '@/hooks/use-region';

// Helper function to check if a string looks like an encrypted value
function isLikelyEncrypted(value: string | undefined | null): boolean {
  if (!value) return false;
  
  const parts = value.split(':');
  return parts.length === 3 && 
    parts[0].length === 16 && 
    parts[1].length === 32 && 
    /^[0-9a-f]+$/i.test(parts[0]) && 
    /^[0-9a-f]+$/i.test(parts[1]) && 
    /^[0-9a-f]+$/i.test(parts[2]);
}

// Razorpay types
declare global {
  interface Window {
    Razorpay: {
      (options: RazorpayOptions): RazorpayInstance;
      on(event: string, handler: Function): void;
    };
  }
}

type CheckoutStep = 'billing' | 'payment' | 'confirmation';

interface RazorpayOptions {
  key: string;
  subscription_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: Function;
    escape?: boolean;
    animation?: boolean;
  };
  handler?: (response: RazorpayResponse) => void;
}

interface RazorpayInstance {
  on(event: string, handler: (response: any) => void): void;
  open(): void;
  close(): void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  [key: string]: any;
}

// Parse URL search params since wouter doesn't provide a built-in way
const getParamsFromLocation = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    planId: params.get('planId') ? parseInt(params.get('planId')!) : undefined,
    prorationAmount: params.get('prorationAmount') ? parseFloat(params.get('prorationAmount')!) : undefined,
    upgradeFlow: params.get('upgradeFlow') === 'true'
  };
};

// Add user region interface
interface UserRegion {
  region: 'GLOBAL' | 'INDIA';
  currency: 'USD' | 'INR';
  country?: string;
}

const BillingReview = React.memo(({ billingInfo, handleReviewBillingAndContinue, handleEditBillingDetails, user }: {
  billingInfo: BillingDetails | null;
  handleReviewBillingAndContinue: () => void;
  handleEditBillingDetails: () => void;
  user: any;
}) => {
  if (!billingInfo) return null;

  // Get country and state names from codes
  const countryName = billingInfo.country ? Country.getCountryByCode(billingInfo.country)?.name || billingInfo.country : '';
  const stateName = billingInfo.state && billingInfo.country ? 
    State.getStateByCodeAndCountry(billingInfo.state, billingInfo.country)?.name || billingInfo.state : billingInfo.state;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <p className="text-gray-500 text-sm mb-1">Name</p>
          <p className="font-medium">{billingInfo.fullName}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm mb-1">Email</p>
          <p className="font-medium">{user?.email || billingInfo.email}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm mb-1">Phone</p>
          <p className="font-medium">{billingInfo.phoneNumber || "Not provided"}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm mb-1">Country</p>
          <p className="font-medium">{countryName}</p>
        </div>
        {billingInfo.addressLine1 && (
          <div>
            <p className="text-gray-500 text-sm mb-1">Address</p>
            <p className="font-medium">{billingInfo.addressLine1}</p>
            {billingInfo.addressLine2 && (
              <p className="font-medium">{billingInfo.addressLine2}</p>
            )}
            <p className="font-medium">
              {[billingInfo.city, stateName, billingInfo.postalCode].filter(Boolean).join(", ")}
            </p>
          </div>
        )}
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button onClick={handleReviewBillingAndContinue} className="flex-1">
          Continue
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            console.log("Edit billing details clicked from review");
            handleEditBillingDetails();
          }}
          id="edit-billing-details-button"
          type="button"
        >
          Edit Details
        </Button>
      </div>
    </div>
  );
});

class CheckoutErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Checkout error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <div className="mb-4 text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">We're sorry, the checkout page encountered an error.</p>
          <Button onClick={() => window.location.href = "/pricing"}>
            Return to Pricing
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function CheckoutPageWithErrorBoundary() {
  return (
    <CheckoutErrorBoundary>
      <CheckoutPage />
    </CheckoutErrorBoundary>
  );
}

export function CheckoutPage() {
  const [location, navigate] = useLocation();
  const { planId, prorationAmount, upgradeFlow: upgradeFlowParam } = getParamsFromLocation();
  // Default to false for new users - we'll determine the real value later
  const [upgradeFlow, setUpgradeFlow] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('billing');
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingInfo, setBillingInfo] = useState<BillingDetails | null>(null);
  const [gatewayKey, setGatewayKey] = useState<GatewayKeyResponse | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [useAlternativePayment, setUseAlternativePayment] = useState(false);
  const [alternativePaymentUrl, setAlternativePaymentUrl] = useState('');
  const [actuallyIsUpgrade, setActuallyIsUpgrade] = useState<boolean | undefined>(undefined);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBillingReview, setShowBillingReview] = useState(false);
  const [progress, setProgress] = useState(60); // Start at 60% since we're at step 3 of the registration flow
  const branding = useBranding();
  const [formKey, setFormKey] = useState(0);
  // Add isEditing flag to prevent auto-advancing when user explicitly clicks Edit
  const [isEditing, setIsEditing] = useState(false);
  
  // Replace direct region management with the useRegion hook
  const { userRegion, formatCurrency: formatRegionCurrency } = useRegion();

  // Add featuresLoading and featuresError state
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState<string | null>(null);

  // Add request tracking to prevent duplicate requests
  const pendingRequests = useRef<Set<string>>(new Set());
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef<boolean>(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Deduplicated request function to prevent multiple identical API calls
  const deduplicatedRequest = useCallback(async <T,>(key: string, requestFn: () => Promise<T>): Promise<T | undefined> => {
    if (pendingRequests.current.has(key)) {
      // Request already in progress, wait for it
      return;
    }
    
    try {
      pendingRequests.current.add(key);
      const result = await requestFn();
      return result;
    } finally {
      pendingRequests.current.delete(key);
    }
  }, []);

  // Move format currency outside of render loop for better performance
  const formatCurrency = useCallback((amount: number, currencyCode: string = 'USD') => {
    console.log(`Formatting currency: ${amount} ${currencyCode}`);
    
    // Don't automatically convert values, trust the values from the API
    // The server sends amounts in their display format, not the Razorpay format
    
    // Use appropriate locale based on currency
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currencyCode === 'INR' ? 0 : 2,
        maximumFractionDigits: 2
      });
      return formatter.format(amount);
    } catch (error) {
      console.error(`Error formatting currency ${amount} ${currencyCode}:`, error);
      return `${amount} ${currencyCode}`;
    }
  }, []);

  // Effect to check if plan ID is provided - add empty dependency array to run only once
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
    
    // Set loading to 50% immediately
    setLoadingProgress(50);
    
  }, [planId, toast, navigate]);

  // Effect to fetch necessary data - fix dependency array to prevent infinite loop
  useEffect(() => {
    if (!planId || loadingProgress >= 100) return;
    
    // Create a flag for this specific data loading session
    const loadingId = Date.now();
    const loadingSessionId = `loading-${loadingId}`;
    
    // Set initial loading state
    setLoadingProgress(50);

    // Check if this is really an upgrade for an existing user
    const checkSubscriptionStatus = async () => {
      return deduplicatedRequest('check-subscription', async () => {
        if (user) {
          try {
            const response = await axios.get('/api/user/subscription');
            const hasActiveSubscription = response.data && 
                                      Array.isArray(response.data) && 
                                      response.data.length > 0;
            
            if (isMounted.current) {
              setUpgradeFlow(hasActiveSubscription && upgradeFlowParam);
              setActuallyIsUpgrade(hasActiveSubscription);
            }
            return { hasActiveSubscription };
          } catch (error) {
            console.error('Error checking subscription status:', error);
            if (isMounted.current) {
              setUpgradeFlow(upgradeFlowParam);
            }
            return { error };
          }
        } else {
          if (isMounted.current) {
            setUpgradeFlow(false);
            setActuallyIsUpgrade(false);
          }
          return { hasActiveSubscription: false };
        }
      });
    };

    const fetchBillingInfo = async () => {
      return deduplicatedRequest('billing-info', async () => {
        try {
          const billing = await PaymentService.getBillingDetails();
          if (billing && isMounted.current) {
            setBillingInfo(billing);
            if (selectedPlan && currentStep === 'billing') {
              setShowBillingReview(true);
            }
          }
          return billing;
        } catch (error) {
          console.error('Error fetching billing details:', error);
          return null;
        }
      });
    };

    const fetchPlanData = async () => {
      return deduplicatedRequest(`plan-data-${planId}`, async () => {
        try {
          setFeaturesLoading(true);
          const response = await axios.get(`/api/public/subscription-plans/${planId}`);
          const planData = response.data;
          
          if (isMounted.current) {
            setSelectedPlan(planData);
            
            // Fetch features immediately after getting plan data
            try {
              const featuresResponse = await axios.get('/api/public/plan-features');
              const data = featuresResponse.data;
              
              const featuresByPlan: Record<number, Array<any>> = {};
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
              
              if (isMounted.current) {
                if (featuresByPlan[planId]) {
                  const planWithFeatures = {
                    ...planData,
                    features: featuresByPlan[planId].map((f: any) => f.featureName || f.name)
                  };
                  setSelectedPlan(planWithFeatures);
                } else {
                  // Set empty features array if none found for this plan
                  setSelectedPlan({
                    ...planData,
                    features: []
                  });
                }
                setFeaturesLoading(false);
              }
            } catch (error) {
              console.error('Error fetching plan features:', error);
              if (isMounted.current) {
                setFeaturesError('Failed to load features.');
                setFeaturesLoading(false);
                // Still set the plan but with empty features
                setSelectedPlan({
                  ...planData,
                  features: []
                });
              }
            }
          }
          
          return planData;
        } catch (error) {
          console.error('Error fetching plan details:', error);
          setFeaturesLoading(false);
          if (isMounted.current) {
            toast({
              title: "Couldn't fetch plan details",
              description: "Please try again or contact support.",
              variant: "destructive"
            });
            navigate('/pricing');
          }
          return null;
        }
      });
    };

    const fetchGatewayKey = async () => {
      return deduplicatedRequest('gateway-key', async () => {
        try {
          const key = await PaymentService.getGatewayKey();
          if (isMounted.current) {
            setGatewayKey(key);
          }
          return key;
        } catch (error) {
          console.error('Error fetching gateway key:', error);
          if (isMounted.current) {
            toast({
              title: "Payment system unavailable",
              description: "Please try again later or contact support.",
              variant: "destructive"
            });
          }
          return null;
        }
      });
    };

    // Execute all data fetching in parallel but handle completion properly
    const fetchAllData = async () => {
      try {
        await Promise.all([
          checkSubscriptionStatus(),
          fetchBillingInfo(),
          fetchPlanData(),
          fetchGatewayKey()
        ]);
        
        // Data loading complete
        if (isMounted.current) {
          setLoadingProgress(100);
        }
      } catch (error) {
        console.error('Error loading checkout data:', error);
        if (isMounted.current) {
          setLoadingProgress(100); // Set to 100% even on error to remove loading indicator
        }
      }
    };
    
    fetchAllData();
    
    // This effect should only run once per planId
  }, [planId, deduplicatedRequest]);

  // Add a cleanup function to ensure loading completes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loadingProgress < 100) {
        console.log('Safety timeout triggered - forcing loading completion');
        setLoadingProgress(100);
      }
    }, 8000); // 8 seconds max wait
    
    return () => clearTimeout(timer);
  }, [loadingProgress]);

  // Simplify Razorpay loading to prevent repeated script loading
  useEffect(() => {
    if (razorpayLoaded || document.getElementById('razorpay-script')) return;
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.id = 'razorpay-script';
    
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      setRazorpayLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Don't remove the script on unmount to prevent repeated loading
    };
  }, [razorpayLoaded]);

  // Effect to auto-advance to payment step if we have billing info
  // Fix dependency array to prevent infinite looping
  useEffect(() => {
    // Only auto-advance if not explicitly editing and we have billing info
    if (billingInfo && selectedPlan && currentStep === 'billing' && !showBillingReview && !isEditing) {
      console.log("Auto-advancing to billing review since we have billing info", { 
        billingInfo: !!billingInfo,
        selectedPlan: !!selectedPlan,
        currentStep,
        showBillingReview,
        isEditing
      });
      setShowBillingReview(true);
    }
  }, [currentStep, showBillingReview, billingInfo]);

  // Add a debug effect to log state changes for easier troubleshooting
  useEffect(() => {
    console.log("Checkout state updated", { 
      currentStep, 
      showBillingReview: showBillingReview,
      hasBillingInfo: !!billingInfo
    });
  }, [currentStep, showBillingReview, billingInfo]);

  // Pre-fetch payment intent and gateway key as soon as billing info is available
  useEffect(() => {
    if (billingInfo && planId && !paymentIntent) {
      initPaymentIntent();
    }
  }, [billingInfo, planId, paymentIntent]);

  // Add loading state specifically for payment details
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);

  const handleBillingDetailsSubmitted = (details: BillingDetails) => {
    // Reset editing flag after submission
    setIsEditing(false);
    setBillingInfo(details);
    setShowBillingReview(true);
    setCurrentStep('payment');
    initPaymentIntent();
  };

  const handleReviewBillingAndContinue = () => {
    setCurrentStep('payment');
    // Don't call initPaymentIntent here, it's now pre-fetched
  };

  const handleEditBillingDetails = () => {
    console.log("Edit billing details clicked");
    // Force re-render the form with existing details by incrementing the formKey
    setFormKey(prevKey => prevKey + 1);
    // Set editing flag to prevent auto-advancing
    setIsEditing(true);
    // Direct state changes to show the form instead of review
    setShowBillingReview(false);
    setCurrentStep('billing');
  };

  // Create payment intent after billing details are submitted or if they already exist
  const initPaymentIntent = useCallback(async () => {
    // Set payment loading state to true
    setPaymentDetailsLoading(true);
    setPaymentError('');

    try {
      if (!planId) return;
      
      // Create a payment details object with plan ID and always start immediately
      const paymentDetails = {
        planId,
        startImmediately: true, // Always start immediately for new subscriptions
        isSubscription: true    // Explicitly mark as subscription
      };
      
      console.log('Creating payment intent with details:', paymentDetails);
      const intent = await PaymentService.createPaymentIntent(paymentDetails);
      setPaymentIntent(intent);
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      
      // Extract detailed error message for user
      let errorMessage = "Couldn't initiate payment process";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific Razorpay errors
        if (error.message.includes('contact number') || error.message.includes('invalid_mobile_number')) {
          errorMessage = "Payment failed: Your phone number contains invalid characters. Please update your billing details with digits only and try again.";
        } else if (error.message.includes('customer')) {
          errorMessage = "Payment failed: There was an issue with your customer information. Please try again with different contact details.";
        }
      }
      
      setPaymentError(errorMessage);
      toast({
        title: "Payment processing error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Always set loading to false when done
      setPaymentDetailsLoading(false);
    }
  }, [planId, toast]);

  const handleBillingCancel = () => {
    // Reset editing flag
    setIsEditing(false);
    // Redirect logged-in users to dashboard, others to pricing page
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/pricing');
    }
  };

  // Get price display based on user region
  const getPriceDisplay = (plan: any) => {
    if (!plan) return 'Loading...';
    
    console.log("Checkout: Getting price display for plan:", plan.name, "User region:", userRegion);
    
    // For freemium plans
    if (plan.isFreemium || !plan.pricing || plan.pricing?.length === 0) {
      return 'Free';
    }
    
    // Check if the plan has displayPrice and displayCurrency fields from the server
    if (plan.displayPrice && plan.displayCurrency) {
      console.log("Checkout: Using display price from server:", plan.displayPrice, plan.displayCurrency);
      return formatRegionCurrency(parseFloat(plan.displayPrice), plan.displayCurrency);
    }
    
    // Try to get pricing for user's region first
    const regionPricing = plan.pricing?.find((p: any) => p.targetRegion === userRegion.region);
    if (regionPricing) {
      console.log("Checkout: Found pricing for user region:", userRegion.region, regionPricing);
      return formatRegionCurrency(parseFloat(regionPricing.price), regionPricing.currency);
    }
    
    // Fallback to global pricing
    const pricing = plan.pricing?.find((p: any) => p.targetRegion === 'GLOBAL');
    if (pricing) {
      console.log("Checkout: Using fallback global pricing:", pricing);
      return formatRegionCurrency(parseFloat(pricing.price), pricing.currency);
    }
    
    // Default fallback
    if (plan.name === 'Pro') {
      console.log("Checkout: Using hardcoded Pro plan pricing");
      return userRegion.region === 'INDIA' 
        ? formatRegionCurrency(1999, 'INR')
        : formatRegionCurrency(29.99, 'USD');
    }
    
    // Last resort fallback
    console.log("Checkout: Using last resort fallback pricing:", plan.price);
    return plan.price && plan.price !== '0.00' 
      ? formatRegionCurrency(parseFloat(plan.price), plan.currency || 'USD') 
      : 'Loading...';
  };

  // Handle payment success 
  const handlePaymentSuccess = (result: any) => {
    // Regular payment success for existing users
    setCurrentStep('confirmation');
    toast({
      title: "Payment successful",
      description: "Your subscription has been activated",
      variant: "default"
    });
  };

  const verifyPayment = (response: RazorpayResponse) => {
    setIsProcessing(true);
    
    console.log('Razorpay payment callback received:', JSON.stringify(response, null, 2));
    
    if (!planId) {
      setPaymentError('Missing plan information');
      setIsProcessing(false);
      return;
    }
    
    // Prepare verification data without upgrade flag
    const verificationData = {
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature,
      subscriptionId: response.razorpay_subscription_id,
      planId,
    };
    
    console.log('Verifying payment with data:', JSON.stringify(verificationData, null, 2));
    
    PaymentService.verifyPayment(verificationData)
      .then(result => {
        if (result.success) {
          handlePaymentSuccess(result);
        } else {
          setPaymentError(result.message || 'Payment verification failed');
          toast({
            title: "Payment verification failed",
            description: result.message || "Please contact support for assistance",
            variant: "destructive"
          });
        }
      })
      .catch(error => {
        console.error('Error in payment verification:', error);
        setPaymentError('Payment verification failed. Please contact support.');
        toast({
          title: "Error during verification",
          description: "There was a problem confirming your payment",
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  // Load Razorpay script when needed
  useEffect(() => {
    if (currentStep === 'payment' && paymentIntent && !useAlternativePayment) {
      const loadScript = async () => {
        if (typeof window !== 'undefined' && 'Razorpay' in window) {
          console.log('Razorpay already loaded');
          setRazorpayLoaded(true);
          return true;
        }
        
        // Wait for the Razorpay script to load (up to 5 seconds)
        let attempts = 0;
        const maxAttempts = 50;
        
        return new Promise<boolean>((resolve) => {
          const checkInterval = setInterval(() => {
            if (typeof window !== 'undefined' && 'Razorpay' in window) {
              clearInterval(checkInterval);
              setRazorpayLoaded(true);
              resolve(true);
            } else if (attempts++ >= maxAttempts) {
              clearInterval(checkInterval);
              resolve(false);
            }
          }, 100);
        });
      };
      
      loadScript();
    }
  }, [currentStep, paymentIntent]);

  const processPayment = async () => {
    if (!paymentIntent || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      if (useAlternativePayment && alternativePaymentUrl) {
        // Redirect to Razorpay hosted payment page
        window.location.href = alternativePaymentUrl;
        return;
      }
      
      if (!razorpayLoaded || !(typeof window !== 'undefined' && 'Razorpay' in window)) {
        throw new Error('Payment processor not loaded properly');
      }
      
      if (!gatewayKey?.publicKey) {
        throw new Error('Payment gateway configuration is missing');
      }
      
      // IMPORTANT: For Razorpay subscriptions, always use the provided amount from the server
      // Razorpay might show a smaller authentication amount ($0.50/₹1) but will later charge the full amount
      // This is standard Razorpay behavior for all subscription flows
      const paymentAmount = paymentIntent.amount;
      
      console.log('Payment amount being sent to Razorpay:', paymentAmount);
      console.log('Actual plan amount that will be charged after authentication:', 
                 paymentIntent.actualPlanAmount ? paymentIntent.actualPlanAmount : 'Not provided');
      console.log('Payment currency from intent:', paymentIntent.currency);
      console.log('User region from hook:', userRegion);
      
      // Clean up phone number if it looks encrypted
      let phoneNumber = billingInfo?.phoneNumber;
      if (phoneNumber && isLikelyEncrypted(phoneNumber)) {
        console.log('Detected encrypted phone number - clearing it');
        phoneNumber = undefined;
      } else if (phoneNumber && phoneNumber !== '' && !/^[0-9+]+$/.test(phoneNumber)) {
        console.log('Phone number contains invalid characters - clearing it');
        phoneNumber = undefined;
      }
      
      // Ensure currency consistency - if user is in India, use INR
      const currency = userRegion.region === 'INDIA' ? 'INR' : paymentIntent.currency;
      
      // Set up Razorpay options
      const options: RazorpayOptions = {
        key: gatewayKey.publicKey,
        amount: paymentAmount,
        currency: currency, // Use currency based on user region
        name: branding.appName,
        description: upgradeFlow 
          ? `New ${paymentIntent.planName} Plan Subscription` 
          : `${paymentIntent.planName} Plan Subscription`,
        subscription_id: paymentIntent.subscriptionId,
        image: '/logo.png',
        handler: verifyPayment,
        prefill: {
          name: user?.fullName || billingInfo?.fullName,
          email: user?.email,
          // Only provide contact if it's non-empty and contains valid characters (digits and + only)
          contact: phoneNumber
        },
        notes: {
          start_immediately: 'true',
          actual_plan_amount: paymentIntent.actualPlanAmount?.toString() || '',
          plan_name: paymentIntent.planName,
          user_region: userRegion.region // Add user region to payment notes
        },
        theme: {
          color: '#4f46e5' // Match your primary color
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };
      
      console.log('Razorpay options:', JSON.stringify(options, null, 2));
      console.log('Payment intent for debug:', JSON.stringify(paymentIntent, null, 2));
      
      // Initialize Razorpay
      if (typeof window !== 'undefined' && 'Razorpay' in window) {
        // @ts-ignore - Razorpay types require explicit constructor signature
        const razorpayInstance = new window.Razorpay(options);
        
        // Open payment modal
        razorpayInstance.open();
      } else {
        throw new Error('Razorpay not available');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Extract detailed error message from Razorpay error if available
      let errorMessage = 'Payment processing failed';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Look for Razorpay-specific error information in the message
        if (error.message.includes('Razorpay error')) {
          // Add more specific guidance for common errors
          if (error.message.includes('invalid_mobile_number') || 
              error.message.includes('contact number') || 
              error.message.includes('phone')) {
            errorMessage = 'Please check your phone number. It should only contain digits and optionally a + symbol.';
          } else if (error.message.includes('customer')) {
            errorMessage = 'There was an issue with your customer information. Please try again or use different contact details.';
          }
        }
      }
      
      setPaymentError(errorMessage);
      setIsProcessing(false);
      
      toast({
        title: "Payment processing failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Progress indicator for steps
  const renderStepProgress = () => {
    const steps = [
      { id: 'billing', label: 'Billing Details', icon: <Lock className="h-4 w-4" /> },
      { id: 'payment', label: 'Payment', icon: <CreditCard className="h-4 w-4" /> },
      { id: 'confirmation', label: 'Confirmation', icon: <CheckCircle className="h-4 w-4" /> }
    ];
    
    return (
      <div className="flex items-center justify-between w-full mb-6">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          
          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                  isCompleted ? 'bg-green-500' : isActive ? 'bg-primary' : 'bg-gray-200'
                } text-white mb-1`}>
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : step.icon}
                </div>
                <span className={`text-xs ${isActive ? 'font-medium text-primary' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Helper function to get the appropriate locale based on currency
  const getCurrencyLocale = (currency: string): string => {
    switch (currency) {
      case 'INR':
        return 'en-IN';
      case 'USD':
        return 'en-US';
      default:
        return 'en-US';
    }
  };

  // Now, in the displayRegularSubscription function, let's fix any types and make sure we properly format amounts
  const displayRegularSubscription = () => {
    if (!selectedPlan || !paymentIntent) return null;
    
    // Format amount for display including currency
    const formattedPrice = new Intl.NumberFormat(getCurrencyLocale(paymentIntent.currency), {
      style: 'currency',
      currency: paymentIntent.currency,
    }).format(paymentIntent.amount);
    
    // Format subtotal if available
    const formattedSubtotal = paymentIntent.subtotal ? 
      new Intl.NumberFormat(getCurrencyLocale(paymentIntent.currency), {
        style: 'currency',
        currency: paymentIntent.currency,
      }).format(paymentIntent.subtotal) : formattedPrice;
    
    // Check if we have tax details
    const hasTax = paymentIntent.taxDetails && 
                  paymentIntent.taxDetails.taxAmount > 0;
                  
    const taxAmount = hasTax && paymentIntent.taxDetails ? 
      new Intl.NumberFormat(getCurrencyLocale(paymentIntent.currency), {
        style: 'currency',
        currency: paymentIntent.currency,
      }).format(paymentIntent.taxDetails.taxAmount) : null;
      
    const taxPercentage = hasTax && paymentIntent.taxDetails ? 
      paymentIntent.taxDetails.taxPercentage : null;
    
    // Get billing cycle text
    const billingCycleText = paymentIntent.billingCycle === 'MONTHLY' ? '/month' : '/year';
    
    const isTaxIncluded = paymentIntent.currency === 'INR';

    return (
      <div className="bg-white rounded-lg shadow-sm border p-5 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col space-y-3">
          <h3 className="text-lg font-semibold">{selectedPlan.name}</h3>
          <p className="text-gray-500 text-sm dark:text-gray-400">{selectedPlan.description}</p>
          
          <div className="py-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Subscription</span>
              <span className="font-semibold">{formattedSubtotal}{billingCycleText}</span>
            </div>
            
            {hasTax && taxAmount && (
              <div className="flex justify-between mt-1">
                <span className="text-gray-600 dark:text-gray-300">
                  {isTaxIncluded ? `GST (${taxPercentage}%, included)` : `Tax (${taxPercentage}%)`}
                </span>
                <span>{taxAmount}</span>
              </div>
            )}
            
            <div className="flex justify-between mt-2 pt-2 border-t">
              <span className="font-medium">Total</span>
              <span className="font-bold">{formattedPrice}{billingCycleText}</span>
            </div>
            
            {isTaxIncluded && (
              <div className="mt-2 text-xs text-amber-600">
                Price is inclusive of GST as per Indian tax regulations.
              </div>
            )}
            
            {hasTax && paymentIntent.taxDetails?.taxBreakdown && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {isTaxIncluded ? 'GST breakdown (included in price):' : 'Tax breakdown:'}
                </p>
                {paymentIntent.taxDetails.taxBreakdown.map((tax, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{tax.name} ({tax.percentage}%{isTaxIncluded ? ', included' : ''})</span>
                    <span>
                      {new Intl.NumberFormat(getCurrencyLocale(paymentIntent.currency), {
                        style: 'currency',
                        currency: paymentIntent.currency,
                      }).format(tax.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add this function to correctly display prorated amounts
  const displayProrationDetails = () => {
    if (!paymentIntent) {
      return null;
    }

    console.log('Payment Intent in displayProrationDetails:', paymentIntent);
    console.log('Proration Amount from URL:', prorationAmount);

    // For future subscriptions, show both the token amount and the future amount
    if (paymentIntent.isFutureSubscription) {
      // Format the actual plan amount
      const actualPlanAmount = paymentIntent.actualPlanAmount ? 
        (paymentIntent.currency === 'INR' ? paymentIntent.actualPlanAmount / 100 : paymentIntent.actualPlanAmount / 100) : 0;
      
      // Format the token amount (authentication amount)
      const tokenAmount = paymentIntent.currency === 'INR' ? paymentIntent.amount / 100 : paymentIntent.amount;
      
      // Format the future date
      const futureDate = paymentIntent.futurePaymentDate ? 
        new Date(paymentIntent.futurePaymentDate).toLocaleDateString() : 'a future date';
      
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <div>
              <span className="font-medium text-gray-800">{selectedPlan?.name} Plan</span>
              <p className="text-xs text-gray-500">Starting on {futureDate}</p>
            </div>
            <span className="font-semibold text-lg">{formatCurrency(actualPlanAmount, paymentIntent.currency)}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg border border-amber-200 bg-amber-50">
            <div>
              <span className="font-medium text-amber-800">Verification Charge</span>
              <p className="text-xs text-amber-700">For future subscription</p>
            </div>
            <span className="font-medium text-amber-800">{formatCurrency(tokenAmount, paymentIntent.currency)}</span>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Future Subscription Information</p>
                <p className="text-sm text-blue-700 mt-1">
                  A small verification charge of {formatCurrency(tokenAmount, paymentIntent.currency)} will be made to verify your payment method. 
                  Your subscription for {formatCurrency(actualPlanAmount, paymentIntent.currency)} will 
                  begin on {futureDate}.
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold text-lg">
            <span>Today's Charge</span>
            <span>{formatCurrency(tokenAmount, paymentIntent.currency)}</span>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Future recurring payment: {formatCurrency(actualPlanAmount, paymentIntent.currency)} {paymentIntent.billingCycle === 'YEARLY' ? 'per year' : 'per month'}</span>
          </div>
        </div>
      );
    }

          // For upgrade flow, use our updated display without proration credits
      if (actuallyIsUpgrade && upgradeFlow) {
      // For INR, Razorpay amounts are in paisa (1/100 of a rupee)
      // The paymentIntent.amount is always in the smallest currency unit (paisa for INR)
      const fullPlanAmount = paymentIntent.actualPlanAmount
        ? (paymentIntent.currency === 'INR' 
            ? paymentIntent.actualPlanAmount / 100 
            : paymentIntent.actualPlanAmount / 100)
        : (paymentIntent.currency === 'INR' 
            ? paymentIntent.amount / 100
            : paymentIntent.amount);
      
      // The amount to pay is now always the full plan price (no proration credits)
      const amountToPay = fullPlanAmount;
      
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <div>
              <span className="font-medium text-gray-800">{selectedPlan?.name} Plan</span>
              <p className="text-xs text-gray-500">New subscription</p>
            </div>
            <span className="font-semibold text-lg">{formatCurrency(fullPlanAmount, paymentIntent.currency)}</span>
          </div>
          
          {actuallyIsUpgrade && upgradeFlow ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">About your plan change</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your current subscription will be cancelled and a new subscription will begin immediately.
                    You will be charged the full price of the new plan.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">New Subscription</p>
                  <p className="text-sm text-blue-700 mt-1">
                    You are subscribing to the {selectedPlan?.name} plan. You will be charged immediately.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(amountToPay, paymentIntent.currency)}</span>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <CreditCard className="h-4 w-4" />
            <span>
              {`You'll be charged ${paymentIntent.billingCycle === 'YEARLY' ? 'annually' : 'monthly'} for your new subscription`}
            </span>
          </div>
        </div>
      );
    }

    // For new subscriptions, use our specialized display
    return displayRegularSubscription();
  };

  // Add a component to display pending downgrade information
  const PendingDowngradeInfo = ({ subscription, effectiveDate }: { subscription: any; effectiveDate: string }) => {
    if (!subscription?.pendingPlanChangeTo || subscription?.pendingPlanChangeType !== 'DOWNGRADE') {
      return null;
    }
    
    const formattedDate = new Date(effectiveDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return (
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-700">Pending Plan Change</AlertTitle>
        <AlertDescription className="text-blue-600">
          Your subscription will be downgraded at the end of your current billing period ({formattedDate}).
          Until then, you'll continue to have access to all features of your current plan.
        </AlertDescription>
      </Alert>
    );
  };
  
  // Check for pending downgrade when component mounts
  useEffect(() => {
    const checkPendingChanges = async () => {
      if (!user) return;
      
      try {
        const response = await axios.get('/api/user/subscription/pending-change');
        if (response.data?.hasPendingChange && response.data?.subscription?.pendingPlanChangeType === 'DOWNGRADE') {
          // Show some UI for the pending downgrade if needed
          console.log('User has a pending downgrade scheduled:', response.data);
        }
      } catch (error) {
        console.error('Error checking for pending subscription changes:', error);
      }
    };
    
    checkPendingChanges();
  }, [user]);

  return (
    <DefaultLayout pageTitle="Checkout">
      <div className="container py-8 max-w-7xl">
        {/* Simple loading indicator */}
        {loadingProgress < 100 && (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-3">Loading checkout...</span>
          </div>
        )}
        
        {loadingProgress === 100 && (
          <>
            {/* Show region indicator */}
            {userRegion.region === 'INDIA' && (
              <div className="text-center mb-4 text-sm text-gray-500">
                Showing prices for India (INR)
              </div>
            )}
            
            {/* Checkout Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-medium">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-gray-900">Account Details</span>
                </div>
                <div className="flex-grow mx-4 h-px bg-gray-200"></div>
                {currentStep === 'billing' ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-medium">2</div>
                    <span className="font-medium text-gray-900">Billing Information</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white font-medium">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-900">Billing Information</span>
                  </div>
                )}
                <div className="flex-grow mx-4 h-px bg-gray-200"></div>
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 'payment' ? 'bg-indigo-600' : 'bg-gray-300'} text-white font-medium`}>
                    3
                  </div>
                  <span className={`font-medium ${currentStep === 'payment' ? 'text-gray-900' : 'text-gray-500'}`}>Payment</span>
                </div>
              </div>
              <Progress value={currentStep === 'billing' ? 65 : 95} className="h-2 bg-indigo-100" />
            </div>
            
            {/* Modern Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
              {/* Left Column - Billing Info */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b">
                    <h2 className="text-lg font-medium">Billing Information</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {currentStep === 'billing' ? 'Please enter your billing details' : 'Your billing details'}
                    </p>
                  </div>
                  
                  <div className="p-4">
                    {currentStep === 'billing' && (
                      <>
                        {showBillingReview && billingInfo ? (
                          <BillingReview 
                            billingInfo={billingInfo}
                            handleReviewBillingAndContinue={handleReviewBillingAndContinue}
                            handleEditBillingDetails={handleEditBillingDetails}
                            user={user}
                          />
                        ) : (
                          <div className="billing-form-container" key={`form-container-${formKey}`}>
                            <BillingDetailsForm
                              existingDetails={billingInfo}
                              onDetailsSubmitted={handleBillingDetailsSubmitted}
                              onCancel={handleBillingCancel}
                              key={`billing-form-${formKey}`}
                            />
                          </div>
                        )}
                      </>
                    )}
                    
                    {currentStep !== 'billing' && billingInfo && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-500 text-sm mb-1">Name</p>
                          <p className="font-medium">{billingInfo.fullName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">Email</p>
                          <p className="font-medium">{user?.email || billingInfo.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">Phone</p>
                          <p className="font-medium">{!billingInfo.phoneNumber || billingInfo.phoneNumber === '' ? "Not provided" : billingInfo.phoneNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">Country</p>
                          <p className="font-medium">{billingInfo.country ? Country.getCountryByCode(billingInfo.country)?.name || billingInfo.country : ''}</p>
                        </div>
                        {billingInfo.addressLine1 && (
                          <div>
                            <p className="text-gray-500 text-sm mb-1">Address</p>
                            <p className="font-medium">{billingInfo.addressLine1}</p>
                            {billingInfo.addressLine2 && (
                              <p className="font-medium">{billingInfo.addressLine2}</p>
                            )}
                            <p className="font-medium">
                              {[billingInfo.city, billingInfo.state && billingInfo.country ? State.getStateByCodeAndCountry(billingInfo.state, billingInfo.country)?.name || billingInfo.state : billingInfo.state, billingInfo.postalCode].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                        <div className="pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              // Force form re-render by incrementing the formKey
                              setFormKey(prevKey => prevKey + 1);
                              // Set editing flag to prevent auto-advancing
                              setIsEditing(true);
                              // Reset states to show the form
                              setShowBillingReview(false);
                              setCurrentStep('billing');
                              console.log("Edit billing details clicked from payment step");
                            }}
                            className="text-primary text-xs flex items-center"
                          >
                            <span className="mr-1">Edit Details</span>
                            <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                            </svg>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Security & Trust Indicators */}
                {currentStep === 'payment' && (
                  <div className="mt-6 bg-white rounded-lg p-4 border shadow-sm">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">Secure Checkout</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Your information is securely processed and encrypted.
                        We do not store your credit card details.
                      </p>
                      <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        <span className="text-xs">256-bit SSL</span>
                        <Lock className="h-4 w-4 text-green-600" />
                        <span className="text-xs">PCI Compliant</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right Column - Payment Info */}
              <div className="lg:col-span-3">
                {currentStep === 'billing' ? (
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b">
                      <h2 className="text-lg font-medium">Order Summary</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Review your subscription details
                      </p>
                    </div>
                    
                    <div className="p-4">
                      {selectedPlan && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 rounded-md bg-gray-50">
                            <div>
                              <h3 className="font-medium">{selectedPlan.name} Plan</h3>
                              <p className="text-sm text-gray-600">{selectedPlan.description || 'Monthly subscription'}</p>
                            </div>
                            <div className="text-lg font-semibold">
                              {selectedPlan.price !== undefined && selectedPlan.price > 0 ? 
                                formatCurrency(selectedPlan.price, selectedPlan.currency || 'USD') : 
                                getPriceDisplay(selectedPlan)}
                            </div>
                          </div>
                          
                          <div className="pt-4">
                            <h4 className="text-sm font-medium mb-2">Plan Features:</h4>
                            {selectedPlan.features && selectedPlan.features.length > 0 ? (
                              <ul className="space-y-2">
                                {selectedPlan.features.map((feature: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 text-green-600 flex-shrink-0 mt-0.5">
                                      <path d="M7.49991 0.877045C3.84222 0.877045 0.877075 3.84219 0.877075 7.49988C0.877075 11.1575 3.84222 14.1227 7.49991 14.1227C11.1576 14.1227 14.1227 11.1575 14.1227 7.49988C14.1227 3.84219 11.1576 0.877045 7.49991 0.877045ZM1.82708 7.49988C1.82708 4.36686 4.36689 1.82704 7.49991 1.82704C10.6329 1.82704 13.1727 4.36686 13.1727 7.49988C13.1727 10.6329 10.6329 13.1727 7.49991 13.1727C4.36689 13.1727 1.82708 10.6329 1.82708 7.49988ZM10.1589 5.53774C10.3178 5.31191 10.2636 5.00001 10.0378 4.84109C9.81194 4.68217 9.50004 4.73642 9.34113 4.96225L6.51977 8.97154L5.35681 7.78706C5.16334 7.59002 4.84677 7.58711 4.64973 7.78058C4.45268 7.97404 4.44978 8.29061 4.64325 8.48765L6.22658 10.1003C6.33054 10.2062 6.47617 10.2604 6.62407 10.2483C6.77197 10.2363 6.90686 10.1591 6.99226 10.0377L10.1589 5.53774Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="text-sm">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : featuresLoading ? (
                              <div className="text-sm text-gray-500 p-2 border border-gray-200 rounded-md bg-gray-50">
                                <div className="flex justify-center mb-2">
                                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                                Loading features information...
                              </div>
                            ) : featuresError ? (
                              <div className="text-sm text-red-500 p-2 border border-red-200 rounded-md bg-red-50">
                                {featuresError}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 p-2 border border-gray-200 rounded-md bg-gray-50">
                                No features found for this plan.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : currentStep === 'payment' ? (
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b">
                      <h2 className="text-lg font-medium">Payment Details</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {actuallyIsUpgrade && upgradeFlow
                            ? `Upgrade to ${selectedPlan?.name} plan subscription` 
                            : `Subscribe to ${selectedPlan?.name} plan`}
                      </p>
                    </div>
                    
                    <div className="p-4">
                      {paymentError && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Payment Error</AlertTitle>
                          <AlertDescription>
                            {paymentError}
                            {paymentError.includes('phone number') && (
                              <div className="mt-2 text-sm bg-amber-50 border border-amber-200 p-2 rounded">
                                <strong>Tip:</strong> Razorpay requires phone numbers to contain only digits and the + symbol.
                                Please update your billing details and try again.
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {paymentDetailsLoading ? (
                        <div className="py-8 flex flex-col items-center justify-center space-y-4">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <p className="text-sm text-gray-600">Initializing payment...</p>
                          <p className="text-xs text-gray-500">This may take a few moments</p>
                        </div>
                      ) : paymentIntent ? (
                        <div className="space-y-6">
                          {/* Order Summary */}
                          <div className="rounded-md">
                            <h3 className="font-medium text-base mb-3">Order Summary</h3>
                            {displayProrationDetails()}
                          </div>
                          
                          <div className="pt-2">
                            {/* Payment Button */}
                            <Button 
                              className="w-full h-12 text-base" 
                              onClick={processPayment}
                              disabled={isProcessing || !paymentIntent || !gatewayKey}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <DollarSign className="mr-2 h-5 w-5" />
                                  {actuallyIsUpgrade === true
                                    ? `Pay for Upgrade ${formatCurrency(
                                        (paymentIntent.actualPlanAmount && paymentIntent.actualPlanAmount > 0)
                                          ? paymentIntent.actualPlanAmount / 100
                                          : paymentIntent.amount, 
                                        paymentIntent.currency
                                      )}`
                                    : `Subscribe for ${formatCurrency(
                                        (paymentIntent.amount),
                                        paymentIntent.currency
                                      )}${paymentIntent.currency === 'INR' ? ' (GST incl.)' : ''}`
                                  }
                                </>
                              )}
                            </Button>
                            
                            {!actuallyIsUpgrade && paymentIntent.actualPlanAmount && (
                              <div className="text-center text-xs text-gray-500 mt-2">
                                <p>You will be charged {formatCurrency(paymentIntent.actualPlanAmount / 100, paymentIntent.currency)} for your subscription.</p>
                              </div>
                            )}
                            
                            <Button 
                              variant="outline"
                              className="w-full mt-3" 
                              onClick={() => {
                                // Go to dashboard or pricing based on login status
                                user ? navigate('/dashboard') : navigate('/pricing');
                              }}
                              disabled={isProcessing}
                            >
                              Cancel
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-center pt-4">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <ShieldCheck className="h-5 w-5 text-green-500" />
                                <span>Secure payment powered by Razorpay</span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <Lock className="h-4 w-4" />
                                <span>Your payment information is encrypted with industry-standard security</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 flex flex-col items-center justify-center space-y-4">
                          <AlertCircle className="h-10 w-10 text-amber-500" />
                          <p className="text-sm text-gray-600">Unable to initialize payment</p>
                          <p className="text-xs text-gray-500">Please try refreshing the page</p>
                          <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => window.location.reload()}
                          >
                            Refresh Page
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b">
                      <h2 className="text-lg font-medium">
                        Subscription Confirmation
                      </h2>
                    </div>
                    
                    <div className="p-8">
                      <div className="flex flex-col items-center justify-center py-6 space-y-6">
                        <div className="rounded-full p-5 bg-green-100">
                          <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-semibold text-center">
                          {actuallyIsUpgrade === true 
                            ? "Upgrade Successful!" 
                            : "Thank You For Your Purchase!"}
                        </h3>
                        <p className="text-center text-gray-600 max-w-md">
                          {actuallyIsUpgrade === true
                            ? `Your subscription has been successfully upgraded. You now have immediate access to all the new features of your ${branding.appName} plan.` 
                            : `Your subscription has been successfully activated. You now have full access to all the features of your ${branding.appName} plan.`}
                        </p>
                        <Button 
                          className="mt-6" 
                          onClick={() => navigate('/dashboard')}
                        >
                          Go to Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DefaultLayout>
  );
}
