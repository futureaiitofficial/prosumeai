/**
 * Script to fix transaction currency issues
 * 
 * This script scans all payment transactions and checks if the currency matches
 * the expected currency based on the user's region.
 * 
 * Run with: npx tsx server/scripts/fix-transaction-currencies.ts
 */

import { db } from '../config/db';
import { paymentTransactions, userBillingDetails, invoices } from '@shared/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { TaxService } from '../services/tax-service';

async function fixTransactionCurrencies() {
  console.log('Starting transaction currency correction process...');
  
  try {
    // Get all payment transactions
    const allTransactions = await db.select()
      .from(paymentTransactions)
      .where(isNotNull(paymentTransactions.currency));
    
    console.log(`Found ${allTransactions.length} transactions to check and potentially fix`);
    
    // Track stats
    let fixed = 0;
    let alreadyCorrect = 0;
    let failed = 0;
    
    // Process each transaction
    for (const transaction of allTransactions) {
      try {
        console.log(`Processing transaction ${transaction.id} (payment ${transaction.gatewayTransactionId})`);
        
        // Get user's billing details to determine correct currency
        const userBillingInfo = await db.select()
          .from(userBillingDetails)
          .where(eq(userBillingDetails.userId, transaction.userId))
          .limit(1);
          
        // If no billing info, default to US/USD
        const userCountry = userBillingInfo.length > 0 ? userBillingInfo[0].country : 'US';
        const targetRegion = userCountry === 'IN' ? 'INDIA' : 'GLOBAL';
        const correctCurrency = targetRegion === 'INDIA' ? 'INR' : 'USD';
        
        // Check if currency matches expected value
        if (transaction.currency !== correctCurrency) {
          console.log(`Currency mismatch detected on transaction ${transaction.id}:`);
          console.log(`  User ID: ${transaction.userId}, Country: ${userCountry}, Region: ${targetRegion}`);
          console.log(`  Current currency: ${transaction.currency}, Expected: ${correctCurrency}`);
          
          // Update transaction with correct currency
          await db.update(paymentTransactions)
            .set({
              currency: correctCurrency,
              updatedAt: new Date()
            })
            .where(eq(paymentTransactions.id, transaction.id));
            
          console.log(`Updated transaction ${transaction.id} currency to ${correctCurrency}`);
          
          // Find any invoices associated with this transaction
          const invoiceRecords = await db.select()
            .from(invoices)
            .where(eq(invoices.transactionId, transaction.id));
            
          if (invoiceRecords.length > 0) {
            console.log(`Found ${invoiceRecords.length} invoices for transaction ${transaction.id}`);
            
            // Delete and regenerate invoices
            for (const invoice of invoiceRecords) {
              console.log(`Deleting invoice #${invoice.invoiceNumber} (${invoice.id})`);
              
              await db.delete(invoices)
                .where(eq(invoices.id, invoice.id));
            }
            
            // Regenerate invoice
            const newInvoice = await TaxService.generateInvoice(transaction.id);
            console.log(`Regenerated invoice #${newInvoice.invoiceNumber} with currency ${newInvoice.currency}`);
          }
          
          fixed++;
        } else {
          console.log(`Transaction ${transaction.id} has correct currency (${transaction.currency}), no changes needed`);
          alreadyCorrect++;
        }
      } catch (txnError) {
        console.error(`Error processing transaction ${transaction.id}:`, txnError);
        failed++;
      }
    }
    
    console.log('Transaction currency correction process completed');
    console.log(`Results: ${fixed} fixed, ${alreadyCorrect} already correct, ${failed} failed`);
    
  } catch (error) {
    console.error('Error fixing transaction currencies:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
fixTransactionCurrencies(); 