import React from 'react';
import { AdminLayout } from '@/components/admin/layout';
import SubscriptionManagement from '@/components/admin/subscription-management';

const AdminSubscriptionsPage: React.FC = () => {
  return (
    <AdminLayout>
      <SubscriptionManagement />
    </AdminLayout>
  );
};

export default AdminSubscriptionsPage; 