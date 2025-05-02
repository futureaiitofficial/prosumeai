import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = window.location.origin;

export interface PaymentIntent {
  paymentIntentId?: string;
  orderId?: string;
  clientSecret?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  planName: string;
  planDescription?: string;
  billingCycle: string;
  formattedPrice?: string;
  gateway: string;
  short_url?: string;
}

export interface BillingDetails {
  id?: number;
  userId?: number;
  fullName: string;
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber?: string;
  taxId?: string;
  companyName?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  message: string;
  planName?: string;
  subscriptionId?: number;
  transactionId?: number;
  error?: string;
}

export interface GatewayKeyResponse {
  publicKey: string;
  gateway: string;
  isTestMode: boolean;
}

/**
 * Service to handle payment operations
 */
export const PaymentService = {
  /**
   * Create a payment intent for a subscription plan
   */
  createPaymentIntent: async (planId: number): Promise<PaymentIntent> => {
    try {
      console.log(`Creating payment intent for plan ID: ${planId}`);
      const response = await axios.post('/api/payments/create-intent', { planId });
      console.log('Payment intent created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      
      // More detailed error message extraction
      const errorResponse = error.response?.data || {};
      const errorMessage = errorResponse.error || 
                         errorResponse.message || 
                         error.message || 
                         'Failed to create payment intent';
      
      console.error(`Payment intent creation failed: ${errorMessage}`);
      
      if (errorResponse.details) {
        console.error('Error details:', errorResponse.details);
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Get an alternative payment URL when Razorpay script fails to load
   */
  getAlternativePaymentUrl: async (planId: number): Promise<{paymentUrl: string}> => {
    try {
      // For now, this just returns the created payment intent's short_url if available
      const intentResponse = await axios.post('/api/payments/create-intent', { planId });
      
      if (intentResponse.data && intentResponse.data.short_url) {
        return { paymentUrl: intentResponse.data.short_url };
      }
      
      throw new Error('No alternative payment URL available');
    } catch (error: any) {
      console.error('Error getting alternative payment URL:', error);
      
      // Better error handling with fallback
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to get alternative payment URL';
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Verify a payment
   */
  verifyPayment: async (paymentData: {
    paymentId: string;
    planId: number;
    signature?: string;
    subscriptionId?: string;
  }): Promise<PaymentVerificationResult> => {
    try {
      console.log('Sending payment verification request with data:', JSON.stringify(paymentData));
      const response = await axios.post('/api/payments/verify', paymentData);
      console.log('Payment verification response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      
      // Return a structured error response for consistent handling
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify payment',
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Get user's billing details
   */
  getBillingDetails: async (): Promise<BillingDetails | null> => {
    try {
      const response = await axios.get('/api/user/billing-details');
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // No billing details found, which is expected for new users
        console.log('No billing details found for this user, this is normal for new users');
        return null;
      }
      
      // Log other errors but still return null to prevent UI disruption
      console.error('Error fetching billing details:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Return null to handle general errors as "no billing details"
      return null;
    }
  },

  /**
   * Save user's billing details
   */
  saveBillingDetails: async (billingDetails: Omit<BillingDetails, 'id' | 'userId'>): Promise<BillingDetails> => {
    try {
      const response = await axios.post('/api/user/billing-details', billingDetails);
      return response.data;
    } catch (error: any) {
      console.error('Error saving billing details:', error);
      
      // Enhanced error message extraction
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to save billing details';
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Cancel a subscription
   */
  cancelSubscription: async () => {
    try {
      const response = await axios.post('/api/payments/cancel-subscription');
      return response.data;
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      
      // Enhanced error message extraction
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to cancel subscription';
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Get user's region based on IP
   */
  getUserRegion: async () => {
    try {
      const response = await axios.get('/api/user/region');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user region:', error);
      // Default to GLOBAL if we can't determine region
      return { region: 'GLOBAL', currency: 'USD' };
    }
  },

  /**
   * Get Razorpay gateway key
   */
  getGatewayKey: async (): Promise<GatewayKeyResponse> => {
    try {
      const response = await axios.get('/api/payments/gateway-key');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching gateway key:', error);
      
      // Enhanced error message extraction
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to get payment gateway key';
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Get all payment gateways (admin only)
   */
  getPaymentGateways: async () => {
    try {
      const response = await axios.get('/api/admin/payment-gateways');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment gateways:', error);
      throw error;
    }
  },

  /**
   * Save a payment gateway (admin only)
   */
  savePaymentGateway: async (gateway: { name: string; service: string; key: string; isActive: boolean }) => {
    try {
      const response = await axios.post('/api/admin/payment-gateways', gateway);
      return response.data;
    } catch (error: any) {
      console.error('Error saving payment gateway:', error);
      throw error;
    }
  },

  /**
   * Delete a payment gateway (admin only)
   */
  deletePaymentGateway: async (id: number) => {
    try {
      const response = await axios.delete(`/api/admin/payment-gateways/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting payment gateway:', error);
      throw error;
    }
  },

  /**
   * Toggle a payment gateway status (admin only)
   */
  togglePaymentGatewayStatus: async (id: number) => {
    try {
      const response = await axios.patch(`/api/admin/payment-gateways/${id}/toggle`);
      return response.data;
    } catch (error: any) {
      console.error('Error toggling payment gateway status:', error);
      throw error;
    }
  },

  /**
   * Verify a payment gateway key (admin only)
   */
  verifyPaymentGatewayKey: async (service: string, key: string) => {
    try {
      const response = await axios.post('/api/admin/payment-gateways/verify', { service, key });
      return response.data;
    } catch (error: any) {
      console.error('Error verifying payment gateway key:', error);
      throw error;
    }
  }
}; 