import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';

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
    '--disable-component-extensions-with-background-pages',
    '--disable-features=TranslateUI',
    '--disable-component-update',
    '--disable-client-side-phishing-detection',
    '--mute-audio',
    '--no-pings',
    '--disable-logging',
    '--disable-permissions-api',
    '--ignore-certificate-errors',
    '--disable-canvas-aa',
    '--disable-3d-apis',
    '--disable-bundled-ppapi-flash',
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
        args: getChromeLaunchArgs(),
        timeout: 90000, // 90 second timeout
        protocolTimeout: 240000 // 4 minute protocol timeout
      });
      
      try {
        // Open a new page
        const page = await browser.newPage();
        
        // Load the HTML file
        await page.goto(`file://${tempHtmlPath}`, {
          waitUntil: 'networkidle0',
          timeout: 60000
        });
        
        // Set media type to print for better styling
        await page.emulateMediaType('print');
        
        // Wait for fonts and content to load
        await page.evaluate(() => document.fonts.ready);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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
          },
          timeout: 90000 // 90 second timeout for PDF generation
        });
        
        console.log(`PDF generated at ${tempPdfPath}`);
        
        // Read the PDF file
        const pdfBuffer = await fs.readFile(tempPdfPath);
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${data.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cover_Letter'}_${new Date().toISOString().split('T')[0]}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        
        // Send the PDF
        res.end(pdfBuffer);
        
        // Clean up temp files
        try {
          await fs.unlink(tempHtmlPath);
          await fs.unlink(tempPdfPath);
        } catch (cleanupError) {
          console.warn('Could not remove temporary files:', cleanupError);
        }
        
      } finally {
        try {
          await browser.close();
        } catch (closeError) {
          console.warn('Error closing browser:', closeError);
        }
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ 
        message: 'Failed to process PDF request', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
} 