import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Invoice, InvoiceSettings } from './pdf-service.d';
import os from 'os';

// Make __dirname available in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a temp directory for invoice HTML templates
const TEMP_DIR = path.join(os.tmpdir(), 'prosume-invoice-templates');
fs.ensureDirSync(TEMP_DIR);

// Clean up old temp files on startup
try {
  const files = fs.readdirSync(TEMP_DIR);
  for (const file of files) {
    if (file.startsWith('invoice-') && file.endsWith('.html')) {
      fs.unlinkSync(path.join(TEMP_DIR, file));
    }
  }
  console.log(`Cleaned up ${files.length} temporary invoice HTML files`);
} catch (err) {
  console.error('Error cleaning up temp files:', err);
}

// Enhanced Chrome launch arguments for Docker production environments
const getChromeLaunchArgs = () => {
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-default-apps',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-sync',
    '--metrics-recording-only',
    '--no-default-browser-check',
    '--safebrowsing-disable-auto-update',
    '--disable-background-networking',
    // Additional Docker-specific flags to prevent crashes
    '--disable-ipc-flooding-protection',
    '--disable-backgrounding-occluded-windows',
    '--disable-component-extensions-with-background-pages',
    '--disable-features=TranslateUI',
    '--disable-component-update',
    '--disable-client-side-phishing-detection',
    '--disable-default-apps',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-pings',
    '--disable-logging',
    '--disable-permissions-api',
    '--ignore-certificate-errors',
    '--disable-canvas-aa',
    '--disable-3d-apis',
    '--disable-bundled-ppapi-flash',
    '--disable-logging',
    '--disable-notifications',
    '--disable-desktop-notifications',
    '--disable-translate',
    '--disable-file-system',
    '--disable-reading-from-canvas',
    '--disable-web-bluetooth',
    '--disable-audio-output',
    // Memory and resource constraints for containers
    '--memory-pressure-off',
    '--max_old_space_size=4096',
    '--js-flags=--max-old-space-size=4096'
  ];
};

