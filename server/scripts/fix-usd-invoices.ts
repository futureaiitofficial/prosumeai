/**
 * Script to fix existing USD invoices to ensure they don't show GST/Indian tax information
 * 
 * Run this script with: npx tsx server/scripts/fix-usd-invoices.ts
 */

import { db } from '../config/db';
import { invoices, paymentTransactions } from '@shared/schema';
import { eq, and, ne } from 'drizzle-orm';
import { TaxService } from '../services/tax-service';

async function fixUsdInvoices() {
  console.log('Starting USD invoice correction process...');
  
  try {
    // Get all USD invoices
    const usdInvoices = await db.select()
      .from(invoices)
      .where(eq(invoices.currency, 'USD'));
    
    console.log(`Found ${usdInvoices.length} USD invoices to check and fix`);
    
    // Process each USD invoice
    for (const invoice of usdInvoices) {
      try {
        console.log(`Processing invoice #${invoice.invoiceNumber} (ID: ${invoice.id})`);
        
        // Check if it has any tax amount
        const hasTax = parseFloat(invoice.taxAmount || '0') > 0;
        const hasIndianCompanyInfo = invoice.companyDetails && 
                                   (invoice.companyDetails as any).country === 'IN' &&
                                   (invoice.companyDetails as any).gstin;
                                   
        if (hasTax || hasIndianCompanyInfo) {
          console.log(`Invoice #${invoice.invoiceNumber} has issues that need fixing`);
          
          // Delete the existing invoice
          await db.delete(invoices)
            .where(eq(invoices.id, invoice.id));
            
          console.log(`Deleted invoice #${invoice.invoiceNumber}`);
          
          // Regenerate the invoice using the transaction ID
          if (invoice.transactionId) {
            const newInvoice = await TaxService.generateInvoice(invoice.transactionId);
            console.log(`Regenerated invoice #${newInvoice.invoiceNumber} for transaction ${invoice.transactionId}`);
          } else {
            console.error(`Missing transaction ID for invoice #${invoice.invoiceNumber}, can't regenerate`);
          }
        } else {
          console.log(`Invoice #${invoice.invoiceNumber} looks good, no changes needed`);
        }
      } catch (invoiceError) {
        console.error(`Error processing invoice #${invoice.invoiceNumber}:`, invoiceError);
      }
    }
    
    console.log('USD invoice correction process completed');
    
  } catch (error) {
    console.error('Error fixing USD invoices:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
fixUsdInvoices(); 