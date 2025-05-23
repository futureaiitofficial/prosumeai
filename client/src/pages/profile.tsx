import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import DefaultLayout from "@/components/layouts/default-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, CreditCard, Shield, Loader2, Check, CheckCircle } from "lucide-react";

import BillingDetailsForm from "@/components/checkout/billing-details-form";
import { PaymentService } from "@/services/payment-service";
import type { BillingDetails } from "@/services/payment-service";
import { cn } from "@/lib/utils";

// List of countries for billing information display
interface CountryOption {
  value: string;
  label: string;
}

const countries: CountryOption[] = [
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

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get tab from URL query parameter
  const [defaultTab, setDefaultTab] = useState<string>('personal');
  
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    username: user?.username || "",
  });
  const [editingBilling, setEditingBilling] = useState(false);

  // Query to fetch billing details
  const billingDetailsQuery = useQuery({
    queryKey: ['billingDetails'],
    queryFn: async () => {
      try {
        console.log('Fetching billing details for user');
        const details = await PaymentService.getBillingDetails();
        console.log('Received billing details:', details ? 'Success' : 'No details found');
        return details;
      } catch (error) {
        console.error('Error fetching billing details:', error);
        return null;
      }
    },
    enabled: !!user,
    // Keep the data for 1 hour in the cache
    staleTime: 60 * 60 * 1000,
    // Never delete the data from cache automatically
    gcTime: Infinity,
    // Refetch on window focus and reconnect
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  
  // Handle initial data loading and tab selection
  useEffect(() => {
    // Check if URL has a tab parameter
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    
    // Set the active tab if it's valid
    if (tabParam && ['personal', 'billing', 'security'].includes(tabParam)) {
      setDefaultTab(tabParam);
      
      // If billing tab is selected, make sure we have fresh data
      if (tabParam === 'billing') {
        console.log('Billing tab selected, ensuring fresh data...');
        // Prefetch billing data
        billingDetailsQuery.refetch().catch(err => {
          console.error('Error prefetching billing details:', err);
        });
      }
    }
    
    // Ensure we have billing data regardless of tab
    if (user && !billingDetailsQuery.data && !billingDetailsQuery.isLoading) {
      console.log('No billing data in cache, fetching...');
      billingDetailsQuery.refetch().catch(err => {
        console.error('Error fetching initial billing details:', err);
      });
    }
  }, [user, billingDetailsQuery]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const res = await apiRequest("PUT", `/api/user/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/user"], {
        ...user,
        ...userData,
      });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  return (
    <DefaultLayout pageTitle="Profile" pageDescription="Manage your personal information and account settings">
      <div className="grid gap-4 md:gap-6">
        {/* Profile Header Card - Improved Mobile Layout */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-white dark:ring-slate-800 shadow-lg">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} alt={user?.username} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-lg">
                  {user?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <CardTitle className="text-xl font-bold">{user?.fullName || user?.username}</CardTitle>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <CardDescription className="text-base">{user?.email}</CardDescription>
                  {user?.emailVerified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <CheckCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 transition-colors" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Email verified</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Modern Tab Interface */}
        <Tabs defaultValue={defaultTab} className="w-full" onValueChange={(value) => {
          // Update URL when tab changes
          const url = new URL(window.location.href);
          url.searchParams.set('tab', value);
          window.history.pushState({}, '', url.toString());
        }}>
          {/* Mobile-First Tab Navigation */}
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
              <TabsTrigger 
                value="personal" 
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg transition-all",
                  "data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm",
                  "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-indigo-300",
                  "hover:bg-white/50 dark:hover:bg-slate-800",
                  "mb-1 sm:mb-0"
                )}
              >
                <User className="h-4 w-4" />
                <span className="hidden xs:inline">Personal</span>
                <span className="xs:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger 
                value="billing"
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg transition-all",
                  "data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm",
                  "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-indigo-300",
                  "hover:bg-white/50 dark:hover:bg-slate-800",
                  "mb-1 sm:mb-0"
                )}
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden xs:inline">Billing</span>
                <span className="xs:hidden">Bills</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg transition-all",
                  "data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm",
                  "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-indigo-300",
                  "hover:bg-white/50 dark:hover:bg-slate-800"
                )}
              >
                <Shield className="h-4 w-4" />
                <span className="hidden xs:inline">Security</span>
                <span className="xs:hidden">Secure</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="personal" className="mt-0">
            <Card className="border-none shadow-lg">
              <form onSubmit={handleSubmit}>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-indigo-600" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-4 md:p-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="h-11 rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={profileData.email}
                          onChange={handleChange}
                          disabled
                          className="h-11 rounded-lg bg-slate-50 dark:bg-slate-800/50 pr-10"
                        />
                        {user?.emailVerified && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <Check className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 transition-colors" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Email verified</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Email cannot be changed for security reasons
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={profileData.username}
                        onChange={handleChange}
                        disabled
                        className="h-11 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Username cannot be changed
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-slate-800/20 rounded-b-lg p-4 md:p-6">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing" className="mt-0">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Billing Information
                </CardTitle>
                <CardDescription>
                  Manage your billing details for invoices and subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {billingDetailsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                      <p className="text-sm text-slate-500">Loading billing information...</p>
                    </div>
                  </div>
                ) : editingBilling ? (
                  <BillingDetailsForm
                    existingDetails={billingDetailsQuery.data || null}
                    onDetailsSubmitted={(details) => {
                      console.log('Billing details updated, refreshing UI');
                      queryClient.setQueryData(['billingDetails'], details);
                      queryClient.invalidateQueries({ queryKey: ['billingDetails'] });
                      billingDetailsQuery.refetch().then(() => {
                        console.log('Billing details refetched successfully');
                      }).catch(err => {
                        console.error('Error refetching billing details:', err);
                      });
                      
                      setEditingBilling(false);
                      
                      toast({
                        title: 'Billing details updated',
                        description: 'Your billing information has been updated successfully.'
                      });
                    }}
                    onCancel={() => setEditingBilling(false)}
                  />
                ) : (
                  <div className="space-y-6">
                    {billingDetailsQuery.data ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-1 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Full Name</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {
                                (billingDetailsQuery.data?.fullName && 
                                 typeof billingDetailsQuery.data?.fullName === 'string' && 
                                 !billingDetailsQuery.data?.fullName.includes(':'))
                                  ? billingDetailsQuery.data?.fullName
                                  : 'Not provided'
                              }
                            </p>
                          </div>
                          <div className="space-y-1 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Company</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {
                                (billingDetailsQuery.data?.companyName && 
                                 typeof billingDetailsQuery.data?.companyName === 'string' && 
                                 !billingDetailsQuery.data?.companyName.includes(':'))
                                  ? billingDetailsQuery.data?.companyName
                                  : 'Not provided'
                              }
                            </p>
                          </div>
                          <div className="space-y-1 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg sm:col-span-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Address</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {
                                (billingDetailsQuery.data?.addressLine1 && 
                                 typeof billingDetailsQuery.data?.addressLine1 === 'string' && 
                                 !billingDetailsQuery.data?.addressLine1.includes(':'))
                                  ? billingDetailsQuery.data?.addressLine1
                                  : 'Address not provided'
                              }<br />
                              {
                                (billingDetailsQuery.data?.addressLine2 && 
                                 typeof billingDetailsQuery.data?.addressLine2 === 'string' && 
                                 !billingDetailsQuery.data?.addressLine2.includes(':')) 
                                  ? <>{billingDetailsQuery.data?.addressLine2}<br /></>
                                  : null
                              }
                              {
                                (billingDetailsQuery.data?.city && 
                                 billingDetailsQuery.data?.state && 
                                 billingDetailsQuery.data?.postalCode)
                                  ? `${billingDetailsQuery.data?.city}, ${billingDetailsQuery.data?.state} ${billingDetailsQuery.data?.postalCode}`
                                  : 'Location not provided'
                              }<br />
                              {countries.find((c: CountryOption) => c.value === billingDetailsQuery.data?.country)?.label || billingDetailsQuery.data?.country}
                            </p>
                          </div>
                          <div className="space-y-1 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg sm:col-span-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contact Information</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              <span className="font-medium">Phone:</span> {
                                (billingDetailsQuery.data?.phoneNumber && 
                                 typeof billingDetailsQuery.data?.phoneNumber === 'string' && 
                                 !billingDetailsQuery.data?.phoneNumber.includes(':'))
                                  ? billingDetailsQuery.data?.phoneNumber
                                  : 'Not provided'
                              }<br />
                              <span className="font-medium">Tax ID:</span> {
                                (billingDetailsQuery.data?.taxId && 
                                 typeof billingDetailsQuery.data?.taxId === 'string' && 
                                 !billingDetailsQuery.data?.taxId.includes(':'))
                                  ? billingDetailsQuery.data?.taxId
                                  : 'Not provided'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={() => setEditingBilling(true)}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
                          >
                            Update Billing Information
                          </Button>
                          
                          <Button
                            onClick={async () => {
                              try {
                                queryClient.removeQueries({ queryKey: ['billingDetails'] });
                                
                                toast({
                                  title: 'Refreshing',
                                  description: 'Fetching latest billing information from the server...'
                                });
                                
                                const result = await billingDetailsQuery.refetch();
                                
                                if (result.isSuccess) {
                                  toast({
                                    title: 'Refreshed Successfully',
                                    description: 'Billing information has been updated with the latest data.'
                                  });
                                } else {
                                  throw new Error('Failed to refresh data');
                                }
                              } catch (error) {
                                console.error('Error refreshing billing details:', error);
                                toast({
                                  title: 'Refresh Failed',
                                  description: 'Could not refresh billing information. Please try again.',
                                  variant: 'destructive'
                                });
                              }
                            }}
                            variant="outline"
                            className="flex-1 sm:flex-none border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                          >
                            Refresh Data
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 mb-6">
                          <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                            <CreditCard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No billing information</h3>
                          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                            Adding billing information helps us generate proper invoices for your subscriptions and payments.
                          </p>
                          <Button 
                            onClick={() => setEditingBilling(true)}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md px-8"
                            size="lg"
                          >
                            Add Billing Information
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="mt-0">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-red-600" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-4 md:p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter your current password"
                      className="h-11 rounded-lg border-slate-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <Separator className="my-6" />
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter your new password"
                      className="h-11 rounded-lg border-slate-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      className="h-11 rounded-lg border-slate-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-800/20 rounded-b-lg p-4 md:p-6">
                <Button 
                  type="button"
                  className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-md"
                >
                  Change Password
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DefaultLayout>
  );
}
