// Create proper type declarations for modules
declare module 'pdfmake/build/pdfmake';
declare module 'pdfmake/build/vfs_fonts';

// Direct import for type checking
import type { Invoice, InvoiceSettings } from './pdf-service.d';

// Use dynamic imports to handle the PDF dependencies properly
let pdfMake: any;
let pdfFonts: any;
let isInitialized = false;

/**
 * Initialize the PDF module
 * Exported as initializePDFService for use during server startup
 */
export async function initializePDFService(): Promise<boolean> {
  if (isInitialized) {
    console.log('PDF service already initialized');
    return true;
  }

  try {
    console.log('Initializing PDF service...');
    // Dynamic imports to handle the module structure
    try {
      pdfMake = (await import('pdfmake/build/pdfmake')).default;
      console.log('PDF make module loaded successfully');
    } catch (pdfError) {
      console.error('Error loading pdfmake module:', pdfError);
      // Try CommonJS require as fallback
      try {
        pdfMake = require('pdfmake/build/pdfmake');
        console.log('PDF make module loaded via CommonJS require');
      } catch (requireError) {
        console.error('Failed to load pdfmake with CommonJS require:', requireError);
        throw new Error('Could not load pdfmake module');
      }
    }
    
    try {
      // Try both ways to load fonts in case the structure is different
      pdfFonts = await import('pdfmake/build/vfs_fonts.js');
      
      // Check if fonts loaded correctly in the expected structure
      if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
        pdfMake.vfs = pdfFonts.pdfMake.vfs;
        console.log('PDF fonts loaded successfully using pdfMake.vfs structure');
      } else if (pdfFonts && pdfFonts.default && pdfFonts.default.pdfMake && pdfFonts.default.pdfMake.vfs) {
        // Alternative import structure
        pdfMake.vfs = pdfFonts.default.pdfMake.vfs;
        console.log('PDF fonts loaded successfully using pdfFonts.default structure');
      } else {
        // Try CommonJS require as a fallback (this often works when ESM imports fail)
        const commonjsFonts = require('pdfmake/build/vfs_fonts.js');
        if (commonjsFonts && commonjsFonts.pdfMake && commonjsFonts.pdfMake.vfs) {
          pdfMake.vfs = commonjsFonts.pdfMake.vfs;
          console.log('PDF fonts loaded successfully using CommonJS require');
        } else {
          console.warn('PDF fonts virtual file system not found, some fonts may not render correctly');
          
          // Explicitly use a dummy VFS to force default fonts to be used
          pdfMake.vfs = {};
          
          // Set defaultFontSrc to ensure proper embedding of Roboto font
          pdfMake.fonts = {
            Roboto: {
              normal: 'Roboto-Regular.ttf',
              bold: 'Roboto-Medium.ttf',
              italics: 'Roboto-Italic.ttf',
              bolditalics: 'Roboto-MediumItalic.ttf'
            }
          };
        }
      }
    } catch (fontError) {
      console.error('Error loading PDF fonts:', fontError);
      
      // Try CommonJS require as a fallback
      try {
        const commonjsFonts = require('pdfmake/build/vfs_fonts.js');
        if (commonjsFonts && commonjsFonts.pdfMake && commonjsFonts.pdfMake.vfs) {
          pdfMake.vfs = commonjsFonts.pdfMake.vfs;
          console.log('PDF fonts loaded successfully using CommonJS require after ESM import failed');
        } else {
          console.warn('PDF fonts virtual file system not found after fallback, fonts may not render correctly');
          
          // Explicitly use a dummy VFS to force default fonts to be used
          pdfMake.vfs = {};
          
          // Set defaultFontSrc to ensure proper embedding of Roboto font
          pdfMake.fonts = {
            Roboto: {
              normal: 'Roboto-Regular.ttf',
              bold: 'Roboto-Medium.ttf',
              italics: 'Roboto-Italic.ttf',
              bolditalics: 'Roboto-MediumItalic.ttf'
            }
          };
        }
      } catch (requireError) {
        console.error('Both ESM and CommonJS font loading methods failed:', requireError);
        console.warn('PDF will be generated without custom fonts');
        
        // Explicitly use a dummy VFS to force default fonts to be used
        pdfMake.vfs = {};
        
        // Set defaultFontSrc to ensure proper embedding of Roboto font
        pdfMake.fonts = {
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf'
          }
        };
      }
    }

    // Generate a test document to validate the setup
    try {
      const testDoc = {
        content: [{ text: 'PDF Service Initialization Test', fontSize: 16 }],
        defaultStyle: { font: 'Roboto' }
      };
      
      const testPdf = pdfMake.createPdf(testDoc);
      await new Promise<void>((resolve, reject) => {
        testPdf.getBuffer((buffer: Buffer, pages: any) => {
          if (!buffer || buffer.length < 100) {
            console.error('Test PDF generation did not produce valid buffer');
            reject(new Error('Test PDF generation failed'));
          } else {
            console.log(`PDF test document successfully generated (${buffer.length} bytes)`);
            resolve();
          }
        });
      });
    } catch (testError) {
      console.error('Error generating test PDF:', testError);
      // Continue anyway as we'll try to use the service
    }

    isInitialized = true;
    console.log('PDF service initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing PDF module:', error);
    console.warn('PDF service will attempt to initialize on first use');
    return false;
  }
}

