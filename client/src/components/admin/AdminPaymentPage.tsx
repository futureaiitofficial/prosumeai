import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentGatewayManager } from './PaymentGatewayManager';
import { AdminLayout } from './layout';

export function AdminPaymentPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Payment Management</h1>
        </div>
        
        <Tabs defaultValue="gateways" className="space-y-4">
          <TabsList>
            <TabsTrigger value="gateways">Payment Gateways</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gateways">
            <PaymentGatewayManager />
          </TabsContent>
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Payment Transactions</CardTitle>
                <CardDescription>
                  View all payment transactions processed through your payment gateways
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-center py-8">
                  Transaction history will be displayed here. Coming soon.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure global payment settings for your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-center py-8">
                  Payment settings will be available here. Coming soon.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 