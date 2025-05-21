/**
 * This script sets up default tax settings for testing the tax calculation functionality.
 * It creates:
 * 1. Single GST tax setting of 18% for India
 * 2. Company tax information
 * 3. Invoice settings
 * 
 * Run with: npx tsx server/scripts/seed-tax-settings.ts
 */

import { db } from '../config/db';
import { taxSettings, companyTaxInfo, invoiceSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function seedTaxSettings() {
  try {
    console.log('Starting tax settings seed...');
    
    // First, check if tax settings already exist
    const existingSettings = await db.select().from(taxSettings);
    if (existingSettings.length > 0) {
      // Delete existing tax settings
      console.log(`Found ${existingSettings.length} existing tax settings, deleting them...`);
      for (const setting of existingSettings) {
        await db.delete(taxSettings).where(eq(taxSettings.id, setting.id));
      }
    }
    
    // Create a single GST tax for India at 18%
    const defaultTaxes = [
      {
        name: 'Indian GST',
        type: 'GST' as const,
        percentage: '18.00',
        country: 'IN',
        enabled: true,
        applyToRegion: 'INDIA' as const,
        applyCurrency: 'INR' as const
      }
    ];
    
    for (const tax of defaultTaxes) {
      await db.insert(taxSettings).values(tax);
    }
    console.log(`Created ${defaultTaxes.length} tax settings`);
    
    // Check if company tax info exists
    const existingCompanyInfo = await db.select().from(companyTaxInfo);
    if (existingCompanyInfo.length > 0) {
      console.log('Company tax info already exists, updating...');
      await db.update(companyTaxInfo)
        .set({
          companyName: 'ProsumeAI',
          address: '123 Tech Park',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'IN',
          gstin: 'GSTIN12345678901',
          pan: 'AAACP1234M',
          taxRegNumber: 'GST12345678901',
          email: 'billing@prosumeai.com',
          phone: '+91-9876543210',
          updatedAt: new Date()
        })
        .where(eq(companyTaxInfo.id, existingCompanyInfo[0].id));
    } else {
      console.log('Creating company tax info...');
      await db.insert(companyTaxInfo).values({
        companyName: 'ProsumeAI',
        address: '123 Tech Park',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'IN',
        gstin: 'GSTIN12345678901',
        pan: 'AAACP1234M',
        taxRegNumber: 'GST12345678901',
        email: 'billing@prosumeai.com',
        phone: '+91-9876543210',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Check if invoice settings exist
    const existingInvoiceSettings = await db.select().from(invoiceSettings);
    if (existingInvoiceSettings.length > 0) {
      console.log('Invoice settings already exist, updating...');
      await db.update(invoiceSettings)
        .set({
          logoUrl: null,
          footerText: 'Thank you for your business!',
          termsAndConditions: 'Standard terms and conditions apply.',
          invoicePrefix: 'INV-',
          showTaxBreakdown: true,
          nextInvoiceNumber: 1001,
          defaultDueDays: 15,
          updatedAt: new Date()
        })
        .where(eq(invoiceSettings.id, existingInvoiceSettings[0].id));
    } else {
      console.log('Creating invoice settings...');
      await db.insert(invoiceSettings).values({
        logoUrl: null,
        footerText: 'Thank you for your business!',
        termsAndConditions: 'Standard terms and conditions apply.',
        invoicePrefix: 'INV-',
        showTaxBreakdown: true,
        nextInvoiceNumber: 1001,
        defaultDueDays: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('Tax settings seed completed successfully!');
  } catch (error) {
    console.error('Error seeding tax settings:', error);
  } finally {
    process.exit(0);
  }
}

seedTaxSettings(); 