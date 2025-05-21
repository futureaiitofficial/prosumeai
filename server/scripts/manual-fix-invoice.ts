import { db } from '../config/db';
import { invoices } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to manually fix the specific invoice with incorrect tax calculations
 */
async function manualFixInvoice() {
  try {
    console.log('Starting manual invoice fix...');
    
    // Get invoice #INV-1001
    const invoice = await db.select().from(invoices).where(eq(invoices.invoiceNumber, 'INV-1001')).limit(1);
    
    if (invoice.length === 0) {
      console.log('Invoice #INV-1001 not found');
      return;
    }
    
    const invoiceRecord = invoice[0];
    
    // Get the current values
    const total = parseFloat(invoiceRecord.total);
    const taxAmount = parseFloat(invoiceRecord.taxAmount);
    const subtotal = parseFloat(invoiceRecord.subtotal);
    const percentage = 18; // According to the check
    
    console.log('Current invoice values:');
    console.log(`  Subtotal: ${subtotal}`);
    console.log(`  Tax: ${taxAmount}`);
    console.log(`  Total: ${total}`);
    console.log(`  Tax Percentage: ${percentage}%`);
    
    // Calculate new values
    // For inclusive tax, use: tax = total * (percentage / (100 + percentage))
    const newTaxAmount = (total * percentage) / (100 + percentage);
    const newSubtotal = total - newTaxAmount;
    
    console.log('\nNew inclusive tax values:');
    console.log(`  Subtotal: ${newSubtotal.toFixed(2)}`);
    console.log(`  Tax: ${newTaxAmount.toFixed(2)}`);
    console.log(`  Total: ${total} (unchanged)`);
    
    // Update tax details
    let updatedTaxDetails = invoiceRecord.taxDetails;
    
    if (updatedTaxDetails) {
      updatedTaxDetails.taxAmount = newTaxAmount;
      updatedTaxDetails.subtotal = newSubtotal;
      
      if (updatedTaxDetails.taxBreakdown && updatedTaxDetails.taxBreakdown.length > 0) {
        updatedTaxDetails.taxBreakdown[0].amount = newTaxAmount;
      }
    }
    
    // Update invoice items to use the new subtotal
    let updatedItems = invoiceRecord.items;
    if (updatedItems && updatedItems.length > 0) {
      updatedItems = updatedItems.map(item => ({
        ...item,
        unitPrice: newSubtotal,
        total: newSubtotal
      }));
    }
    
    console.log('\nUpdating invoice in database...');
    
    // Update the invoice
    const result = await db.update(invoices)
      .set({
        subtotal: newSubtotal.toString(),
        taxAmount: newTaxAmount.toString(),
        taxDetails: updatedTaxDetails,
        items: updatedItems
      })
      .where(eq(invoices.id, invoiceRecord.id))
      .returning();
    
    if (result.length > 0) {
      console.log(`Successfully fixed invoice #${invoiceRecord.invoiceNumber}`);
    } else {
      console.log('Update operation did not return any results');
    }
    
  } catch (error) {
    console.error('Error fixing invoice:', error);
  }
}

// Execute the function
manualFixInvoice()
  .then(() => {
    console.log('Manual invoice fix completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 