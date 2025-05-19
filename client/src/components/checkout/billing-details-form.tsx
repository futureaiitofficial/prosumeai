import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { useAuth } from '@/hooks/use-auth';

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

// Country-specific field labels, placeholders and validation patterns
const countryFields = {
  // United States
  US: {
    city: { label: 'City', placeholder: 'New York' },
    state: { label: 'State', placeholder: 'NY' },
    postalCode: { 
      label: 'ZIP Code', 
      placeholder: '10001', 
      pattern: /^\d{5}(-\d{4})?$/, 
      message: 'Please enter a valid ZIP code (e.g., 10001 or 10001-1234)' 
    },
    addressLine1: { label: 'Street Address', placeholder: '123 Main St' },
    phoneNumber: { 
      label: 'Phone Number', 
      placeholder: '5551234567', 
      pattern: /^[0-9+]+$/, 
      message: 'Please enter digits only (no spaces, dashes or parentheses) for payment compatibility' 
    },
    taxId: { label: 'Tax ID (EIN)', placeholder: 'XX-XXXXXXX' }
  },
  // United Kingdom
  GB: {
    city: { label: 'City/Town', placeholder: 'London' },
    state: { label: 'County', placeholder: 'Greater London' },
    postalCode: { 
      label: 'Postcode', 
      placeholder: 'SW1A 1AA', 
      pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i, 
      message: 'Please enter a valid UK postcode' 
    },
    addressLine1: { label: 'Street Address', placeholder: '10 Downing Street' },
    phoneNumber: { 
      label: 'Phone Number', 
      placeholder: '+447123456789', 
      pattern: /^[0-9+]+$/, 
      message: 'Please enter digits only (and + symbol if needed) for payment compatibility' 
    },
    taxId: { label: 'VAT Number', placeholder: 'GB123456789' }
  },
  // Canada
  CA: {
    city: { label: 'City', placeholder: 'Toronto' },
    state: { label: 'Province', placeholder: 'ON' },
    postalCode: { 
      label: 'Postal Code', 
      placeholder: 'M5V 2H1', 
      pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 
      message: 'Please enter a valid Canadian postal code (e.g., M5V 2H1)' 
    },
    addressLine1: { label: 'Street Address', placeholder: '123 Queen Street' },
    phoneNumber: { 
      label: 'Phone Number', 
      placeholder: '(416) 123-4567', 
      pattern: /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, 
      message: 'Please enter a valid Canadian phone number' 
    },
    taxId: { label: 'Business Number', placeholder: '123456789 RC0001' }
  },
  // Australia
  AU: {
    city: { label: 'City/Suburb', placeholder: 'Sydney' },
    state: { label: 'State/Territory', placeholder: 'NSW' },
    postalCode: { 
      label: 'Postcode', 
      placeholder: '2000', 
      pattern: /^\d{4}$/, 
      message: 'Please enter a valid 4-digit Australian postcode' 
    },
    addressLine1: { label: 'Street Address', placeholder: '123 George Street' },
    phoneNumber: { 
      label: 'Phone Number', 
      placeholder: '02 1234 5678', 
      pattern: /^(?:\+61|0)[2-478](?:[ -]?[0-9]){8}$/, 
      message: 'Please enter a valid Australian phone number' 
    },
    taxId: { label: 'ABN', placeholder: '12 345 678 901' }
  },
  // India
  IN: {
    city: { label: 'City', placeholder: 'Mumbai' },
    state: { label: 'State', placeholder: 'Maharashtra' },
    postalCode: { 
      label: 'PIN Code', 
      placeholder: '400001', 
      pattern: /^\d{6}$/, 
      message: 'Please enter a valid 6-digit Indian PIN code' 
    },
    addressLine1: { label: 'Street Address', placeholder: '123 Marine Drive' },
    phoneNumber: { 
      label: 'Phone Number', 
      placeholder: '9876543210', 
      pattern: /^(?:\+91|0)?[6789]\d{9}$/, 
      message: 'Please enter a valid Indian phone number' 
    },
    taxId: { label: 'GST Number', placeholder: '22AAAAA0000A1Z5' }
  },
  // Germany
  DE: {
    city: { label: 'City', placeholder: 'Berlin' },
    state: { label: 'State', placeholder: 'Berlin' },
    postalCode: { 
      label: 'Postal Code', 
      placeholder: '10115', 
      pattern: /^\d{5}$/, 
      message: 'Please enter a valid 5-digit German postal code' 
    },
    addressLine1: { label: 'Street Address', placeholder: 'Unter den Linden 123' },
    phoneNumber: { 
      label: 'Phone Number', 
      placeholder: '030 12345678', 
      pattern: /^(?:\+49|0)[0-9]{3,5}[\s-]?[0-9]{6,8}$/, 
      message: 'Please enter a valid German phone number' 
    },
    taxId: { label: 'VAT ID', placeholder: 'DE123456789' }
  },
  // Default (used for all other countries)
  default: {
    city: { label: 'City', placeholder: 'City' },
    state: { label: 'State/Province/Region', placeholder: 'State/Province/Region' },
    postalCode: { 
      label: 'Postal/ZIP Code', 
      placeholder: 'Postal Code', 
      pattern: /^[a-zA-Z0-9\s-]{3,10}$/, 
      message: 'Please enter a valid postal code' 
    },
    addressLine1: { label: 'Address Line 1', placeholder: 'Address Line 1' },
    phoneNumber: { 
      label: 'Phone Number', 
      placeholder: 'Phone Number', 
      pattern: /^[0-9+]+$/, 
      message: 'Please enter digits only (and + symbol if needed) for Razorpay compatibility' 
    },
    taxId: { label: 'Tax/VAT ID', placeholder: 'Tax/VAT ID' }
  }
};

