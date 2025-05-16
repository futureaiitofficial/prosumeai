import { PgDatabase } from 'drizzle-orm/pg-core';
import { db } from '../config/db';
import { paymentTransactions, userSubscriptions, planPricing, userBillingDetails } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Script to update transaction labels for clarity
 * This script helps identify and label payment transactions appropriately
 */

async function updateTransactionLabels() {
  console.log('Starting transaction labels update...');
  
  try {
    // Get all transactions
    const transactions = await db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.gateway, 'RAZORPAY'));
    
    console.log(`Found ${transactions.length} Razorpay transactions to process`);
    
    let updatedCount = 0;
    
    // Process each transaction
    for (const tx of transactions) {
      if (!tx.refundReason) continue;
      
      // Skip if already processed with new format
      if (tx.refundReason.includes('SUBSCRIPTION_PAYMENT:')) {
        continue;
      }
      
      let newNote: string | null = null;
      
      // Get all plan pricing data
      const allPlanPricing = await db.select()
        .from(planPricing);
      
      // Check for amount that looks like a plan payment but in wrong currency
      let isLikelyWrongCurrencyPayment = false;
      let matchedPlanInfo = null;
      
      // Check if amount matches a plan price
      for (const pricing of allPlanPricing) {
        // Only check against plans in the same currency
        if (pricing.currency === tx.currency) {
          const txAmount = parseFloat(tx.amount);
          const planPrice = parseFloat(pricing.price);
          
          // Check if amount is very close to a plan price
          if (Math.abs(txAmount - planPrice) < (planPrice * 0.05)) { // Within 5% tolerance
            isLikelyWrongCurrencyPayment = true;
            matchedPlanInfo = pricing;
            console.log(`Transaction ${tx.id}: Found pricing match: Amount ${txAmount} ${tx.currency} matches plan ID ${pricing.planId} price ${pricing.price} ${pricing.currency}`);
            break;
          }
        }
      }
      
      // Check if the plan currency is correct for the user's region
      if (isLikelyWrongCurrencyPayment && matchedPlanInfo) {
        // Check if we have user billing info to determine correct currency
        const userBillingInfo = await db.select()
          .from(userBillingDetails)
          .where(eq(userBillingDetails.userId, tx.userId))
          .limit(1);
        
        const userCountry = userBillingInfo.length > 0 ? userBillingInfo[0].country : 'US';
        const expectedCurrency = userCountry === 'IN' ? 'INR' : 'USD';
        
        // If the currency matches what the user should have, it's not a wrong currency payment
        if (tx.currency === expectedCurrency) {
          isLikelyWrongCurrencyPayment = false;
          console.log(`Transaction ${tx.id}: Currency ${tx.currency} is correct for user in ${userCountry}`);
        } else {
          console.log(`Transaction ${tx.id}: Found wrong currency - user in ${userCountry} should use ${expectedCurrency} but transaction is in ${tx.currency}`);
        }
      }
      
      // Extract plan name from refund reason if available
      const extractPlanName = (reason?: string): string => {
        if (!reason) return 'Unknown';
        const match = reason.match(/plan_name:\s*([^,]+)/);
        return match ? match[1].trim() : 'Unknown';
      };
      
      // Extract plan amount from refund reason if available
      const extractPlanAmount = (reason?: string): string => {
        if (!reason) return 'unknown';
        const match = reason.match(/actual_plan_amount:\s*([\d.]+)/);
        return match ? match[1].trim() : 'unknown';
      };
      
      // Update notes to have clear prefixes
      if (isLikelyWrongCurrencyPayment) {
        newNote = `SUBSCRIPTION_PAYMENT: ${tx.refundReason || ''} - currency_mismatch: true, notes: This payment may have used incorrect currency`;
        console.log(`Transaction ${tx.id}: Marking as subscription payment with possible currency mismatch`);
      } else {
        newNote = `SUBSCRIPTION_PAYMENT: ${tx.refundReason || ''}`;
        console.log(`Transaction ${tx.id}: Marking as subscription payment (default)`);
      }
      
      if (newNote) {
        await db.update(paymentTransactions)
          .set({ refundReason: newNote })
          .where(eq(paymentTransactions.id, tx.id));
        
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} transaction records`);
    
  } catch (error) {
    console.error('Error updating transaction labels:', error);
    process.exit(1);
  }
  
  console.log('Transaction labels update completed!');
  process.exit(0);
}

// Run the function
updateTransactionLabels(); 