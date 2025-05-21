import { db } from '../config/db';
import { invoices } from '@shared/schema';

async function checkInvoices() {
  try {
    console.log('Checking invoice details...');
    
    // Get all invoices
    const allInvoices = await db.select().from(invoices);
    
    console.log(`Found ${allInvoices.length} total invoices`);
    
    for (const invoice of allInvoices) {
      const total = parseFloat(invoice.total);
      const taxAmount = parseFloat(invoice.taxAmount);
      const subtotal = parseFloat(invoice.subtotal);
      
      console.log(`\nInvoice #${invoice.invoiceNumber}:`);
      console.log(`Currency: ${invoice.currency}`);
      console.log(`Subtotal: ${subtotal}`);
      console.log(`Tax Amount: ${taxAmount}`);
      console.log(`Total: ${total}`);
      console.log(`Transaction ID: ${invoice.transactionId}`);
      
      // Check if tax calculation is inclusive or exclusive
      const calculatedTotal = subtotal + taxAmount;
      const difference = Math.abs(total - calculatedTotal);
      
      if (difference < 0.01) {
        console.log('Tax calculation: EXCLUSIVE (tax is added on top of subtotal)');
      } else {
        console.log('Tax calculation: INCLUSIVE (tax is included in total)');
      }
      
      // Show tax details if available
      if (invoice.taxDetails && invoice.taxDetails.taxPercentage) {
        console.log(`Tax percentage: ${invoice.taxDetails.taxPercentage}%`);
      }
      
      if (invoice.taxDetails && invoice.taxDetails.taxBreakdown && invoice.taxDetails.taxBreakdown.length > 0) {
        console.log('Tax breakdown:');
        for (const tax of invoice.taxDetails.taxBreakdown) {
          console.log(`  - ${tax.name}: ${tax.percentage}% (${tax.amount})`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking invoices:', error);
  }
}

// Execute the function
checkInvoices()
  .then(() => {
    console.log('\nInvoice check completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 