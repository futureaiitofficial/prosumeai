import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/layout';
import SubscriptionManagement from '@/components/admin/subscription-management';
import UserSubscriptionManagement from '@/components/admin/user-subscription-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const AdminSubscriptionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Subscription Management</h1>
          <div className="flex items-center mt-2 sm:mt-0 gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh data">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="plans" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="users">User Subscriptions</TabsTrigger>
          </TabsList>
          <TabsContent value="plans">
            <SubscriptionManagement key={`plans-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="users">
            <UserSubscriptionManagement key={`users-${refreshKey}`} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptionsPage; 