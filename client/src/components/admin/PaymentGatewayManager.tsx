import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2, Save, CheckCircle, XCircle, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type PaymentGateway = {
  id: number;
  name: string;
  service: string;
  key: string;
  isActive: boolean;
  isDefault: boolean;
  testMode: boolean;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
};

// Add new types
type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  price: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  isFeatured: boolean;
  isFreemium: boolean;
  active: boolean;
  pricing: PlanPricing[];
};

type PlanPricing = {
  id: number;
  planId: number;
  targetRegion: 'GLOBAL' | 'INDIA';
  currency: 'USD' | 'INR';
  price: string;
};

type PlanMapping = {
  [key: string]: string;
};

export function PaymentGatewayManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [activeTab, setActiveTab] = useState('paypal');
  
  // Form state
  const [newGateway, setNewGateway] = useState({
    name: '',
    service: 'paypal',
    key: '',
    isActive: true,
    isDefault: false,
    testMode: false
  });
  
  // Set service when tab changes
  useEffect(() => {
    setNewGateway(prev => ({
      ...prev,
      service: activeTab
    }));
  }, [activeTab]);
  
  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error: string | null;
  } | null>(null);
  
  // Delete confirmation state
  const [selectedGatewayId, setSelectedGatewayId] = useState<number | null>(null);

  // Add state for plan management
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [planMappings, setPlanMappings] = useState<PlanMapping>({});
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSavingMappings, setIsSavingMappings] = useState(false);
  const [newPlanMapping, setNewPlanMapping] = useState<{planId: string, razorpayPlanId: string}>({
    planId: '',
    razorpayPlanId: ''
  });
  
  // Fetch gateways on component mount
  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/admin/payment-gateways');
      setGateways(response.data);
    } catch (error) {
      console.error('Failed to fetch payment gateways:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment gateways',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewGateway(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Reset validation when input changes
    setValidationResult(null);
  };

  const handleServiceChange = (value: string) => {
    setNewGateway(prev => ({
      ...prev,
      service: value
    }));
    
    // Reset validation when service changes
    setValidationResult(null);
  };

  const validateKey = async () => {
    if (!newGateway.key) {
      toast({
        title: 'Validation Error',
        description: 'API key is required',
        variant: 'destructive',
      });
      return;
    }
    
    // Pre-validate format before sending to server
    if (newGateway.service === 'razorpay' && !newGateway.key.includes(':')) {
      toast({
        title: 'Validation Error',
        description: 'Razorpay API key must be in format: key_id:key_secret',
        variant: 'destructive',
      });
      return;
    }
    
    // Pre-validate PayPal key format
    if (newGateway.service === 'paypal' && !newGateway.key.includes(':')) {
      toast({
        title: 'Validation Error',
        description: 'PayPal API key must be in format: client_id:client_secret',
        variant: 'destructive',
      });
      return;
    }
    
    setIsValidating(true);
    try {
      const response = await axios.post('/api/admin/payment-gateways/verify', {
        service: newGateway.service,
        key: newGateway.key
      });
      
      setValidationResult(response.data);
      
      if (response.data.isValid) {
        toast({
          title: 'Validation Successful',
          description: `The ${newGateway.service} API key is valid`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Validation Failed',
          description: response.data.error || `The ${newGateway.service} API key is invalid`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Failed to validate API key:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to validate API key';
      
      toast({
        title: 'Validation Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      setValidationResult({
        isValid: false,
        error: errorMessage
      });
    } finally {
      setIsValidating(false);
    }
  };

  const saveGateway = async () => {
    if (!newGateway.name || !newGateway.key) {
      toast({
        title: 'Validation Error',
        description: 'Name and API key are required',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('Saving gateway with service:', newGateway.service);
    
    // Validate format before saving
    if (newGateway.service === 'razorpay' && !newGateway.key.includes(':')) {
      toast({
        title: 'Validation Error',
        description: 'Razorpay API key must be in format: key_id:key_secret',
        variant: 'destructive',
      });
      return;
    }
    
    if (newGateway.service === 'paypal' && !newGateway.key.includes(':')) {
      toast({
        title: 'Validation Error',
        description: 'PayPal API key must be in format: client_id:client_secret',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await axios.post('/api/admin/payment-gateways', newGateway);
      
      toast({
        title: 'Success',
        description: 'Payment gateway saved successfully',
        variant: 'default',
      });
      
      // Reset form
      setNewGateway({
        name: '',
        service: activeTab, // Use activeTab to ensure consistency
        key: '',
        isActive: true,
        isDefault: false,
        testMode: false
      });
      
      // Reset validation result
      setValidationResult(null);
      
      // Refresh gateways list
      fetchGateways();
    } catch (error: any) {
      console.error('Failed to save payment gateway:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save payment gateway';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const toggleGatewayStatus = async (id: number) => {
    try {
      await axios.patch(`/api/admin/payment-gateways/${id}/toggle`);
      fetchGateways();
      toast({
        title: 'Success',
        description: 'Gateway status updated successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to toggle gateway status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update gateway status',
        variant: 'destructive',
      });
    }
  };

  const deleteGateway = async () => {
    if (!selectedGatewayId) return;
    
    try {
      await axios.delete(`/api/admin/payment-gateways/${selectedGatewayId}`);
      setSelectedGatewayId(null);
      fetchGateways();
      toast({
        title: 'Success',
        description: 'Payment gateway deleted successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to delete payment gateway:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment gateway',
        variant: 'destructive',
      });
    }
  };

  const getServiceGateways = (service: string) => {
    return gateways.filter(gateway => gateway.service.toLowerCase() === service.toLowerCase());
  };

  // Add new functions for plan management
  const fetchSubscriptionPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await axios.get('/api/admin/subscription-plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subscription plans',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPlans(false);
    }
  };
  
  const fetchPlanMappings = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await axios.get('/api/admin/payment-gateways/plan-mappings', {
        params: { service: 'razorpay' }
      });
      
      if (response.data && response.data.mappings) {
        setPlanMappings(response.data.mappings);
      }
    } catch (error) {
      console.error('Failed to fetch plan mappings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch plan mappings',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPlans(false);
    }
  };
  
  // Format plan ID for display
  const formatPlanId = (planId: string | Record<string, string>) => {
    if (!planId) return 'Not configured';
    
    if (typeof planId === 'object') {
      // Handle new format with currency-specific plan IDs
      const currencies = Object.keys(planId);
      if (currencies.length === 0) return 'Not configured';
      
      // Create a condensed display of all available currencies
      return currencies.map(currency => 
        `${currency}: ${planId[currency].substring(0, 8)}...`
      ).join(', ');
    }
    
    // Handle legacy format (direct plan ID string)
    return planId.substring(0, 8) + '...';
  };
  
  const savePlanMapping = async () => {
    if (!newPlanMapping.planId || !newPlanMapping.razorpayPlanId) {
      toast({
        title: 'Validation Error',
        description: 'Both Plan ID and Razorpay Plan ID are required',
        variant: 'destructive',
      });
      return;
    }
    
    // Make sure razorpay plan ID starts with plan_
    if (!newPlanMapping.razorpayPlanId.startsWith('plan_')) {
      toast({
        title: 'Validation Error',
        description: 'Razorpay Plan ID should start with "plan_"',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSavingMappings(true);
    try {
      // Find the plan details for display name
      const plan = plans.find(p => p.id.toString() === newPlanMapping.planId);
      const planName = plan ? plan.name : `Plan ${newPlanMapping.planId}`;
      
      // Update local state first
      const updatedMappings = {
        ...planMappings,
        [newPlanMapping.planId]: newPlanMapping.razorpayPlanId
      };
      
      // Additional metadata to store with the mapping
      const mappingMetadata = {
        ...((planMappings as any).metadata || {}),
        [newPlanMapping.planId]: {
          planName,
          addedAt: new Date().toISOString(),
          razorpayPlanId: newPlanMapping.razorpayPlanId,
        }
      };
      
      // Save to server
      await axios.post('/api/admin/payment-gateways/plan-mappings', {
        service: 'razorpay',
        mappings: updatedMappings,
        metadata: mappingMetadata
      });
      
      setPlanMappings(updatedMappings);
      
      // Reset form
      setNewPlanMapping({
        planId: '',
        razorpayPlanId: ''
      });
      
      toast({
        title: 'Success',
        description: 'Plan mapping saved successfully',
        variant: 'default',
      });
      
      // Refresh the mappings to get the updated data
      fetchPlanMappings();
    } catch (error: any) {
      console.error('Failed to save plan mapping:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save plan mapping';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSavingMappings(false);
    }
  };
  
  const removePlanMapping = async (planId: string) => {
    if (!planId) return;
    
    setIsSavingMappings(true);
    try {
      // Get the gateway for the service
      const razorpayGateway = gateways.find(g => g.service.toLowerCase() === 'razorpay' && g.isActive);
      
      if (!razorpayGateway) {
        toast({
          title: 'Error',
          description: 'No active Razorpay gateway configured',
          variant: 'destructive',
        });
        return;
      }
      
      // Remove the mapping from our state
      const updatedMappings = { ...planMappings };
      delete updatedMappings[planId];
      
      // Update on the server
      await axios.post('/api/admin/payment-gateways/plan-mappings', {
        service: 'razorpay',
        mappings: updatedMappings
      });
      
      setPlanMappings(updatedMappings);
      
      toast({
        title: 'Success',
        description: 'Plan mapping removed successfully',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Failed to remove plan mapping:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to remove plan mapping';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSavingMappings(false);
    }
  };
  
  const createRazorpayPlan = async (plan: SubscriptionPlan) => {
    // Get the gateway for Razorpay
    const razorpayGateway = gateways.find(g => g.service.toLowerCase() === 'razorpay' && g.isActive);
    
    if (!razorpayGateway) {
      toast({
        title: 'Error',
        description: 'No active Razorpay gateway configured',
        variant: 'destructive',
      });
      return;
    }

    // Get pricing for both regions
    const globalPricing = plan.pricing.find(p => p.targetRegion === 'GLOBAL' && p.currency === 'USD');
    const indiaPricing = plan.pricing.find(p => p.targetRegion === 'INDIA' && p.currency === 'INR');

    if (!globalPricing && !indiaPricing) {
      toast({
        title: 'Error',
        description: 'Plan has no pricing configured for either region',
        variant: 'destructive',
      });
      return;
    }

    // Create plans for both available currencies
    if (globalPricing) {
      try {
        // Create USD plan
        const response = await axios.post('/api/admin/payment-gateways/create-plan', {
          gatewayId: razorpayGateway.id,
          planId: plan.id,
          currency: 'USD',
          amount: parseFloat(globalPricing.price) * 100, // Convert to cents
          interval: plan.billingCycle === 'MONTHLY' ? 'monthly' : 'yearly',
          name: plan.name,
          description: plan.description || `${plan.name} subscription plan`
        });

        if (response.data.success) {
          toast({
            title: 'Success',
            description: `USD plan created in Razorpay: ${response.data.planId}`,
          });

          // Refresh plan mappings
          fetchPlanMappings();
        } else {
          toast({
            title: 'Error',
            description: `Failed to create USD plan: ${response.data.error || 'Unknown error'}`,
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Error creating USD Razorpay plan:', error);
        toast({
          title: 'Error',
          description: `Failed to create USD plan: ${error.response?.data?.message || error.message}`,
          variant: 'destructive',
        });
      }
    }

    // Create INR plan separately
    if (indiaPricing) {
      try {
        // Create INR plan
        const response = await axios.post('/api/admin/payment-gateways/create-plan', {
          gatewayId: razorpayGateway.id,
          planId: plan.id,
          currency: 'INR',
          amount: parseFloat(indiaPricing.price) * 100, // Convert to paisa
          interval: plan.billingCycle === 'MONTHLY' ? 'monthly' : 'yearly',
          name: plan.name,
          description: plan.description || `${plan.name} subscription plan`
        });

        if (response.data.success) {
          toast({
            title: 'Success',
            description: `INR plan created in Razorpay: ${response.data.planId}`,
          });

          // Refresh plan mappings
          fetchPlanMappings();
        } else {
          toast({
            title: 'Error',
            description: `Failed to create INR plan: ${response.data.error || 'Unknown error'}`,
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Error creating INR Razorpay plan:', error);
        toast({
          title: 'Error',
          description: `Failed to create INR plan: ${error.response?.data?.message || error.message}`,
          variant: 'destructive',
        });
      }
    }
  };
  
  // Load plans when the tab changes to Razorpay
  useEffect(() => {
    if (activeTab === 'razorpay' && !isLoading) {
      fetchSubscriptionPlans();
      fetchPlanMappings();
    }
  }, [activeTab, isLoading, gateways]);

  // Update the component that renders the plan mappings table
  const renderPlanMappings = () => {
    if (isLoadingPlans) {
      return (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading plan mappings...</span>
        </div>
      );
    }
    
    if (!plans || plans.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          No subscription plans available. Create plans in the Subscription Management section.
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Internal Plan</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Razorpay Plan ID</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map(plan => {
            const mappedPlanId = planMappings[plan.id];
            const hasMappings = mappedPlanId && (
              typeof mappedPlanId === 'string' || 
              (typeof mappedPlanId === 'object' && Object.keys(mappedPlanId).length > 0)
            );
            
            // Get pricing for different regions
            const inrPricing = plan.pricing.find(p => p.currency === 'INR');
            const usdPricing = plan.pricing.find(p => p.currency === 'USD');
            
            return (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>
                  {usdPricing && <div>USD: ${parseFloat(usdPricing.price).toFixed(2)}</div>}
                  {inrPricing && <div>INR: ₹{parseFloat(inrPricing.price).toFixed(2)}</div>}
                </TableCell>
                <TableCell>
                  {hasMappings ? (
                    <div className="space-y-1">
                      {typeof mappedPlanId === 'object' ? (
                        Object.entries(mappedPlanId as Record<string, string>).map(([currency, planId]) => (
                          <div key={currency} className="flex items-center">
                            <Badge className="mr-2" variant="outline">{currency}</Badge>
                            <span className="text-xs font-mono">{String(planId).substring(0, 12)}...</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs font-mono">{mappedPlanId}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not configured</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {!hasMappings && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createRazorpayPlan(plan)}
                        disabled={isSavingMappings || !plan.pricing || plan.pricing.length === 0}
                      >
                        {isSavingMappings ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Plan
                          </>
                        )}
                      </Button>
                    )}
                    {hasMappings && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removePlanMapping(plan.id.toString())}
                        disabled={isSavingMappings}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payment Gateway Management</h2>
        <p className="text-muted-foreground mt-2">
          Configure payment gateways for subscription processing
        </p>
      </div>

      <Tabs defaultValue="paypal" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paypal">PayPal (Global)</TabsTrigger>
          <TabsTrigger value="razorpay">Razorpay (India)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="paypal" className="space-y-4 mt-4">
          <GatewayConfig 
            service="paypal"
            gateways={getServiceGateways('paypal')}
            newGateway={newGateway}
            validationResult={validationResult}
            isValidating={isValidating}
            handleInputChange={handleInputChange}
            handleServiceChange={handleServiceChange}
            validateKey={validateKey}
            saveGateway={saveGateway}
            toggleGatewayStatus={toggleGatewayStatus}
            setSelectedGatewayId={setSelectedGatewayId}
            setNewGateway={setNewGateway}
            isLoading={isLoading}
          />
          <div className="bg-muted p-4 rounded-md text-sm">
            <h4 className="font-medium mb-2">PayPal Integration Notes</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>PayPal is used for processing payments in USD and other non-INR currencies</li>
              <li>Enter your PayPal API credentials in the format: <code className="bg-background px-1 rounded-sm">client_id:client_secret</code></li>
              <li>Configure webhooks in the PayPal dashboard to point to <code className="bg-background px-1 rounded-sm">/api/webhooks/paypal</code></li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="razorpay" className="space-y-4 mt-4">
          <GatewayConfig 
            service="razorpay"
            gateways={getServiceGateways('razorpay')}
            newGateway={newGateway}
            validationResult={validationResult}
            isValidating={isValidating}
            handleInputChange={handleInputChange}
            handleServiceChange={handleServiceChange}
            validateKey={validateKey}
            saveGateway={saveGateway}
            toggleGatewayStatus={toggleGatewayStatus}
            setSelectedGatewayId={setSelectedGatewayId}
            setNewGateway={setNewGateway}
            isLoading={isLoading}
          />
          
          {/* Razorpay Plan Mapping Section */}
          {getServiceGateways('razorpay').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Razorpay Subscription Plans</CardTitle>
                <CardDescription>
                  Map your subscription plans to Razorpay plans for subscription processing
                </CardDescription>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mt-2 text-sm">
                  <p><strong>Important:</strong> For INR payments, plan prices should already include the 18% GST.</p>
                  <p className="text-xs mt-1">When creating plans with INR currency, set the price as the total amount including GST. This ensures customers see the full price with taxes included from the beginning.</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {renderPlanMappings()}
                  
                  {/* Subscription Plans Table */}
                  <h3 className="text-lg font-medium mt-6">Available Subscription Plans</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plan</TableHead>
                          <TableHead>Pricing</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingPlans ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : plans.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No subscription plans available
                            </TableCell>
                          </TableRow>
                        ) : (
                          plans.map(plan => {
                            const inrPricing = plan.pricing.find(p => p.targetRegion === 'INDIA' && p.currency === 'INR');
                            const isConfigured = !!planMappings[plan.id];
                            
                            return (
                              <TableRow key={plan.id}>
                                <TableCell>
                                  <div className="font-medium">{plan.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ID: {plan.id} | {plan.billingCycle.toLowerCase()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {inrPricing ? (
                                    <div className="font-medium">
                                      ₹{parseFloat(inrPricing.price).toLocaleString('en-IN')}
                                      <span className="text-xs text-muted-foreground ml-1">
                                        /{plan.billingCycle === 'YEARLY' ? 'year' : 'month'}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-amber-500 text-sm">No INR pricing</div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isConfigured ? (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                      Configured
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                      Not Configured
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant={isConfigured ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => createRazorpayPlan(plan)}
                                    disabled={isSavingMappings || !inrPricing}
                                  >
                                    {isConfigured ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        Recreate
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Create Plan
                                      </>
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Manual Mapping Form */}
                  <h3 className="text-lg font-medium mt-6">Manual Plan Mapping</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                        <div>
                          <Label htmlFor="planId">Internal Plan ID</Label>
                          <Select 
                            value={newPlanMapping.planId}
                            onValueChange={(value) => setNewPlanMapping(prev => ({...prev, planId: value}))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map(plan => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name} ({plan.billingCycle.toLowerCase()})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="razorpayPlanId">Razorpay Plan ID</Label>
                          <Input
                            id="razorpayPlanId"
                            value={newPlanMapping.razorpayPlanId}
                            onChange={(e) => setNewPlanMapping(prev => ({...prev, razorpayPlanId: e.target.value}))}
                            placeholder="plan_..."
                            className="font-mono"
                          />
                        </div>
                        <Button
                          onClick={savePlanMapping}
                          disabled={isSavingMappings || !newPlanMapping.planId || !newPlanMapping.razorpayPlanId}
                        >
                          {isSavingMappings ? <Loader2 className="h-4 w-4 animate-spin" /> : "Map Plan"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="bg-muted p-4 rounded-md text-sm">
            <h4 className="font-medium mb-2">Razorpay Integration Notes</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Razorpay is used for processing payments in INR for Indian customers</li>
              <li>Enter your Razorpay API key in the format: <code className="bg-background px-1 rounded-sm">key_id:key_secret</code></li>
              <li>Configure webhooks in the Razorpay dashboard to point to <code className="bg-background px-1 rounded-sm">/api/webhooks/razorpay</code></li>
              <li>Map your subscription plans to Razorpay plans for recurring billing</li>
              <li>Plans can be created automatically through the API or manually in the Razorpay dashboard</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!selectedGatewayId} onOpenChange={(open) => !open && setSelectedGatewayId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment gateway configuration.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteGateway} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sub-component for gateway configuration
function GatewayConfig({
  service,
  gateways,
  newGateway,
  validationResult,
  isValidating,
  handleInputChange,
  handleServiceChange,
  validateKey,
  saveGateway,
  toggleGatewayStatus,
  setSelectedGatewayId,
  setNewGateway,
  isLoading
}: {
  service: string;
  gateways: PaymentGateway[];
  newGateway: any;
  validationResult: any;
  isValidating: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleServiceChange: (value: string) => void;
  validateKey: () => void;
  saveGateway: () => void;
  toggleGatewayStatus: (id: number) => void;
  setSelectedGatewayId: (id: number | null) => void;
  setNewGateway: React.Dispatch<React.SetStateAction<any>>;
  isLoading: boolean;
}) {
  // Ensure the service is correctly set when component mounts
  useEffect(() => {
    if (newGateway.service !== service) {
      handleServiceChange(service);
    }
  }, [service]);

  return (
    <div className="space-y-4">
      {/* Existing Gateways */}
      {!isLoading && gateways.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>No {service} API keys configured yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {gateways.map((gateway) => (
            <Card key={gateway.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{gateway.name}</CardTitle>
                  <div className="flex space-x-1">
                    {gateway.testMode && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                        Test
                      </Badge>
                    )}
                    {gateway.isDefault && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Default
                      </Badge>
                    )}
                    <Badge variant={gateway.isActive ? 'default' : 'outline'}>
                      {gateway.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Last used: {gateway.lastUsed ? new Date(gateway.lastUsed).toLocaleString() : 'Never'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                    <div>
                      <Label htmlFor={`key-${gateway.id}`}>API Key</Label>
                      <Input
                        id={`key-${gateway.id}`}
                        value={gateway.key}
                        disabled
                        className="font-mono"
                      />
                    </div>
                    <div className="flex items-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedGatewayId(gateway.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={gateway.isActive}
                    onCheckedChange={() => toggleGatewayStatus(gateway.id)}
                    id={`active-${gateway.id}`}
                  />
                  <Label htmlFor={`active-${gateway.id}`}>
                    {gateway.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* New Gateway Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New {service === 'paypal' ? 'PayPal' : 'Razorpay'} API Key</CardTitle>
          <CardDescription>
            {service === 'paypal' 
              ? 'Enter your PayPal API credentials to enable global payments in USD'
              : 'Enter your Razorpay API credentials to enable payments in INR for Indian customers'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={service === 'paypal' ? "Production PayPal Key" : "Production Razorpay Key"}
                  value={newGateway.name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="service">Service</Label>
                <Select value={service} onValueChange={handleServiceChange} disabled={true}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal (Global)</SelectItem>
                    <SelectItem value="razorpay">Razorpay (India)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="key">API Key</Label>
              <div className="flex space-x-2">
                <Input
                  id="key"
                  name="key"
                  placeholder={service === 'paypal' ? 'client_id:client_secret' : 'rzp_live_...:...'}
                  value={newGateway.key}
                  onChange={handleInputChange}
                  className="font-mono"
                />
                <Button 
                  variant="outline" 
                  onClick={validateKey}
                  disabled={isValidating || !newGateway.key}
                >
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
                </Button>
              </div>
              {validationResult && (
                <div className={`mt-2 text-sm flex items-center ${validationResult.isValid ? 'text-green-500' : 'text-destructive'}`}>
                  {validationResult.isValid ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>API Key is valid</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      <span>{validationResult.error || 'API Key is invalid'}</span>
                    </>
                  )}
                </div>
              )}
              
              {/* Warning for test keys in production */}
              {newGateway.key && (
                ((newGateway.service === 'paypal' && (newGateway.key.includes('sb-') || newGateway.key === 'client_id:client_secret')) || 
                (newGateway.service === 'razorpay' && newGateway.key.includes('rzp_test_')))
              ) && (
                <div className="mt-2 text-amber-500 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>
                    {newGateway.key === 'client_id:client_secret' 
                      ? 'This is a placeholder. You need to replace with actual PayPal credentials.' 
                      : 'This appears to be a test key. It should not be used in production.'}
                  </span>
                </div>
              )}
              
              {/* Help text for PayPal credentials */}
              {service === 'paypal' && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>For PayPal:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Get credentials from PayPal Developer Dashboard</li>
                    <li>Format: <code className="bg-muted px-1 rounded">client_id:client_secret</code></li>
                    <li>Sandbox credentials start with <code className="bg-muted px-1 rounded">sb-</code></li>
                    <li>Production credentials have a different format</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={newGateway.isActive}
                onCheckedChange={(checked) => 
                  setNewGateway((prev: typeof newGateway) => ({...prev, isActive: checked}))
                }
                id="active-new"
                name="isActive"
              />
              <Label htmlFor="active-new">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={newGateway.isDefault}
                onCheckedChange={(checked) => 
                  setNewGateway((prev: typeof newGateway) => ({...prev, isDefault: checked}))
                }
                id="default-new"
                name="isDefault"
              />
              <Label htmlFor="default-new">Set as Default</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={newGateway.testMode}
                onCheckedChange={(checked) => 
                  setNewGateway((prev: typeof newGateway) => ({...prev, testMode: checked}))
                }
                id="test-mode-new"
                name="testMode"
              />
              <Label htmlFor="test-mode-new">Test Mode</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={saveGateway} 
            disabled={!newGateway.name || !newGateway.key}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Save {service === 'paypal' ? 'PayPal' : 'Razorpay'} API Key
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 