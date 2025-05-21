import { db } from '../config/db';
import { invoices, paymentTransactions, userSubscriptions, subscriptionPlans } from '@shared/schema';
import { eq, isNotNull } from 'drizzle-orm';

/**
 * This script updates existing invoices to include the new reference fields
 * that were added in the add-invoice-reference-fields migration.
 */
async function fixExistingInvoices() {
  console.log('Starting to update existing invoices with reference data...');
  
  try {
    // Get all invoices that have a transaction ID but missing the new reference fields
    const invoicesToUpdate = await db.select()
      .from(invoices)
      .where(isNotNull(invoices.transactionId));
    
    console.log(`Found ${invoicesToUpdate.length} invoices to process`);
    
    let updatedCount = 0;
    
    for (const invoice of invoicesToUpdate) {
      if (!invoice.transactionId) continue;
      
      // Get the transaction details
      const transaction = await db.select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.id, invoice.transactionId))
        .limit(1);
      
      if (transaction.length === 0) {
        console.warn(`Transaction with ID ${invoice.transactionId} not found for invoice ${invoice.id}`);
        continue;
      }
      
      const txn = transaction[0];
      
      // Get subscription details if available
      let subscriptionPlan = "Subscription";
      let subscriptionId = txn.subscriptionId;
      let nextPaymentDate = null;
      
      if (txn.subscriptionId) {
        try {
          // Get subscription with plan details
          const subscriptionData = await db.select({
            subscription: userSubscriptions,
            planName: subscriptionPlans.name
          })
          .from(userSubscriptions)
          .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
          .where(eq(userSubscriptions.id, txn.subscriptionId))
          .limit(1);
          
          if (subscriptionData.length > 0) {
            subscriptionPlan = subscriptionData[0].planName ?? "Subscription";
            
            // Set next payment date from subscription end date if available
            if (subscriptionData[0].subscription.endDate && subscriptionData[0].subscription.autoRenew) {
              nextPaymentDate = subscriptionData[0].subscription.endDate;
            }
            
            // Also update the items to reflect the plan name
            if (invoice.items && Array.isArray(invoice.items)) {
              invoice.items = invoice.items.map(item => ({
                ...item,
                description: `${subscriptionPlan} Plan Subscription`
              }));
            }
          }
        } catch (error) {
          console.error(`Error fetching subscription details for ID ${txn.subscriptionId}:`, error);
        }
      }
      
      // Update the invoice with reference data
      await db.update(invoices)
        .set({
          subscriptionId: subscriptionId,
          subscriptionPlan: subscriptionPlan,
          nextPaymentDate: nextPaymentDate,
          gatewayTransactionId: txn.gatewayTransactionId,
          // Also update items if we have them
          items: invoice.items,
          // Razorpay payment ID might be inside the metadata JSON
          razorpayPaymentId: txn.metadata && typeof txn.metadata === 'object' ? (txn.metadata as any).paymentId : null
        })
        .where(eq(invoices.id, invoice.id));
      
      updatedCount++;
      console.log(`Updated invoice #${invoice.invoiceNumber} (ID: ${invoice.id}) with plan "${subscriptionPlan}"`);
    }
    
    console.log(`Successfully updated ${updatedCount} invoices with reference information`);
  } catch (error) {
    console.error('Error updating invoices:', error);
    throw error;
  }
}

// Run the script
fixExistingInvoices()
  .then(() => {
    console.log('Invoice update process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Invoice update process failed:', error);
    process.exit(1);
  }); 