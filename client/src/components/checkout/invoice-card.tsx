import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Download, ExternalLink } from "lucide-react";
import { Badge } from "../ui/badge";
import { PaymentService } from "../../services/payment-service";
import { useToast } from "@/hooks/use-toast";
import { handlePDFViewing } from "@/utils/pdf-helpers";

// Utility functions
function formatCurrency(amount: number | string, currencyCode: string = 'USD'): string {
  // Log currency information for debugging
  console.log(`Invoice formatCurrency: amount=${amount}, currency=${currencyCode}`);
  
  // Ensure currency code is valid and fallback to USD if not
  const validCurrency = ['USD', 'INR'].includes(currencyCode) ? currencyCode : 'USD';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const locale = validCurrency === 'INR' ? 'en-IN' : 'en-US';
  
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: validCurrency,
      minimumFractionDigits: validCurrency === 'INR' ? 0 : 2,
      maximumFractionDigits: 2
    });
    return formatter.format(numAmount);
  } catch (error) {
    console.error(`Error formatting currency: ${error}`);
    // Fallback format if formatter fails
    return `${validCurrency === 'USD' ? '$' : '₹'}${numAmount.toFixed(validCurrency === 'INR' ? 0 : 2)}`;
  }
}

function formatDate(dateString: string | number | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper to fix GST calculation for display purposes
function calculateGSTValues(invoice: any) {
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

interface InvoiceCardProps {
  invoice: any;
  showDownload?: boolean;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, showDownload = true }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  
  // Add debug logging to help diagnose currency issues
  console.log(`Rendering InvoiceCard for #${invoice.invoiceNumber}:`, { 
    currency: invoice.currency,
    amount: invoice.total, 
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount
  });
  
  // Calculate correct GST values for display
  const { displaySubtotal, displayTaxAmount, total } = calculateGSTValues(invoice);

  const getStatusColor = (status: string) => {
    status = status.toLowerCase();
    if (status === 'paid' || status === 'completed') return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (status === 'failed') return 'bg-red-100 text-red-800 hover:bg-red-200';
    if (status === 'refunded') return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
    return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      toast({
        title: 'Generating Invoice PDF',
        description: 'Please wait while we prepare your invoice...',
      });
      
      // Generate a unique timestamp to avoid cache issues
      const timestamp = Date.now();
      const url = `/api/user/invoices/${invoice.id}/download?t=${timestamp}`;
      const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
      
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
      console.error('Error downloading invoice:', error);
      
      // Show detailed error to help with debugging
      let errorMessage = 'Failed to download invoice.';
      
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
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Invoice #{invoice.invoiceNumber}</CardTitle>
            <CardDescription>{formatDate(invoice.createdAt)}</CardDescription>
          </div>
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>{formatCurrency(displaySubtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax:</span>
            <span>{formatCurrency(displayTaxAmount, invoice.currency)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>{formatCurrency(total, invoice.currency)}</span>
          </div>
        </div>
      </CardContent>
      {showDownload && (
        <CardFooter className="bg-muted/30 p-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            disabled={isDownloading}
            className="ml-auto flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Loading...' : 'Download PDF'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default InvoiceCard; 