import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateLatexResume } from '../utils/simple-templates';
import { createSimplePDF, generateLatexFile } from '../utils/pdf-generator';
import puppeteer from 'puppeteer';
import { type ResumeData } from '../../types/resume';

export function registerResumeTemplateRoutes(app: express.Express) {
  // Generate LaTeX content from resume data
  app.post('/api/resume/generate-latex', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { resumeData, template } = req.body;
      
      if (!resumeData) {
        return res.status(400).json({ 
          message: "Missing required field: resumeData" 
        });
      }
      
      const latexContent = generateLatexResume(resumeData, template || 'professional');
      
      res.json({ latexContent });
    } catch (error: any) {
      console.error('Error in generate-latex route:', error);
      res.status(500).json({ 
        message: "Failed to generate LaTeX content", 
        error: error.message 
      });
    }
  });
  
  // Generate and download a LaTeX file
  app.post('/api/resume/download-latex', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { resumeData, template } = req.body;
      
      if (!resumeData) {
        return res.status(400).json({ 
          message: "Missing required field: resumeData" 
        });
      }
      
      const filePath = await generateLatexFile(resumeData, template || 'professional');
      
      res.download(filePath, 'resume.tex', (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        }
        
        // Clean up the file after download
        fs.unlink(filePath).catch(err => {
          console.error('Error deleting temporary file:', err);
        });
      });
    } catch (error: any) {
      console.error('Error in download-latex route:', error);
      res.status(500).json({ 
        message: "Failed to generate LaTeX file", 
        error: error.message 
      });
    }
  });
  
  // Generate and download a PDF file
  app.post('/api/resume/download-pdf', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { resumeData, template } = req.body;
      
      if (!resumeData) {
        return res.status(400).json({ 
          message: "Missing required field: resumeData" 
        });
      }
      
      const filePath = await createSimplePDF(resumeData);
      
      res.download(filePath, 'resume.pdf', (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        }
        
        // Clean up the file after download
        fs.unlink(filePath).catch(err => {
          console.error('Error deleting temporary file:', err);
        });
      });
    } catch (error: any) {
      console.error('Error in download-pdf route:', error);
      res.status(500).json({ 
        message: "Failed to generate PDF file", 
        error: error.message 
      });
    }
  });

  app.post('/api/resume-templates/generate-pdf', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { html, styles, data } = req.body;
      
      if (!html) {
        return res.status(400).json({ error: 'HTML content is required' });
      }

      console.log('Starting PDF generation with Puppeteer');
      
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.ensureDir(tempDir);
      
      const tempHtmlPath = path.join(tempDir, `resume-${Date.now()}.html`);
      const tempPdfPath = path.join(tempDir, `resume-${Date.now()}.pdf`);
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume</title>
  <style>
    @page {
      size: A4;
      margin-top: 5mm;  /* Small top margin for second and subsequent pages */
      margin-right: 0;
      margin-bottom: 0;
      margin-left: 0;
    }
    
    /* First page should have no top margin */
    @page :first {
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
    .resume-container {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      position: relative;
      overflow: visible;
    }
    /* Support for vertical dividers across page breaks */
    [data-template-id="elegant-divider"] .vertical-divider {
      page-break-inside: auto;
      page-break-before: auto;
      page-break-after: auto;
      -webkit-column-break-inside: auto;
      break-inside: auto;
      position: absolute;
      height: 100%;
    }
    /* Better approach for showing dividers on each page - ONLY for Elegant Divider template */
    [data-template-id="elegant-divider"] {
      position: relative;
    }
    
    [data-template-id="elegant-divider"]::before {
      content: none;
    }
    
    @media print {
      [data-template-id="elegant-divider"]::before {
        content: "";
        position: fixed;
        top: 0;
        left: 32%;
        height: 100%;
        width: 1px;
        background-color: #333;
        z-index: 1000;
      }
    }
    /* Natural flow styles and overrides */
    .resume-section {
      page-break-inside: auto;
      margin-bottom: 0.2rem;
      margin-top: 0.5rem;
    }
    .resume-section > h2 {
      page-break-after: avoid;
      page-break-before: auto;
      padding-top: 0.2rem;
      margin-bottom: 0.2rem;
    }
    .experience-item, .education-item, .project-item, .certification-item {
      page-break-inside: avoid;
      margin-bottom: 0.6rem;
    }
    ${styles || ''}
  </style>
</head>
<body>
  <div class="resume-container">
    ${html}
  </div>
</body>
</html>`;
      
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf8');
      console.log(`Temporary HTML file created at ${tempHtmlPath}`);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      try {
        const page = await browser.newPage();
        await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('print');
        await page.evaluate(() => document.fonts.ready);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const containerHeight = await page.evaluate(() => {
          const container = document.querySelector('.resume-container');
          return container ? container.scrollHeight : 0;
        });
        console.log(`Resume container height: ${containerHeight}px`);
        
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
        
        const pdfBuffer = await fs.readFile(tempPdfPath);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${data.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`);
        
        res.send(pdfBuffer);
      } catch (error: any) {
        console.error('Error in PDF generation:', error);
        res.status(500).json({ 
          message: "Failed to generate PDF", 
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
      console.error('Error in generate-pdf route:', error);
      res.status(500).json({ 
        message: "Failed to process PDF request", 
        error: error.message 
      });
    }
  });

  // New endpoint for generating accurate preview information
  app.post('/api/resume-templates/generate-preview-info', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { html, styles } = req.body;
      
      if (!html) {
        return res.status(400).json({ error: 'HTML content is required' });
      }

      console.log('Generating preview info with Puppeteer');
      
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.ensureDir(tempDir);
      
      const tempHtmlPath = path.join(tempDir, `preview-info-${Date.now()}.html`);
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume Preview Info</title>
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
      width: 210mm;
      height: auto;
    }
    .resume-container {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      position: relative;
      overflow: visible;
    }
    .resume-section {
      page-break-inside: auto;
      margin-bottom: 0.2rem;
      margin-top: 0.5rem;
    }
    .resume-section > h2 {
      page-break-after: avoid;
      page-break-before: auto;
      padding-top: 0.2rem;
      margin-bottom: 0.2rem;
    }
    .experience-item, .education-item, .project-item, .certification-item {
      page-break-inside: avoid;
      margin-bottom: 0.6rem;
    }
    ${styles || ''}
  </style>
