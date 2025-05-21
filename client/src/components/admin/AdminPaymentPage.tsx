import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentGatewayManager } from './PaymentGatewayManager';
import { AdminLayout } from './layout';

const TaxInfoAlert = () => (
  <div className="mb-6 bg-amber-50 border border-amber-200 rounded-md p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-amber-800">Important Tax Information</h3>
        <div className="mt-2 text-sm text-amber-700">
          <p>
            For Indian customers (INR pricing), plan prices <strong>include 18% GST</strong>. When creating or updating plan prices:
          </p>
          <ul className="list-disc pl-5 mt-1">
            <li>Enter the <strong>total</strong> price customers will pay (including GST)</li>
            <li>The system will automatically calculate and record the GST component</li>
            <li>Invoices will show the price as "GST inclusive" as required by Indian tax regulations</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export function AdminPaymentPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Payment Management</h1>
        </div>
        
        <TaxInfoAlert />
        
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