// Define the base schema type
const billingFormSchema = z.object({
  fullName: z.string(),
  country: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  phoneNumber: z.string().optional(),
  taxId: z.string().optional(),
  companyName: z.string().optional(),
});

// Use the base schema for the form values type
type BillingFormValues = z.infer<typeof billingFormSchema>;

// Helper function to get dynamic validation schema based on selected country
const getDynamicValidationSchema = (country: string) => {
  const countryConfig = countryFields[country as keyof typeof countryFields] || countryFields.default;
  
  return billingFormSchema.extend({
    fullName: z.string().min(2, 'Full name is required'),
    country: z.string().min(2, 'Country is required'),
    addressLine1: z.string().min(3, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    postalCode: z.string().min(3, 'Postal code is required')
      .refine(
        (val) => countryConfig.postalCode.pattern.test(val), 
        { message: countryConfig.postalCode.message }
      ),
    phoneNumber: z.string().optional()
      .refine(
        (val) => !val || countryConfig.phoneNumber.pattern.test(val),
        { message: countryConfig.phoneNumber.message }
      ),
  });
};

interface BillingDetailsFormProps {
  existingDetails: BillingDetails | null;
  onDetailsSubmitted: (details: BillingDetails) => void;
  onCancel: () => void;
  [key: string]: any; // Allow for additional props like data attributes
}

// Helper function to format input based on pattern
const formatInput = (value: string, country: string, field: 'phoneNumber' | 'postalCode'): string => {
  const countryConfig = countryFields[country as keyof typeof countryFields] || countryFields.default;
  
  // Remove non-numeric characters for phone and postal code except in specific cases
  let formattedValue = value;
  
  if (field === 'phoneNumber') {
    // For all phone numbers, only allow digits and + for payment gateway compatibility
    // Keep only digits and + symbol
    const cleanedPhoneNumber = value.replace(/[^0-9+]/g, '');
    
    // Ensure only one + and it's at the beginning
    if (cleanedPhoneNumber.includes('+')) {
      const parts = cleanedPhoneNumber.split('+');
      // If multiple + signs, keep only the first one
      if (parts.length > 2) {
        return '+' + parts.slice(1).join('');
      }
      // Ensure + is only at the beginning
      if (cleanedPhoneNumber.indexOf('+') !== 0) {
        return '+' + cleanedPhoneNumber.replace(/\+/g, '');
      }
    }
    
    return cleanedPhoneNumber;
  } else if (field === 'postalCode') {
    // For US ZIP codes, format properly
    if (country === 'US') {
      // Allow only numeric digits and hyphen, max length of 10 chars (5 digits + hyphen + 4 digits)
      const numericAndHyphen = value.replace(/[^0-9-]/g, '');
      
      // Ensure proper ZIP+4 format (allow only one hyphen at position 5)
      if (numericAndHyphen.includes('-')) {
        const parts = numericAndHyphen.split('-');
        if (parts.length > 2) {
          // If multiple hyphens, keep only the first one
          return `${parts[0].slice(0, 5)}-${parts.slice(1).join('').slice(0, 4)}`;
        } else {
          // Ensure first part is max 5 digits, second part is max 4 digits
          return `${parts[0].slice(0, 5)}-${parts[1].slice(0, 4)}`;
        }
      }
      
      // If no hyphen yet and we have more than 5 digits, automatically add hyphen
      if (numericAndHyphen.length > 5 && !numericAndHyphen.includes('-')) {
        return `${numericAndHyphen.slice(0, 5)}-${numericAndHyphen.slice(5, 9)}`;
      }
      
      // Otherwise just cap at 5 digits
      return numericAndHyphen.slice(0, 5);
    }
    
    // For UK postal codes, convert to uppercase and format properly (e.g., SW1A 1AA)
    if (country === 'GB') {
      let ukPostcode = value.toUpperCase();
      
      // Remove all spaces first
      ukPostcode = ukPostcode.replace(/\s/g, '');
      
      // Add space at the correct position if length is sufficient
      if (ukPostcode.length > 3) {
        // UK postcodes are of the form A(A)N(A/N) NAA
        // We need to insert a space before the last 3 characters
        const outwardCode = ukPostcode.slice(0, -3);
        const inwardCode = ukPostcode.slice(-3);
        return `${outwardCode} ${inwardCode}`;
      }
      
      return ukPostcode;
    }
    
    // For Canadian postal codes, convert to proper format (e.g., A1A 1A1) and uppercase
    if (country === 'CA') {
      const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (cleaned.length > 3) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
      }
      return cleaned;
    }
    
    // For Australian postcodes (4 digits)
    if (country === 'AU') {
      return value.replace(/\D/g, '').slice(0, 4);
    }
    
    // For Indian PIN codes (6 digits)
    if (country === 'IN') {
      return value.replace(/\D/g, '').slice(0, 6);
    }
    
    // For German postal codes (5 digits)
    if (country === 'DE') {
      return value.replace(/\D/g, '').slice(0, 5);
    }
  }
  
  return formattedValue;
};

