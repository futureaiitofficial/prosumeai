/**
 * Transaction Currency Validator
 * 
 * This script checks recent transactions for currency/amount mismatches,
 * helping detect issues early if the webhook handling fails.
 * 
 * Run with: npx tsx server/scripts/validate-transaction-currencies.ts
 */

import { db } from '../config/db';
import { paymentTransactions, userBillingDetails, planPricing, subscriptionPlans, userSubscriptions } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import fs from 'fs';

export async function validateTransactionCurrencies() {
  console.log('Starting transaction currency validation check...');
  
  // Look at transactions from the last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  try {
    // Get recent transactions
    const recentTransactions = await db.select()
      .from(paymentTransactions)
      .where(gte(paymentTransactions.createdAt, oneDayAgo))
      .orderBy(desc(paymentTransactions.createdAt));
    
    console.log(`Found ${recentTransactions.length} transactions from the last 24 hours to validate`);
    
    // Track validation issues
    const validationIssues = [];
    
    // Process each transaction
    for (const transaction of recentTransactions) {
      try {
        console.log(`Validating transaction ${transaction.id} (payment ${transaction.gatewayTransactionId})`);
        
        // Get the user's billing details to determine correct currency
        const userBillingInfo = await db.select()
          .from(userBillingDetails)
          .where(eq(userBillingDetails.userId, transaction.userId))
          .limit(1);
          
        // If no billing info, default to US/USD
        const userCountry = userBillingInfo.length > 0 ? userBillingInfo[0].country : 'US';
        const targetRegion = userCountry === 'IN' ? 'INDIA' : 'GLOBAL';
        const correctCurrency = targetRegion === 'INDIA' ? 'INR' : 'USD';
        
        // Get subscription and plan information to validate the amount
        const subscription = await db.select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.id, transaction.subscriptionId))
          .limit(1);
          
        if (!subscription.length) {
          console.log(`No subscription found for transaction ${transaction.id}, skipping validation`);
          continue;
        }
        
        const planId = subscription[0].planId;
        
        // Get pricing for the CORRECT currency (not just the transaction currency)
        const pricingInfo = await db.select()
          .from(planPricing)
          .where(
            and(
              eq(planPricing.planId, planId),
              eq(planPricing.currency, correctCurrency)
            )
          )
          .limit(1);
        
        if (!pricingInfo.length) {
          console.log(`No pricing found for plan ${planId} with currency ${correctCurrency}, skipping validation`);
          continue;
        }
        
        // VALIDATE: Is the transaction currency correct for this user's region?
        if (transaction.currency !== correctCurrency) {
          validationIssues.push({
            transactionId: transaction.id,
            gatewayTransactionId: transaction.gatewayTransactionId,
            userId: transaction.userId,
            userCountry,
            targetRegion,
            issueType: 'CURRENCY_MISMATCH',
            currentCurrency: transaction.currency,
            correctCurrency,
            timestamp: new Date().toISOString()
          });
          
          console.log(`❌ VALIDATION FAILED - Currency mismatch for transaction ${transaction.id}:`);
          console.log(`  Current: ${transaction.currency}, Expected: ${correctCurrency}`);
        }
        
        // VALIDATE: Is the amount correct for this plan?
        // Only check if currency is already correct
        if (transaction.currency === correctCurrency) {
          const correctAmount = pricingInfo[0].price;
          const currentAmount = transaction.amount;
          
          // Allow for small rounding differences (within 1%)
          const amountDifference = Math.abs(parseFloat(currentAmount) - parseFloat(correctAmount));
          const percentDifference = amountDifference / parseFloat(correctAmount);
          
          if (percentDifference > 0.01) { // More than 1% difference
            validationIssues.push({
              transactionId: transaction.id,
              gatewayTransactionId: transaction.gatewayTransactionId,
              userId: transaction.userId,
              userCountry,
              targetRegion,
              issueType: 'AMOUNT_MISMATCH',
              currentAmount,
              correctAmount,
              currency: transaction.currency,
              timestamp: new Date().toISOString()
            });
            
            console.log(`❌ VALIDATION FAILED - Amount mismatch for transaction ${transaction.id}:`);
            console.log(`  Current: ${currentAmount} ${transaction.currency}, Expected: ${correctAmount} ${transaction.currency}`);
          }
        }
      } catch (validationError) {
        console.error(`Error validating transaction ${transaction.id}:`, validationError);
      }
    }
    
    // Save validation issues to a log file
    if (validationIssues.length > 0) {
      // Format for log file
      const logData = {
        timestamp: new Date().toISOString(),
        totalIssues: validationIssues.length,
        issues: validationIssues
      };
      
      const logDir = './logs';
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = `${logDir}/currency-validation-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(
        logFile, 
        JSON.stringify(logData, null, 2),
        'utf8'
      );
      
      console.log(`⚠️ Found ${validationIssues.length} validation issues! Details saved to ${logFile}`);
      console.log(`⚠️ ALERT: Transactions with incorrect currency/amount detected!`);
    } else {
      console.log('✅ All transactions validated successfully! No issues found.');
    }
    
    return validationIssues;
  } catch (error) {
    console.error('Error validating transaction currencies:', error);
    throw error;
  }
}

// When running as a standalone script
if (require.main === module) {
  validateTransactionCurrencies()
    .then(() => {
      console.log('Validation complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during validation:', error);
      process.exit(1);
    });
}

// Default export for ESM imports
export default validateTransactionCurrencies; 