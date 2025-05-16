import React from 'react';
import { AdminLayout } from '@/components/admin/layout';
import CronJobManagement from '@/components/admin/cron-job-management';

export default function AdminToolsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System Tools</h1>
          <p className="text-muted-foreground">
            Manage system maintenance tools and background tasks
          </p>
        </div>
        
        <CronJobManagement />
      </div>
    </AdminLayout>
  );
} 