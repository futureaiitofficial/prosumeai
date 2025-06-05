import puppeteer from "puppeteer"
import fs from "fs-extra"
import path from "path"
import { fileURLToPath } from "url"
import type { Invoice, InvoiceSettings } from "./pdf-service.d"
import os from "os"
import { getChromeOptions, getMinimalChromeOptions } from "../utils/chrome-detector"

// Make __dirname available in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create a temp directory for invoice HTML templates
const TEMP_DIR = path.join(os.tmpdir(), "prosume-invoice-templates")
fs.ensureDirSync(TEMP_DIR)

// Clean up old temp files on startup
try {
  const files = fs.readdirSync(TEMP_DIR)
  for (const file of files) {
    if (file.startsWith("invoice-") && file.endsWith(".html")) {
      fs.unlinkSync(path.join(TEMP_DIR, file))
    }
  }
  console.log(`Cleaned up ${files.length} temporary invoice HTML files`)
} catch (err) {
  console.error("Error cleaning up temp files:", err)
}

// Chrome detection and launch options are now handled by the shared chrome-detector utility

// Export for server startup
export async function initializePuppeteerPDFService(): Promise<boolean> {
  try {
    console.log("Initializing Puppeteer PDF service...")

    // Try full Chrome options first
    let options = getChromeOptions()
    console.log("Chrome launch options:", JSON.stringify(options, null, 2))

    let browser
    try {
      browser = await puppeteer.launch(options)
    } catch (error) {
      console.warn("Full Chrome options failed, trying minimal options:", error)
      options = getMinimalChromeOptions()
      console.log("Minimal Chrome launch options:", JSON.stringify(options, null, 2))
      browser = await puppeteer.launch(options)
    }

    // Test basic functionality
    const page = await browser.newPage()
    await page.setContent("<html><body><h1>Test</h1></body></html>")
    const title = await page.title()
    console.log("Test page title:", title)

    await browser.close()
    console.log("Puppeteer PDF service initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing Puppeteer PDF service:", error)

    // Try to provide more helpful error information
    if (error instanceof Error) {
      if (error.message.includes("Browser was not found")) {
        console.error("Chrome browser not found. Available browsers:")
        try {
          const { execSync } = await import("child_process")
          const result = execSync(
            'which google-chrome-stable google-chrome chromium-browser chromium 2>/dev/null || echo "No browsers found"',
            { encoding: "utf8" },
          )
          console.error(result)
        } catch (e) {
          console.error("Could not check for available browsers")
        }
      }
    }

    console.log("PDF generation will continue without browser verification")
    return false
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
  let browser
  let htmlPath = ""

  try {
    console.log(`Generating PDF with puppeteer for invoice #${invoice.invoiceNumber}`)

    // Get branding settings
    let brandingSettings
    try {
      const { db } = await import("../config/db.js")
      const schema = await import("../../shared/schema.js")
      const { eq } = await import("drizzle-orm")

      // Get appSettings from schema
      const appSettings = schema.appSettings

      // Fetch branding settings from the database
      const brandingData = await db.select().from(appSettings).where(eq(appSettings.key, "branding")).limit(1)

      // Parse the branding settings from the value field if available
      if (brandingData.length > 0 && brandingData[0].value) {
        try {
          if (typeof brandingData[0].value === "string") {
            brandingSettings = JSON.parse(brandingData[0].value)
          } else {
            brandingSettings = brandingData[0].value
          }
          console.log("Branding settings loaded for invoice PDF: success")
        } catch (parseError) {
          console.error("Error parsing branding settings:", parseError)
          brandingSettings = null
        }
      } else {
        console.log("Branding settings not found for invoice PDF")
        brandingSettings = null
      }
    } catch (brandingError) {
      console.error("Error fetching branding settings for invoice:", brandingError)
      brandingSettings = null
    }

    // Format dates
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return "N/A"
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    // Format currency
    const formatCurrency = (amount: string | number, currency = "USD") => {
      const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
      const locale = currency === "INR" ? "en-IN" : "en-US"

      const formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: currency === "INR" ? 0 : 2,
      })

      return formatter.format(numAmount)
    }

    // Prepare invoice details
    const companyDetails = invoice.companyDetails || {}
    const billingDetails = invoice.billingDetails || {}
    const items = invoice.items || []
    const taxDetails = invoice.taxDetails || { taxBreakdown: [] }
    const taxBreakdown = taxDetails.taxBreakdown || []

    // Create a readable company address
    const companyAddress = [
      companyDetails.address,
      companyDetails.city && companyDetails.state && companyDetails.postalCode
        ? `${companyDetails.city}, ${companyDetails.state} ${companyDetails.postalCode}`
        : "",
      companyDetails.country,
    ]
      .filter(Boolean)
      .join(", ")

    // Create a readable customer address
    const customerName = billingDetails.fullName || billingDetails.companyName || "Customer"
    const customerAddress = [
      billingDetails.addressLine1,
      billingDetails.addressLine2,
      billingDetails.city && billingDetails.state && billingDetails.postalCode
        ? `${billingDetails.city}, ${billingDetails.state} ${billingDetails.postalCode}`
        : "",
      billingDetails.country,
    ]
      .filter(Boolean)
      .join(", ")

    // Generate items HTML
    let itemsHTML = ""
    let subtotal = 0

    for (const item of items) {
      const quantity = item.quantity || 1
      const unitPrice = item.unitPrice || 0
      const amount = quantity * unitPrice
      subtotal += amount

      itemsHTML += `
        <tr>
          <td>${item.description || "Service"}</td>
          <td class="text-center">${quantity}</td>
          <td class="text-right">${formatCurrency(unitPrice, invoice.currency)}</td>
          <td class="text-right">${formatCurrency(amount, invoice.currency)}</td>
        </tr>
      `
    }

    // Generate tax breakdown HTML
    let taxBreakdownHTML = ""
    for (const tax of taxBreakdown) {
      taxBreakdownHTML += `
        <tr>
          <td>${tax.name}</td>
          <td>${formatCurrency(tax.amount, invoice.currency)}</td>
        </tr>
      `
    }

    // Extract reference information from notes or generate defaults
    const transactionId = invoice.notes?.match(/Transaction ID: ([A-Za-z0-9]+)/)?.[1] || `TXN${Date.now()}`
    const razorpayRef = invoice.notes?.match(/Razorpay Payment ID: ([A-Za-z0-9_]+)/)?.[1] || `pay_${Date.now()}`
    const subscriptionId = invoice.notes?.match(/Subscription ID: ([A-Za-z0-9_]+)/)?.[1] || `sub_${Date.now()}`

    // Generate terms and conditions if available
    let termsHTML = ""
    if (settings.termsAndConditions) {
      termsHTML = `
        <div class="terms">
          <h3>Terms and Conditions</h3>
          <p>${settings.termsAndConditions}</p>
        </div>
      `
    }

    // Status color based on payment status
    const statusColor =
      invoice.status.toLowerCase() === "paid" || invoice.status.toLowerCase() === "completed" ? "#16a34a" : "#ef4444"

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
              const brandingLogo =
                brandingSettings && typeof brandingSettings === "object" ? (brandingSettings as any).logoUrl : null
              const logo = brandingLogo || settings.logoUrl
              return logo ? `<img src="${logo}" alt="Company Logo" class="logo">` : ""
            })()}
            <div class="company-name">${companyDetails.companyName || "Company Name"}</div>
            <div class="app-name">${
              brandingSettings && typeof brandingSettings === "object"
                ? (brandingSettings as any).appName || "atScribe"
                : "atScribe"
            } - ${
              brandingSettings && typeof brandingSettings === "object"
                ? (brandingSettings as any).appTagline || "AI-powered resume and career tools"
                : "AI-powered resume and career tools"
            }</div>
            <div class="company-address">${companyAddress}</div>
            ${companyDetails.gstin ? `<div class="company-gstin">GSTIN: ${companyDetails.gstin}</div>` : ""}
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
            <div class="billing-details">${billingDetails.fullName || ""}</div>
            ${billingDetails.companyName ? `<div class="billing-details">${billingDetails.companyName}</div>` : ""}
            <div class="billing-details">${billingDetails.addressLine1 || ""}</div>
            ${billingDetails.addressLine2 ? `<div class="billing-details">${billingDetails.addressLine2}</div>` : ""}
            <div class="billing-details">${billingDetails.city}, ${billingDetails.state} ${billingDetails.postalCode}</div>
            <div class="billing-details">${billingDetails.country}</div>
            ${billingDetails.taxId ? `<div class="billing-details">Tax ID: ${billingDetails.taxId}</div>` : ""}
            <div class="billing-details">Email: ${billingDetails.email || ""}</div>
          </div>
          
          <div class="billing-meta">
            <h3>Payment Details</h3>
            <div class="billing-details">
              <div><strong>Invoice Total:</strong> ${formatCurrency(invoice.total, invoice.currency)}</div>
              <div><strong>Payment Status:</strong> ${invoice.status.toUpperCase()}</div>
              ${invoice.paidAt ? `<div><strong>Paid On:</strong> ${formatDate(invoice.paidAt)}</div>` : ""}
            </div>
            
            ${
              invoice.nextPaymentDate
                ? `
            <div class="next-payment">
              <div><strong>Next Payment:</strong> ${formatDate(invoice.nextPaymentDate)}</div>
            </div>
            `
                : ""
            }
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
          ${
            invoice.currency === "INR"
              ? `
          <tr>
            <td>Total (incl. GST)</td>
            <td>${formatCurrency(invoice.total, invoice.currency)}</td>
          </tr>
          ${taxBreakdownHTML}
          `
              : `
          <tr>
            <td>Subtotal</td>
            <td>${formatCurrency(invoice.subtotal, invoice.currency)}</td>
          </tr>
          ${taxBreakdownHTML}
          <tr class="total total-row">
            <td>Total</td>
            <td>${formatCurrency(invoice.total, invoice.currency)}</td>
          </tr>
          `
          }
        </table>
        
        ${
          invoice.notes
            ? `
        <div class="notes-section">
          <h3>Notes</h3>
          <div class="notes-content">${invoice.notes}</div>
        </div>
        `
            : ""
        }
        
        ${
          settings.termsAndConditions
            ? `
        <div class="notes-section">
          <h3>Terms & Conditions</h3>
          <div class="notes-content">${settings.termsAndConditions}</div>
        </div>
        `
            : ""
        }
        
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
          ${invoice.currency === "INR" ? "<p>Prices are inclusive of GST as per Indian tax regulations.</p>" : ""}
        </div>
      </div>
    </body>
    </html>
    `

    // Create a temporary HTML file
    const timestamp = Date.now()
    htmlPath = path.join(TEMP_DIR, `invoice-${invoice.invoiceNumber}-${timestamp}.html`)
    await fs.writeFile(htmlPath, html)

    // Launch puppeteer and generate PDF with fallback strategy
    let options = getChromeOptions()
    try {
      browser = await puppeteer.launch(options)
    } catch (error) {
      console.warn("Full Chrome options failed for PDF generation, trying minimal options:", error)
      options = getMinimalChromeOptions()
      browser = await puppeteer.launch(options)
    }

    const page = await browser.newPage()

    // Set a longer timeout for navigation
    await page.goto(`file://${htmlPath}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    })

    // Wait for any fonts or styles to load
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Set PDF options for high-quality output with optimized margins
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.7cm",
        right: "0.7cm",
        bottom: "0.7cm",
        left: "0.7cm",
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    })

    console.log(
      `Successfully generated PDF for invoice #${invoice.invoiceNumber} using puppeteer, size: ${pdfBuffer.length} bytes`,
    )

    // Convert the Uint8Array to a Buffer object
    return Buffer.from(pdfBuffer)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error generating PDF with puppeteer:", error)

    // Provide more specific error information
    if (error instanceof Error && error.message.includes("Browser was not found")) {
      console.error("Chrome executable not found. Please ensure Chrome is properly installed in the Docker container.")
      console.error("Chrome detection is handled by the chrome-detector utility.")
    }

    throw new Error(`Failed to generate PDF with puppeteer: ${errorMessage}`)
  } finally {
    // Ensure browser is always closed, even if there's an error
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.warn("Error closing browser:", closeError)
      }
    }

    // Remove the temp HTML file after PDF generation
    if (htmlPath) {
      try {
        await fs.unlink(htmlPath)
      } catch (cleanupError) {
        console.warn(`Could not remove temporary file ${htmlPath}:`, cleanupError)
      }
    }
  }
}
