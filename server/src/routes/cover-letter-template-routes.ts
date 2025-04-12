import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';

// Define the type locally instead of importing
interface CoverLetterData {
  id?: number;
  title?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  recipientName?: string;
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  content?: string;
  template?: string;
  date?: string;
  letterStyle?: string;
}

export function registerCoverLetterTemplateRoutes(app: express.Express) {
  // Generate and download PDF for cover letter template
  app.post('/api/cover-letter-templates/generate-pdf', async (req, res) => {
    // Authentication check
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { html, styles, data } = req.body;
      
      if (!html) {
        return res.status(400).json({ error: 'HTML content is required' });
      }
      
      console.log('Starting PDF generation with Puppeteer for cover letter');
      
      // Create a temporary HTML file
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.ensureDir(tempDir);
      
      const tempHtmlPath = path.join(tempDir, `cover-letter-${Date.now()}.html`);
      const tempPdfPath = path.join(tempDir, `cover-letter-${Date.now()}.pdf`);
      
      // Create the HTML content
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cover Letter</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background-color: white;
      font-family: Arial, sans-serif;
      width: 100%;
      height: 100%;
    }
    .cover-letter-container {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      position: relative;
      overflow: visible;
    }
    ${styles || ''}
  </style>
</head>
<body>
  <div class="cover-letter-container">
    ${html}
  </div>
</body>
</html>`;
      
      // Write the HTML to a temp file
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf8');
      console.log(`Temporary HTML file created at ${tempHtmlPath}`);
      
      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      try {
        // Open a new page
        const page = await browser.newPage();
        
        // Load the HTML file
        await page.goto(`file://${tempHtmlPath}`, {
          waitUntil: 'networkidle0',
        });
        
        // Set media type to print for better styling
        await page.emulateMediaType('print');
        
        // Wait for fonts and content to load
        await page.evaluate(() => document.fonts.ready);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Log container height for debugging
        const containerHeight = await page.evaluate(() => {
          const container = document.querySelector('.cover-letter-container');
          return container ? container.scrollHeight : 0;
        });
        console.log(`Cover letter container height: ${containerHeight}px`);
        
        // Generate PDF
        await page.pdf({
          path: tempPdfPath,
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: false,
          displayHeaderFooter: false,
          margin: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0'
          }
        });
        
        console.log(`PDF generated at ${tempPdfPath}`);
        
        // Read the PDF file
        const pdfBuffer = await fs.readFile(tempPdfPath);
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${data.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cover_Letter'}_${new Date().toISOString().split('T')[0]}.pdf`);
        
        // Send the PDF
        res.send(pdfBuffer);
      } catch (error: any) {
        console.error('Error during cover letter PDF generation:', error);
        res.status(500).json({ message: "Failed to generate PDF", details: error.message });
      } finally {
        await browser.close();
        await fs.remove(tempHtmlPath).catch(e => console.error("Cleanup failed:", e));
        await fs.remove(tempPdfPath).catch(e => console.error("Cleanup failed:", e));
      }
    } catch (error: any) {
      console.error('Error in cover letter generate-pdf route:', error);
      res.status(500).json({ 
        message: "Failed to process cover letter PDF request", 
        error: error.message 
      });
    }
  });
} 