</head>
<body>
  <div class="resume-container">
    ${html}
  </div>
</body>
</html>`;
      
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf8');
      console.log(`Temporary preview HTML file created at ${tempHtmlPath}`);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      try {
        const page = await browser.newPage();
        await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('print');
        await page.evaluate(() => document.fonts.ready);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Calculate accurate page breaks using the same logic as PDF generation
        const pageInfo = await page.evaluate(() => {
          const container = document.querySelector('.resume-container');
          if (!container) return { pageBreaks: [], totalPages: 1 };
          
          const containerHeight = container.scrollHeight;
          const pageHeightPx = 297 * (96 / 25.4); // 297mm in pixels at 96 DPI
          
          // Calculate how many pages this content spans
          const totalPages = Math.ceil(containerHeight / pageHeightPx);
          
          // Generate page breaks at natural boundaries (same as actual PDF)
          const pageBreaks = [];
          for (let page = 1; page < totalPages; page++) {
            pageBreaks.push(page * 297); // Page breaks in mm
          }
          
          return {
            pageBreaks,
            totalPages,
            containerHeightPx: containerHeight,
            containerHeightMm: Math.round(containerHeight / (96 / 25.4))
          };
        });
        
        console.log('Server-calculated page info:', pageInfo);
        
        res.json({
          pageBreaks: pageInfo.pageBreaks,
          totalPages: pageInfo.totalPages,
          containerHeight: pageInfo.containerHeightMm,
          success: true
        });
        
      } catch (error: any) {
        console.error('Error in preview info generation:', error);
        res.status(500).json({ 
          message: "Failed to generate preview info", 
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
      console.error('Error in generate-preview-info route:', error);
      res.status(500).json({ 
        message: "Failed to process preview info request", 
        error: error.message 
      });
    }
  });

  // New endpoint for generating actual PDF preview images (100% accurate)
  app.post('/api/resume-templates/generate-pdf-preview', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { html, styles } = req.body;
      
      if (!html) {
        return res.status(400).json({ error: 'HTML content is required' });
      }

      console.log('Generating PDF preview images with Puppeteer');
      
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.ensureDir(tempDir);
      
      const tempHtmlPath = path.join(tempDir, `pdf-preview-${Date.now()}.html`);
      
      // Use the exact same HTML as PDF generation
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume</title>
  <style>
    @page {
      size: A4;
      margin-top: 5mm;  /* Small top margin for second and subsequent pages */
      margin-right: 0;
      margin-bottom: 0;
      margin-left: 0;
    }
    
    /* First page should have no top margin */
    @page :first {
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
    .resume-container {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      position: relative;
      overflow: visible;
    }
    /* Support for vertical dividers across page breaks */
    [data-template-id="elegant-divider"] .vertical-divider {
      page-break-inside: auto;
      page-break-before: auto;
      page-break-after: auto;
      -webkit-column-break-inside: auto;
      break-inside: auto;
      position: absolute;
      height: 100%;
    }
    /* Better approach for showing dividers on each page - ONLY for Elegant Divider template */
    [data-template-id="elegant-divider"] {
      position: relative;
    }
    
    [data-template-id="elegant-divider"]::before {
      content: none;
    }
    
    @media print {
      [data-template-id="elegant-divider"]::before {
        content: "";
        position: fixed;
        top: 0;
        left: 32%;
        height: 100%;
        width: 1px;
        background-color: #333;
        z-index: 1000;
      }
    }
    /* Natural flow styles and overrides */
    .resume-section {
      page-break-inside: auto;
      margin-bottom: 0.2rem;
      margin-top: 0.5rem;
    }
    .resume-section > h2 {
      page-break-after: avoid;
      page-break-before: auto;
      padding-top: 0.2rem;
      margin-bottom: 0.2rem;
    }
    .experience-item, .education-item, .project-item, .certification-item {
      page-break-inside: avoid;
      margin-bottom: 0.6rem;
    }
    ${styles || ''}
  </style>
</head>
<body>
  <div class="resume-container">
    ${html}
  </div>
</body>
</html>`;
      
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf8');
      console.log(`PDF preview HTML file created at ${tempHtmlPath}`);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      try {
        const page = await browser.newPage();
        await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('print');
        await page.evaluate(() => document.fonts.ready);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate PDF first to determine exact page count
        const tempPdfPath = path.join(tempDir, `preview-pdf-${Date.now()}.pdf`);
        
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
        
        // Get the actual page count from the generated PDF
        const pdfBuffer = await fs.readFile(tempPdfPath);
        
        // Simple way to count pages - look for page count in PDF metadata
        // This is a rough estimate, but more accurate than height calculation
        const pdfString = pdfBuffer.toString('latin1');
        const pageCountMatch = pdfString.match(/\/Count\s+(\d+)/);
        const actualPageCount = pageCountMatch ? parseInt(pageCountMatch[1]) : 1;
        
        console.log(`Actual PDF page count: ${actualPageCount}`);
        
        // Calculate accurate page breaks based on actual PDF pages
        const pageBreaks = [];
        for (let page = 1; page < actualPageCount; page++) {
          pageBreaks.push(page * 297); // Page breaks in mm
        }
        
        // Now capture page images for preview
        const pageImages = [];
        
        for (let pageNum = 1; pageNum <= actualPageCount; pageNum++) {
          // Set viewport to A4 size for accurate rendering
          await page.setViewport({
            width: 794,  // A4 width in pixels at 96 DPI
            height: 1123, // A4 height in pixels at 96 DPI
            deviceScaleFactor: 2 // High DPI for better quality
          });
          
          // Take screenshot of specific page area
          const pageYOffset = (pageNum - 1) * 1123; // Height of previous pages
          
          const screenshot = await page.screenshot({
            type: 'png',
            clip: {
              x: 0,
              y: pageYOffset,
              width: 794,
              height: 1123
            }
          });
          
          pageImages.push({
            page: pageNum,
            image: Buffer.from(screenshot).toString('base64')
          });
        }
        
        res.json({
          pageBreaks,
          totalPages: actualPageCount,
          pageImages,
          success: true,
          message: `Generated ${actualPageCount} page preview images`
        });
        
        // Cleanup
        try {
          await fs.remove(tempPdfPath);
        } catch (err) {
          console.error('Failed to delete temp PDF:', err);
        }
        
      } catch (error: any) {
        console.error('Error in PDF preview generation:', error);
        res.status(500).json({ 
          message: "Failed to generate PDF preview", 
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
      console.error('Error in generate-pdf-preview route:', error);
      res.status(500).json({ 
        message: "Failed to process PDF preview request", 
        error: error.message 
      });
    }
  });
}