import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { TokenWarningDialog } from '@/components/ui/token-warning-dialog';

export function useTokenWarning(featureCode: string, warningThreshold = 80) {
  const { user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [featureData, setFeatureData] = useState<{
    featureName: string;
    tokenUsage: number;
    tokenLimit: number;
    resetFrequency: string;
    resetDate?: string;
  }>({
    featureName: '',
    tokenUsage: 0,
    tokenLimit: 1,
    resetFrequency: 'monthly',
  });

  // Fetch token usage data for this feature
  const { data, isLoading } = useQuery({
    queryKey: ['tokenUsage', featureCode],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user/token-usage/${featureCode}`);
      return await response.json();
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  // Check if usage is above threshold and show warning if needed
  useEffect(() => {
    if (data && data.features && data.features.length > 0) {
      const feature = data.features[0];
      const usage = feature.tokenUsage;
      const limit = feature.tokenLimit;
      const percentage = Math.round((usage / limit) * 100);
      
      // Update feature data
      setFeatureData({
        featureName: feature.featureName,
        tokenUsage: usage,
        tokenLimit: limit,
        resetFrequency: formatResetFrequency(feature.resetFrequency),
        resetDate: feature.nextResetDate,
      });
      
      // Show warning if usage is above threshold
      if (percentage >= warningThreshold) {
        // Don't immediately show on first load - only after an action
        const hasShownWarning = localStorage.getItem(`token-warning-${featureCode}`);
        const lastWarningTime = parseInt(hasShownWarning || '0', 10);
        const now = Date.now();
        
        // Only show warning once every 6 hours (21600000 ms)
        if (!hasShownWarning || now - lastWarningTime > 21600000) {
          setShowWarning(true);
          localStorage.setItem(`token-warning-${featureCode}`, now.toString());
        }
      }
    }
  }, [data, featureCode, warningThreshold]);

  // Render the warning dialog
  const WarningDialog = () => (
    <TokenWarningDialog
      open={showWarning}
      onOpenChange={setShowWarning}
      featureName={featureData.featureName}
      tokenUsage={featureData.tokenUsage}
      tokenLimit={featureData.tokenLimit}
      resetFrequency={featureData.resetFrequency}
      resetDate={featureData.resetDate}
    />
  );

  return {
    showWarning,
    setShowWarning,
    isLoading,
    usage: featureData.tokenUsage,
    limit: featureData.tokenLimit,
    percentage: Math.round((featureData.tokenUsage / featureData.tokenLimit) * 100),
    WarningDialog
  };
}

function formatResetFrequency(frequency: string): string {
  switch (frequency) {
    case 'DAILY':
      return 'daily';
    case 'WEEKLY':
      return 'weekly';
    case 'MONTHLY':
      return 'monthly';
    case 'YEARLY':
      return 'yearly';
    default:
      return 'periodic';
  }
} 