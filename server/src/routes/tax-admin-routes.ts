import express from 'express';
import { requireAdmin } from '../../middleware/auth';
import { db } from '../../config/db';
import { taxSettings, companyTaxInfo, invoiceSettings, invoices } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { TaxService } from '../../services/tax-service';

export function registerTaxAdminRoutes(app: express.Express) {
  // Tax Settings Routes
  
  // Get all tax settings
  app.get('/api/admin/tax-settings', requireAdmin, async (req, res) => {
    try {
      const settings = await TaxService.getAllTaxSettings();
      res.json(settings);
    } catch (error: any) {
      console.error('Error in GET /api/admin/tax-settings:', error);
      res.status(500).json({ 
        message: 'Failed to fetch tax settings', 
        error: error.message 
      });
    }
  });

  // Create tax setting
  app.post('/api/admin/tax-settings', requireAdmin, async (req, res) => {
    try {
      const taxData = req.body;
      const newTax = await db.insert(taxSettings)
        .values(taxData)
        .returning();
      
      res.status(201).json(newTax[0]);
    } catch (error: any) {
      console.error('Error in POST /api/admin/tax-settings:', error);
      res.status(500).json({ 
        message: 'Failed to create tax setting', 
        error: error.message 
      });
    }
  });

  // Update tax setting
  app.patch('/api/admin/tax-settings/:id', requireAdmin, async (req, res) => {
    try {
      const taxId = parseInt(req.params.id);
      if (isNaN(taxId)) {
        return res.status(400).json({ message: 'Invalid tax setting ID' });
      }
      
      const updateData = req.body;
      
      // Remove timestamp fields if they exist in the request
      const { createdAt, updatedAt, ...cleanedData } = updateData;

      const updatedTax = await db.update(taxSettings)
        .set({
          ...cleanedData,
          updatedAt: new Date() // This ensures we're passing a proper Date object
        })
        .where(eq(taxSettings.id, taxId))
        .returning();
      
      if (!updatedTax.length) {
        return res.status(404).json({ message: 'Tax setting not found' });
      }
      
      res.json(updatedTax[0]);
    } catch (error: any) {
      console.error(`Error in PATCH /api/admin/tax-settings/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to update tax setting', 
        error: error.message 
      });
    }
  });

  // Delete tax setting
  app.delete('/api/admin/tax-settings/:id', requireAdmin, async (req, res) => {
    try {
      const taxId = parseInt(req.params.id);
      if (isNaN(taxId)) {
        return res.status(400).json({ message: 'Invalid tax setting ID' });
      }
      
      const deleted = await db.delete(taxSettings)
        .where(eq(taxSettings.id, taxId))
        .returning();
      
      if (!deleted.length) {
        return res.status(404).json({ message: 'Tax setting not found' });
      }
      
      res.json({ message: 'Tax setting deleted successfully', id: taxId });
    } catch (error: any) {
      console.error(`Error in DELETE /api/admin/tax-settings/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to delete tax setting', 
        error: error.message 
      });
    }
  });

  // Company Tax Info Routes
  
  // Get company tax info
  app.get('/api/admin/company-tax-info', requireAdmin, async (req, res) => {
    try {
      const companyInfo = await TaxService.getCompanyTaxInfo();
      
      if (!companyInfo) {
        return res.status(404).json({ message: 'Company tax information not found' });
      }
      
      res.json(companyInfo);
    } catch (error: any) {
      console.error('Error in GET /api/admin/company-tax-info:', error);
      res.status(500).json({ 
        message: 'Failed to fetch company tax information', 
        error: error.message 
      });
    }
  });

  // Update company tax info
  app.put('/api/admin/company-tax-info', requireAdmin, async (req, res) => {
    try {
      const companyData = req.body;
      
      // Remove timestamp fields from the request data
      const { createdAt, updatedAt, ...cleanedData } = companyData;
      
      // Log the company data for debugging
      console.log('Updating company tax info:', cleanedData);
      
      // Check if company info already exists
      const existingInfo = await db.select()
        .from(companyTaxInfo)
        .limit(1);
      
      let updatedInfo;
      
      if (existingInfo.length > 0) {
        // Update existing record with explicit updatedAt
        updatedInfo = await db.update(companyTaxInfo)
          .set({
            ...cleanedData,
            updatedAt: new Date() // Ensure we're using a proper Date object
          })
          .where(eq(companyTaxInfo.id, existingInfo[0].id))
          .returning();
      } else {
        // Create new record
        updatedInfo = await db.insert(companyTaxInfo)
          .values(cleanedData)
          .returning();
      }
      
      res.json(updatedInfo[0]);
    } catch (error: any) {
      console.error('Error in PUT /api/admin/company-tax-info:', error);
      res.status(500).json({ 
        message: 'Failed to update company tax information', 
        error: error.message 
      });
    }
  });

  // Invoice Settings Routes
  
  // Get invoice settings
  app.get('/api/admin/invoice-settings', requireAdmin, async (req, res) => {
    try {
      const settings = await db.select()
        .from(invoiceSettings)
        .limit(1);
      
      if (!settings.length) {
        return res.status(404).json({ message: 'Invoice settings not found' });
      }
      
      res.json(settings[0]);
    } catch (error: any) {
      console.error('Error in GET /api/admin/invoice-settings:', error);
      res.status(500).json({ 
        message: 'Failed to fetch invoice settings', 
        error: error.message 
      });
    }
  });

  // Update invoice settings
  app.put('/api/admin/invoice-settings', requireAdmin, async (req, res) => {
    try {
      const settingsData = req.body;
      
      // Remove timestamp fields if they exist in the request
      const { createdAt, updatedAt, ...cleanedData } = settingsData;
      
      // Check if settings already exist
      const existingSettings = await db.select()
        .from(invoiceSettings)
        .limit(1);
      
      let updatedSettings;
      
      if (existingSettings.length > 0) {
        // Update existing record with timestamp
        updatedSettings = await db.update(invoiceSettings)
          .set({
            ...cleanedData,
            updatedAt: new Date() // Ensure we're using a proper Date object
          })
          .where(eq(invoiceSettings.id, existingSettings[0].id))
          .returning();
      } else {
        // Create new record
        updatedSettings = await db.insert(invoiceSettings)
          .values(cleanedData)
          .returning();
      }
      
      res.json(updatedSettings[0]);
    } catch (error: any) {
      console.error('Error in PUT /api/admin/invoice-settings:', error);
      res.status(500).json({ 
        message: 'Failed to update invoice settings', 
        error: error.message 
      });
    }
  });

  // Invoice Management Routes
  
  // Get all invoices (with pagination)
  app.get('/api/admin/invoices', requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // Get total count for pagination
      const countResult = await db.select({ count: sql<number>`COUNT(*)` })
        .from(invoices);
      
      const totalCount = Number(countResult[0].count);
      
      // Get invoices with pagination
      const allInvoices = await db.select()
        .from(invoices)
        .orderBy(desc(invoices.createdAt))
        .limit(limit)
        .offset(offset);
      
      res.json({
        invoices: allInvoices,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error: any) {
      console.error('Error in GET /api/admin/invoices:', error);
      res.status(500).json({ 
        message: 'Failed to fetch invoices', 
        error: error.message 
      });
    }
  });

  // Get invoice by ID
  app.get('/api/admin/invoices/:id', requireAdmin, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: 'Invalid invoice ID' });
      }
      
      const invoice = await TaxService.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(invoice);
    } catch (error: any) {
      console.error(`Error in GET /api/admin/invoices/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to fetch invoice', 
        error: error.message 
      });
    }
  });

  // Update invoice status or notes
  app.patch('/api/admin/invoices/:id', requireAdmin, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: 'Invalid invoice ID' });
      }
      
      const { status, notes } = req.body;
      
      // Only allow updating specific fields
      const updateData: any = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      
      const updatedInvoice = await db.update(invoices)
        .set(updateData)
        .where(eq(invoices.id, invoiceId))
        .returning();
      
      if (!updatedInvoice.length) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(updatedInvoice[0]);
    } catch (error: any) {
      console.error(`Error in PATCH /api/admin/invoices/${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Failed to update invoice', 
        error: error.message 
      });
    }
  });

  // Regenerate invoice - useful for testing
  app.post('/api/admin/regenerate-invoice/:transactionId', requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: 'Invalid transaction ID' });
      }
      
      // Delete existing invoice for this transaction if it exists
      await db.delete(invoices)
        .where(eq(invoices.transactionId, transactionId));
      
      // Generate new invoice
      const newInvoice = await TaxService.generateInvoice(transactionId);
      
      res.json({
        message: 'Invoice regenerated successfully',
        invoice: newInvoice
      });
    } catch (error: any) {
      console.error(`Error in POST /api/admin/regenerate-invoice/${req.params.transactionId}:`, error);
      res.status(500).json({ 
        message: 'Failed to regenerate invoice', 
        error: error.message 
      });
    }
  });

  // Regenerate specific invoice by ID
  app.post('/api/admin/regenerate-invoice-by-id/:invoiceId', requireAdmin, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: 'Invalid invoice ID' });
      }
      
      // Get the invoice to determine its transaction ID
      const existingInvoice = await db.select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);
        
      if (existingInvoice.length === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      const transactionId = existingInvoice[0].transactionId;
      if (!transactionId) {
        return res.status(400).json({ message: 'Invoice does not have an associated transaction ID' });
      }
      
      // Delete the existing invoice
      await db.delete(invoices)
        .where(eq(invoices.id, invoiceId));
      
      // Generate new invoice
      const newInvoice = await TaxService.generateInvoice(transactionId);
      
      res.json({
        message: 'Invoice regenerated successfully',
        oldInvoiceId: invoiceId,
        newInvoice
      });
    } catch (error: any) {
      console.error(`Error in POST /api/admin/regenerate-invoice-by-id/${req.params.invoiceId}:`, error);
      res.status(500).json({ 
        message: 'Failed to regenerate invoice', 
        error: error.message 
      });
    }
  });
} 