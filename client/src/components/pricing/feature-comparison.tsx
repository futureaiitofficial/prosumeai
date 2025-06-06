import React from 'react';
import { Check, X } from 'lucide-react';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  currency: 'USD' | 'INR';
  billingCycle: 'MONTHLY' | 'YEARLY';
  targetRegion: 'GLOBAL' | 'INDIA';
  isFeatured: boolean;
  isFreemium: boolean;
  active: boolean;
  pricing?: { 
    id: number;
    planId: number;
    targetRegion: 'GLOBAL' | 'INDIA';
    currency: 'USD' | 'INR';
    price: string;
  }[];
  displayPrice?: string;
  displayCurrency?: string;
}

interface PlanFeature {
  id: number;
  planId: number;
  featureId: number;
  featureName: string;
  featureCode: string;
  description: string;
  limitType: 'UNLIMITED' | 'COUNT' | 'BOOLEAN';
  limitValue: number;
  isEnabled: boolean;
  resetFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'NEVER';
}

interface FeatureComparisonProps {
  plans: SubscriptionPlan[];
  features: PlanFeature[];
  allFeaturesByPlan: { [key: number]: PlanFeature[] };
  getFeatureValueDisplay: (feature: PlanFeature) => string;
  getPriceDisplay: (plan: SubscriptionPlan) => string;
}

const FeatureComparison: React.FC<FeatureComparisonProps> = ({
  plans,
  features,
  allFeaturesByPlan,
  getFeatureValueDisplay,
  getPriceDisplay
}) => {
  return (
    <>
      {/* Mobile Feature Comparison - Horizontal Scrollable Table */}
      <div className="block md:hidden">
        <div className="overflow-x-auto pb-6 -mx-4 px-4">
          <div className="min-w-[640px]">
            <table className="w-full border-collapse border">
              <thead className="bg-indigo-50 sticky top-0">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-indigo-700 border-b border-r">Feature</th>
                  {plans.map((plan: SubscriptionPlan) => (
                    <th key={plan.id} className="p-3 text-center text-sm font-medium text-indigo-700 border-b border-r">
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-xs mt-1">{getPriceDisplay(plan)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {features.map(feature => (
                  <tr key={feature.featureId} className="border-b">
                    <td className="p-3 text-sm border-r">{feature.featureName}</td>
                    {plans.map((plan: SubscriptionPlan) => {
                      const planFeature = allFeaturesByPlan[plan.id]?.find(
                        f => f.featureId === feature.featureId
                      );
                      
                      return (
                        <td key={`${plan.id}-${feature.featureId}`} className="p-3 text-center text-sm border-r">
                          {planFeature ? (
                            planFeature.limitType === 'BOOLEAN' ? (
                              planFeature.isEnabled ? (
                                <Check className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-red-600 mx-auto" />
                              )
                            ) : (
                              <span>{getFeatureValueDisplay(planFeature)}</span>
                            )
                          ) : (
                            <X className="h-5 w-5 text-red-600 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-gray-500 mt-2 text-center italic">Swipe horizontally to view all plan features</div>
          </div>
        </div>
      </div>
      
      {/* Desktop Feature Comparison Table (hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-indigo-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider border-r w-1/5">
                Feature
              </th>
              {plans.map((plan: SubscriptionPlan) => (
                <th key={plan.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-indigo-700 uppercase tracking-wider border-r last:border-r-0 w-1/5">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {features.map((feature: PlanFeature) => (
              <tr key={feature.featureId}>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 border-r w-1/5">
                  {feature.featureName}
                </td>
                {plans.map((plan: SubscriptionPlan) => {
                  const planFeature = allFeaturesByPlan[plan.id]?.find(
                    (f: PlanFeature) => f.featureId === feature.featureId
                  );
                  
                  return (
                    <td key={`${plan.id}-${feature.featureId}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center border-r last:border-r-0 w-1/5">
                      {planFeature ? (
                        planFeature.limitType === 'BOOLEAN' ? (
                          planFeature.isEnabled ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-600 mx-auto" />
                          )
                        ) : (
                          <span>{getFeatureValueDisplay(planFeature)}</span>
                        )
                      ) : (
                        <X className="h-5 w-5 text-red-600 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default FeatureComparison; 