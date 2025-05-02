import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import DefaultLayout from '@/components/layouts/default-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Loader2, ShieldCheck, DollarSign, Lock, CreditCard } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { PaymentService, BillingDetails } from '@/services/payment-service';
import BillingDetailsForm from '@/components/checkout/billing-details-form';
import axios from 'axios';

// Add TypeScript declaration for Razorpay
declare global {
  interface Window {
    Razorpay: {
      (options: RazorpayOptions): RazorpayInstance;
      on(event: string, handler: Function): void;
    };
  }
}

// Define checkout steps
type CheckoutStep = 'billing' | 'payment' | 'confirmation';

// Add this interface for Razorpay payment options
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

// Interface for Razorpay instance
interface RazorpayInstance {
  on(event: string, handler: (response: any) => void): void;
  open(): void;
  close(): void;
}

// Add this interface for Razorpay payment response
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  [key: string]: any;
}

// Add this interface near the top of the file with other type definitions
interface PaymentIntent {
  amount: number;
  currency: string;
  subscriptionId?: string;
  short_url?: string;
  [key: string]: any;
}

export default function CheckoutPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('billing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingInfo, setBillingInfo] = useState<BillingDetails | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [gatewayKey, setGatewayKey] = useState<any>(null);
  const [paymentError, setPaymentError] = useState('');
  const [isFetchingBilling, setIsFetchingBilling] = useState(true);
  const [planPricing, setPlanPricing] = useState<{ amount: number, currency: string } | null>(null);
  const [paymentReady, setPaymentReady] = useState<boolean>(false);
  
  // Parse URL query parameters from location
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const planIdFromUrl = searchParams.get('planId');
  const prorationAmount = searchParams.get('prorationAmount') || 0;
  const planId = planIdFromUrl || sessionStorage.getItem('selectedPlanId');
  
  // Get user's billing details
  useEffect(() => {
    if (!user || !user.id) return;
    
    const fetchBillingInfo = async () => {
      setIsFetchingBilling(true);
      try {
        const details = await PaymentService.getBillingDetails();
        console.log('Billing details fetch result:', details);
        setBillingInfo(details);
        
        // If billing details already exist, move to payment step
        if (details) {
          console.log('Billing details found, moving to payment step');
          setCurrentStep('payment');
        } else {
          // Ensure we show the billing form if no details exist
          console.log('No billing details found, staying on billing step');
          setCurrentStep('billing');
        }
      } catch (error) {
        console.error('Error loading billing details:', error);
        // Ensure we show billing form on error
        console.log('Error occurred, staying on billing step');
        setCurrentStep('billing');
      } finally {
        console.log('Finally block reached in fetchBillingInfo. Current step:', currentStep);
        setIsFetchingBilling(false);
      }
    };
    
    fetchBillingInfo();
  }, [user]);
  
  // Load the plan data and initialize payment intent
  useEffect(() => {
    if (!planId) {
      console.log('No planId provided, redirecting to plan selection');
      toast({
        title: 'No Plan Selected',
        description: 'Please select a subscription plan to continue. Redirecting to subscription page...',
        variant: 'destructive',
      });
      
      setTimeout(() => navigate('/user/subscription'), 2000);
      return;
    }
    
    console.log(`Loading plan data for ID: ${planId}`);
    
    const fetchPlanData = async () => {
      try {
        const response = await axios.get(`/api/public/subscription-plans/${planId}`);
        console.log('Plan data loaded successfully:', response.data);
        
        if (!response.data || !response.data.id) {
          throw new Error('Invalid plan data received');
        }
        
        setSelectedPlan(response.data);

        // Fetch pricing for the user's region/currency
        try {
          const pricingRes = await axios.get(`/api/public/subscription-plans/${planId}/pricing`);
          if (pricingRes.data && pricingRes.data.amount && pricingRes.data.currency) {
            setPlanPricing({
              amount: pricingRes.data.amount,
              currency: pricingRes.data.currency
            });
          } else {
            setPlanPricing(null);
          }
        } catch (pricingError) {
          setPlanPricing(null);
        }

        // Initialize payment intent if on payment step and not already initialized
        if (currentStep === 'payment' && billingInfo && !paymentIntent) {
          console.log('Initializing payment intent for plan:', response.data.id);
          const intent = await PaymentService.createPaymentIntent(response.data.id);
          if (!intent || !intent.subscriptionId) {
            throw new Error('Failed to create payment intent');
          }

          // Validate the subscription ID
          if (typeof intent.subscriptionId !== 'string') {
            throw new Error(`Invalid subscription ID format: ${intent.subscriptionId}`);
          }

          // Additional validation for subscription ID format
          if (!intent.subscriptionId.startsWith('sub_')) {
            console.warn(`Warning: Subscription ID doesn't start with 'sub_': ${intent.subscriptionId}`);
          }

          console.log('Created payment intent with subscription ID:', intent.subscriptionId);
          console.log('Payment intent amount:', intent.amount, 'Currency:', intent.currency);
          setPaymentIntent(intent);
        }
      } catch (error) {
        console.error('Error loading plan data:', error);
        toast({
          title: 'Plan Not Found',
          description: 'The selected subscription plan could not be found. Please try selecting another plan.',
          variant: 'destructive',
        });
        
        // Redirect back to subscription page
        navigate('/user/subscription');
      }
    };
    
    fetchPlanData();
  }, [planId, toast, navigate, currentStep, billingInfo, paymentIntent]);
  
  // Progress bar animation for loading states
  useEffect(() => {
    if (!selectedPlan) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 100);
      
      return () => {
        clearInterval(interval);
        setLoadingProgress(100);
      };
    }
  }, [selectedPlan]);

  // Handle billing details submission
  const handleBillingDetailsSubmitted = (details: BillingDetails) => {
    console.log('Billing details submitted:', details);
    setBillingInfo(details);
    setCurrentStep('payment');
    
    toast({
      title: 'Billing details saved',
      description: 'You can now proceed with payment.',
    });
    console.log('Transitioning to payment step with billing info:', details);

    // Initialize payment intent after billing details are saved, if not already initialized
    if (selectedPlan && !paymentIntent) {
      const initPaymentIntent = async () => {
        try {
          console.log('Initializing payment intent after billing details saved for plan:', selectedPlan.id);
          const intent = await PaymentService.createPaymentIntent(selectedPlan.id);
          if (!intent || !intent.subscriptionId) {
            throw new Error('Failed to create payment intent');
          }

          // Validate the subscription ID
          if (typeof intent.subscriptionId !== 'string') {
            throw new Error(`Invalid subscription ID format: ${intent.subscriptionId}`);
          }

          // Additional validation for subscription ID format
          if (!intent.subscriptionId.startsWith('sub_')) {
            console.warn(`Warning: Subscription ID doesn't start with 'sub_': ${intent.subscriptionId}`);
          }

          console.log('Created payment intent with subscription ID:', intent.subscriptionId);
          console.log('Payment intent amount:', intent.amount, 'Currency:', intent.currency);
          setPaymentIntent(intent);
        } catch (error) {
          console.error('Error initializing payment intent after billing details:', error);
          toast({
            title: 'Payment Initialization Error',
            description: 'Could not initialize payment. Please try again or contact support.',
            variant: 'destructive',
          });
        }
      };
      initPaymentIntent();
    }
  };

  // Cancel billing details step
  const handleBillingCancel = () => {
    navigate('/user/subscription');
  };

  // Function to load Razorpay script (more robust version)
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if Razorpay is already available
      if (typeof window !== 'undefined' && typeof window.Razorpay === 'function') {
        console.log('Razorpay already loaded');
        resolve(true);
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
        console.log('Razorpay script already loading, waiting for it to complete');
        
        // Wait for Razorpay to be available with a timeout
        const maxWaitTime = 10000; // 10 seconds
        const startTime = Date.now();
        
        const checkInterval = setInterval(() => {
          if (window.Razorpay && typeof window.Razorpay === 'function') {
            console.log('Razorpay loaded successfully from existing script');
            clearInterval(checkInterval);
            resolve(true);
            return;
          }
          
          // Check for timeout
          if (Date.now() - startTime > maxWaitTime) {
            console.warn('Timed out waiting for Razorpay script to load');
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 100);
        
        return;
      }

      // Load the script
      console.log('Loading Razorpay script');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        // Give a small delay to ensure Razorpay is initialized
        setTimeout(() => {
          if (typeof window.Razorpay === 'function') {
            resolve(true);
          } else {
            console.error('Razorpay script loaded but global object not available');
            resolve(false);
          }
        }, 300);
      };
      
      script.onerror = () => {
        console.error('Error loading Razorpay script');
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  };

  const verifyPayment = (response: RazorpayResponse) => {
    setIsProcessing(true);
    
    console.log('======= RAZORPAY PAYMENT RESPONSE =======');
    console.log('Full response object:', response);
    console.log('Keys in response:', Object.keys(response));
    
    // Deep inspection of the response
    Object.keys(response).forEach(key => {
      console.log(`${key}:`, response[key]);
    });
    console.log('======= END PAYMENT RESPONSE =======');

    // Make sure all fields are present
    if (!response.razorpay_payment_id || !response.razorpay_signature || !response.razorpay_subscription_id) {
      console.error('Missing required fields in Razorpay response:', response);
      setPaymentStatus('failed');
      
      // Create a more detailed error message
      const missingFields = [];
      if (!response.razorpay_payment_id) missingFields.push('payment ID');
      if (!response.razorpay_signature) missingFields.push('signature');
      if (!response.razorpay_subscription_id) missingFields.push('subscription ID');
      
      const errorMessage = `Missing ${missingFields.join(', ')} from Razorpay response. Please try again.`;
      setPaymentError(errorMessage);
      setIsProcessing(false);
      toast({
        title: 'Payment verification error',
        description: errorMessage,
        variant: 'destructive',
      });
      return;
    }

    console.log('Payment ID:', response.razorpay_payment_id);
    console.log('Subscription ID:', response.razorpay_subscription_id);
    console.log('Signature:', response.razorpay_signature);
    
    // Create the verification data with subscription ID exactly as provided by Razorpay
    const verificationData = {
      paymentId: response.razorpay_payment_id,
      planId: selectedPlan?.id || 0,
      signature: response.razorpay_signature,
      subscriptionId: response.razorpay_subscription_id // Ensure this is used exactly as provided
    };
    
    console.log('Sending verification data to server:', JSON.stringify(verificationData, null, 2));
    
    PaymentService.verifyPayment(verificationData)
      .then((result) => {
        console.log('Payment verification result:', result);
        if (result.success) {
          setPaymentStatus('success');
          setCurrentStep('confirmation');
          toast({
            title: 'Payment successful!',
            description: `Your subscription to ${result.planName || selectedPlan?.name} has been activated.`,
            variant: 'default',
          });
          setTimeout(() => navigate('/dashboard'), 3000);
        } else {
          setPaymentStatus('failed');
          setPaymentError(result.message || 'Please try again or contact support.');
          toast({
            title: 'Payment verification failed',
            description: result.message || 'Please try again or contact support.',
            variant: 'destructive',
          });
        }
      })
      .catch((error) => {
        console.error('Payment verification error:', error);
        setPaymentStatus('failed');
        setPaymentError(error instanceof Error ? error.message : 'Please try again or contact support.');
        toast({
          title: 'Payment verification error',
          description: error instanceof Error ? error.message : 'Please try again or contact support.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsProcessing(false);
        
        // Clear any URL parameters to avoid double processing on refresh
        if (window.history && window.history.replaceState) {
          const url = window.location.href.split('?')[0];
          window.history.replaceState({}, document.title, url);
        }
      });
  };

  // Format currency for display
  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Add useEffect to check for payment verification data in URL
  useEffect(() => {
    // Check if we have payment verification data in the URL
    const params = new URLSearchParams(window.location.search);
    const razorpayPaymentId = params.get('razorpay_payment_id');
    const razorpaySignature = params.get('razorpay_signature');
    const razorpaySubscriptionId = params.get('razorpay_subscription_id');
    
    // If we have all params, verify the payment
    if (razorpayPaymentId && razorpaySignature && razorpaySubscriptionId && selectedPlan) {
      console.log('Found payment verification data in URL, verifying payment');
      verifyPayment({
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        razorpay_subscription_id: razorpaySubscriptionId
      });
      
      // Clear URL parameters after processing to prevent multiple verifications on refresh
      if (window.history && window.history.replaceState) {
        const url = window.location.href.split('?')[0];
        window.history.replaceState({}, document.title, url);
      }
    }
  }, [selectedPlan]);

  // Function to handle payment using direct URL
  const openDirectCheckout = (fallbackUrl: string) => {
    const paymentWindow = window.open(fallbackUrl, '_blank', 'width=800,height=600');
    
    // Set a timer to poll for payment completion by checking if window closed
    const checkInterval = setInterval(() => {
      if (paymentWindow && paymentWindow.closed) {
        clearInterval(checkInterval);
        // Window closed, check payment status
        console.log("Payment window closed, checking payment status...");
        
        // After window closes, check subscription status
        setTimeout(() => {
          // Check payment status by redirecting to dashboard page
          // The user will need to refresh or we need server polling
          toast({
            title: 'Payment Processing',
            description: 'Your payment is being processed. You will be redirected to the dashboard shortly.',
            variant: 'default',
          });
          setTimeout(() => navigate('/dashboard'), 3000);
        }, 1000);
      }
    }, 1000);
  };

  // Load Razorpay script when component mounts or step changes to payment
  useEffect(() => {
    if (currentStep === 'payment') {
      const loadScript = async () => {
        try {
          console.log('Loading Razorpay script...');
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            throw new Error('Payment gateway script not loaded. Please try again in a moment.');
          }
          console.log('Razorpay script loaded successfully.');
          setPaymentReady(true);

          // Also fetch gateway key if not already fetched
          if (!gatewayKey) {
            console.log('Getting payment gateway key...');
            const keyResponse = await PaymentService.getGatewayKey();
            if (!keyResponse || !keyResponse.publicKey) {
              throw new Error('Could not retrieve payment gateway key');
            }
            setGatewayKey(keyResponse);
          }
        } catch (error) {
          console.error('Error loading Razorpay script or gateway key:', error);
          toast({
            title: 'Payment Setup Error',
            description: 'Could not load payment gateway. Please refresh the page or contact support.',
            variant: 'destructive',
          });
        }
      };
      loadScript();
    }
  }, [currentStep, toast, gatewayKey]);

  const processPayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentError('');

      if (!paymentIntent) {
        throw new Error('Payment intent not initialized');
      }

      if (!window.Razorpay) {
        console.error('Razorpay script not loaded');
        throw new Error('Razorpay script failed to load. Please try again.');
      }

      if (!gatewayKey || !gatewayKey.publicKey) {
        console.error('Payment gateway key not loaded');
        throw new Error('Payment gateway key not loaded. Please try again.');
      }

      // Ensure subscriptionId is valid and starts with 'sub_'
      const subscriptionId = paymentIntent.subscriptionId && paymentIntent.subscriptionId.startsWith('sub_') 
        ? paymentIntent.subscriptionId 
        : undefined;
      if (!subscriptionId) {
        console.error('Invalid or missing subscription ID:', paymentIntent.subscriptionId);
        throw new Error('Invalid subscription ID. Please try again.');
      }

      const options: RazorpayOptions = {
        key: gatewayKey.publicKey,
        subscription_id: subscriptionId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        name: 'ATScribe',
        description: `Subscription for ${paymentIntent.planName}`,
        image: 'https://ATScribe.com/logo.png', // Use absolute HTTPS URL to avoid mixed content issues
        prefill: {
          name: billingInfo?.fullName || '',
          email: user?.email || '',
          contact: billingInfo?.phoneNumber || ''
        },
        notes: {
          plan_id: planId?.toString() || '',
          user_id: user?.id?.toString() || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal dismissed');
            setIsProcessing(false);
          }
        },
        handler: (response: RazorpayResponse) => {
          console.log('Payment response received:', response);
          verifyPayment(response);
        }
      };

      console.log('Opening Razorpay checkout with detailed options:', JSON.stringify(options, null, 2));
      const razorpayInstance = new (window.Razorpay as any)(options);
      razorpayInstance.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response);
        setPaymentError(response.error.description || 'Payment failed. Please try again.');
        setIsProcessing(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setPaymentError(err.message || 'Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  // Add a global handler for Razorpay callbacks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Define a global callback function that Razorpay can call
      (window as any).handleRazorpayCallback = function(response: any) {
        console.log('Global Razorpay callback triggered:', response);
        if (response.razorpay_payment_id && response.razorpay_subscription_id && response.razorpay_signature) {
          verifyPayment(response);
        }
      };
      
      return () => {
        // Clean up when component unmounts
        delete (window as any).handleRazorpayCallback;
      };
    }
  }, []);

  // Render checkout step progress
  const renderStepProgress = () => {
    const steps = ['billing', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    
    return (
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div 
              key={step} 
              className={`flex items-center ${index <= currentIndex ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 
                ${index < currentIndex ? 'bg-primary text-white' : 
                  index === currentIndex ? 'border-2 border-primary' : 
                  'border-2 border-muted'}`}
              >
                {index < currentIndex ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="hidden md:inline">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
            </div>
          ))}
        </div>
        <Progress value={(currentIndex / (steps.length - 1)) * 100} className="h-2" />
      </div>
    );
  };

  // Loading state - when plan data is being fetched
  if (!selectedPlan) {
    return (
      <DefaultLayout pageTitle="Checkout" pageDescription="Process your subscription payment">
        <div className="flex flex-col items-center justify-center h-64 max-w-md mx-auto">
          <Progress value={loadingProgress} className="w-full mb-4" />
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <h3 className="text-xl font-medium mb-2">Setting up your checkout...</h3>
          <p className="text-sm text-muted-foreground text-center">
            We're preparing your payment details. This will only take a moment.
          </p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout pageTitle="Checkout" pageDescription="Complete your subscription payment">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Heading */}
        <h1 className="text-3xl font-bold mb-1">Checkout</h1>
        <p className="text-muted-foreground mb-8">Complete your subscription payment</p>
        
        {/* Step Indicator */}
        {renderStepProgress()}
        
        {/* Step content */}
        {currentStep === 'billing' && (
          <BillingDetailsForm 
            existingDetails={billingInfo} 
            onDetailsSubmitted={handleBillingDetailsSubmitted} 
            onCancel={handleBillingCancel}
          />
        )}
        
        {currentStep === 'payment' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Details */}
            <Card className="border-2 border-primary/10">
              <CardHeader className="bg-primary/5">
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your subscription details</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Plan Info */}
                  <div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-medium">
                          {selectedPlan?.name || 'Subscription Plan'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedPlan?.description || 'Complete subscription plan details'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Billing Address Summary */}
                  <div className="space-y-3 border-t pt-3">
                    <h4 className="font-medium text-sm">Billing Information</h4>
                    {billingInfo && (
                      <div className="text-sm text-muted-foreground">
                        <p>{billingInfo.fullName}</p>
                        <p>{billingInfo.addressLine1}</p>
                        {billingInfo.addressLine2 && <p>{billingInfo.addressLine2}</p>}
                        <p>{billingInfo.city}, {billingInfo.state} {billingInfo.postalCode}</p>
                        <p>{countries.find(c => c.value === billingInfo.country)?.label || billingInfo.country}</p>
                        {billingInfo.phoneNumber && <p>Phone: {billingInfo.phoneNumber}</p>}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentStep('billing')} 
                      className="mt-2"
                    >
                      Edit Billing Details
                    </Button>
                  </div>
                  
                  {/* Order Details */}
                  <div className="space-y-3 border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subscription:</span>
                      <span>
                        {isProcessing && !paymentIntent ? (
                          <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                        ) : paymentIntent ? (
                          formatCurrency(paymentIntent.amount / 100, paymentIntent.currency)
                        ) : planPricing ? (
                          formatCurrency(planPricing.amount, planPricing.currency)
                        ) : (
                          <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                        )}
                      </span>
                    </div>
                    
                    {/* If proration credit exists, show it */}
                    {prorationAmount && Number(prorationAmount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Proration Credit:</span>
                        <span className="text-green-600">
                          -{formatCurrency(Number(prorationAmount), paymentIntent?.currency || planPricing?.currency || 'USD')}
                        </span>
                      </div>
                    )}
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between font-medium">
                      <span>Total today:</span>
                      <span>
                        {isProcessing && !paymentIntent ? (
                          <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
                        ) : paymentIntent ? (
                          formatCurrency(paymentIntent.amount / 100 - (Number(prorationAmount) || 0), paymentIntent.currency)
                        ) : planPricing ? (
                          formatCurrency(planPricing.amount - (Number(prorationAmount) || 0), planPricing.currency)
                        ) : (
                          <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>
                      Secure payment processing via Razorpay
                    </CardDescription>
                  </div>
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Payment Option */}
                  <div className="border rounded-lg p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <img src="/razorpay-logo.svg" alt="Razorpay Logo" className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">
                        Razorpay Secure Checkout
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Pay securely with Razorpay using credit/debit cards, UPI, or bank transfer
                      </p>
                    </div>
                  </div>
                  
                  {/* Environment note for testing */}
                  {gatewayKey?.isTestMode && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                      <h4 className="font-medium flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4" />
                        Test Environment
                      </h4>
                      <p className="text-sm">
                        This is a test environment. Use the following test credentials:
                      </p>
                      <ul className="text-sm mt-2">
                        <li>Card: 4111 1111 1111 1111, Expiry: Any future date, CVV: Any 3 digits</li>
                        <li>UPI: success@razorpay</li>
                      </ul>
                    </div>
                  )}
                  
                  {/* Process Payment Button */}
                  <Button 
                    className="w-full font-medium" 
                    size="lg"
                    onClick={processPayment}
                    disabled={isProcessing || !paymentIntent || !gatewayKey || !paymentReady}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                  
                  {/* Display any payment errors */}
                  {paymentStatus === 'failed' && (
                    <div className="mt-3 p-3 border border-red-200 bg-red-50 rounded-lg text-red-700 text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Payment Failed</p>
                          <p className="mt-1">{paymentError || 'There was an error processing your payment. Please try again or contact support.'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Your payment details are protected with industry-standard encryption
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {currentStep === 'confirmation' && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-2xl">Payment Successful</CardTitle>
              <CardDescription className="text-base mt-2">
                Your subscription to {selectedPlan.name} has been activated successfully.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-green-50 border border-green-100 p-4 mb-4">
                <p className="text-center text-sm text-green-800">
                  You will be redirected to your dashboard shortly.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">Payment processed successfully</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">Account upgraded to {selectedPlan.name}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">
                    Billing cycle: {selectedPlan.billingCycle?.toLowerCase()}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        )}
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Need help? <a href="/contact" className="text-primary hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </DefaultLayout>
  );
}

// List of countries for dropdown
const countries = [
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AE', label: 'United Arab Emirates' },
];