/**
 * Generate a PDF for an invoice
 * 
 * @param invoice The invoice data to render
 * @param settings Invoice settings for formatting
 * @returns A buffer containing the PDF data
 */
export async function generateInvoicePDF(invoice: Invoice, settings: InvoiceSettings): Promise<Buffer> {
  // Ensure PDF module is initialized
  if (!isInitialized || !pdfMake) {
    console.log('PDF service not initialized, initializing now...');
    await initializePDFService();
    
    if (!pdfMake) {
      throw new Error('Failed to initialize PDF service');
    }
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

  // Prepare company details
  const companyDetails = invoice.companyDetails || {};
  const companyAddress = [
    companyDetails.address,
    `${companyDetails.city}, ${companyDetails.state} ${companyDetails.postalCode}`,
    companyDetails.country
  ].filter(Boolean).join(', ');

  // Prepare billing details
  const billingDetails = invoice.billingDetails || {};
  const customerName = billingDetails.fullName || billingDetails.companyName || 'Customer';
  const customerAddress = [
    billingDetails.addressLine1,
    billingDetails.addressLine2,
    `${billingDetails.city}, ${billingDetails.state} ${billingDetails.postalCode}`,
    billingDetails.country
  ].filter(Boolean).join(', ');

  // Prepare tax details
  const taxDetails = invoice.taxDetails || { taxBreakdown: [] };
  const taxBreakdown = taxDetails.taxBreakdown || [];

  // Prepare items
  const items = invoice.items || [];
  const itemsTable = items.map((item: any) => [
    { text: item.description || 'Subscription', style: 'tableItem' },
    { text: item.quantity || 1, style: 'tableItem', alignment: 'center' },
    { text: formatCurrency(item.unitPrice, invoice.currency), style: 'tableItem', alignment: 'right' },
    { text: formatCurrency(item.total, invoice.currency), style: 'tableItem', alignment: 'right' }
  ]);

  // Create the document definition
  const docDefinition: any = {
    content: [
      // Header
      {
        columns: [
          // Logo if available
          settings.logoUrl ? {
            image: settings.logoUrl,
            width: 150,
            alignment: 'left'
          } : {
            text: companyDetails.companyName || 'Company Name',
            style: 'companyName'
          },
          {
            text: [
              { text: 'INVOICE\n', style: 'invoiceTitle' },
              { text: `#${invoice.invoiceNumber}\n`, style: 'invoiceNumber' },
              { text: `Date: ${formatDate(invoice.createdAt)}\n`, style: 'invoiceDate' },
              { text: `Due Date: ${formatDate(invoice.dueDate)}\n`, style: 'invoiceDate' },
              { text: `Status: ${invoice.status.toUpperCase()}`, style: 'invoiceStatus' }
            ],
            alignment: 'right'
          }
        ],
        columnGap: 10,
        margin: [0, 0, 0, 20]
      },

      // Company and Billing Info
      {
        columns: [
          {
            width: '50%',
            text: [
              { text: 'From:\n', style: 'sectionHeader' },
              { text: companyDetails.companyName || 'Company Name', style: 'companyInfo' },
              { text: companyAddress + '\n', style: 'companyInfo' },
              { text: companyDetails.email || '', style: 'companyInfo' },
              { text: companyDetails.phone || '', style: 'companyInfo' },
              companyDetails.gstin ? { text: `GSTIN: ${companyDetails.gstin}\n`, style: 'companyInfo' } : {},
              companyDetails.pan ? { text: `PAN: ${companyDetails.pan}`, style: 'companyInfo' } : {}
            ]
          },
          {
            width: '50%',
            text: [
              { text: 'Bill To:\n', style: 'sectionHeader' },
              { text: customerName, style: 'customerInfo' },
              { text: customerAddress + '\n', style: 'customerInfo' },
              { text: billingDetails.email || '', style: 'customerInfo' },
              { text: billingDetails.phoneNumber || '', style: 'customerInfo' },
              billingDetails.taxId ? { text: `Tax ID: ${billingDetails.taxId}`, style: 'customerInfo' } : {}
            ]
          }
        ],
        columnGap: 10,
        margin: [0, 0, 0, 20]
      },

      // Items Table
      {
        style: 'itemsTable',
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            // Header row
            [
              { text: 'Description', style: 'tableHeader' },
              { text: 'Qty', style: 'tableHeader', alignment: 'center' },
              { text: 'Unit Price', style: 'tableHeader', alignment: 'right' },
              { text: 'Amount', style: 'tableHeader', alignment: 'right' }
            ],
            // Items
            ...itemsTable
          ]
        },
        layout: {
          hLineWidth: function(i: number, node: any) {
            return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5;
          },
          vLineWidth: function() {
            return 0;
          },
          hLineColor: function(i: number) {
            return i === 1 ? '#aaa' : '#eee';
          }
        }
      },

      // Summary
      {
        style: 'summary',
        layout: 'noBorders',
        table: {
          widths: ['*', 'auto'],
          body: [
            [{ text: 'Subtotal:', style: 'summaryLabel', alignment: 'right' }, 
             { text: formatCurrency(invoice.subtotal, invoice.currency), style: 'summaryValue', alignment: 'right' }],
            
            // Only show tax if it's greater than 0
            ...(parseFloat(invoice.taxAmount) > 0 ? [
              [{ text: 'Tax:', style: 'summaryLabel', alignment: 'right' }, 
               { text: formatCurrency(invoice.taxAmount, invoice.currency), style: 'summaryValue', alignment: 'right' }]
            ] : []),
            
            [{ text: 'Total:', style: 'summaryLabelBold', alignment: 'right' }, 
             { text: formatCurrency(invoice.total, invoice.currency), style: 'summaryValueBold', alignment: 'right' }]
          ]
        }
      },

      // Tax Breakdown (if enabled in settings and has tax)
      ...(settings.showTaxBreakdown && parseFloat(invoice.taxAmount) > 0 && taxBreakdown.length > 0 ? [
        {
          text: 'Tax Breakdown:',
          style: 'taxBreakdownTitle',
          margin: [0, 10, 0, 5]
        },
        {
          style: 'taxBreakdown',
          layout: 'noBorders',
          table: {
            widths: ['*', 'auto', 'auto'],
            body: taxBreakdown.map((tax: any) => [
              { text: tax.name, style: 'taxItem' },
              { text: `${tax.percentage}%`, style: 'taxItem', alignment: 'right' },
              { text: formatCurrency(tax.amount, invoice.currency), style: 'taxItem', alignment: 'right' }
            ])
          }
        }
      ] : []),

      // Notes
      ...(invoice.notes ? [
        {
          text: 'Notes:',
          style: 'notesTitle',
          margin: [0, 10, 0, 5]
        },
        {
          text: invoice.notes,
          style: 'notes'
        }
      ] : []),

      // Footer
      ...(settings.footerText ? [
        {
          text: settings.footerText,
          style: 'footer',
          margin: [0, 20, 0, 0]
        }
      ] : []),

      // Terms and Conditions
      ...(settings.termsAndConditions ? [
        {
          text: 'Terms and Conditions:',
          style: 'termsTitle',
          margin: [0, 10, 0, 5]
        },
        {
          text: settings.termsAndConditions,
          style: 'terms'
        }
      ] : [])
    ],

    // Styles
    styles: {
      companyName: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 5]
      },
      invoiceTitle: {
        fontSize: 20,
        bold: true,
        color: '#2563eb'
      },
      invoiceNumber: {
        fontSize: 14,
        bold: true
      },
      invoiceDate: {
        fontSize: 12
      },
      invoiceStatus: {
        fontSize: 12,
        bold: true,
        color: invoice.status.toLowerCase() === 'paid' || invoice.status.toLowerCase() === 'completed' ? '#16a34a' : '#ef4444'
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 5]
      },
      companyInfo: {
        fontSize: 10,
        color: '#666'
      },
      customerInfo: {
        fontSize: 10,
        color: '#666'
      },
      itemsTable: {
        margin: [0, 10, 0, 10]
      },
      tableHeader: {
        fontSize: 12,
        bold: true,
        color: '#2563eb',
        margin: [0, 5, 0, 5]
      },
      tableItem: {
        fontSize: 10,
        margin: [0, 5, 0, 5]
      },
      summary: {
        margin: [0, 10, 0, 10]
      },
      summaryLabel: {
        fontSize: 12,
        color: '#666'
      },
      summaryLabelBold: {
        fontSize: 12,
        bold: true
      },
      summaryValue: {
        fontSize: 12
      },
      summaryValueBold: {
        fontSize: 14,
        bold: true
      },
      taxBreakdownTitle: {
        fontSize: 12,
        bold: true
      },
      taxBreakdown: {
        fontSize: 10,
        color: '#666'
      },
      taxItem: {
        fontSize: 10,
        color: '#666'
      },
      notesTitle: {
        fontSize: 12,
        bold: true
      },
      notes: {
        fontSize: 10,
        color: '#666',
        italics: true
      },
      footer: {
        fontSize: 10,
        color: '#666',
        alignment: 'center'
      },
      termsTitle: {
        fontSize: 12,
        bold: true
      },
      terms: {
        fontSize: 8,
        color: '#666'
      }
    },

    // Page settings
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],

    // Footer
    footer: function(currentPage: number, pageCount: number) {
      return {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: '#888',
        margin: [0, 10, 0, 0]
      };
    },

    // Defaults
    defaultStyle: {
      font: 'Roboto'
    },
    
    // Force embedding of fonts
    compress: false
  };

  // Create a buffer promise
  return new Promise((resolve, reject) => {
    try {
      if (!pdfMake) {
        console.error('PDF module not initialized');
        return reject(new Error('PDF module not initialized'));
      }
      
      // Log key aspects of the invoice to help with debugging
      console.log(`Generating PDF for invoice #${invoice.invoiceNumber}, amount: ${invoice.total} ${invoice.currency}`);
      
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      
      // Add a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.error('PDF generation timed out after 30 seconds');
        reject(new Error('PDF generation timed out'));
      }, 30000);
      
      // Use a better approach for getBuffer that properly handles errors
      try {
        pdfDocGenerator.getBuffer(function(buffer: Buffer, pages: any) {
          clearTimeout(timeoutId); // Clear the timeout when we get a response
          
          if (!buffer || buffer.length < 100) {
            console.error('Generated an invalid or empty PDF buffer:', buffer?.length || 0, 'bytes');
            return reject(new Error('Generated PDF is empty or invalid'));
          }
          
          console.log(`Successfully generated PDF for invoice #${invoice.invoiceNumber}, size: ${buffer.length} bytes, pages: ${pages?.length || 'unknown'}`);
          resolve(buffer);
        });
      } catch (bufferError) {
        clearTimeout(timeoutId);
        console.error('Error in getBuffer method:', bufferError);
        reject(bufferError);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
} 