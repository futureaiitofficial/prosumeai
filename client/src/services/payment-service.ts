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
  isUpgrade?: boolean;
  // New fields for future-dated subscriptions
  actualPlanAmount?: number;
  isTokenPayment?: boolean;
  futurePaymentDate?: string;
  isFutureSubscription?: boolean;
  startImmediately?: boolean;
  startAt?: number;
  // Tax related fields
  subtotal?: number;
  taxDetails?: {
    taxType: string;
    taxAmount: number;
    taxPercentage: number;
    taxBreakdown: Array<{
      name: string;
      type: string;
      percentage: number;
      amount: number;
    }>;
    subtotal: number;
    total: number;
  };
  // Proration related fields
  prorationInfo?: {
    originalPlanPrice?: number;
    newPlanPrice?: number;
    remainingValue?: number;
    prorationAmount?: number;
    prorationCredit?: number;
    isUpgrade?: boolean;
    currency?: string;
  };
  isSubscription: boolean;
}

export interface PaymentDetails {
  planId: number;
  amount?: number;
  currency?: string;
  isUpgrade?: boolean;
  isSubscription?: boolean;
}

export interface BillingDetails {
  id?: number;
  userId?: number;
  fullName: string;
  email?: string;
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber?: string;
  taxId?: string;
  companyName?: string;
  // Alias for addressLine1 for easier access
  address?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  message: string;
  planName?: string;
  subscriptionId?: number;
  transactionId?: number;
  error?: string;
  isUpgrade?: boolean;
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
   * @param paymentDetails - Can be either a plan ID or a payment details object
   */
  createPaymentIntent: async (paymentDetailsOrPlanId: number | PaymentDetails): Promise<PaymentIntent> => {
    try {
      let paymentDetails: PaymentDetails;
      
      // Handle backwards compatibility with the old API that accepted just a planId
      if (typeof paymentDetailsOrPlanId === 'number') {
        paymentDetails = { 
          planId: paymentDetailsOrPlanId,
          isSubscription: true // Always create a subscription by default
        };
        console.log(`Creating payment intent for plan ID: ${paymentDetailsOrPlanId}`);
      } else {
        paymentDetails = {
          ...paymentDetailsOrPlanId,
          isSubscription: paymentDetailsOrPlanId.isSubscription !== false // Default to true unless explicitly set to false
        };
        console.log(`Creating payment intent with details:`, paymentDetails);
      }
      
      const response = await axios.post('/api/payments/create-intent', paymentDetails);
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
   * Verify a payment with the server
   * @param verificationData Payment verification data from Razorpay
   * @returns Verification result
   */
  verifyPayment: async (verificationData: {
    paymentId: string;
    signature: string;
    subscriptionId?: string;
    planId?: number;
    isUpgrade?: boolean;
  }): Promise<any> => {
    try {
      console.log('[Payment Service] Verifying payment with data:', JSON.stringify(verificationData, null, 2));
      const response = await axios.post('/api/payments/verify', verificationData);
      console.log('[Payment Service] Verification response:', JSON.stringify(response.data, null, 2));
      return {
        success: true,
        ...response.data
      };
    } catch (error: any) {
      console.error('[Payment Service] Error verifying payment:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Payment verification failed';
      return {
        success: false,
        message: errorMessage
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
    // Use local storage cache to avoid repeatedly fetching the region
    const cachedRegion = localStorage.getItem('user-region-cache');
    const cacheTimestamp = localStorage.getItem('user-region-timestamp');
    
    // Check if we have a valid cached region (less than 24 hours old)
    if (cachedRegion && cacheTimestamp) {
      const cacheTime = parseInt(cacheTimestamp, 10);
      const now = Date.now();
      const cacheAge = now - cacheTime;
      const cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (cacheAge < cacheTTL) {
        try {
          const regionData = JSON.parse(cachedRegion);
          console.log('Using cached region data:', regionData);
          return regionData;
        } catch (e) {
          // Invalid JSON in cache, will fetch fresh data
          console.warn('Invalid region cache data, fetching fresh data');
        }
      }
    }
    
    try {
      console.log('Fetching user region from server...');
      const response = await axios.get('/api/user/region');
      console.log('Server response for region detection:', response.data);
      
      // Validate the response data
      if (!response.data || !response.data.region) {
        console.warn('Region response missing required fields, defaulting to GLOBAL');
        return { region: 'GLOBAL', currency: 'USD', error: 'Invalid server response' };
      }
      
      // Cache the valid region data
      try {
        localStorage.setItem('user-region-cache', JSON.stringify(response.data));
        localStorage.setItem('user-region-timestamp', Date.now().toString());
      } catch (e) {
        console.warn('Failed to cache region data:', e);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user region:', error);
      
      // Try to extract specific error information
      const errorMessage = error.response?.data?.error || error.message;
      
      // Check if there's a network error, which might indicate local development
      if (error.message?.includes('Network Error')) {
        console.warn('Network error detecting region, likely running in local development');
        return { region: 'GLOBAL', currency: 'USD', error: 'Network error' };
      }
      
      // Default to GLOBAL if we can't determine region
      return { region: 'GLOBAL', currency: 'USD', error: errorMessage };
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
  },

  /**
   * Get user's invoices
   */
  getUserInvoices: async () => {
    try {
      const response = await axios.get('/api/user/invoices');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user invoices:', error);
      throw error;
    }
  },

  /**
   * Get invoice by ID
   */
  getInvoiceById: async (invoiceId: number) => {
    try {
      const response = await axios.get(`/api/user/invoices/${invoiceId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching invoice ${invoiceId}:`, error);
      throw error;
    }
  },

  /**
   * Download invoice
   */
  downloadInvoice: async (invoiceId: number) => {
    try {
      console.log(`Downloading invoice ${invoiceId}`);
      
      const response = await axios.get(`/api/user/invoices/${invoiceId}/download`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      // Check if the response is a valid PDF
      if (response.headers['content-type'] !== 'application/pdf') {
        console.error('Received non-PDF content type:', response.headers['content-type']);
      }
      
      // Additional validation of the PDF data
      const blob = response.data;
      if (blob.size < 1000) {
        console.warn(`Received very small PDF (${blob.size} bytes), may be corrupt`);
      }
      
      return blob;
    } catch (error: any) {
      console.error(`Error downloading invoice ${invoiceId}:`, error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        if (error.response.data instanceof Blob) {
          // Try to extract text from error blob
          try {
            const text = await error.response.data.text();
            console.error('Error blob content:', text);
          } catch (e) {
            console.error('Could not read error blob content');
          }
        } else {
          console.error('Error response data:', error.response.data);
        }
      }
      
      throw error;
    }
  },

  /**
   * Get invoices for a specific subscription
   */
  getSubscriptionInvoices: async (subscriptionId: number) => {
    try {
      const response = await axios.get(`/api/subscription/invoices/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching invoices for subscription ${subscriptionId}:`, error);
      throw error;
    }
  },

  /**
   * Download an invoice for a transaction, generating one if it doesn't exist
   * @param transactionId The ID of the transaction
   * @returns Promise containing the PDF blob data
   */
  downloadTransactionInvoice: async (transactionId: number) => {
    try {
      console.log(`Downloading invoice for transaction ${transactionId}`);
      
      const response = await axios.get(`/api/user/transactions/${transactionId}/download`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      // Check if the response is a valid PDF
      if (response.headers['content-type'] !== 'application/pdf') {
        console.error('Received non-PDF content type:', response.headers['content-type']);
      }
      
      // Additional validation of the PDF data
      const blob = response.data;
      if (blob.size < 1000) {
        console.warn(`Received very small PDF (${blob.size} bytes), may be corrupt`);
      }
      
      return blob;
    } catch (error: any) {
      console.error(`Error downloading transaction invoice ${transactionId}:`, error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        if (error.response.data instanceof Blob) {
          // Try to extract text from error blob
          try {
            const text = await error.response.data.text();
            console.error('Error blob content:', text);
          } catch (e) {
            console.error('Could not read error blob content');
          }
        } else {
          console.error('Error response data:', error.response.data);
        }
      }
      
      throw error;
    }
  }
}; 