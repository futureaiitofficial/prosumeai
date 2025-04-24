import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TokenUsageProps {
  featureCode?: string;
  compact?: boolean;
  className?: string;
}

interface FeatureTokenUsage {
  featureId: number;
  featureCode: string;
  featureName: string;
  tokenLimit: number;
  tokenUsage: number;
  resetFrequency: string;
  nextResetDate: string;
}

export function TokenUsage({ featureCode, compact = false, className = '' }: TokenUsageProps) {
  const { user } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenUsage', featureCode],
    queryFn: async () => {
      const endpoint = featureCode 
        ? `/api/user/token-usage/${featureCode}` 
        : '/api/user/token-usage';
        
      const response = await apiRequest('GET', endpoint);
      return await response.json();
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
  
  if (isLoading) {
    return compact ? (
      <div className="text-xs text-muted-foreground">Loading usage...</div>
    ) : (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Token Usage
          </CardTitle>
          <CardDescription>Loading your AI token usage...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (error) {
    return compact ? (
      <div className="text-xs text-red-500">Error loading usage</div>
    ) : (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-4 w-4" />
            Error
          </CardTitle>
          <CardDescription>Failed to load token usage information</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // If no data or no features with token usage
  if (!data || !data.features || data.features.length === 0) {
    return compact ? (
      <div className="text-xs text-muted-foreground">No token usage data</div>
    ) : (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Token Usage
          </CardTitle>
          <CardDescription>You haven't used any AI tokens yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Render a single feature if featureCode is specified, otherwise all features
  const featuresToRender: FeatureTokenUsage[] = featureCode
    ? data.features.filter((f: FeatureTokenUsage) => f.featureCode === featureCode)
    : data.features;
  
  if (compact) {
    // Compact version - just show the usage percentage for the first feature
    if (featuresToRender.length === 0) return null;
    
    const feature = featuresToRender[0];
    const percentage = Math.min(Math.round((feature.tokenUsage / feature.tokenLimit) * 100), 100);
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary" />
              <div className="w-24">
                <Progress value={percentage} className="h-2" />
              </div>
              <span className="text-xs text-muted-foreground">{percentage}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{feature.tokenUsage} / {feature.tokenLimit} tokens used</p>
            <p className="text-xs text-muted-foreground">Resets: {formatResetFrequency(feature.resetFrequency)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Token Usage
        </CardTitle>
        <CardDescription>Your AI feature usage this period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {featuresToRender.map((feature) => {
            const percentage = Math.min(Math.round((feature.tokenUsage / feature.tokenLimit) * 100), 100);
            const isWarning = percentage >= 80;
            
            return (
              <div key={feature.featureId} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{feature.featureName}</span>
                    <Badge variant={isWarning ? "destructive" : "outline"} className="text-xs">
                      {percentage}%
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {feature.tokenUsage} / {feature.tokenLimit}
                  </span>
                </div>
                <Progress value={percentage} className={`h-2 ${isWarning ? 'bg-red-200' : ''}`} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Resets {formatResetFrequency(feature.resetFrequency)}</span>
                  {feature.nextResetDate && (
                    <span>Next reset: {formatDate(feature.nextResetDate)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
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
      return 'never';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
} 