// Export for server startup
export async function initializePuppeteerPDFService(): Promise<boolean> {
  try {
    console.log('Initializing Puppeteer PDF service...');
    
    // Test to make sure puppeteer can launch with a timeout
    const browser = await Promise.race([
      puppeteer.launch({
        headless: 'new' as any,
        args: getChromeLaunchArgs(),
        timeout: 60000, // Increased timeout
        protocolTimeout: 180000 // 3 minute protocol timeout
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Puppeteer launch timeout')), 45000)
      )
    ]) as any;
    
    await browser.close();
    console.log('Puppeteer PDF service initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Puppeteer PDF service:', error);
    console.log('PDF generation will continue without browser verification');
    return false;
  }
}

/**
 * Generate a PDF for an invoice using puppeteer
 * This creates an HTML file and converts it to PDF using puppeteer
 * 
 * @param invoice The invoice data to render
 * @param settings Invoice settings for formatting
 * @returns A buffer containing the PDF data
 */
export async function generateInvoicePDF(invoice: Invoice, settings: InvoiceSettings): Promise<Buffer> {
  try {
    console.log(`Generating PDF with puppeteer for invoice #${invoice.invoiceNumber}`);
    
    // Get branding settings
    let brandingSettings;
    try {
      const { db } = await import('../config/db.js');
      const schema = await import('../../shared/schema.js');
      const { eq } = await import('drizzle-orm');
      
      // Get appSettings from schema
      const appSettings = schema.appSettings;
      
      // Fetch branding settings from the database
      const brandingData = await db.select().from(appSettings).where(eq(appSettings.key, 'branding')).limit(1);
      
      // Parse the branding settings from the value field if available
      if (brandingData.length > 0 && brandingData[0].value) {
        try {
          if (typeof brandingData[0].value === 'string') {
            brandingSettings = JSON.parse(brandingData[0].value);
          } else {
            brandingSettings = brandingData[0].value;
          }
          console.log('Branding settings loaded for invoice PDF: success');
        } catch (parseError) {
          console.error('Error parsing branding settings:', parseError);
          brandingSettings = null;
        }
      } else {
        console.log('Branding settings not found for invoice PDF');
        brandingSettings = null;
      }
    } catch (brandingError) {
      console.error('Error fetching branding settings for invoice:', brandingError);
      brandingSettings = null;
    }
    
    // Format dates
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Format currency
    const formatCurrency = (amount: string | number, currency: string = 'USD') => {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      const locale = currency === 'INR' ? 'en-IN' : 'en-US';
      
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: currency === 'INR' ? 0 : 2
      });
      
      return formatter.format(numAmount);
    };

    // Prepare invoice details
    const companyDetails = invoice.companyDetails || {};
    const billingDetails = invoice.billingDetails || {};
    const items = invoice.items || [];
    const taxDetails = invoice.taxDetails || { taxBreakdown: [] };
    const taxBreakdown = taxDetails.taxBreakdown || [];
    
    // Create a readable company address
    const companyAddress = [
      companyDetails.address,
      companyDetails.city && companyDetails.state && companyDetails.postalCode ? 
        `${companyDetails.city}, ${companyDetails.state} ${companyDetails.postalCode}` : '',
      companyDetails.country
    ].filter(Boolean).join(', ');
    
    // Create a readable customer address
    const customerName = billingDetails.fullName || billingDetails.companyName || 'Customer';
    const customerAddress = [
      billingDetails.addressLine1,
      billingDetails.addressLine2,
      billingDetails.city && billingDetails.state && billingDetails.postalCode ? 
        `${billingDetails.city}, ${billingDetails.state} ${billingDetails.postalCode}` : '',
      billingDetails.country
    ].filter(Boolean).join(', ');

    // Generate items HTML
    let itemsHTML = '';
    let subtotal = 0;
    
    // Get subscription plan name for better item description
    const subscriptionPlan = invoice.subscriptionPlan || 'Subscription';
    
    // Format next payment date if available
    const nextPaymentDate = invoice.nextPaymentDate ? formatDate(invoice.nextPaymentDate) : 'Not available';
    
    // Get transaction reference IDs
    const transactionId = invoice.transactionId || 'N/A';
    const razorpayRef = invoice.gatewayTransactionId || invoice.razorpayPaymentId || 'N/A';
    const subscriptionId = invoice.subscriptionId || 'N/A';
    
    // Process tax breakdown for display
    let taxBreakdownHTML = '';
    if (parseFloat(invoice.taxAmount) > 0) {
      // For GST in India, tax is inclusive - show it differently
      if (invoice.currency === 'INR') {
        taxBreakdownHTML += `
          <tr>
            <td>Subtotal (excl. GST)</td>
            <td>${formatCurrency(invoice.subtotal, invoice.currency)}</td>
          </tr>
        `;
        
        // Add detailed tax breakdown if available
        if (invoice.taxDetails && invoice.taxDetails.taxBreakdown && invoice.taxDetails.taxBreakdown.length > 0) {
          invoice.taxDetails.taxBreakdown.forEach((tax: any) => {
            taxBreakdownHTML += `
              <tr>
                <td>${tax.name} (${tax.percentage}%) included</td>
                <td>${formatCurrency(tax.amount, invoice.currency)}</td>
              </tr>
            `;
          });
        } else {
          taxBreakdownHTML += `
            <tr>
              <td>GST (18%) included</td>
              <td>${formatCurrency(invoice.taxAmount, invoice.currency)}</td>
            </tr>
          `;
        }
      } else {
        // For non-INR currencies, show standard tax breakdown only if tax amount is significant
        // (this should never happen for USD based on our updates, but keeping for completeness)
        const minTaxThreshold = 0.01; // Minimum threshold to show tax
        const taxAmount = parseFloat(invoice.taxAmount);
        if (taxAmount > minTaxThreshold) {
          taxBreakdownHTML += `
            <tr>
              <td>Tax</td>
              <td>${formatCurrency(invoice.taxAmount, invoice.currency)}</td>
            </tr>
          `;
          
          // Add detailed tax breakdown if available
          if (invoice.taxDetails && invoice.taxDetails.taxBreakdown && invoice.taxDetails.taxBreakdown.length > 0) {
            invoice.taxDetails.taxBreakdown.forEach((tax: any) => {
              taxBreakdownHTML += `
                <tr>
                  <td><small>${tax.name} (${tax.percentage}%)</small></td>
                  <td><small>${formatCurrency(tax.amount, invoice.currency)}</small></td>
                </tr>
              `;
            });
          }
        }
      }
    }
    
    items.forEach(item => {
      const itemTotal = parseFloat(item.total.toString());
      subtotal += itemTotal;
      
      // Use the actual item description from the invoice
      const itemDescription = item.description || `${subscriptionPlan} Plan`;
      
      itemsHTML += `
        <tr>
          <td>${itemDescription}</td>
          <td class="text-center">${item.quantity || 1}</td>
          <td class="text-right">${formatCurrency(item.unitPrice, invoice.currency)}</td>
          <td class="text-right">${formatCurrency(item.total, invoice.currency)}</td>
        </tr>
      `;
    });
    
    // Generate notes section if available
    let notesHTML = '';
    if (invoice.notes) {
      notesHTML = `
        <div class="notes">
          <h3>Notes</h3>
          <p>${invoice.notes}</p>
        </div>
      `;
    }
    
    // Generate terms and conditions if available
    let termsHTML = '';
    if (settings.termsAndConditions) {
      termsHTML = `
        <div class="terms">
          <h3>Terms and Conditions</h3>
          <p>${settings.termsAndConditions}</p>
        </div>
      `;
    }

    // Status color based on payment status
    const statusColor = invoice.status.toLowerCase() === 'paid' || 
                        invoice.status.toLowerCase() === 'completed' ? 
                        '#16a34a' : '#ef4444';
    
    // Generate full HTML invoice
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice #${invoice.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        :root {
          --primary-color: #2563eb;
          --text-color: #374151;
          --text-light: #6b7280;
          --border-color: #e5e7eb;
          --bg-light: #f9fafb;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: var(--text-color);
          line-height: 1.5;
          font-size: 9pt;
          margin: 0;
          padding: 0;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
          position: relative;
        }
        
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 20px;
        }
        
        .company-details {
          flex: 2;
        }
        
        .invoice-meta {
          flex: 1;
          text-align: right;
        }
        
        .logo {
          max-width: 180px;
          max-height: 50px;
          margin-bottom: 15px;
        }
        
        .company-name {
          font-size: 14pt;
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 5px;
        }
        
        .app-name {
          font-size: 10pt;
          font-weight: 500;
          color: var(--text-light);
          margin-bottom: 5px;
        }
        
        .company-address {
          font-size: 9pt;
          color: var(--text-light);
          max-width: 250px;
        }
        
        .invoice-number {
          font-size: 12pt;
          font-weight: 700;
          margin-bottom: 10px;
          color: var(--primary-color);
        }
        
        .invoice-date {
          font-size: 9pt;
          margin-bottom: 5px;
        }
        
        .billing-container {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        
        .billing-info {
          flex: 1;
        }
        
        .billing-meta {
          flex: 1;
          text-align: right;
        }
        
        h3 {
          color: var(--primary-color);
          font-size: 10pt;
          margin-bottom: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .billing-details {
          font-size: 9pt;
          color: var(--text-color);
          margin: 5px 0;
        }
        
        .reference-section {
          margin-bottom: 20px;
          background-color: var(--bg-light);
          border-radius: 4px;
          padding: 12px;
        }
        
        .reference-section h3 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 10pt;
        }
        
        .reference-details {
          font-size: 9pt;
          margin: 5px 0;
        }
        
        .reference-number {
          font-family: monospace;
          background-color: #e5e7eb;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 8pt;
        }
        
        .next-payment {
          font-weight: 600;
          color: var(--primary-color);
          background-color: rgba(37, 99, 235, 0.1);
          padding: 8px;
          border-radius: 4px;
          margin-top: 10px;
          display: inline-block;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        .items-table th {
          background-color: var(--bg-light);
          padding: 8px;
          text-align: left;
          font-weight: 600;
          font-size: 9pt;
          border-bottom: 2px solid var(--border-color);
        }
        
        .items-table td {
          padding: 8px;
          border-bottom: 1px solid var(--border-color);
          font-size: 9pt;
        }
        
        .items-table th:last-child, 
        .items-table td:last-child {
          text-align: right;
        }
        
        .items-table th:nth-child(2), 
        .items-table td:nth-child(2) {
          text-align: center;
        }
        
        .items-table th:nth-child(3), 
        .items-table td:nth-child(3) {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        .summary-table {
          width: 300px;
          margin-left: auto;
          margin-bottom: 30px;
        }
        
        .summary-table td {
          padding: 4px 8px;
          font-size: 9pt;
        }
        
        .summary-table tr.total {
          font-weight: 700;
          border-top: 1px solid var(--border-color);
        }
        
        .summary-table td:last-child {
          text-align: right;
        }
        
        .total-row {
          font-size: 11pt;
          font-weight: 700;
          color: var(--primary-color);
        }
        
        .notes-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }
        
        .notes-content {
          font-size: 9pt;
          color: var(--text-light);
        }
        
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 8pt;
          color: var(--text-light);
        }
        
        .page-break {
          page-break-after: always;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="company-details">
            ${(() => {
              // Use branding logo if available, fall back to settings logo
              const brandingLogo = brandingSettings && typeof brandingSettings === 'object' ? (brandingSettings as any).logoUrl : null;
              const logo = brandingLogo || settings.logoUrl;
              return logo ? `<img src="${logo}" alt="Company Logo" class="logo">` : '';
            })()}
            <div class="company-name">${companyDetails.companyName || 'Company Name'}</div>
            <div class="app-name">${
              brandingSettings && typeof brandingSettings === 'object' 
                ? (brandingSettings as any).appName || 'atScribe' 
                : 'atScribe'
            } - ${
              brandingSettings && typeof brandingSettings === 'object' 
                ? (brandingSettings as any).appTagline || 'AI-powered resume and career tools' 
                : 'AI-powered resume and career tools'
            }</div>
            <div class="company-address">${companyAddress}</div>
            ${companyDetails.gstin ? `<div class="company-gstin">GSTIN: ${companyDetails.gstin}</div>` : ''}
          </div>
          <div class="invoice-meta">
            <div class="invoice-number">Invoice #${invoice.invoiceNumber}</div>
            <div class="invoice-date">Issue Date: ${formatDate(invoice.createdAt)}</div>
            <div class="invoice-date">Due Date: ${formatDate(invoice.dueDate || invoice.createdAt)}</div>
            <div class="invoice-date">Status: ${invoice.status.toUpperCase()}</div>
          </div>
        </div>
        
        <div class="billing-container">
          <div class="billing-info">
            <h3>Bill To</h3>
            <div class="billing-details">${billingDetails.fullName || ''}</div>
            ${billingDetails.companyName ? `<div class="billing-details">${billingDetails.companyName}</div>` : ''}
            <div class="billing-details">${billingDetails.addressLine1 || ''}</div>
            ${billingDetails.addressLine2 ? `<div class="billing-details">${billingDetails.addressLine2}</div>` : ''}
            <div class="billing-details">${billingDetails.city}, ${billingDetails.state} ${billingDetails.postalCode}</div>
            <div class="billing-details">${billingDetails.country}</div>
            ${billingDetails.taxId ? `<div class="billing-details">Tax ID: ${billingDetails.taxId}</div>` : ''}
            <div class="billing-details">Email: ${billingDetails.email || ''}</div>
          </div>
          
          <div class="billing-meta">
            <h3>Payment Details</h3>
            <div class="billing-details">
              <div><strong>Invoice Total:</strong> ${formatCurrency(invoice.total, invoice.currency)}</div>
              <div><strong>Payment Status:</strong> ${invoice.status.toUpperCase()}</div>
              ${invoice.paidAt ? `<div><strong>Paid On:</strong> ${formatDate(invoice.paidAt)}</div>` : ''}
            </div>
            
            ${invoice.nextPaymentDate ? `
            <div class="next-payment">
              <div><strong>Next Payment:</strong> ${formatDate(invoice.nextPaymentDate)}</div>
            </div>
            ` : ''}
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        
        <table class="summary-table">
          ${invoice.currency === 'INR' ? `
          <tr>
            <td>Total (incl. GST)</td>
            <td>${formatCurrency(invoice.total, invoice.currency)}</td>
          </tr>
          ${taxBreakdownHTML}
          ` : `
          <tr>
            <td>Subtotal</td>
            <td>${formatCurrency(invoice.subtotal, invoice.currency)}</td>
          </tr>
          ${taxBreakdownHTML}
          <tr class="total total-row">
            <td>Total</td>
            <td>${formatCurrency(invoice.total, invoice.currency)}</td>
          </tr>
          `}
        </table>
        
        ${invoice.notes ? `
        <div class="notes-section">
          <h3>Notes</h3>
          <div class="notes-content">${invoice.notes}</div>
        </div>
        ` : ''}
        
        ${settings.termsAndConditions ? `
        <div class="notes-section">
          <h3>Terms & Conditions</h3>
          <div class="notes-content">${settings.termsAndConditions}</div>
        </div>
        ` : ''}
        
        <div class="reference-section">
          <h3>Reference Information</h3>
          <div class="reference-details">
            <strong>Transaction ID:</strong> <span class="reference-number">${transactionId}</span>
          </div>
          <div class="reference-details">
            <strong>Payment Reference:</strong> <span class="reference-number">${razorpayRef}</span>
          </div>
          <div class="reference-details">
            <strong>Subscription ID:</strong> <span class="reference-number">${subscriptionId}</span>
          </div>
        </div>
        
        <div class="footer">
          ${settings.footerText || `Thank you for your business!`}
          ${invoice.currency === 'INR' ? '<p>Prices are inclusive of GST as per Indian tax regulations.</p>' : ''}
        </div>
      </div>
    </body>
    </html>
    `;

    // Create a temporary HTML file
    const timestamp = Date.now();
    const htmlPath = path.join(TEMP_DIR, `invoice-${invoice.invoiceNumber}-${timestamp}.html`);
    await fs.writeFile(htmlPath, html);

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new' as any,
      args: getChromeLaunchArgs(),
      timeout: 90000, // 90 second timeout
      protocolTimeout: 240000 // 4 minute protocol timeout
    });
    
    try {
      const page = await browser.newPage();
      
      // Set a longer timeout for navigation
      await page.goto(`file://${htmlPath}`, { 
        waitUntil: 'networkidle0',
        timeout: 60000 
      });
      
      // Wait for any fonts or styles to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Set PDF options for high-quality output with optimized margins
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.7cm',
          right: '0.7cm',
          bottom: '0.7cm',
          left: '0.7cm'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        timeout: 90000 // 90 second timeout for PDF generation
      });
      
      console.log(`Successfully generated PDF for invoice #${invoice.invoiceNumber} using puppeteer, size: ${pdfBuffer.length} bytes`);
      
      // Convert the Uint8Array to a Buffer object
      return Buffer.from(pdfBuffer);
    } finally {
      // Ensure browser is always closed, even if there's an error
      try {
        await browser.close();
      } catch (closeError) {
        console.warn('Error closing browser:', closeError);
      }
      
      // Remove the temp HTML file after PDF generation
      try {
        await fs.unlink(htmlPath);
      } catch (cleanupError) {
        console.warn(`Could not remove temporary file ${htmlPath}:`, cleanupError);
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error generating PDF with puppeteer:', error);
    throw new Error(`Failed to generate PDF with puppeteer: ${errorMessage}`);
  }
} 