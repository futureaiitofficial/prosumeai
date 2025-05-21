import { db } from '../config/db';
import { invoices } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to fix existing invoices with incorrect tax calculations
 * 
 * This script finds all INR invoices and recalculates their tax values to use inclusive GST
 * rather than adding GST on top of the amount
 */
async function fixExistingInvoices() {
  try {
    console.log('Starting to fix existing invoices...');
    
    // Get all invoices with INR currency
    const allInvoices = await db.select().from(invoices).where(eq(invoices.currency, 'INR'));
    
    console.log(`Found ${allInvoices.length} INR invoices to fix`);
    
    let fixedCount = 0;
    
    for (const invoice of allInvoices) {
      // Get the current values
      const total = parseFloat(invoice.total);
      const taxAmount = parseFloat(invoice.taxAmount);
      const subtotal = parseFloat(invoice.subtotal);
      
      // Check if the invoice is using exclusive tax (tax added on top)
      const calculatedTotal = subtotal + taxAmount;
      const difference = Math.abs(total - calculatedTotal);
      
      // If total = subtotal + tax, then it's exclusive tax
      const isExclusiveTax = difference < 0.01;
      
      if (!isExclusiveTax) {
        console.log(`Invoice #${invoice.invoiceNumber} is already using inclusive tax, skipping`);
        continue;
      }
      
      console.log(`Invoice #${invoice.invoiceNumber} is using exclusive tax calculation (${subtotal} + ${taxAmount} = ${total}), fixing...`);
      
      // Get tax details to extract the percentage
      let percentage = 18; // Default to 18% if not found
      
      if (invoice.taxDetails && invoice.taxDetails.taxPercentage) {
        percentage = invoice.taxDetails.taxPercentage;
      } else if (invoice.taxDetails && invoice.taxDetails.taxBreakdown && invoice.taxDetails.taxBreakdown.length > 0) {
        percentage = invoice.taxDetails.taxBreakdown[0].percentage;
      }
      
      // Option 1: Keep the same total amount (recalculate subtotal)
      const originalTotalAmount = total;
      
      // New tax calculation (extracting tax from total)
      // For inclusive tax: tax = total * (percentage / (100 + percentage))
      const newTaxAmount = (originalTotalAmount * percentage) / (100 + percentage);
      
      // New subtotal (total minus tax)
      const newSubtotal = originalTotalAmount - newTaxAmount;
      
      console.log(`Fixed calculation (keeping the same total):`);
      console.log(`  Subtotal: ${newSubtotal.toFixed(2)}`);
      console.log(`  Tax: ${newTaxAmount.toFixed(2)}`);
      console.log(`  Total: ${originalTotalAmount.toFixed(2)}`);
      
      // Update tax details
      let updatedTaxDetails = invoice.taxDetails;
      
      if (updatedTaxDetails) {
        updatedTaxDetails.taxAmount = newTaxAmount;
        updatedTaxDetails.subtotal = newSubtotal;
        updatedTaxDetails.total = originalTotalAmount;
        
        if (updatedTaxDetails.taxBreakdown && updatedTaxDetails.taxBreakdown.length > 0) {
          updatedTaxDetails.taxBreakdown[0].amount = newTaxAmount;
        }
      }
      
      // Update invoice items to use the new subtotal
      let updatedItems = invoice.items;
      if (updatedItems && updatedItems.length > 0) {
        updatedItems = updatedItems.map(item => ({
          ...item,
          unitPrice: newSubtotal,
          total: newSubtotal
        }));
      }
      
      // Update the invoice
      await db.update(invoices)
        .set({
          subtotal: newSubtotal.toString(),
          taxAmount: newTaxAmount.toString(),
          // Don't change the total
          taxDetails: updatedTaxDetails,
          items: updatedItems
        })
        .where(eq(invoices.id, invoice.id));
      
      console.log(`Fixed invoice #${invoice.invoiceNumber}`);
      fixedCount++;
    }
    
    console.log(`Successfully fixed ${fixedCount} invoices`);
    
  } catch (error) {
    console.error('Error fixing invoices:', error);
  }
}

// Execute the function
fixExistingInvoices()
  .then(() => {
    console.log('Invoice fix script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 