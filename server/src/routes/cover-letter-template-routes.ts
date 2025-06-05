import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';
import { getChromeOptions, getMinimalChromeOptions } from '../../utils/chrome-detector';

// Chrome launch options are now handled by chrome-detector utility

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
  // Generate cover letter PDF
  app.post('/api/cover-letter-templates/generate-pdf', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { html, styles, data } = req.body;
      
      if (!html) {
        return res.status(400).json({ error: 'HTML content is required' });
      }

      console.log('Starting cover letter PDF generation with Puppeteer');
      
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.ensureDir(tempDir);
      
      const tempHtmlPath = path.join(tempDir, `cover-letter-${Date.now()}.html`);
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cover Letter</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background-color: white;
      font-family: Arial, sans-serif;
    }
    .cover-letter-container {
      width: 100%;
      min-height: 100vh;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
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
      
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf8');
      console.log(`Temporary HTML file created at ${tempHtmlPath}`);
      
      const browser = await puppeteer.launch(getChromeOptions()).catch(async (error) => {
        console.warn("Full Chrome options failed, trying minimal options:", error);
        return puppeteer.launch(getMinimalChromeOptions());
      });
      
      try {
        const page = await browser.newPage();
        await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('print');
        await page.evaluate(() => document.fonts.ready);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: false,
          displayHeaderFooter: false,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          }
        });
        
        console.log(`Cover letter PDF generated, size: ${pdfBuffer.length} bytes`);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${data.applicantName?.replace(/[^a-zA-Z0-9]/g, '_') || 'CoverLetter'}_${new Date().toISOString().split('T')[0]}.pdf`);
        
        res.send(Buffer.from(pdfBuffer));
      } catch (error: any) {
        console.error('Error in cover letter PDF generation:', error);
        res.status(500).json({ 
          message: "Failed to generate cover letter PDF", 
          error: error.message 
        });
      } finally {
        await browser.close();
        try {
          await fs.unlink(tempHtmlPath);
        } catch (err) {
          console.error('Failed to delete temp HTML:', err);
        }
      }
    } catch (error: any) {
      console.error('Error in cover letter generate-pdf route:', error);
      res.status(500).json({ 
        message: "Failed to process cover letter PDF request", 
        error: error.message 
      });
    }
  });

  // Generate cover letter preview info
  app.post('/api/cover-letter-templates/generate-page-info', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { html, styles } = req.body;
      
      if (!html) {
        return res.status(400).json({ error: 'HTML content is required' });
      }

      console.log('Generating cover letter preview info with Puppeteer');
      
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.ensureDir(tempDir);
      
      const tempHtmlPath = path.join(tempDir, `cover-letter-preview-${Date.now()}.html`);
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cover Letter Preview</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background-color: white;
      font-family: Arial, sans-serif;
    }
    .cover-letter-container {
      width: 100%;
      min-height: 100vh;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
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
      
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf8');
      console.log(`Cover letter preview HTML file created at ${tempHtmlPath}`);
      
      const browser = await puppeteer.launch(getChromeOptions()).catch(async (error) => {
        console.warn("Full Chrome options failed, trying minimal options:", error);
        return puppeteer.launch(getMinimalChromeOptions());
      });
      
      try {
        const page = await browser.newPage();
        await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('print');
        await page.evaluate(() => document.fonts.ready);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Calculate page info for cover letter
        const pageInfo = await page.evaluate(() => {
          const container = document.querySelector('.cover-letter-container');
          if (!container) return { pageBreaks: [], totalPages: 1 };
          
          const containerHeight = container.scrollHeight;
          const pageHeightPx = 297 * (96 / 25.4); // 297mm in pixels at 96 DPI
          
          const totalPages = Math.ceil(containerHeight / pageHeightPx);
          
          const pageBreaks = [];
          for (let page = 1; page < totalPages; page++) {
            pageBreaks.push(page * 297);
          }
          
          return {
            pageBreaks,
            totalPages,
            containerHeightPx: containerHeight,
            containerHeightMm: Math.round(containerHeight / (96 / 25.4))
          };
        });
        
        console.log('Cover letter page info:', pageInfo);
        
        res.json({
          pageBreaks: pageInfo.pageBreaks,
          totalPages: pageInfo.totalPages,
          containerHeight: pageInfo.containerHeightMm,
          success: true
        });
        
      } catch (error: any) {
        console.error('Error in cover letter preview info generation:', error);
        res.status(500).json({ 
          message: "Failed to generate cover letter preview info", 
          error: error.message 
        });
      } finally {
        await browser.close();
        try {
          await fs.unlink(tempHtmlPath);
        } catch (err) {
          console.error('Failed to delete temp HTML:', err);
        }
      }
      
    } catch (error: any) {
      console.error('Error in cover letter generate-page-info route:', error);
      res.status(500).json({ 
        message: "Failed to process cover letter preview info request", 
        error: error.message 
      });
    }
  });
} 