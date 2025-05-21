/**
 * Script to fix transaction amounts after currency conversion
 * 
 * This script finds transactions that were converted from INR to USD
 * and fixes their amounts to match the proper USD price (e.g., INR 899.00 → USD 9.99)
 * 
 * Run with: npx tsx server/scripts/fix-transaction-amounts.ts
 */

import { db } from '../config/db';
import { paymentTransactions, userBillingDetails, planPricing, subscriptionPlans, invoices, userSubscriptions } from '@shared/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { TaxService } from '../services/tax-service';

async function fixTransactionAmounts() {
  console.log('Starting transaction amount correction process...');
  
  try {
    // Get all USD transactions
    const usdTransactions = await db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.currency, 'USD'));
    
    console.log(`Found ${usdTransactions.length} USD transactions to check and potentially fix`);
    
    // Track stats
    let fixed = 0;
    let alreadyCorrect = 0;
    let failed = 0;
    
    // Process each transaction
    for (const transaction of usdTransactions) {
      try {
        console.log(`Processing USD transaction ${transaction.id} (payment ${transaction.gatewayTransactionId})`);
        
        // Get the subscription info to find the plan
        const subscription = await db.select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.id, transaction.subscriptionId))
          .limit(1);
          
        if (!subscription.length) {
          console.log(`No subscription found for transaction ${transaction.id}, skipping`);
          continue;
        }
        
        const planId = subscription[0].planId;
        
        // Get the plan pricing for USD
        const pricingInfo = await db.select()
          .from(planPricing)
          .where(
            and(
              eq(planPricing.planId, planId),
              eq(planPricing.currency, 'USD')
            )
          )
          .limit(1);
          
        if (!pricingInfo.length) {
          console.log(`No USD pricing found for plan ${planId}, skipping transaction ${transaction.id}`);
          continue;
        }
        
        const correctUsdAmount = pricingInfo[0].price;
        const currentAmount = transaction.amount;
        
        // Check if the USD amount matches the plan price
        const isInrConvertedToUsd = parseFloat(currentAmount) > 20; // Assuming USD plans are less than $20
        
        if (isInrConvertedToUsd) {
          console.log(`Transaction ${transaction.id} appears to be INR amount with USD currency:`);
          console.log(`  Current amount: $${currentAmount}, Correct USD amount: $${correctUsdAmount}`);
          
          // Update with the correct USD amount
          await db.update(paymentTransactions)
            .set({
              amount: correctUsdAmount,
              updatedAt: new Date()
            })
            .where(eq(paymentTransactions.id, transaction.id));
            
          console.log(`Updated transaction ${transaction.id} amount from $${currentAmount} to $${correctUsdAmount}`);
          
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
            console.log(`Regenerated invoice #${newInvoice.invoiceNumber} with amount ${newInvoice.total} ${newInvoice.currency}`);
          }
          
          fixed++;
        } else {
          console.log(`Transaction ${transaction.id} amount ($${currentAmount}) seems correct, no changes needed`);
          alreadyCorrect++;
        }
      } catch (txnError) {
        console.error(`Error processing transaction ${transaction.id}:`, txnError);
        failed++;
      }
    }
    
    console.log('Transaction amount correction process completed');
    console.log(`Results: ${fixed} fixed, ${alreadyCorrect} already correct, ${failed} failed`);
    
  } catch (error) {
    console.error('Error fixing transaction amounts:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
fixTransactionAmounts(); 