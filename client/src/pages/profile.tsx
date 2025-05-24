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
import { User, CreditCard, Shield, Loader2, Check, CheckCircle, KeyRound } from "lucide-react";
import { Link } from "wouter";

import BillingDetailsForm from "@/components/checkout/billing-details-form";
import TwoFactorSetup from "@/components/auth/TwoFactorSetup";
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
  
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    username: user?.username || "",
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
    <DefaultLayout pageTitle="Profile" pageDescription="Manage your personal information">
      <div className="w-full max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* Profile Header Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 py-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white dark:ring-slate-800 shadow-lg">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} alt={user?.username} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-xl">
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <CardTitle className="text-2xl font-bold">{user?.fullName || user?.username}</CardTitle>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
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

          {/* Personal Information */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="space-y-2 md:col-span-2">
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
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-800/20 rounded-b-lg p-4 md:p-6 flex flex-col sm:flex-row gap-4 sm:justify-between items-center">
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
                
                <Link href="/user/settings">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Go to Advanced Settings
                  </Button>
                </Link>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
}
