import { PgDatabase } from 'drizzle-orm/pg-core';
import { db } from '../config/db';
import { userSubscriptions, paymentTransactions } from '@shared/schema';
import { eq, ne, and, asc, isNull } from 'drizzle-orm';
import { getPaymentGatewayByName } from '../services/payment-gateways';

/**
 * Script to synchronize all Razorpay subscription invoices with our database.
 * This ensures we have proper records of all subscription charges.
 */

async function syncSubscriptionInvoices() {
  console.log('Starting subscription invoice synchronization...');
  
  try {
    // Get all active Razorpay subscriptions
    const activeSubscriptions = await db.select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.paymentGateway, 'RAZORPAY'),
          ne(userSubscriptions.paymentReference, ''),
          ne(userSubscriptions.status, 'CANCELLED')
        )
      )
      .orderBy(asc(userSubscriptions.id));
    
    console.log(`Found ${activeSubscriptions.length} active Razorpay subscriptions to sync`);
    
    // Initialize Razorpay gateway
    const razorpay = getPaymentGatewayByName('razorpay');
    
    // Process each subscription
    let successCount = 0;
    let errorCount = 0;
    let newTransactionsCount = 0;
    
    for (const subscription of activeSubscriptions) {
      try {
        // Skip if no valid payment reference
        if (!subscription.paymentReference || !subscription.paymentReference.startsWith('sub_')) {
          console.log(`Skipping subscription ${subscription.id} due to invalid payment reference: ${subscription.paymentReference}`);
          continue;
        }
        
        console.log(`Processing subscription ${subscription.id} with Razorpay ID: ${subscription.paymentReference}`);
        
        // Get existing transactions for this subscription
        const existingTransactions = await db.select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.subscriptionId, subscription.id));
        
        console.log(`Subscription ${subscription.id} has ${existingTransactions.length} existing transactions`);
        
        // Fetch invoices for this subscription
        const subscriptionId = subscription.paymentReference;
        const invoiceResult = await razorpay.fetchInvoicesForSubscription(subscriptionId);
        
        if (!invoiceResult || !invoiceResult.items || !Array.isArray(invoiceResult.items)) {
          console.warn(`No invoices found or invalid data returned for subscription ${subscriptionId}`);
          continue;
        }
        
        console.log(`Found ${invoiceResult.count} invoices for subscription ${subscriptionId}`);
        
        // Check if any new transactions were added
        const currentTransactions = await db.select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.subscriptionId, subscription.id));
        
        const newTransactions = currentTransactions.length - existingTransactions.length;
        if (newTransactions > 0) {
          console.log(`Added ${newTransactions} new transactions for subscription ${subscription.id}`);
          newTransactionsCount += newTransactions;
        }
        
        successCount++;
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nSubscription invoice synchronization complete!');
    console.log(`Processed ${activeSubscriptions.length} subscriptions`);
    console.log(`Success: ${successCount}, Errors: ${errorCount}`);
    console.log(`Added ${newTransactionsCount} new transactions`);
    
  } catch (error) {
    console.error('Error in subscription invoice synchronization:', error);
  }
}

// Run the function
syncSubscriptionInvoices().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
}); 