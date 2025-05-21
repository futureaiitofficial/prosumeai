import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '@/hooks/use-toast';
import { PaymentService } from '../../services/payment-service';
import InvoiceCard from './invoice-card';
import { Download } from 'lucide-react';
import { handlePDFViewing } from '@/utils/pdf-helpers';

interface RazorpayInvoice {
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

interface CustomInvoice {
  id: number;
  invoiceNumber: string;
  userId: number;
  transactionId: number;
  subtotal: string;
  taxAmount: string;
  total: string;
  currency: string;
  status: string;
  billingDetails: any;
  companyDetails: any;
  taxDetails: any;
  items: any[];
  createdAt: string;
  paidAt?: string;
  dueDate?: string;
  notes?: string;
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
  invoiceId?: number;
}

interface SubscriptionInvoicesProps {
  subscriptionId: string;
}

// Helper function to format currency
function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  // Log currency information for debugging
  console.log(`Formatting amount ${amount} with currency ${currencyCode}`);
  
  // Ensure currency code is valid and fallback to USD if not
  const validCurrency = ['USD', 'INR'].includes(currencyCode) ? currencyCode : 'USD';
  
  // For INR currency, use appropriate locale
  const locale = validCurrency === 'INR' ? 'en-IN' : 'en-US';
  
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: validCurrency,
      minimumFractionDigits: validCurrency === 'INR' ? 0 : 2,
      maximumFractionDigits: 2
    });
    return formatter.format(amount);
  } catch (error) {
    console.error(`Error formatting currency: ${error}`);
    // Fallback format if formatter fails
    return `${validCurrency === 'USD' ? '$' : '₹'}${amount.toFixed(validCurrency === 'INR' ? 0 : 2)}`;
  }
}

// Helper to fix GST calculation for display purposes
function formatGSTValues(invoice: CustomInvoice) {
  if (invoice.currency === 'INR') {
    const total = parseFloat(invoice.total);
    const taxAmount = parseFloat(invoice.taxAmount);
    const subtotal = parseFloat(invoice.subtotal);
    
    // Calculate if the invoice is using exclusive tax (where total = subtotal + tax)
    const calculatedTotal = subtotal + taxAmount;
    const isExclusiveTax = Math.abs(total - calculatedTotal) < 0.01;
    
    if (isExclusiveTax) {
      // For displaying, convert to inclusive tax
      const percentage = 18; // Standard GST rate
      // Recalculate values using the inclusive tax formula
      const correctTaxAmount = (total * percentage) / (100 + percentage);
      const correctSubtotal = total - correctTaxAmount;
      
      return {
        displaySubtotal: correctSubtotal,
        displayTaxAmount: correctTaxAmount,
        total
      };
    }
  }
  
  // If not INR or already using inclusive tax, return original values
  return {
    displaySubtotal: parseFloat(invoice.subtotal),
    displayTaxAmount: parseFloat(invoice.taxAmount),
    total: parseFloat(invoice.total)
  };
}

export function SubscriptionInvoices({ subscriptionId }: SubscriptionInvoicesProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [razorpayInvoices, setRazorpayInvoices] = useState<RazorpayInvoice[]>([]);
  const [customInvoices, setCustomInvoices] = useState<CustomInvoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [downloadingInvoice, setDownloadingInvoice] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        
        let data;
        
        // If subscriptionId is provided, fetch invoices for that specific subscription
        if (subscriptionId) {
          try {
            data = await PaymentService.getSubscriptionInvoices(parseInt(subscriptionId));
          } catch (err: any) {
            // If this fails with a 404, fall back to getting all user invoices
            if (err.response && err.response.status === 404) {
              console.log("Subscription invoice endpoint returned 404, falling back to user invoices");
              data = await PaymentService.getUserInvoices();
            } else {
              throw err; // Re-throw if it's not a 404
            }
          }
        } else {
          // If no subscriptionId provided, fetch all user invoices
          data = await PaymentService.getUserInvoices();
        }
        
        // Set state from response data
        setTransactions(data.transactions || []);
        
        // Fetch our custom invoices if available
        if (data.customInvoices) {
          setCustomInvoices(data.customInvoices);
        } else {
          setCustomInvoices([]);
        }
        
        // We no longer use Razorpay invoices
        setRazorpayInvoices([]);
        
        setError(null);
      } catch (err: any) {
        console.error("Error fetching invoices:", err);
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

  // Handle Razorpay invoice download
  const handleRazorpayDownload = (invoiceId: string) => {
    // Razorpay invoices are usually available for download from their website
    // Since this is an external URL, we'll open it in a new tab
    window.open(`https://dashboard.razorpay.com/app/invoices/${invoiceId}`, '_blank');
    
    toast({
      title: 'Opening Razorpay Invoice',
      description: 'The invoice will open in a new tab from Razorpay.',
    });
  };

  // Handle transaction invoice download using the new endpoint
  const handleTransactionInvoiceDownload = async (transaction: Transaction) => {
    try {
      setDownloadingInvoice(transaction.id);
      
      toast({
        title: 'Generating Invoice',
        description: 'Please wait while your invoice is being prepared...',
      });
      
      // Generate a unique timestamp to avoid cache issues
      const timestamp = Date.now();
      const url = `/api/user/transactions/${transaction.id}/download?t=${timestamp}`;
      const filename = `Invoice-Transaction-${transaction.id}.pdf`;
      
      // Use our PDF helper utility to handle viewing/downloading
      const success = await handlePDFViewing(url, filename);
      
      if (success) {
        toast({
          title: 'Invoice Ready',
          description: 'Your invoice should be available now.',
        });
      } else {
        throw new Error('Unable to open or download PDF');
      }
    } catch (error: any) {
      console.error('Error opening transaction invoice:', error);
      
      // Show a more helpful error message
      let errorMessage = 'Failed to open invoice. Please try again later.';
      
      if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      if (error.response?.status) {
        errorMessage += ` (Status: ${error.response.status})`;
      }
      
      toast({
        title: 'Download Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setDownloadingInvoice(null);
    }
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
        {(razorpayInvoices.length === 0 && transactions.length === 0 && customInvoices.length === 0) ? (
          <p className="text-center py-6 text-muted-foreground">No payment records found for this subscription.</p>
        ) : (
          <>
            {customInvoices.length > 0 && (
              <>
                <h3 className="text-lg font-medium mb-4">Your Invoices</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {customInvoices.map((invoice) => (
                    <InvoiceCard key={invoice.id} invoice={invoice} />
                  ))}
                </div>
              </>
            )}

            {/* Razorpay invoices section removed - we now rely on our own invoices */}

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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {(() => {
                            // Debug log to inspect transaction currency and amount
                            console.log(`Transaction ${transaction.id}: Amount=${transaction.amount}, Currency=${transaction.currency}`);
                            
                            // Make sure we're using the transaction's actual currency
                            return formatCurrency(parseFloat(transaction.amount), transaction.currency);
                          })()}
                        </TableCell>
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
                        <TableCell>
                          {transaction.status === 'COMPLETED' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={downloadingInvoice === transaction.id}
                              onClick={() => handleTransactionInvoiceDownload(transaction)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              <span className="sr-only md:not-sr-only md:ml-1">
                                {downloadingInvoice === transaction.id ? 'Loading...' : 'Invoice'}
                              </span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {/* Note about payments removed */}
          </>
        )}
      </CardContent>
    </Card>
  );
} 