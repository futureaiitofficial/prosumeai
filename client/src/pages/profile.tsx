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
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";


import BillingDetailsForm from "@/components/checkout/billing-details-form";
import { Loader2, CreditCard } from "lucide-react";
import { PaymentService } from "@/services/payment-service";
import type { BillingDetails } from "@/services/payment-service";

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
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} alt={user?.username} />
              <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.fullName || user?.username}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue={defaultTab} className="w-full" onValueChange={(value) => {
          // Update URL when tab changes
          const url = new URL(window.location.href);
          url.searchParams.set('tab', value);
          window.history.pushState({}, '', url.toString());
        }}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="billing">Billing Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleChange}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleChange}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={profileData.username}
                      onChange={handleChange}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Username cannot be changed
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-primary" />
                  Billing Information
                </CardTitle>
                <CardDescription>
                  Manage your billing details for invoices and subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {billingDetailsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : editingBilling ? (
                  <BillingDetailsForm
                    existingDetails={billingDetailsQuery.data || null}
                    onDetailsSubmitted={(details) => {
                      console.log('Billing details updated, refreshing UI');
                      // Update the billing details in the cache
                      queryClient.setQueryData(['billingDetails'], details);
                      // Also invalidate the query to ensure a fresh fetch
                      queryClient.invalidateQueries({ queryKey: ['billingDetails'] });
                      // Force a refetch to get fresh data
                      billingDetailsQuery.refetch().then(() => {
                        console.log('Billing details refetched successfully');
                      }).catch(err => {
                        console.error('Error refetching billing details:', err);
                      });
                      
                      // Exit edit mode
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
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium">Full Name</h3>
                            <p className="text-sm text-muted-foreground">
                              {
                                // Check if full name is available and not an encrypted string
                                (billingDetailsQuery.data?.fullName && 
                                 typeof billingDetailsQuery.data?.fullName === 'string' && 
                                 !billingDetailsQuery.data?.fullName.includes(':'))
                                  ? billingDetailsQuery.data?.fullName
                                  : 'Not provided'
                              }
                            </p>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium">Company</h3>
                            <p className="text-sm text-muted-foreground">
                              {
                                // Check if company name is available and not an encrypted string
                                (billingDetailsQuery.data?.companyName && 
                                 typeof billingDetailsQuery.data?.companyName === 'string' && 
                                 !billingDetailsQuery.data?.companyName.includes(':'))
                                  ? billingDetailsQuery.data?.companyName
                                  : 'Not provided'
                              }
                            </p>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium">Address</h3>
                            <p className="text-sm text-muted-foreground">
                              {
                                // Check if address line 1 is available and not an encrypted string
                                (billingDetailsQuery.data?.addressLine1 && 
                                 typeof billingDetailsQuery.data?.addressLine1 === 'string' && 
                                 !billingDetailsQuery.data?.addressLine1.includes(':'))
                                  ? billingDetailsQuery.data?.addressLine1
                                  : 'Address not provided'
                              }<br />
                              {
                                // Check if address line 2 is available and not an encrypted string
                                (billingDetailsQuery.data?.addressLine2 && 
                                 typeof billingDetailsQuery.data?.addressLine2 === 'string' && 
                                 !billingDetailsQuery.data?.addressLine2.includes(':')) 
                                  ? <>{billingDetailsQuery.data?.addressLine2}<br /></>
                                  : null
                              }
                              {
                                // Display city, state, postal code
                                (billingDetailsQuery.data?.city && 
                                 billingDetailsQuery.data?.state && 
                                 billingDetailsQuery.data?.postalCode)
                                  ? `${billingDetailsQuery.data?.city}, ${billingDetailsQuery.data?.state} ${billingDetailsQuery.data?.postalCode}`
                                  : 'Location not provided'
                              }<br />
                              {countries.find((c: CountryOption) => c.value === billingDetailsQuery.data?.country)?.label || billingDetailsQuery.data?.country}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium">Contact</h3>
                            <p className="text-sm text-muted-foreground">
                              Phone: {
                                // Check if phone number is available and not an encrypted string
                                (billingDetailsQuery.data?.phoneNumber && 
                                 typeof billingDetailsQuery.data?.phoneNumber === 'string' && 
                                 !billingDetailsQuery.data?.phoneNumber.includes(':'))
                                  ? billingDetailsQuery.data?.phoneNumber
                                  : 'Not provided'
                              }<br />
                              Tax ID: {
                                // Check if tax ID is available and not an encrypted string
                                (billingDetailsQuery.data?.taxId && 
                                 typeof billingDetailsQuery.data?.taxId === 'string' && 
                                 !billingDetailsQuery.data?.taxId.includes(':'))
                                  ? billingDetailsQuery.data?.taxId
                                  : 'Not provided'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Button
                            onClick={() => setEditingBilling(true)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Update Billing Information
                          </Button>
                          
                          <Button
                            onClick={async () => {
                              try {
                                // Clear the cache first
                                queryClient.removeQueries({ queryKey: ['billingDetails'] });
                                
                                // Show loading state
                                toast({
                                  title: 'Refreshing',
                                  description: 'Fetching latest billing information from the server...'
                                });
                                
                                // Force refresh the billing details from server with a clean cache
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
                          >
                            Refresh Data
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="rounded-lg border border-dashed p-8 mb-6">
                          <p className="text-muted-foreground mb-4">No billing information on file.</p>
                          <p className="text-muted-foreground mb-4">Adding billing information helps us generate proper invoices for your subscriptions and payments.</p>
                          <Button 
                            onClick={() => setEditingBilling(true)}
                            className="bg-primary hover:bg-primary/90"
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
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter your current password"
                  />
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="button">Change Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          

        </Tabs>
      </div>
    </DefaultLayout>
  );
}
