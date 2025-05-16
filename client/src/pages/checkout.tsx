import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import DefaultLayout from '@/components/layouts/default-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Loader2, ShieldCheck, DollarSign, Lock, CreditCard, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PaymentService, PaymentIntent, BillingDetails, GatewayKeyResponse } from '@/services/payment-service';
import BillingDetailsForm from "@/components/checkout/billing-details-form";
import axios from 'axios';
import Image from 'next/image';

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

export default function CheckoutPage() {
  const [location, navigate] = useLocation();
  const { planId, prorationAmount, upgradeFlow } = getParamsFromLocation();
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

  // Effect to check if plan ID is provided
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

    // Initialize loading sequence
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [planId, toast, navigate]);

  // Effect to fetch necessary data when component mounts
  useEffect(() => {
    if (!planId) return;

    const fetchBillingInfo = async () => {
      try {
        const billing = await PaymentService.getBillingDetails();
        if (billing) {
          setBillingInfo(billing);
          // If we have billing info and plan data, advance to payment step
          if (selectedPlan) {
            setCurrentStep('payment');
          }
        }
      } catch (error) {
        console.error('Error fetching billing details:', error);
        // Don't show error toast as this might be a first-time user
      }
    };

    const fetchPlanData = async () => {
      try {
        const response = await axios.get(`/api/public/subscription-plans/${planId}`);
        const planData = response.data;
        setSelectedPlan(planData);
        
        // Fetch features after getting the plan
        try {
          const featuresResponse = await axios.get('/api/public/plan-features');
          const data = featuresResponse.data;
          
          // Transform the data into a map by planId for easier lookup
          const featuresByPlan: { [key: number]: any[] } = {};
          // Check if data is an array or nested
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
            console.log(`Found ${featuresByPlan[planId].length} features for plan ${planId}`);
            const planWithFeatures = { 
              ...planData,
              features: featuresByPlan[planId].map(f => f.featureName || f.name)
            };
            setSelectedPlan(planWithFeatures);
          }
        } catch (featuresError) {
          console.error('Error fetching plan features:', featuresError);
          // Don't show error toast as this is not critical
        }
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

    const fetchGatewayKey = async () => {
      try {
        const key = await PaymentService.getGatewayKey();
        setGatewayKey(key);
      } catch (error) {
        console.error('Error fetching gateway key:', error);
        toast({
          title: "Payment system unavailable",
          description: "Please try again later or contact support.",
          variant: "destructive"
        });
      }
    };

    // Run all fetches in parallel
    fetchBillingInfo();
    fetchPlanData(); // Will fetch features internally
    fetchGatewayKey();
  }, [planId, navigate, toast]);

  // Effect to auto-advance to payment step if we have billing info
  useEffect(() => {
    if (billingInfo && selectedPlan && currentStep === 'billing') {
      // Instead of auto-advancing, we'll show the review screen
      setShowBillingReview(true);
    }
  }, [billingInfo, selectedPlan]);

  const handleBillingDetailsSubmitted = (details: BillingDetails) => {
    setBillingInfo(details);
    setCurrentStep('payment');
    initPaymentIntent();
  };

  const handleReviewBillingAndContinue = () => {
    setCurrentStep('payment');
    initPaymentIntent();
  };

  const handleEditBillingDetails = () => {
    setShowBillingReview(false);
  };

  // Create payment intent after billing details are submitted or if they already exist
  const initPaymentIntent = async () => {
    try {
      if (!planId) return;
      
      // Create a payment details object with plan ID and always start immediately
      const paymentDetails = {
        planId,
        startImmediately: true // Always start immediately for new subscriptions
      };
      
      console.log('Creating payment intent with details:', paymentDetails);
      const intent = await PaymentService.createPaymentIntent(paymentDetails);
      setPaymentIntent(intent);
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Payment processing error",
        description: error instanceof Error ? error.message : "Couldn't initiate payment process",
        variant: "destructive"
      });
    }
  };

  const handleBillingCancel = () => {
    // Redirect logged-in users to dashboard, others to pricing page
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/pricing');
    }
  };

  // Get price display based on selected plan
  const getPriceDisplay = (plan: any) => {
    if (!plan) return 'Loading...';
    
    // For freemium plans
    if (plan.isFreemium || !plan.pricing || plan.pricing?.length === 0) {
      return 'Free';
    }
    
    // Check if the plan has displayPrice and displayCurrency fields from the server
    if (plan.displayPrice && plan.displayCurrency) {
      return formatCurrency(parseFloat(plan.displayPrice), plan.displayCurrency);
    }
    
    // Fallback to default pricing
    const pricing = plan.pricing?.find((p: any) => p.targetRegion === 'GLOBAL');
    if (pricing) {
      return formatCurrency(parseFloat(pricing.price), pricing.currency);
    }
    
    // Default fallback
    if (plan.name === 'Pro') {
      return formatCurrency(29.99, 'USD');
    }
    
    // Last resort fallback
    return plan.price && plan.price !== '0.00' 
      ? formatCurrency(parseFloat(plan.price), plan.currency || 'USD') 
      : 'Loading...';
  };

  // Load Razorpay script as soon as the component mounts
  useEffect(() => {
    if (!razorpayLoaded) {
      const loadScript = async () => {
        try {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          
          const loadPromise = new Promise<boolean>((resolve) => {
            script.onload = () => {
              console.log('Razorpay script loaded successfully');
              setRazorpayLoaded(true);
              resolve(true);
            };
            script.onerror = () => {
              console.error('Failed to load Razorpay script on first attempt');
              resolve(false);
            };
          });
          
          document.body.appendChild(script);
          
          // Wait for script to load
          const loaded = await loadPromise;
          
          // If script failed to load, try once more after a short delay
          if (!loaded) {
            setTimeout(async () => {
              console.log('Retrying Razorpay script load...');
              const retryScript = document.createElement('script');
              retryScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
              retryScript.async = true;
              
              retryScript.onload = () => {
                console.log('Razorpay script loaded successfully on retry');
                setRazorpayLoaded(true);
              };
              
              document.body.appendChild(retryScript);
            }, 1000);
          }
        } catch (error) {
          console.error('Error loading Razorpay script:', error);
        }
      };
      
      loadScript();
    }
  }, [razorpayLoaded]);

  // Existing loadRazorpayScript function can be simplified since we're loading earlier
  const loadRazorpayScript = (): Promise<boolean> => {
    if (razorpayLoaded) return Promise.resolve(true);
    
    // If it's not loaded yet, wait a bit and check again
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (razorpayLoaded || (window as any).Razorpay) {
          clearInterval(checkInterval);
          setRazorpayLoaded(true);
          resolve(true);
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 5000);
    });
  };

  const verifyPayment = (response: RazorpayResponse) => {
    setIsProcessing(true);
    
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
    
    console.log('Verifying payment with data:', verificationData);
    
    PaymentService.verifyPayment(verificationData)
      .then(result => {
        if (result.success) {
          setCurrentStep('confirmation');
          toast({
            title: "Payment successful",
            description: "Your subscription has been activated",
            variant: "default"
          });
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

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    // For INR, check if we need to convert from smallest unit
    if (currencyCode === 'INR' && amount > 10000 && amount % 1 === 0) {
      // This looks like it might be in paisa - convert to rupees
      console.log(`Converting amount from paisa to rupees: ${amount} paisa -> ${amount/100} INR`);
      amount = amount / 100;
    }
    
    // For USD, check if we need to convert from cents
    if (currencyCode === 'USD' && amount > 1000 && amount % 1 === 0) {
      // This looks like it might be in cents - convert to dollars
      console.log(`Converting amount from cents to dollars: ${amount} cents -> ${amount/100} USD`);
      amount = amount / 100;
    }
    
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
  };

  // Load Razorpay script when needed
  useEffect(() => {
    if (currentStep === 'payment' && paymentIntent && !useAlternativePayment) {
      const loadScript = async () => {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          console.log('Razorpay script failed to load, trying alternative payment method');
          try {
            if (!planId) return;
            const { paymentUrl } = await PaymentService.getAlternativePaymentUrl(planId);
            if (paymentUrl) {
              setAlternativePaymentUrl(paymentUrl);
              setUseAlternativePayment(true);
            } else {
              setPaymentError('Payment processing is currently unavailable. Please try again later.');
            }
          } catch (altError) {
            console.error('Failed to get alternative payment URL:', altError);
            setPaymentError('Payment processing is currently unavailable. Please try again later.');
          }
        }
      };
      
      loadScript();
    }
  }, [currentStep, paymentIntent, planId]);

  const processPayment = async () => {
    if (!paymentIntent || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      if (useAlternativePayment && alternativePaymentUrl) {
        // Redirect to Razorpay hosted payment page
        window.location.href = alternativePaymentUrl;
        return;
      }
      
      if (!razorpayLoaded || !(window as any).Razorpay) {
        throw new Error('Payment processor not loaded properly');
      }
      
      if (!gatewayKey?.publicKey) {
        throw new Error('Payment gateway configuration is missing');
      }
      
      // IMPORTANT: For Razorpay subscriptions, always use the provided amount from the server
      // Razorpay might show a smaller authentication amount ($0.50/₹1) but will later charge the full amount
      // This is standard Razorpay behavior for all subscription flows
      const paymentAmount = 
        // Use the amount provided by the server
        paymentIntent.amount;
      
      console.log('Payment amount being sent to Razorpay:', paymentAmount);
      console.log('Actual plan amount that will be charged after authentication:', 
                 paymentIntent.actualPlanAmount ? paymentIntent.actualPlanAmount : 'Not provided');
      
      // Set up Razorpay options
      const options: RazorpayOptions = {
        key: gatewayKey.publicKey,
        amount: paymentAmount,
        currency: paymentIntent.currency,
        name: 'ATScribe',
        description: upgradeFlow 
          ? `New ${paymentIntent.planName} Plan Subscription` 
          : `${paymentIntent.planName} Plan Subscription`,
        subscription_id: paymentIntent.subscriptionId,
        image: '/logo.png',
        handler: verifyPayment,
        prefill: {
          name: user?.fullName || billingInfo?.fullName,
          email: user?.email,
          contact: billingInfo?.phoneNumber
        },
        notes: {
          start_immediately: 'true',
          actual_plan_amount: paymentIntent.actualPlanAmount?.toString() || '',
          plan_name: paymentIntent.planName
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
      
      // Initialize Razorpay
      // @ts-ignore - Razorpay types require explicit constructor signature
      const razorpayInstance = new (window as any).Razorpay(options);
      
      // Open payment modal
      razorpayInstance.open();
    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment processing failed');
      setIsProcessing(false);
      
      toast({
        title: "Payment processing failed",
        description: error instanceof Error ? error.message : "Please try again or contact support",
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

  // For regular new subscriptions
  const displayRegularSubscription = () => {
    if (!paymentIntent) return null;

    // Get authentication amount (shown by Razorpay)
    const authAmount = paymentIntent.currency === 'INR' 
      ? paymentIntent.amount / 100 
      : paymentIntent.amount;
    
    // Get actual plan amount (charged after authentication)
    const fullPlanAmount = paymentIntent.actualPlanAmount 
      ? (paymentIntent.currency === 'INR' ? paymentIntent.actualPlanAmount / 100 : paymentIntent.actualPlanAmount / 100)
      : authAmount;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
          <div>
            <span className="font-medium text-gray-800">{selectedPlan?.name} Plan</span>
            <p className="text-xs text-gray-500">{selectedPlan?.description || `${paymentIntent.billingCycle.toLowerCase()} billing`}</p>
          </div>
          <span className="font-semibold text-lg">{formatCurrency(fullPlanAmount, paymentIntent.currency)}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{formatCurrency(fullPlanAmount, paymentIntent.currency)}</span>
        </div>
        
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-2">
          <CreditCard className="h-4 w-4" />
          <span>{`You'll be charged ${paymentIntent.billingCycle === 'YEARLY' ? 'annually' : 'monthly'}`}</span>
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
    if (actuallyIsUpgrade || (actuallyIsUpgrade === undefined && upgradeFlow)) {
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
        <Progress value={loadingProgress} className="mb-6" />
        
        {/* Step Progress Indicator */}
        {renderStepProgress()}
        
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
                {currentStep === 'billing' ? (
                  <>
                    {showBillingReview && billingInfo ? (
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
                            <p className="font-medium">{billingInfo.country}</p>
                          </div>
                          {billingInfo.addressLine1 && (
                            <div>
                              <p className="text-gray-500 text-sm mb-1">Address</p>
                              <p className="font-medium">{billingInfo.addressLine1}</p>
                              {billingInfo.addressLine2 && (
                                <p className="font-medium">{billingInfo.addressLine2}</p>
                              )}
                              <p className="font-medium">
                                {[billingInfo.city, billingInfo.state, billingInfo.postalCode].filter(Boolean).join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button onClick={handleReviewBillingAndContinue} className="flex-1">
                            Continue
                          </Button>
                          <Button variant="outline" onClick={handleEditBillingDetails}>
                            Edit Details
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <BillingDetailsForm
                        existingDetails={billingInfo}
                        onDetailsSubmitted={handleBillingDetailsSubmitted}
                        onCancel={handleBillingCancel}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {billingInfo && (
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
                          <p className="font-medium">{billingInfo.country}</p>
                        </div>
                        {billingInfo.addressLine1 && (
                          <div>
                            <p className="text-gray-500 text-sm mb-1">Address</p>
                            <p className="font-medium">{billingInfo.addressLine1}</p>
                            {billingInfo.addressLine2 && (
                              <p className="font-medium">{billingInfo.addressLine2}</p>
                            )}
                            <p className="font-medium">
                              {[billingInfo.city, billingInfo.state, billingInfo.postalCode].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                        <div className="pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setCurrentStep('billing')}
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
                  </>
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
                        ) : (
                          <div className="text-sm text-gray-500 p-2 border border-gray-200 rounded-md bg-gray-50">
                            <div className="flex justify-center mb-2">
                              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                            Loading features information...
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
                    {actuallyIsUpgrade !== undefined ? 
                      (actuallyIsUpgrade ? 
                        `Upgrade to ${selectedPlan?.name} plan subscription` :
                        `Subscribe to ${selectedPlan?.name} plan`) :
                      (upgradeFlow ? 
                        `Upgrade to ${selectedPlan?.name} plan subscription` :
                        `Subscribe to ${selectedPlan?.name} plan`)
                    }
                  </p>
                </div>
                
                <div className="p-4">
                  {paymentError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Payment Error</AlertTitle>
                      <AlertDescription>
                        {paymentError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {paymentIntent && (
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
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <DollarSign className="mr-2 h-5 w-5" />
                              {actuallyIsUpgrade !== undefined && !actuallyIsUpgrade
                                ? `Subscribe for ${formatCurrency(
                                  paymentIntent.actualPlanAmount 
                                    ? paymentIntent.actualPlanAmount / 100
                                    : paymentIntent.amount, 
                                  paymentIntent.currency
                                )}`
                                : `Pay Now ${formatCurrency(
                                  prorationAmount !== undefined 
                                    ? prorationAmount // Already in full currency units from URL
                                    : (paymentIntent.actualPlanAmount
                                      ? paymentIntent.actualPlanAmount / 100 // Convert from smallest unit to full unit
                                      : (paymentIntent.currency === 'INR'
                                        ? paymentIntent.amount / 100 // Convert paisa to rupees
                                        : paymentIntent.amount)), // Keep as is for other currencies
                                  paymentIntent.currency
                                )}`
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
                          onClick={() => user ? navigate('/dashboard') : navigate('/pricing')}
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-center pt-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                          <span>Secure payment powered by Razorpay</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <h2 className="text-lg font-medium">Subscription Confirmation</h2>
                </div>
                
                <div className="p-8">
                  <div className="flex flex-col items-center justify-center py-6 space-y-6">
                    <div className="rounded-full p-5 bg-green-100">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-center">Thank You For Your Purchase!</h3>
                    <p className="text-center text-gray-600 max-w-md">
                      Your subscription has been successfully activated.
                      You now have full access to all the features of your plan.
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
      </div>
    </DefaultLayout>
  );
}
