import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentService } from '@/services/payment-service';
import { toast } from '@/hooks/use-toast';
import { BillingDetails } from '@/services/payment-service';
import { Loader2 } from 'lucide-react';

// List of countries for the dropdown
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

// Create Zod schema for form validation
const billingDetailsSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  country: z.string().min(2, 'Country is required'),
  addressLine1: z.string().min(3, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  phoneNumber: z.string().optional(),
  taxId: z.string().optional(),
  companyName: z.string().optional(),
});

type BillingFormValues = z.infer<typeof billingDetailsSchema>;

interface BillingDetailsFormProps {
  existingDetails: BillingDetails | null;
  onDetailsSubmitted: (details: BillingDetails) => void;
  onCancel: () => void;
}

export default function BillingDetailsForm({ 
  existingDetails, 
  onDetailsSubmitted, 
  onCancel 
}: BillingDetailsFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize the form with existing details if available
  const form = useForm<BillingFormValues>({
    resolver: zodResolver(billingDetailsSchema),
    defaultValues: existingDetails ? {
      fullName: existingDetails.fullName || '',
      country: existingDetails.country || '',
      addressLine1: existingDetails.addressLine1 || '',
      addressLine2: existingDetails.addressLine2 || '',
      city: existingDetails.city || '',
      state: existingDetails.state || '',
      postalCode: existingDetails.postalCode || '',
      phoneNumber: existingDetails.phoneNumber || '',
      taxId: existingDetails.taxId || '',
      companyName: existingDetails.companyName || '',
    } : {
      fullName: '',
      country: 'US',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      phoneNumber: '',
      taxId: '',
      companyName: '',
    }
  });

  const onSubmit = async (values: BillingFormValues) => {
    setIsSubmitting(true);
    try {
      // Save billing details using the PaymentService
      const savedDetails = await PaymentService.saveBillingDetails(values);
      toast({
        title: 'Billing details saved',
        description: 'Your billing information has been saved successfully.',
      });
      onDetailsSubmitted(savedDetails);
    } catch (error: any) {
      console.error('Error saving billing details:', error);
      
      // Provide a more specific error message based on the response if available
      const errorMessage = 
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'There was a problem saving your billing information. Please try again.';
      
      toast({
        title: 'Error saving billing details',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // If we get a 401 Unauthorized error, the session might have expired
      if (error.response?.status === 401) {
        toast({
          title: 'Session expired',
          description: 'Your session has expired. Please refresh the page and try again.',
          variant: 'destructive',
        });
      }
      
      // If we get a network error, provide a specific message
      if (error.message?.includes('Network Error')) {
        toast({
          title: 'Network Error',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Billing Information</CardTitle>
        <CardDescription>
          Please provide your billing details for payment processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apt 4B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555-123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Tax/VAT ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : existingDetails ? 'Update Details' : 'Save & Continue'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 