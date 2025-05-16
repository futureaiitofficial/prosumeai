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
import { useLocation } from "wouter";
import { TokenUsage } from "@/components/ui/token-usage";
import BillingDetailsForm from "@/components/checkout/billing-details-form";
import { Loader2 } from "lucide-react";
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
  const [, navigate] = useLocation();
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
        return await PaymentService.getBillingDetails();
      } catch (error) {
        console.error('Error fetching billing details:', error);
        return null;
      }
    },
    enabled: !!user,
  });

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

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="billing">Billing Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
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
                      // Update the billing details in the cache
                      queryClient.setQueryData(['billingDetails'], details);
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
                            <p className="text-sm text-muted-foreground">{billingDetailsQuery.data?.fullName}</p>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium">Company</h3>
                            <p className="text-sm text-muted-foreground">{billingDetailsQuery.data?.companyName || 'Not provided'}</p>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium">Address</h3>
                            <p className="text-sm text-muted-foreground">
                              {billingDetailsQuery.data?.addressLine1}<br />
                              {billingDetailsQuery.data?.addressLine2 && <>{billingDetailsQuery.data?.addressLine2}<br /></>}
                              {billingDetailsQuery.data?.city}, {billingDetailsQuery.data?.state} {billingDetailsQuery.data?.postalCode}<br />
                                                             {countries.find((c: CountryOption) => c.value === billingDetailsQuery.data?.country)?.label || billingDetailsQuery.data?.country}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium">Contact</h3>
                            <p className="text-sm text-muted-foreground">
                              Phone: {billingDetailsQuery.data?.phoneNumber || 'Not provided'}<br />
                              Tax ID: {billingDetailsQuery.data?.taxId || 'Not provided'}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setEditingBilling(true)}
                          variant="outline"
                        >
                          Edit Billing Information
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-4">No billing information on file.</p>
                        <Button onClick={() => setEditingBilling(true)}>
                          Add Billing Information
                        </Button>
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
          
          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Usage & Limits</CardTitle>
                <CardDescription>
                  Monitor your AI token usage and subscription limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">AI Token Usage</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your current AI token usage across different features. These limits reset according to your subscription plan.
                  </p>
                  <TokenUsage className="mt-4" />
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={() => navigate("/user/subscription")}>
                      View Subscription Details
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Feature Usage</h3>
                  <p className="text-sm text-muted-foreground">
                    Feature-specific AI token usage for key functionality
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Resume Builder</h4>
                      <TokenUsage featureCode="resume" />
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Cover Letter Generation</h4>
                      <TokenUsage featureCode="GENERATE_COVER_LETTER" />
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Job Application Analysis</h4>
                      <TokenUsage featureCode="job_analysis" />
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Keyword Extraction</h4>
                      <TokenUsage featureCode="keyword_extraction" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DefaultLayout>
  );
}
