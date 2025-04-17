import { useState } from 'react';

/**
 * Simple hook to replace the feature guard functionality.
 * All features are always enabled now that subscriptions have been removed.
 */
export function useFeatureGuard() {
  return {
    hasAccess: true,
    isLoading: false,
    usageLimits: { current: 0, limit: 9999 }
  };
}

/**
 * Simple hook to check if a feature is available.
 * All features are always enabled now that subscriptions have been removed.
 */
export function useFeatureAccess() {
  return {
    hasFeature: () => true,
    checkFeatureAccess: async () => ({ hasAccess: true }),
    isLoading: false,
    isError: false,
    features: []
  };
} 