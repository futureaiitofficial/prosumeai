import { PgDatabase } from 'drizzle-orm/pg-core';
import { db } from './config/db';
import { paymentTransactions, userSubscriptions, subscriptionPlans, planPricing } from '@shared/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { getPaymentGatewayByName } from './services/payment-gateways';

/**
 * Script to fix transaction metadata for existing Razorpay transactions.
 * This adds proper metadata to the refundReason field to help identify
 * authentication charges vs subscription charges, and ensures the actual
 * plan amount is stored.
 */
async function fixTransactionMetadata() {
  console.log('Starting transaction metadata fix...');
  
  try {
    // Get all Razorpay transactions that need fixing
    const transactions = await db.select({
      id: paymentTransactions.id,
      userId: paymentTransactions.userId,
      subscriptionId: paymentTransactions.subscriptionId,
      amount: paymentTransactions.amount,
      currency: paymentTransactions.currency,
      gateway: paymentTransactions.gateway,
      gatewayTransactionId: paymentTransactions.gatewayTransactionId,
      status: paymentTransactions.status,
      refundReason: paymentTransactions.refundReason,
      createdAt: paymentTransactions.createdAt
    })
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.gateway, 'RAZORPAY'),
        eq(paymentTransactions.status, 'COMPLETED')
      )
    )
    .orderBy(desc(paymentTransactions.createdAt));
    
    console.log(`Found ${transactions.length} Razorpay transactions to check`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each transaction
    for (const transaction of transactions) {
      try {
        // Skip if already has detailed metadata
        if (
          transaction.refundReason && 
          (transaction.refundReason.includes('actual_plan_amount:') || 
           transaction.refundReason.includes('payment_type:'))
        ) {
          console.log(`Transaction ${transaction.id} already has metadata, skipping`);
          skippedCount++;
          continue;
        }
        
        // Get subscription details
        const subscription = await db.select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.id, transaction.subscriptionId))
          .limit(1);
        
        if (!subscription.length) {
          console.log(`No subscription found for transaction ${transaction.id}, skipping`);
          skippedCount++;
          continue;
        }
        
        // Get plan details
        const plan = await db.select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, subscription[0].planId))
          .limit(1);
          
        if (!plan.length) {
          console.log(`No plan found for subscription ${subscription[0].id}, skipping`);
          skippedCount++;
          continue;
        }
        
        // Get plan pricing
        const pricing = await db.select()
          .from(planPricing)
          .where(eq(planPricing.planId, plan[0].id))
          .limit(1);
          
        if (!pricing.length) {
          console.log(`No pricing found for plan ${plan[0].id}, skipping`);
          skippedCount++;
          continue;
        }
        
        // Determine if this is an authentication charge
        const isAuthCharge = 
          (transaction.currency === 'USD' && parseFloat(transaction.amount) <= 1) || 
          (transaction.currency === 'INR' && parseFloat(transaction.amount) <= 100);
        
        // Build metadata string
        let metadata = `plan_name: ${plan[0].name}, plan_cycle: ${plan[0].billingCycle}, `;
        metadata += `payment_type: ${isAuthCharge ? 'authentication' : 'subscription'}, `;
        metadata += `actual_plan_amount: ${pricing[0].price}, plan_currency: ${pricing[0].currency}`;
        
        // If there was existing refundReason, preserve it
        if (transaction.refundReason) {
          metadata += `, original_note: ${transaction.refundReason}`;
        }
        
        // Update the transaction
        await db.update(paymentTransactions)
          .set({ refundReason: metadata })
          .where(eq(paymentTransactions.id, transaction.id));
          
        console.log(`Updated metadata for transaction ${transaction.id}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error processing transaction ${transaction.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nTransaction metadata fix complete!');
    console.log(`Processed ${transactions.length} transactions`);
    console.log(`Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error in transaction metadata fix:', error);
  }
}

// Run the function
fixTransactionMetadata().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
}); 