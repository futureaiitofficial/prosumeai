/**
 * Script to fix invoices with incorrect currency values
 * 
 * Run this script with: npx tsx server/scripts/fix-invoice-currencies.ts
 */

import { db } from '../config/db';
import { invoices, paymentTransactions } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { TaxService } from '../services/tax-service';

async function fixInvoiceCurrencies() {
  console.log('Starting invoice currency correction process...');
  
  try {
    // Get all invoices with transaction IDs
    const allInvoices = await db.select()
      .from(invoices)
      .where(sql`${invoices.transactionId} IS NOT NULL`);
    
    console.log(`Found ${allInvoices.length} invoices to check and fix`);
    
    // Process each invoice
    for (const invoice of allInvoices) {
      try {
        if (!invoice.transactionId) {
          console.log(`Invoice #${invoice.invoiceNumber} has no transaction ID, skipping`);
          continue;
        }
        
        console.log(`Processing invoice #${invoice.invoiceNumber} (ID: ${invoice.id}) with transaction ID ${invoice.transactionId}`);
        
        // Look up the transaction to verify the correct currency
        const transaction = await db.select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.id, invoice.transactionId))
          .limit(1);
          
        if (transaction.length === 0) {
          console.log(`Transaction ${invoice.transactionId} not found for invoice #${invoice.invoiceNumber}, skipping`);
          continue;
        }
        
        const txnCurrency = transaction[0].currency;
        const invoiceCurrency = invoice.currency;
        
        // Check if currencies match
        if (txnCurrency !== invoiceCurrency) {
          console.log(`Currency mismatch detected for invoice #${invoice.invoiceNumber}:`);
          console.log(`Transaction currency: ${txnCurrency}, Invoice currency: ${invoiceCurrency}`);
          
          // Delete the existing invoice
          await db.delete(invoices)
            .where(eq(invoices.id, invoice.id));
            
          console.log(`Deleted invoice #${invoice.invoiceNumber}`);
          
          // Regenerate the invoice using the transaction ID
          const newInvoice = await TaxService.generateInvoice(invoice.transactionId);
          console.log(`Regenerated invoice #${newInvoice.invoiceNumber} for transaction ${invoice.transactionId} with currency ${newInvoice.currency}`);
        } else {
          console.log(`Invoice #${invoice.invoiceNumber} has the correct currency (${invoiceCurrency}), no changes needed`);
        }
      } catch (invoiceError) {
        console.error(`Error processing invoice #${invoice.invoiceNumber}:`, invoiceError);
      }
    }
    
    console.log('Invoice currency correction process completed');
    
  } catch (error) {
    console.error('Error fixing invoice currencies:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
fixInvoiceCurrencies(); 