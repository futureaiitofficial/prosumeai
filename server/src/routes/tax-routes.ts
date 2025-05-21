import express from 'express';
import { requireUser } from '../../middleware/auth';
import { TaxService } from '../../services/tax-service';
import { db } from '../../config/db';
import { invoices, paymentTransactions, userSubscriptions as subscriptions, subscriptionPlans } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getPaymentGatewayByName } from '../../services/payment-gateways';
import { generateInvoicePDF } from 'server/services/puppeteer-pdf-service';
import { decryptModelData } from '../../middleware/data-encryption';
import type { Invoice, InvoiceSettings } from '../../services/pdf-service.d';

export function registerTaxRoutes(app: express.Express) {
  // Get user's invoices
  app.get('/api/user/invoices', requireUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get custom invoices from our database
      const userInvoices = await TaxService.getUserInvoices(userId);
      
      // Get user's active subscription if available
      const userSubscriptions = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.startDate))
        .limit(1);
      
      let razorpayInvoices: any[] = [];
      let transactions: any[] = [];
      
      // If user has an active subscription, fetch Razorpay invoices
      if (userSubscriptions.length > 0) {
        const subscription = userSubscriptions[0];
        
        // Only attempt to fetch from Razorpay if we have a payment reference
        if (subscription.paymentReference) {
          try {
            // Fetch invoices from the payment gateway
            const gateway = getPaymentGatewayByName('razorpay');
            const invoicesData = await gateway.fetchInvoicesForSubscription(subscription.paymentReference);
            razorpayInvoices = invoicesData.items || [];
          } catch (error) {
            console.error(`Error fetching Razorpay invoices: ${(error as Error).message}`);
            // Continue with the endpoint even if Razorpay fetch fails
          }
        }
        
        // Get transactions
        transactions = await db.select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.userId, userId))
          .orderBy(desc(paymentTransactions.createdAt));
      }
      
      // Return only custom invoices and transactions to frontend users
      // Razorpay invoices are hidden from frontend users but still available for admin
      res.json({
        customInvoices: userInvoices,
        transactions: transactions,
        success: true
      });
    } catch (error: any) {
      console.error('Error in GET /api/user/invoices:', error);
      res.status(500).json({ 
        message: 'Failed to fetch invoices', 
        error: error.message,
        success: false
      });
    }
  });

  // Get a specific invoice by ID
  app.get('/api/user/invoices/:id', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      const invoiceId = parseInt(req.params.id);
      
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: 'Invalid invoice ID' });
      }
      
      // Get the invoice
      const invoice = await TaxService.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Make sure the invoice belongs to the user
      if (invoice.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to view this invoice' });
      }
      
      res.json(invoice);
    } catch (error: any) {
      console.error(`Error in GET /api/user/invoices/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to fetch invoice', 
        error: error.message 
      });
    }
  });

  // Download invoice as PDF
  app.get('/api/user/invoices/:id/download', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      const invoiceId = parseInt(req.params.id);
      
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: 'Invalid invoice ID' });
      }
      
      // Get the invoice
      let invoice = await TaxService.getInvoiceById(invoiceId);
      
      // If there's no invoice but the ID might be a transaction ID, try to generate an invoice for it
      if (!invoice) {
        try {
          // Check if this is a transaction ID
          const transaction = await db.select()
            .from(paymentTransactions)
            .where(and(
              eq(paymentTransactions.id, invoiceId),
              eq(paymentTransactions.userId, userId)
            ))
            .limit(1);
            
          if (transaction.length > 0 && transaction[0].status === 'COMPLETED') {
            console.log(`Invoice not found for transaction ${invoiceId}, generating invoice`);
            // Generate invoice for this transaction
            invoice = await TaxService.generateInvoice(invoiceId);
            console.log(`Generated invoice ${invoice.id} for transaction ${invoiceId}`);
          } else {
            return res.status(404).json({ message: 'Invoice not found and transaction is not eligible for invoice generation' });
          }
        } catch (genError) {
          console.error(`Error generating invoice for transaction ${invoiceId}:`, genError);
          return res.status(404).json({ message: 'Invoice not found and could not be generated' });
        }
      }
      
      // Invoice still not found after generation attempt
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Make sure the invoice belongs to the user
      if (invoice.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to download this invoice' });
      }
      
      // Decrypt the billing details before generating the PDF
      if (invoice.billingDetails) {
        invoice.billingDetails = decryptModelData(invoice.billingDetails, 'userBillingDetails');
      }
      
      // Get invoice settings for formatting
      const settings = await TaxService.getInvoiceSettings();
      
      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(invoice as any, settings as any);
      
      // Ensure the PDF buffer is valid
      if (!pdfBuffer || pdfBuffer.length < 100) {
        console.error(`Generated PDF buffer is too small: ${pdfBuffer?.length || 0} bytes`);
        return res.status(500).json({ 
          message: 'Generated PDF is invalid or empty', 
          success: false 
        });
      }
      
      console.log(`Sending PDF download for invoice #${invoice.invoiceNumber}, size: ${pdfBuffer.length} bytes`);
      
      // Set response headers for PDF download with proper content length
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error(`Error in GET /api/user/invoices/${req.params.id}/download:`, error);
      res.status(500).json({ 
        message: 'Failed to download invoice', 
        error: error.message 
      });
    }
  });

  // Download invoice for a specific transaction
  app.get('/api/user/transactions/:transactionId/download', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      const transactionId = parseInt(req.params.transactionId);
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: 'Invalid transaction ID' });
      }
      
      // Check if user owns this transaction
      const transaction = await db.select()
        .from(paymentTransactions)
        .where(and(
          eq(paymentTransactions.id, transactionId),
          eq(paymentTransactions.userId, userId)
        ))
        .limit(1);
        
      if (transaction.length === 0) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      // Check if there's already an invoice for this transaction
      let invoice = await db.select()
        .from(invoices)
        .where(eq(invoices.transactionId, transactionId))
        .limit(1);
      
      // If no invoice exists, generate one if transaction is completed
      if (invoice.length === 0) {
        if (transaction[0].status === 'COMPLETED') {
          console.log(`No invoice found for transaction ${transactionId}, generating invoice`);
          try {
            // Generate invoice
            invoice = [await TaxService.generateInvoice(transactionId)];
            console.log(`Generated invoice ${invoice[0].id} for transaction ${transactionId}`);
          } catch (error) {
            console.error(`Error generating invoice for transaction ${transactionId}:`, error);
            return res.status(500).json({ 
              message: 'Failed to generate invoice for transaction', 
              error: (error as Error).message 
            });
          }
        } else {
          return res.status(400).json({ 
            message: `Cannot generate invoice for transaction with status: ${transaction[0].status}. Only completed transactions can have invoices.` 
          });
        }
      }
      
      // Decrypt the billing details before generating the PDF
      if (invoice[0].billingDetails) {
        invoice[0].billingDetails = decryptModelData(invoice[0].billingDetails, 'userBillingDetails');
      }
      
      // Get invoice settings for formatting
      const settings = await TaxService.getInvoiceSettings();
      
      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(invoice[0] as any, settings as any);
      
      // Ensure the PDF buffer is valid
      if (!pdfBuffer || pdfBuffer.length < 100) {
        console.error(`Generated PDF buffer is too small: ${pdfBuffer?.length || 0} bytes`);
        return res.status(500).json({ 
          message: 'Generated PDF is invalid or empty', 
          success: false 
        });
      }
      
      console.log(`Sending PDF download for invoice #${invoice[0].invoiceNumber}, size: ${pdfBuffer.length} bytes`);
      
      // Set response headers for PDF download with proper content length
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice[0].invoiceNumber}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error(`Error in GET /api/user/transactions/${req.params.transactionId}/download:`, error);
      res.status(500).json({ 
        message: 'Failed to download transaction invoice', 
        error: error.message 
      });
    }
  });

  // Get invoices for a specific subscription
  app.get('/api/subscription/invoices/:subscriptionId', requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      const subscriptionId = req.params.subscriptionId;
      
      // Get transactions for this subscription
      const transactions = await db.select()
        .from(paymentTransactions)
        .where(and(
          eq(paymentTransactions.userId, userId),
          eq(paymentTransactions.subscriptionId, parseInt(subscriptionId))
        ))
        .orderBy(desc(paymentTransactions.createdAt));
      
      // Get invoices for these transactions
      const invoiceResults = [];
      
      for (const txn of transactions) {
        if (!txn.id) continue;
        
        const invoice = await db.select()
          .from(invoices)
          .where(eq(invoices.transactionId, txn.id))
          .limit(1);
        
        if (invoice.length > 0) {
          invoiceResults.push(invoice[0]);
        }
      }
      
      // If there are transactions but no invoices, generate invoices for completed transactions
      if (transactions.length > 0 && invoiceResults.length === 0) {
        console.log(`No invoices found for subscription ${subscriptionId}, generating invoices for completed transactions`);
        
        for (const txn of transactions) {
          if (txn.id && txn.status === 'COMPLETED') {
            try {
              const newInvoice = await TaxService.generateInvoice(txn.id);
              invoiceResults.push(newInvoice);
            } catch (error) {
              console.error(`Error generating invoice for transaction ${txn.id}:`, error);
            }
          }
        }
      }
      
      // Get Razorpay payment info
      let razorpayInvoices: any[] = [];
      
      if (transactions.length > 0 && transactions[0].gateway === 'RAZORPAY') {
        // This would typically make an API call to Razorpay to get their invoice data
        // For now, we'll leave it as an empty array
        razorpayInvoices = [];
      }
      
      res.json({
        invoices: razorpayInvoices,
        transactions: transactions
      });
    } catch (error: any) {
      console.error(`Error in GET /api/subscription/invoices/${req.params.subscriptionId}:`, error);
      res.status(500).json({ 
        message: 'Failed to fetch subscription invoices', 
        error: error.message 
      });
    }
  });

  // Download invoice for transaction as PDF
  app.get('/api/user/transactions/:id/download', requireUser, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      console.log(`User ${userId} requesting invoice PDF for transaction ${id}`);
      
      // Verify user has access to this transaction
      const transaction = await db.select()
        .from(paymentTransactions)
        .where(
          and(
            eq(paymentTransactions.id, parseInt(id)),
            eq(paymentTransactions.userId, userId)
          )
        )
        .limit(1);
        
      if (!transaction.length) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      // Check if invoice exists for this transaction
      const existingInvoice = await db.select()
        .from(invoices)
        .where(eq(invoices.transactionId, parseInt(id)))
        .limit(1);
        
      let invoice;
      
      if (existingInvoice.length > 0) {
        invoice = existingInvoice[0];
        
        // If the invoice exists but doesn't have subscription details, update them
        if ((!invoice.subscriptionPlan || !invoice.nextPaymentDate) && transaction[0].subscriptionId) {
          // Look up subscription details
          const subscriptionData = await db.select({
            subscription: subscriptions,
            planName: subscriptionPlans.name
          })
          .from(subscriptions)
          .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
          .where(eq(subscriptions.id, transaction[0].subscriptionId))
          .limit(1);
          
          if (subscriptionData.length > 0) {
            const subscriptionPlan = subscriptionData[0].planName ?? "Subscription";
            
            // Safely handle the items array
            const currentItems = Array.isArray(invoice.items) ? invoice.items : [];
            const updatedItems = currentItems.map((item: any) => ({
              ...item,
              description: `${subscriptionPlan} Plan Subscription`
            }));
            
            // Update the invoice with the subscription details
            await db.update(invoices)
              .set({
                subscriptionPlan,
                // No need to update nextPaymentDate as the DB expectation is a Date
                items: updatedItems
              })
              .where(eq(invoices.id, invoice.id));
              
            // Refresh the invoice data
            invoice = (await db.select()
              .from(invoices)
              .where(eq(invoices.id, invoice.id))
              .limit(1))[0];
          }
        }
      } else {
        // Generate an invoice for this transaction
        invoice = await TaxService.generateInvoice(parseInt(id));
      }
      
      if (!invoice) {
        return res.status(404).json({ message: 'Could not generate invoice for transaction' });
      }
      
      // Get invoice settings
      const invoiceSettings = await TaxService.getInvoiceSettings();
      
      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(invoice as unknown as Invoice, invoiceSettings as unknown as InvoiceSettings);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      console.log(`Sending PDF download for invoice #${invoice.invoiceNumber}, size: ${pdfBuffer.length} bytes`);
      
      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      res.status(500).json({ message: 'Error generating invoice PDF' });
    }
  });
} 