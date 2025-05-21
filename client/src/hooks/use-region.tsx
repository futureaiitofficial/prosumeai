import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PaymentService } from '@/services/payment-service';

export interface UserRegion {
  region: 'GLOBAL' | 'INDIA';
  currency: 'USD' | 'INR';
  country?: string;
  countryName?: string;
  error?: string;
  source?: string;
}

/**
 * Custom hook to get and manage user region information
 * This centralizes the region detection logic so it can be used consistently across the app
 */
export function useRegion() {
  const [userRegion, setUserRegion] = useState<UserRegion>({ region: 'GLOBAL', currency: 'USD' });
  
  const { 
    data: regionData, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery({
    queryKey: ['userRegion'],
    queryFn: async () => {
      try {
        console.log("Fetching user region data...");
        const data = await PaymentService.getUserRegion();
        console.log("User region data:", data);
        return data as UserRegion;
      } catch (err) {
        console.error("Error fetching user region:", err);
        throw err;
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2
  });
  
  // Update the local state when data is fetched
  useEffect(() => {
    if (regionData) {
      console.log("Setting user region from fetched data:", regionData);
      setUserRegion(regionData);
    }
  }, [regionData]);
  
  // Helper methods for common region operations
  const isIndia = userRegion.region === 'INDIA';
  const isGlobal = userRegion.region === 'GLOBAL';
  
  // Format currency based on region
  const formatCurrency = (amount: number, overrideCurrency?: string) => {
    // Always use the provided currency if specified, or fall back to the user's region currency
    const currencyToUse = overrideCurrency || userRegion.currency;
    
    console.log(`Formatting currency: ${amount} ${currencyToUse} (user region: ${userRegion.region})`);
    
    if (currencyToUse === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    }
    
    // Default to USD formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Check if IP is from a page proxy
  const isFromProxy = userRegion.source === 'manual-override';
  
  // Force update region manually (useful for testing)
  const setRegion = (region: UserRegion) => {
    setUserRegion(region);
  };
  
  return {
    userRegion,
    isLoading,
    isError,
    error,
    refetch,
    isIndia,
    isGlobal,
    formatCurrency,
    isFromProxy,
    setRegion
  };
} 