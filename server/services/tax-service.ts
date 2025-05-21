import { db } from '../config/db';
import { taxSettings, companyTaxInfo, invoices, invoiceSettings, userBillingDetails, paymentTransactions, userSubscriptions, subscriptionPlans } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { decryptModelData } from '../middleware/data-encryption';

export interface TaxCalculationResult {
  taxType: string;
  taxAmount: number;
  taxPercentage: number;
  taxBreakdown: TaxBreakdownItem[];
  subtotal: number;
  total: number;
}

export interface TaxBreakdownItem {
  name: string;
  type: string;
  percentage: number;
  amount: number;
}

/**
 * Tax service for handling all tax-related operations
 */
export const TaxService = {
  /**
   * Get all tax settings
   */
  async getAllTaxSettings() {
    try {
      const settings = await db.select().from(taxSettings);
      return settings;
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      throw error;
    }
  },

  /**
   * Get company tax information
   */
  async getCompanyTaxInfo() {
    try {
      const info = await db.select()
        .from(companyTaxInfo)
        .limit(1);
      
      return info.length > 0 ? info[0] : null;
    } catch (error) {
      console.error('Error fetching company tax info:', error);
      throw error;
    }
  },

  /**
   * Calculate applicable taxes for a given amount
   * @param userId - User ID
   * @param amount - Amount to calculate tax on
   * @param currency - Currency of the amount
   */
  async calculateTaxes(userId: number, amount: number, currency: string): Promise<TaxCalculationResult> {
    try {
      // Only calculate tax for INR currency
      if (currency !== 'INR') {
        return {
          taxType: 'NONE',
          taxAmount: 0,
          taxPercentage: 0,
          taxBreakdown: [],
          subtotal: amount,
          total: amount
        };
      }
      
      // Get all active tax settings
      const activeTaxSettings = await db.select()
        .from(taxSettings)
        .where(and(
          eq(taxSettings.enabled, true),
          eq(taxSettings.applyCurrency, 'INR')
        ));
      
      if (!activeTaxSettings.length) {
        return {
          taxType: 'NONE',
          taxAmount: 0,
          taxPercentage: 0,
          taxBreakdown: [],
          subtotal: amount,
          total: amount
        };
      }
      
      // Simply use GST for all cases - simpler to implement and maintain
      const gstSettings = activeTaxSettings.find(tax => tax.type === 'GST');
      
      if (!gstSettings) {
        console.log('No GST tax settings found, falling back to no tax');
        return {
          taxType: 'NONE',
          taxAmount: 0,
          taxPercentage: 0,
          taxBreakdown: [],
          subtotal: amount,
          total: amount
        };
      }
      
      // Calculate GST amount - GST is inclusive in India
      const percentage = parseFloat(gstSettings.percentage.toString());
      
      // For inclusive tax, calculate the base price and tax
      // If original price is P and tax rate is r (as decimal), then:
      // Base price = P / (1 + r) and Tax amount = P - Base price
      const taxRate = percentage / 100;
      const subtotal = amount / (1 + taxRate);
      const taxAmount = amount - subtotal;
      
      console.log(`GST calculation (inclusive): Total amount: ${amount} INR, GST rate: ${percentage}%, Base price: ${subtotal.toFixed(2)} INR, GST amount: ${taxAmount.toFixed(2)} INR`);
      
      return {
        taxType: 'GST',
        taxAmount,
        taxPercentage: percentage,
        taxBreakdown: [{
          name: gstSettings.name,
          type: 'GST',
          percentage,
          amount: taxAmount
        }],
        subtotal: subtotal,
        total: amount // Total is the original amount since tax is inclusive
      };
    } catch (error) {
      console.error('Error calculating taxes:', error);
      // Return no tax in case of error
      return {
        taxType: 'NONE',
        taxAmount: 0,
        taxPercentage: 0,
        taxBreakdown: [],
        subtotal: amount,
        total: amount
      };
    }
  },

  /**
   * Generate invoice for a payment transaction
   * 
   * @param transactionId - The payment transaction ID
   * @returns The generated invoice
   */
  async generateInvoice(transactionId: number) {
    try {
      // Check if invoice already exists for this transaction
      const existingInvoice = await db.select()
        .from(invoices)
        .where(eq(invoices.transactionId, transactionId))
        .limit(1);

      if (existingInvoice.length > 0) {
        console.log(`Invoice already exists for transaction ${transactionId}`);
        return existingInvoice[0];
      }

      // Get transaction details
      const transaction = await db.select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.id, transactionId))
        .limit(1);

      if (transaction.length === 0) {
        throw new Error(`Transaction with ID ${transactionId} not found`);
      }

      const txn = transaction[0];
      const userId = txn.userId;
      const currency = txn.currency;

      // Get subscription details if available
      let subscriptionDetails = null;
      let subscriptionPlan = "Subscription";
      let nextPaymentDate = null;
      
      if (txn.subscriptionId) {
        try {
          // Get the subscription with joined plan details to access plan name
          const subscriptionData = await db.select({
            subscription: userSubscriptions,
            planName: subscriptionPlans.name
          })
          .from(userSubscriptions)
          .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
          .where(eq(userSubscriptions.id, txn.subscriptionId))
          .limit(1);
            
          if (subscriptionData.length > 0) {
            subscriptionDetails = subscriptionData[0].subscription;
            // Get plan name from the joined plan table
            subscriptionPlan = subscriptionData[0].planName ?? "Subscription";
            
            // Calculate next payment date based on current end date
            if (subscriptionDetails.endDate && subscriptionDetails.autoRenew) {
              nextPaymentDate = subscriptionDetails.endDate;
            }
          }
        } catch (error) {
          console.error(`Error fetching subscription details: ${error}`);
          // Continue without subscription details
        }
      }

      // Get user's billing details
      const billingDetails = await db.select()
        .from(userBillingDetails)
        .where(eq(userBillingDetails.userId, userId))
        .limit(1);

      if (billingDetails.length === 0) {
        throw new Error(`Billing details for user ${userId} not found`);
      }

      // Get decrypted billing details for saving in the invoice
      const decryptedBillingDetails = decryptModelData(billingDetails[0], 'userBillingDetails');

      // Get company tax info - but handle differently based on currency
      const companyInfo = await this.getCompanyTaxInfo();
      if (!companyInfo) {
        throw new Error('Company tax information not found');
      }
      
      // For non-INR transactions, create a copy of company info but omit GST information
      let finalCompanyInfo = { ...companyInfo };
      if (currency !== 'INR' && finalCompanyInfo.gstin) {
        // For non-INR transactions, set GSTIN to null 
        finalCompanyInfo = {
          ...companyInfo,
          gstin: null
        };
      }

      // Get invoice settings
      const settings = await this.getInvoiceSettings();
      if (!settings) {
        throw new Error('Invoice settings not found');
      }

      // Calculate taxes - will be 0 for non-INR currencies
      const totalAmount = Number(txn.amount);
      const taxCalculation = await this.calculateTaxes(userId, totalAmount, currency);

      // Generate invoice number
      const invoiceNumber = `${settings.invoicePrefix}${settings.nextInvoiceNumber}`;

      // For USD transactions, ensure no tax information is included
      const invoiceValues = {
        invoiceNumber,
        userId,
        transactionId,
        subscriptionId: txn.subscriptionId,
        subscriptionPlan,
        nextPaymentDate,
        gatewayTransactionId: txn.gatewayTransactionId,
        subtotal: String(currency === 'INR' ? taxCalculation.subtotal : totalAmount),
        taxAmount: String(currency === 'INR' ? taxCalculation.taxAmount : 0),
        total: String(totalAmount),
        currency: txn.currency as any,
        status: txn.status.toLowerCase(), // Convert COMPLETED to 'completed'
        paidAt: txn.status === 'COMPLETED' ? txn.createdAt : null,
        billingDetails: decryptedBillingDetails,
        companyDetails: finalCompanyInfo,
        // For USD transactions, we don't include tax details
        taxDetails: currency === 'INR' ? taxCalculation : {
          taxType: 'NONE',
          taxAmount: 0,
          taxPercentage: 0,
          taxBreakdown: [],
          subtotal: totalAmount,
          total: totalAmount
        },
        items: [
          {
            description: `${subscriptionPlan} Plan Subscription`,
            quantity: 1,
            unitPrice: currency === 'INR' ? taxCalculation.subtotal : totalAmount,
            total: currency === 'INR' ? taxCalculation.subtotal : totalAmount
          }
        ]
      };

      // Create invoice
      const newInvoice = await db.insert(invoices)
        .values(invoiceValues)
        .returning();

      // Update invoice settings with next invoice number
      await db.update(invoiceSettings)
        .set({
          nextInvoiceNumber: settings.nextInvoiceNumber + 1,
          updatedAt: new Date()
        })
        .where(eq(invoiceSettings.id, settings.id));

      return newInvoice[0];
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  },

  /**
   * Get invoice settings
   * 
   * @returns The invoice settings
   */
  async getInvoiceSettings() {
    try {
      const settings = await db.select().from(invoiceSettings).limit(1);
      
      if (settings.length === 0) {
        // Create default settings if none exist
        const defaultSettings = await db.insert(invoiceSettings)
          .values({
            logoUrl: '',
            footerText: 'Thank you for your business.',
            termsAndConditions: 'Terms and conditions apply.',
            invoicePrefix: 'INV-',
            showTaxBreakdown: true,
            nextInvoiceNumber: 1000,
            defaultDueDays: 15
          })
          .returning();
          
        return defaultSettings[0];
      }
      
      return settings[0];
    } catch (error) {
      console.error('Error getting invoice settings:', error);
      throw error;
    }
  },

  /**
   * Get all invoices for a user
   * 
   * @param userId - The user's ID
   * @returns List of invoices
   */
  async getUserInvoices(userId: number) {
    try {
      const userInvoices = await db.select()
        .from(invoices)
        .where(eq(invoices.userId, userId))
        .orderBy(desc(invoices.createdAt));

      return userInvoices;
    } catch (error) {
      console.error('Error getting user invoices:', error);
      throw error;
    }
  },

  /**
   * Get a specific invoice by ID
   * 
   * @param invoiceId - The invoice ID
   * @returns The invoice details
   */
  async getInvoiceById(invoiceId: number) {
    try {
      const invoiceDetails = await db.select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);

      return invoiceDetails.length > 0 ? invoiceDetails[0] : null;
    } catch (error) {
      console.error('Error getting invoice by ID:', error);
      throw error;
    }
  }
}; 