export default function BillingDetailsForm({ 
  existingDetails, 
  onDetailsSubmitted, 
  onCancel,
  ...otherProps // Collect any additional props like data attributes
}: BillingDetailsFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fieldConfig, setFieldConfig] = useState(countryFields.US);
  const [selectedCountry, setSelectedCountry] = useState<string>(existingDetails?.country || 'US');
  
  // Get user data from auth context
  const auth = useAuth();
  // Check if user is logged in
  const userIsLoggedIn = !!auth.user;

  // Add component initialization logging
  console.log("BillingDetailsForm rendered with existing details:", existingDetails ? {
    fullName: existingDetails.fullName,
    country: existingDetails.country,
    hasAddress: !!existingDetails.addressLine1
  } : 'none');

  // Use dynamic validation schema based on selected country
  const form = useForm<BillingFormValues>({
    resolver: zodResolver(getDynamicValidationSchema(selectedCountry)),
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

  // Force reset of form when existingDetails changes
  useEffect(() => {
    if (existingDetails) {
      console.log("Resetting form with existing details", {
        fullName: existingDetails.fullName,
        country: existingDetails.country
      });

      form.reset({
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
      });
      
      // If country changes, update field config
      if (existingDetails.country && existingDetails.country !== selectedCountry) {
        setSelectedCountry(existingDetails.country);
        const newConfig = countryFields[existingDetails.country as keyof typeof countryFields] || countryFields.default;
        setFieldConfig(newConfig);
      }
    }
  }, [existingDetails, form]);

  // Watch for country changes to update field labels and validation schema
  const watchedCountry = useWatch({
    control: form.control,
    name: 'country',
    defaultValue: selectedCountry
  }) as string;
  
  // Update field config and validation schema when country changes
  useEffect(() => {
    if (watchedCountry && watchedCountry !== selectedCountry) {
      setSelectedCountry(watchedCountry);
      const newConfig = countryFields[watchedCountry as keyof typeof countryFields] || countryFields.default;
      setFieldConfig(newConfig);
      
      // Trigger revalidation when country changes
      form.trigger();
    }
  }, [watchedCountry, form, selectedCountry]);

  const onSubmit = async (values: BillingFormValues) => {
    setIsSubmitting(true);
    try {
      // Check if user is authenticated before trying to save billing details
      if (!userIsLoggedIn) {
        // Store billing details in session/local storage for later use after authentication
        const billingDetailsKey = 'pending_billing_details';
        sessionStorage.setItem(billingDetailsKey, JSON.stringify(values));
        
        toast({
          title: 'Authentication required',
          description: 'Please log in or register to continue with your billing information.',
        });
        
        // Redirect to login/register page or show auth modal
        window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
      }
      
      // Save billing details using the PaymentService
      const savedDetails = await PaymentService.saveBillingDetails(values as BillingDetails);
      toast({
        title: 'Billing details saved',
        description: 'Your billing information has been saved successfully.',
      });
      onDetailsSubmitted(savedDetails);
    } catch (error: any) {
      console.error('Error saving billing details:', error);
      
      // Handle authentication errors specifically
      if (error.response?.status === 401) {
        toast({
          title: 'Authentication required',
          description: 'Please log in or register to continue with your billing information.',
          variant: 'destructive',
        });
        
        // Redirect to auth page
        window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
      }
      
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

  // Format input values for specific fields
  const handleInputFormat = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'phoneNumber' | 'postalCode') => {
    // Only format if there's an actual value
    if (e.target.value.trim() === '') {
      form.setValue(fieldName, '');
      return;
    }
    
    // Ensure we're not getting an encrypted value
    if (e.target.value.includes(':') && e.target.value.split(':').length === 3) {
      form.setValue(fieldName, '');
      return;
    }
    
    const formatted = formatInput(e.target.value, selectedCountry, fieldName);
    form.setValue(fieldName, formatted);
  };

  return (
    <div className="space-y-6" data-billing-form tabIndex={-1} {...otherProps}>
      <Form {...form} key={`billing-form-${selectedCountry}`}>
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset postal code and phone when country changes to avoid validation errors
                      form.setValue('postalCode', '');
                      form.setValue('phoneNumber', '');
                    }} 
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
                  <FormLabel>{fieldConfig.addressLine1.label}</FormLabel>
                  <FormControl>
                    <Input placeholder={fieldConfig.addressLine1.placeholder} {...field} />
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
                  <FormLabel>{fieldConfig.city.label}</FormLabel>
                  <FormControl>
                    <Input placeholder={fieldConfig.city.placeholder} {...field} />
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
                  <FormLabel>{fieldConfig.state.label}</FormLabel>
                  <FormControl>
                    <Input placeholder={fieldConfig.state.placeholder} {...field} />
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
                  <FormLabel>{fieldConfig.postalCode.label}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={fieldConfig.postalCode.placeholder} 
                      {...field} 
                      value={field.value}
                      onChange={(e) => {
                        handleInputFormat(e, 'postalCode');
                      }}
                      onKeyDown={(e) => {
                        // Common keys to always allow: backspace, delete, tab, escape, enter, navigation
                        const commonAllowedKeys = [8, 9, 13, 27, 46, 37, 38, 39, 40];
                        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        const ctrlCombos = (e.keyCode >= 65 && e.keyCode <= 90 && e.ctrlKey === true);
                        // Allow: home, end, page up, page down
                        const navKeys = (e.keyCode >= 35 && e.keyCode <= 36);
                        
                        if (commonAllowedKeys.indexOf(e.keyCode) !== -1 || ctrlCombos || navKeys) {
                          return;
                        }
                        
                        // Country-specific restrictions
                        switch(selectedCountry) {
                          case 'US':
                            // For US, allow only numbers and hyphen
                            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
                                (e.keyCode < 96 || e.keyCode > 105) && 
                                e.keyCode !== 189) { // 189 is hyphen
                              e.preventDefault();
                            }
                            break;
                            
                          case 'CA':
                            // For Canada, allow letters, numbers and space
                            const isLetter = (e.keyCode >= 65 && e.keyCode <= 90);
                            const isNumber = (e.keyCode >= 48 && e.keyCode <= 57) || 
                                            (e.keyCode >= 96 && e.keyCode <= 105);
                            const isSpace = e.keyCode === 32;
                            
                            if (!isLetter && !isNumber && !isSpace) {
                              e.preventDefault();
                            }
                            break;
                            
                          case 'GB':
                            // For UK, allow letters, numbers and space
                            const isUKLetter = (e.keyCode >= 65 && e.keyCode <= 90);
                            const isUKNumber = (e.keyCode >= 48 && e.keyCode <= 57) || 
                                             (e.keyCode >= 96 && e.keyCode <= 105);
                            const isUKSpace = e.keyCode === 32;
                            
                            if (!isUKLetter && !isUKNumber && !isUKSpace) {
                              e.preventDefault();
                            }
                            break;
                            
                          case 'AU':
                            // For Australia, allow only numbers
                            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
                                (e.keyCode < 96 || e.keyCode > 105)) {
                              e.preventDefault();
                            }
                            break;
                            
                          case 'IN':
                            // For India, allow only numbers
                            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
                                (e.keyCode < 96 || e.keyCode > 105)) {
                              e.preventDefault();
                            }
                            break;
                            
                          case 'DE':
                            // For Germany, allow only numbers
                            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
                                (e.keyCode < 96 || e.keyCode > 105)) {
                              e.preventDefault();
                            }
                            break;
                            
                            // Add more countries as needed
                            
                            default:
                              // For other countries, allow alphanumeric, space, and hyphen
                              const isDefaultLetter = (e.keyCode >= 65 && e.keyCode <= 90);
                              const isDefaultNumber = (e.keyCode >= 48 && e.keyCode <= 57) || 
                                                   (e.keyCode >= 96 && e.keyCode <= 105);
                              const isDefaultSpace = e.keyCode === 32;
                              const isDefaultHyphen = e.keyCode === 189 || e.keyCode === 109;
                              
                              if (!isDefaultLetter && !isDefaultNumber && !isDefaultSpace && !isDefaultHyphen) {
                                e.preventDefault();
                              }
                              break;
                        }
                      }}
                    />
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
                  <div className="text-xs text-amber-600 mb-1">
                    For payment compatibility, use only digits and optionally a + at the beginning
                  </div>
                  <FormControl>
                    <Input 
                      placeholder={fieldConfig.phoneNumber.placeholder} 
                      {...field} 
                      value={field.value}
                      onChange={(e) => {
                        handleInputFormat(e, 'phoneNumber');
                      }}
                      onKeyDown={(e) => {
                        // Allow: backspace, delete, tab, escape, enter, navigation keys
                        if ([8, 9, 13, 27, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                            (e.keyCode >= 65 && e.keyCode <= 90 && e.ctrlKey === true) ||
                            // Allow: home, end, page up, page down
                            (e.keyCode >= 35 && e.keyCode <= 36)) {
                          return;
                        }
                        
                        const plusKeyCode = 187; // + key
                        const numpadPlusKeyCode = 107; // + key on numpad
                        
                        // Allow + sign (with or without shift), but only if it's at the beginning
                        if ((e.keyCode === plusKeyCode && e.shiftKey) || e.keyCode === numpadPlusKeyCode) {
                          // Only allow + at the beginning
                          if (field.value && field.value.length > 0 && !field.value.startsWith('+')) {
                            e.preventDefault();
                          }
                          return;
                        }
                        
                        // If it's not a number, prevent the default behavior
                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
                            (e.keyCode < 96 || e.keyCode > 105)) {
                          e.preventDefault();
                        }
                      }}
                    />
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
                  <FormLabel>Company Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company" {...field} />
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
                  <FormLabel>{fieldConfig.taxId.label} (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder={fieldConfig.taxId.placeholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
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
              ) : (
                <>Continue</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 