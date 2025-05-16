import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  isFeatured: boolean;
  isFreemium: boolean;
  active: boolean;
  pricing: PlanPricing[];
  createdAt?: string;
  updatedAt?: string;
}

interface PlanPricing {
  id: number;
  planId: number;
  targetRegion: 'GLOBAL' | 'INDIA';
  currency: 'USD' | 'INR';
  price: string;
}

interface Feature {
  id: number;
  name: string;
  code: string;
  description: string;
  featureType: 'ESSENTIAL' | 'ADVANCED' | 'PROFESSIONAL';
  isCountable: boolean;
  isTokenBased?: boolean;
  costFactor: string;
}

interface PlanFeature {
  id: number;
  planId: number;
  featureId: number;
  limitType: 'UNLIMITED' | 'COUNT' | 'BOOLEAN';
  limitValue?: number | null;
  resetFrequency: 'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  // Display fields
  planName?: string;
  featureName?: string;
  featureCode?: string;
  featureDescription?: string;
}

function customFormatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

const SubscriptionManagement: React.FC = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [planFeatures, setPlanFeatures] = useState<PlanFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlan, setNewPlan] = useState<SubscriptionPlan>({
    id: 0,
    name: '',
    description: '',
    price: '',
    billingCycle: 'MONTHLY',
    isFeatured: false,
    isFreemium: false,
    active: false,
    pricing: []
  });
  const [newFeature, setNewFeature] = useState<Feature>({
    id: 0,
    name: '',
    code: '',
    description: '',
    featureType: 'ESSENTIAL',
    isCountable: false,
    isTokenBased: false,
    costFactor: '1.0000'
  });
  const [newPlanFeature, setNewPlanFeature] = useState<Partial<PlanFeature>>({
    limitType: 'UNLIMITED',
    resetFrequency: 'NEVER',
    isEnabled: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [newPricing, setNewPricing] = useState<PlanPricing>({
    id: 0,
    planId: 0,
    targetRegion: 'GLOBAL',
    currency: 'USD',
    price: ''
  });
  const [globalPrice, setGlobalPrice] = useState<string>('');
  const [indiaPrice, setIndiaPrice] = useState<string>('');
  const editPlan = plans.find(p => p.id === editingPlanId);
  const [viewPlanModalOpen, setViewPlanModalOpen] = useState(false);
  const [selectedViewPlanId, setSelectedViewPlanId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingFeature, setIsEditingFeature] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<number | null>(null);
  const [isEditingPlanFeature, setIsEditingPlanFeature] = useState(false);
  const [editingPlanFeatureId, setEditingPlanFeatureId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [plansRes, featuresRes, planFeaturesRes] = await Promise.all([
          axios.get('/api/admin/subscription-plans'),
          axios.get('/api/admin/features'),
          axios.get('/api/admin/plan-features')
        ]);
        setPlans(plansRes.data);
        setFeatures(featuresRes.data);
        
        // Enhance plan features data with plan and feature details for display
        const enhancedPlanFeatures = planFeaturesRes.data.map((pf: PlanFeature) => {
          const plan = plansRes.data.find((p: SubscriptionPlan) => p.id === pf.planId);
          const feature = featuresRes.data.find((f: Feature) => f.id === pf.featureId);
          return {
            ...pf,
            planName: plan?.name || 'Unknown Plan',
            featureName: feature?.name || 'Unknown Feature',
            featureCode: feature?.code || '',
            featureDescription: feature?.description || ''
          };
        });
        
        setPlanFeatures(enhancedPlanFeatures);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to load subscription data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddPlan = async () => {
    try {
      const planToSend = {
        name: newPlan.name,
        description: newPlan.description,
        billingCycle: newPlan.billingCycle,
        isFeatured: newPlan.isFeatured,
        isFreemium: newPlan.isFreemium,
        active: newPlan.active,
        usdPrice: globalPrice || '0.00',
        inrPrice: indiaPrice || '0.00'
      };
      // Exclude createdAt, updatedAt, and id fields for new plans
      console.log('Data to be sent:', planToSend);
      let response: any;
      if (isEditing && editingPlanId !== null) {
        console.log('Updating plan with data:', planToSend);
        response = await axios.patch(`/api/admin/subscription-plans/${editingPlanId}`, planToSend);
        // Refresh the plan list to get the updated data
        const plansRes = await axios.get('/api/admin/subscription-plans');
        setPlans(plansRes.data);
      } else {
        console.log('Creating plan with data:', planToSend);
        response = await axios.post('/api/admin/subscription-plans', planToSend);
        // Refresh the entire plan list to get the latest data including pricing
        const plansRes = await axios.get('/api/admin/subscription-plans');
        setPlans(plansRes.data);
        setSelectedPlanId(response.data.id); // Select the newly created plan
      }
      setNewPlan({
        id: 0,
        name: '',
        description: '',
        price: '0.00',
        billingCycle: 'MONTHLY',
        isFeatured: false,
        isFreemium: false,
        active: false,
        pricing: []
      });
      setGlobalPrice('');
      setIndiaPrice('');
      setIsEditing(false);
      setEditingPlanId(null);
      setSelectedPlanId(response.data.id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddFeature = async () => {
    try {
      if (isEditingFeature && editingFeatureId) {
        // Update existing feature
        await axios.patch(`/api/admin/features/${editingFeatureId}`, newFeature);
        toast({
          title: "Success",
          description: "Feature updated successfully",
        });
      } else {
        // Create new feature
        await axios.post('/api/admin/features', newFeature);
        toast({
          title: "Success",
          description: "Feature created successfully",
        });
      }
      
      // Refetch features to ensure the list is up-to-date
      const featuresRes = await axios.get('/api/admin/features');
      setFeatures(featuresRes.data);
      
      // Reset form and editing state
      setNewFeature({
        id: 0,
        name: '',
        code: '',
        description: '',
        featureType: 'ESSENTIAL',
        isCountable: false,
        isTokenBased: false,
        costFactor: '1.0000'
      });
      setIsEditingFeature(false);
      setEditingFeatureId(null);
    } catch (error: any) {
      console.error('Error managing feature:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to manage feature",
        variant: "destructive"
      });
    }
  };

  const handleAddPlanFeature = async () => {
    try {
      if (!selectedPlanId || !newPlanFeature.featureId) {
        alert('Please select both a Plan and a Feature.');
        return;
      }
      
      // Warn if isEnabled is false
      if (newPlanFeature.isEnabled === false) {
        const confirmDisabled = confirm(
          'Warning: You are adding a feature with "Is Enabled" set to FALSE. ' +
          'This means users will NOT be able to use this feature. ' +
          'Are you sure you want to continue?'
        );
        if (!confirmDisabled) {
          return;
        }
      }
      
      setIsSubmitting(true);
      
      // Ensure planId is properly set before sending to the server
      const planFeatureData = {
        ...newPlanFeature,
        planId: selectedPlanId
      };
      
      console.log('Sending data to server:', planFeatureData);
      
      if (isEditingPlanFeature && editingPlanFeatureId) {
        // Update existing plan feature
        // Clean up data before sending to server - remove timestamp fields and other unnecessary fields
        const cleanedData = {
          planId: planFeatureData.planId,
          featureId: planFeatureData.featureId,
          limitType: planFeatureData.limitType,
          limitValue: planFeatureData.limitValue,
          resetFrequency: planFeatureData.resetFrequency,
          isEnabled: planFeatureData.isEnabled
        };
        console.log('Sending cleaned data for update:', cleanedData);
        await axios.patch(`/api/admin/plan-features/${editingPlanFeatureId}`, cleanedData);
        toast({
          title: "Success",
          description: "Plan feature updated successfully",
        });
      } else {
        // Create new plan feature
        await axios.post('/api/admin/plan-features', planFeatureData);
        toast({
          title: "Success",
          description: "Feature added to plan successfully",
        });
      }
      
      // Fetch the updated data after successful addition
      const [plansRes, featuresRes, planFeaturesRes] = await Promise.all([
        axios.get('/api/admin/subscription-plans'),
        axios.get('/api/admin/features'),
        axios.get('/api/admin/plan-features')
      ]);
      
      setPlans(plansRes.data);
      setFeatures(featuresRes.data);
      
      // Enhance plan features data with plan and feature details for display
      const enhancedPlanFeatures = planFeaturesRes.data.map((pf: PlanFeature) => {
        const plan = plansRes.data.find((p: SubscriptionPlan) => p.id === pf.planId);
        const feature = featuresRes.data.find((f: Feature) => f.id === pf.featureId);
        return {
          ...pf,
          planName: plan?.name || 'Unknown Plan',
          featureName: feature?.name || 'Unknown Feature',
          featureCode: feature?.code || '',
          featureDescription: feature?.description || ''
        };
      });
      
      setPlanFeatures(enhancedPlanFeatures);
      
      // Reset form and editing state
      setNewPlanFeature({
        limitType: 'UNLIMITED',
        resetFrequency: 'NEVER',
        isEnabled: true
      });
      setIsEditingPlanFeature(false);
      setEditingPlanFeatureId(null);
      
    } catch (error: any) {
      console.error('Error managing plan feature:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to manage plan feature",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePlanActive = async (plan: SubscriptionPlan) => {
    try {
      const updatedPlan = { ...plan, active: !plan.active };
      await axios.patch(`/api/admin/subscription-plans/${plan.id}`, { active: updatedPlan.active });
      setPlans(plans.map(p => p.id === plan.id ? updatedPlan : p));
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setNewPlan({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billingCycle,
      isFeatured: plan.isFeatured,
      isFreemium: plan.isFreemium,
      active: plan.active,
      pricing: plan.pricing
    });
    setIsEditing(true);
    setEditingPlanId(plan.id);
    setGlobalPrice(plan.pricing.find(p => p.targetRegion === 'GLOBAL')?.price || '');
    setIndiaPrice(plan.pricing.find(p => p.targetRegion === 'INDIA')?.price || '');
    setSelectedPlanId(plan.id);
  };

  const handleAddPricing = async () => {
    if (!selectedPlanId) return;
    try {
      const pricingData = {
        planId: selectedPlanId,
        targetRegion: newPricing.targetRegion,
        currency: newPricing.currency,
        price: newPricing.price
      };
      // Send this data to the backend API for plan_pricing
      await axios.post('/api/admin/plan-pricing', pricingData);
      // Refresh the plan list to get the updated pricing
      const plansRes = await axios.get('/api/admin/subscription-plans');
      setPlans(plansRes.data);
      setNewPricing({
        id: 0,
        planId: 0,
        targetRegion: 'GLOBAL',
        currency: 'USD',
        price: ''
      });
    } catch (error) {
      console.error('Error adding pricing:', error);
    }
  };

  const handleSelectPlan = (planId: number) => {
    setSelectedPlanId(planId);
    // We don't need to set planId in newPlanFeature since we'll use selectedPlanId directly
    setNewPricing({
      id: 0,
      planId: planId,
      targetRegion: 'GLOBAL',
      currency: 'USD',
      price: ''
    });
  };

  const handleDeletePlan = async (planId: number) => {
    try {
      await axios.delete(`/api/admin/subscription-plans/${planId}`);
      setPlans(plans.filter(p => p.id !== planId));
      if (selectedPlanId === planId) {
        setSelectedPlanId(null);
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
    }
  };

  const handleDeletePlanFeature = async (planFeatureId: number) => {
    try {
      await axios.delete(`/api/admin/plan-features/${planFeatureId}`);
      setPlanFeatures(planFeatures.filter(pf => pf.id !== planFeatureId));
    } catch (error) {
      console.error('Error deleting plan feature:', error);
      alert('Failed to delete plan feature');
    }
  };

  const handleEditFeature = (feature: Feature) => {
    setNewFeature({
      id: feature.id,
      name: feature.name,
      code: feature.code,
      description: feature.description,
      featureType: feature.featureType,
      isCountable: feature.isCountable,
      isTokenBased: feature.isTokenBased || false,
      costFactor: feature.costFactor
    });
    setIsEditingFeature(true);
    setEditingFeatureId(feature.id);
  };

  const handleDeleteFeature = async (featureId: number) => {
    try {
      await axios.delete(`/api/admin/features/${featureId}`);
      setFeatures(features.filter(f => f.id !== featureId));
    } catch (error) {
      console.error('Error deleting feature:', error);
      alert('Failed to delete feature');
    }
  };

  const handleViewPlan = (planId: number) => {
    setSelectedViewPlanId(planId);
    setViewPlanModalOpen(true);
  };

  const resetFeatureForm = () => {
    setNewFeature({
      id: 0,
      name: '',
      code: '',
      description: '',
      featureType: 'ESSENTIAL',
      isCountable: false,
      isTokenBased: false,
      costFactor: '1.0000'
    });
    setIsEditingFeature(false);
    setEditingFeatureId(null);
  };

  const PlanFeatureForm = () => {
    return (
      <form onSubmit={(e) => { e.preventDefault(); handleAddPlanFeature(); }} className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">{isEditingPlanFeature ? 'Edit Plan Feature' : 'Add Feature to Plan'}</h3>
        
        {/* Warning alert about feature enablement */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-medium">
                Important: Please ensure "Is Enabled" is checked for the feature to be available to users
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Even for COUNT type features, the "Is Enabled" flag must be checked for the feature to be visible and usable.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="planId" className="block text-sm font-medium text-gray-700">Select Plan</label>
            <select
              id="planId"
              value={selectedPlanId || ''}
              onChange={(e) => {
                const planId = Number(e.target.value);
                handleSelectPlan(planId);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">Select a Plan</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="featureId" className="block text-sm font-medium text-gray-700">Select Feature</label>
            <select
              id="featureId"
              value={newPlanFeature.featureId || ''}
              onChange={(e) => setNewPlanFeature({ 
                ...newPlanFeature, 
                featureId: Number(e.target.value)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">Select a Feature</option>
              {features.map(feature => (
                <option key={feature.id} value={feature.id}>{feature.name} {feature.isTokenBased ? '(Token Based)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="limitType" className="block text-sm font-medium text-gray-700">Limit Type</label>
            <select
              id="limitType"
              value={newPlanFeature.limitType}
              onChange={(e) => setNewPlanFeature({ ...newPlanFeature, limitType: e.target.value as 'UNLIMITED' | 'COUNT' | 'BOOLEAN' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="UNLIMITED">Unlimited</option>
              <option value="COUNT">Count</option>
              <option value="BOOLEAN">Boolean</option>
            </select>
          </div>
          {newPlanFeature.limitType === 'COUNT' && (
            <div>
              <label htmlFor="limitValue" className="block text-sm font-medium text-gray-700">Limit Value</label>
              <input
                type="number"
                id="limitValue"
                value={newPlanFeature.limitValue || ''}
                onChange={(e) => setNewPlanFeature({ ...newPlanFeature, limitValue: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          )}
          <div>
            <label htmlFor="isEnabled" className="block text-sm font-medium text-gray-700 mb-1">Is Enabled</label>
            <div className="flex items-center">
              <Checkbox
                id="isEnabled"
                checked={newPlanFeature.isEnabled}
                onCheckedChange={(checked) => setNewPlanFeature({ ...newPlanFeature, isEnabled: checked === true })}
                className="mr-2"
              />
              <Label htmlFor="isEnabled" className="text-sm text-gray-600">
                {newPlanFeature.isEnabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <strong>IMPORTANT:</strong> {newPlanFeature.limitType === 'BOOLEAN' 
                ? 'This option determines if the feature is available when using BOOLEAN limit type.' 
                : 'This must be CHECKED for users to access this feature (even with COUNT type features).'}
            </p>
          </div>
          {newPlanFeature.limitType === 'COUNT' && (
            <div>
              <label htmlFor="resetFrequency" className="block text-sm font-medium text-gray-700">Reset Frequency</label>
              <select
                id="resetFrequency"
                value={newPlanFeature.resetFrequency}
                onChange={(e) => setNewPlanFeature({ ...newPlanFeature, resetFrequency: e.target.value as 'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="NEVER">Never</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center col-span-full md:col-span-1 mt-6 md:mt-0">
          <Button onClick={handleAddPlanFeature} className="w-full md:w-auto col-span-full md:col-span-1">
            {isSubmitting ? 'Processing...' : isEditingPlanFeature ? 'Update Feature' : 'Add Feature to Plan'}
          </Button>
          {isEditingPlanFeature && (
            <Button 
              variant="outline" 
              onClick={() => {
                setNewPlanFeature({
                  limitType: 'UNLIMITED',
                  resetFrequency: 'NEVER',
                  isEnabled: true
                });
                setIsEditingPlanFeature(false);
                setEditingPlanFeatureId(null);
              }} 
              className="w-full md:w-auto col-span-full md:col-span-1 ml-2"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold">Subscription Management</h1>
      <Toaster />
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="plan-features">Plan Features</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Plan' : 'Add New Plan'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={newPlan.name}
                    onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                    placeholder="Plan name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={newPlan.description}
                    onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                    placeholder="Plan description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Billing Cycle</label>
                  <Select
                    value={newPlan.billingCycle}
                    onValueChange={(value: 'MONTHLY' | 'YEARLY') => setNewPlan({ ...newPlan, billingCycle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (USD - Global)</label>
                  <Input
                    value={globalPrice}
                    onChange={e => setGlobalPrice(e.target.value)}
                    placeholder="Price in USD for Global"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (INR - India)</label>
                  <Input
                    value={indiaPrice}
                    onChange={e => setIndiaPrice(e.target.value)}
                    placeholder="Price in INR for India"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={newPlan.active}
                      onChange={(e) => setNewPlan({ ...newPlan, active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700">
                      Active
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFreemium"
                      checked={newPlan.isFreemium}
                      onChange={(e) => setNewPlan({ ...newPlan, isFreemium: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isFreemium" className="ml-2 text-sm font-medium text-gray-700">
                      Freemium
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={newPlan.isFeatured}
                      onChange={(e) => setNewPlan({ ...newPlan, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isFeatured" className="ml-2 text-sm font-medium text-gray-700">
                      Featured
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-center col-span-full md:col-span-1 mt-6 md:mt-0">
                  <Button onClick={handleAddPlan} className="w-full md:w-auto col-span-full md:col-span-1">{isEditing ? 'Update Plan' : 'Add Plan'}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Freemium</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map(plan => (
                    <TableRow key={plan.id} onClick={() => handleSelectPlan(plan.id)} className={selectedPlanId === plan.id ? 'bg-muted' : ''}>
                      <TableCell>{plan.id}</TableCell>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>{plan.description}</TableCell>
                      <TableCell>
                        {plan.pricing && plan.pricing.length > 0 ? (
                          plan.pricing.map(p => (
                            <div key={p.id}>{p.price} {p.currency} ({p.targetRegion})</div>
                          ))
                        ) : (
                          <div>{plan.price}</div>
                        )}
                      </TableCell>
                      <TableCell>{plan.billingCycle}</TableCell>
                      <TableCell>{plan.active ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{plan.isFreemium ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{plan.isFeatured ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewPlan(plan.id); }}>View</Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>Edit</Button>
                          <Button variant={plan.active ? 'destructive' : 'secondary'} size="sm" onClick={() => handleTogglePlanActive(plan)}>
                            {plan.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this plan?')) {
                              await handleDeletePlan(plan.id);
                            }
                          }}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {selectedPlanId && (
            <Card>
              <CardHeader>
                <CardTitle>Add Pricing for {plans.find(p => p.id === selectedPlanId)?.name || 'Selected Plan'}</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const selectedPlan = plans.find(p => p.id === selectedPlanId);
                  return selectedPlan && selectedPlan.pricing.length < 2 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Target Region</label>
                        <Select
                          value={newPricing.targetRegion}
                          onValueChange={(value: 'GLOBAL' | 'INDIA') => setNewPricing({ ...newPricing, targetRegion: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GLOBAL">Global</SelectItem>
                            <SelectItem value="INDIA">India</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Currency</label>
                        <Select
                          value={newPricing.currency}
                          onValueChange={(value: 'USD' | 'INR') => setNewPricing({ ...newPricing, currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="INR">INR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Price</label>
                        <Input
                          value={newPricing.price}
                          onChange={e => setNewPricing({ ...newPricing, price: e.target.value })}
                          placeholder="Price for this region"
                        />
                      </div>
                      <div className="flex items-center justify-center col-span-full md:col-span-1 mt-6 md:mt-0">
                        <Button onClick={handleAddPricing} className="w-full md:w-auto col-span-full md:col-span-1">Add Pricing</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Pricing for both regions (Global and India) has already been added for this plan.</p>
                  );
                })()}
                <div className="mt-4">
                  <h3 className="text-lg font-medium">Current Pricing for this Plan</h3>
                  {(() => {
                    const selectedPlan = plans.find(p => p.id === selectedPlanId);
                    return selectedPlan && selectedPlan.pricing.length ? (
                      <ul className="list-disc pl-5">
                        {selectedPlan.pricing.map(price => (
                          <li key={price.id}>{price.price} {price.currency} ({price.targetRegion})</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No pricing added yet for this plan.</p>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
          <Dialog open={viewPlanModalOpen} onOpenChange={setViewPlanModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Plan Details</DialogTitle>
              </DialogHeader>
              {selectedViewPlanId && (() => {
                const plan = plans.find(p => p.id === selectedViewPlanId);
                return plan ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">ID:</p>
                        <p>{plan.id}</p>
                      </div>
                      <div>
                        <p className="font-medium">Name:</p>
                        <p>{plan.name}</p>
                      </div>
                      <div>
                        <p className="font-medium">Description:</p>
                        <p>{plan.description}</p>
                      </div>
                      <div>
                        <p className="font-medium">Billing Cycle:</p>
                        <p>{plan.billingCycle}</p>
                      </div>
                      <div>
                        <p className="font-medium">Active:</p>
                        <p>{plan.active ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Freemium:</p>
                        <p>{plan.isFreemium ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Featured:</p>
                        <p>{plan.isFeatured ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Pricing:</p>
                        {plan.pricing && plan.pricing.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {plan.pricing.map(price => (
                              <li key={price.id}>{price.price} {price.currency} ({price.targetRegion})</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No pricing information available.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Associated Features</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Feature Name</TableHead>
                            <TableHead>Limit Type</TableHead>
                            <TableHead>Limit Value</TableHead>
                            <TableHead>Enabled</TableHead>
                            <TableHead>Reset Frequency</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {planFeatures.filter(pf => pf.planId === selectedViewPlanId).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No features associated with this plan
                              </TableCell>
                            </TableRow>
                          ) : (
                            planFeatures.filter(pf => pf.planId === selectedViewPlanId).map(pf => {
                              const feature = features.find(f => f.id === pf.featureId);
                              return (
                                <TableRow key={pf.id}>
                                  <TableCell>{pf.id}</TableCell>
                                  <TableCell>{feature ? feature.name : 'Unknown Feature'}</TableCell>
                                  <TableCell>{pf.limitType}</TableCell>
                                  <TableCell>{pf.limitValue ?? 'N/A'}</TableCell>
                                  <TableCell>
                                    {pf.isEnabled 
                                      ? "Yes" 
                                      : <span className="text-red-600 font-bold flex items-center">
                                          No
                                          <svg className="h-4 w-4 ml-1 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                        </span>
                                    }
                                    {!pf.isEnabled && 
                                      <div className="text-xs text-red-500 font-medium">
                                        Users CANNOT access this feature!
                                      </div>
                                    }
                                  </TableCell>
                                  <TableCell>{pf.resetFrequency}</TableCell>
                                  <TableCell>
                                    <Button variant="destructive" size="sm" onClick={async () => {
                                      if (confirm('Are you sure you want to remove this feature from the plan?')) {
                                        await handleDeletePlanFeature(pf.id);
                                      }
                                    }}>Remove</Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <p>Plan not found.</p>
                );
              })()}
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Feature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={newFeature.name}
                    onChange={e => setNewFeature({ ...newFeature, name: e.target.value })}
                    placeholder="e.g., AI Resume Builder"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <Input
                    value={newFeature.code}
                    onChange={e => setNewFeature({ ...newFeature, code: e.target.value })}
                    placeholder="e.g., ai_resume_builder"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={newFeature.description}
                    onChange={e => setNewFeature({ ...newFeature, description: e.target.value })}
                    placeholder="e.g., AI-powered resume creation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Feature Type</label>
                  <Select
                    value={newFeature.featureType}
                    onValueChange={(value: 'ESSENTIAL' | 'ADVANCED' | 'PROFESSIONAL') => setNewFeature({ ...newFeature, featureType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feature type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESSENTIAL">Essential</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                      <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost Factor</label>
                  <Input
                    value={newFeature.costFactor}
                    onChange={e => setNewFeature({ ...newFeature, costFactor: e.target.value })}
                    placeholder="e.g., 1.0000"
                  />
                </div>
                <div className="flex items-center space-x-2 col-span-full">
                  <input
                    type="checkbox"
                    checked={newFeature.isCountable}
                    onChange={e => setNewFeature({ ...newFeature, isCountable: e.target.checked })}
                  />
                  <label className="text-sm font-medium">Countable</label>
                </div>
                <div className="flex items-center space-x-2 col-span-full">
                  <input
                    type="checkbox"
                    checked={newFeature.isTokenBased || false}
                    onChange={e => setNewFeature({ ...newFeature, isTokenBased: e.target.checked })}
                  />
                  <label className="text-sm font-medium">Token Based</label>
                </div>
                <Button onClick={handleAddFeature} className="w-full md:w-auto col-span-full md:col-span-1">
                  {isEditingFeature ? 'Update Feature' : 'Add Feature'}
                </Button>
                {isEditingFeature && (
                  <Button 
                    variant="outline" 
                    onClick={resetFeatureForm} 
                    className="w-full md:w-auto col-span-full md:col-span-1 ml-2"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Countable</TableHead>
                    <TableHead>Token Based</TableHead>
                    <TableHead>Cost Factor</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No features found
                      </TableCell>
                    </TableRow>
                  ) : (
                    features.map(feature => (
                      <TableRow key={feature.id}>
                        <TableCell>{feature.id}</TableCell>
                        <TableCell>{feature.name}</TableCell>
                        <TableCell>{feature.code}</TableCell>
                        <TableCell>{feature.description}</TableCell>
                        <TableCell>{feature.featureType}</TableCell>
                        <TableCell>{feature.isCountable ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{feature.isTokenBased ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{feature.costFactor}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditFeature(feature)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={async () => {
                              if (confirm('Are you sure you want to delete this feature?')) {
                                await handleDeleteFeature(feature.id);
                              }
                            }}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plan-features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Feature to Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <PlanFeatureForm />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Limit Type</TableHead>
                    <TableHead>Limit Value</TableHead>
                    <TableHead>Reset Frequency</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planFeatures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No plan features found
                      </TableCell>
                    </TableRow>
                  ) : (
                    planFeatures.map(pf => (
                      <TableRow key={pf.id}>
                        <TableCell>{pf.id}</TableCell>
                        <TableCell>{pf.planName || 'Unknown Plan'}</TableCell>
                        <TableCell>{pf.featureName || 'Unknown Feature'}</TableCell>
                        <TableCell>{pf.limitType}</TableCell>
                        <TableCell>{pf.limitValue ?? 'N/A'}</TableCell>
                        <TableCell>{pf.resetFrequency}</TableCell>
                        <TableCell>
                          {pf.isEnabled 
                            ? <span className="text-green-600 font-medium">Yes</span>
                            : <span className="text-red-600 font-bold flex items-center">
                                No
                                <svg className="h-4 w-4 ml-1 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </span>
                          }
                          {!pf.isEnabled && 
                            <div className="text-xs text-red-500 mt-1">
                              Feature not accessible to users!
                            </div>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              setSelectedPlanId(pf.planId);
                              setNewPlanFeature({
                                ...pf,
                                featureId: pf.featureId,
                              });
                              setIsEditingPlanFeature(true);
                              setEditingPlanFeatureId(pf.id);
                            }}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={async () => {
                              if (confirm('Are you sure you want to delete this plan feature?')) {
                                await handleDeletePlanFeature(pf.id);
                              }
                            }}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionManagement; 