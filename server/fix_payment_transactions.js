import { db } from './src/config/db.js';
import { paymentTransactions, userSubscriptions, subscriptionPlans, planPricing, userBillingDetails } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

async function fixTransactionMetadata() {
  try {
    console.log('Starting payment transaction fix script...');
    
    // Get all transactions for user 19 (Peter)
    const transactions = await db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, 19))
      .orderBy(paymentTransactions.id);
    
    console.log(`Found ${transactions.length} transactions to process`);
    
    // Fix each transaction
    for (const tx of transactions) {
      console.log(`Processing transaction ${tx.id}: ${tx.amount} ${tx.currency} (${tx.gatewayTransactionId})`);
      
      // Get subscription details
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.id, tx.subscriptionId))
        .limit(1);
      
      if (!subscription.length) {
        console.log(`No subscription found for ID ${tx.subscriptionId}, skipping`);
        continue;
      }
      
      // Get plan details
      const plan = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription[0].planId))
        .limit(1);
      
      if (!plan.length) {
        console.log(`No plan found for ID ${subscription[0].planId}, skipping`);
        continue;
      }
      
      // Get user's billing info
      const billingInfo = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, tx.userId))
        .limit(1);
      
      const userCountry = billingInfo.length > 0 ? billingInfo[0].country : 'US';
      const targetRegion = userCountry === 'IN' ? 'INDIA' : 'GLOBAL';
      
      // Get correct pricing for this plan in the user's region
      const pricing = await db.select()
        .from(planPricing)
        .where(
          and(
            eq(planPricing.planId, subscription[0].planId),
            eq(planPricing.targetRegion, targetRegion)
          )
        )
        .limit(1);
      
      if (!pricing.length) {
        console.log(`No pricing found for plan ${subscription[0].planId} in region ${targetRegion}, skipping`);
        continue;
      }
      
      // Determine if there's a currency mismatch
      const correctCurrency = pricing[0].currency;
      const hasCurrencyMismatch = tx.currency !== correctCurrency;
      
      // Only keep the transactions that match the actual charged currency (INR in this case)
      // The USD with $0.00 ones should be removed
      if (tx.amount === '0.00' && tx.currency === 'USD') {
        console.log(`Transaction ${tx.id} has zero amount, will be removed`);
        await db.delete(paymentTransactions)
          .where(eq(paymentTransactions.id, tx.id));
        continue;
      }
      
      // Create metadata for the transaction
      const metadata = {
        planDetails: {
          id: subscription[0].planId,
          name: plan[0].name,
          cycle: plan[0].billingCycle
        },
        paymentDetails: {
          expectedCurrency: correctCurrency,
          actualCurrency: tx.currency,
          hasCurrencyMismatch: hasCurrencyMismatch,
          correctPlanPrice: pricing[0].price,
          correctPlanCurrency: pricing[0].currency
        },
        userRegion: targetRegion,
        userCountry: userCountry,
        description: `${plan[0].name} subscription payment with currency mismatch`,
        fixedBy: 'admin-correction-script'
      };
      
      // Update the transaction
      await db.update(paymentTransactions)
        .set({ 
          metadata: metadata,
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.id, tx.id));
      
      console.log(`Updated transaction ${tx.id} with proper metadata`);
    }
    
    console.log('Transaction fix completed successfully');
  } catch (error) {
    console.error('Error fixing transaction metadata:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix script
fixTransactionMetadata(); 