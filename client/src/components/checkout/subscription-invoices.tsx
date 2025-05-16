import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  entity: string;
  customer_id: string;
  subscription_id: string;
  status: string;
  payment_id: string;
  amount: number;
  currency: string;
  date: number;
  paid_at?: number;
  billing_start?: number;
  billing_end?: number;
}

interface Transaction {
  id: number;
  amount: string;
  currency: string;
  gateway: string;
  gatewayTransactionId: string;
  status: string;
  createdAt: string;
  refundReason?: string;
}

interface SubscriptionInvoicesProps {
  subscriptionId: string;
}

// Helper function to format currency
function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  // For INR currency, use appropriate locale
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'INR' ? 0 : 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
}

export function SubscriptionInvoices({ subscriptionId }: SubscriptionInvoicesProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!subscriptionId) return;

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/subscription/invoices/${subscriptionId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch invoices');
        }
        
        const data = await response.json();
        setInvoices(data.invoices || []);
        setTransactions(data.transactions || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load subscription invoices');
        toast({
          title: 'Error',
          description: err.message || 'Failed to load subscription invoices',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [subscriptionId, toast]);

  // Format timestamp to readable date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Invoices</CardTitle>
          <CardDescription>Loading your payment history...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Invoices</CardTitle>
          <CardDescription>There was an error loading your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Invoices</CardTitle>
        <CardDescription>
          Your payment history for this subscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(invoices.length === 0 && transactions.length === 0) ? (
          <p className="text-center py-6 text-muted-foreground">No payment records found for this subscription.</p>
        ) : (
          <>
            {invoices.length > 0 && (
              <>
                <h3 className="text-lg font-medium mb-2">Invoices from Razorpay</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Billing Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.id}</TableCell>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount / 100, invoice.currency)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                            invoice.status === 'refunded' ? 'bg-amber-100 text-amber-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {invoice.billing_start && invoice.billing_end ? 
                            `${formatDate(invoice.billing_start)} to ${formatDate(invoice.billing_end)}` : 
                            'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {transactions.length > 0 && (
              <>
                <h3 className="text-lg font-medium mt-6 mb-2">Transactions in Our System</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(transaction.amount), transaction.currency)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {transaction.gatewayTransactionId || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                            transaction.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                            transaction.status === 'REFUNDED' ? 'bg-amber-100 text-amber-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.refundReason || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              <p>Note: For Razorpay subscriptions, the first charge is typically a small authentication amount. 
              The actual subscription charge happens after successful authentication.</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 