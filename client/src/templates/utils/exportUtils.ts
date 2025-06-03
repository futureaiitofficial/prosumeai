import { type ResumeData } from '@/types/resume';
import type { ReactElement } from 'react';

/**
 * Generates a PDF from a React element using server-side Puppeteer
 * @param element The React element to render
 * @param filename The filename for the generated PDF
 * @param endpoint The server endpoint to use for generation (defaults to resume endpoint)
 * @returns A Promise that resolves to a Blob containing the PDF
 */
export async function generatePDFFromReactElement(
  element: ReactElement,
  filename: string = 'Resume.pdf',
  endpoint: string = '/api/resume-templates/generate-pdf'
): Promise<Blob> {
  try {
    console.log(`Starting PDF generation for: ${filename} using endpoint: ${endpoint}`);
    
    // Create a container for the resume
    const container = document.createElement('div');
    container.style.width = '100%';  // Changed from fixed width to fill available space
    container.style.margin = '0';
    container.style.padding = '0';
    container.style.backgroundColor = 'white';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);
    
    // Render the component
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(container);
    root.render(element);
    
    // Wait for rendering to complete and styles to be applied
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add additional page break styles for better flow
    const pageBreakStyles = `
      /* Page break handling - allow content to flow naturally */
      .resume-section {
        page-break-inside: auto;
        break-inside: auto;
        margin-bottom: 0.2rem;
        margin-top: 0.5rem;
      }
      
      /* Only avoid page breaks after headings */
      h2 {
        page-break-after: avoid;
        break-after: avoid;
        page-break-before: auto;
        break-before: auto;
        margin-bottom: 0.2rem;
      }
      
      /* Keep individual items together but allow sections to break */
      .experience-item, .education-item, .project-item, .certification-item {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 0.6rem;
      }
      
      /* Keep together only small items that should stay as a unit */
      .no-break-inside {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Avoid breaks after specific elements */
      .no-break-after {
        page-break-after: avoid;
        break-after: avoid;
      }
      
      /* Resume header should stay together */
      .resume-header {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 0.6rem;
      }
      
      /* Add proper page margins */
      @page {
        margin-top: 5mm;  /* Small top margin for second and subsequent pages */
        margin-right: 0;
        margin-bottom: 0;
        margin-left: 0;
      }
      
      /* First page should have no top margin */
      @page :first {
        margin: 0;
      }
      
      /* Page should fill the entire space */
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
      }
      
      /* Print-specific styles */
      @media print {
        body {
          background-color: white;
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
        
        .resume-container {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
      }
      
      /* Elegant Divider template - single column layout with horizontal dividers */
      .elegant-divider-template {
        position: relative;
      }
      
      /* Remove any conflicting styles for elegant divider template */
      .elegant-divider-template .resume-section {
        page-break-inside: auto;
        break-inside: auto;
        margin-bottom: 1pt;
      }
      
      /* Ensure dividers display properly */
      .elegant-divider-template .resume-section h2 + div {
        margin-bottom: 4pt;
      }
    `;
    
    // Get only the relevant styles from the document
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          // Only get styles that are actually used in our container
          const rules = Array.from(sheet.cssRules);
          return rules
            .filter(rule => {
              if (rule instanceof CSSStyleRule) {
                // Check if the selector matches any element in our container
                try {
                  return container.querySelector(rule.selectorText);
                } catch (e) {
                  return false;
                }
              }
              return true;
            })
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          console.warn('Could not access stylesheet:', e);
          return '';
        }
      })
      .filter(Boolean)
      .join('\n');
    
    // Get the HTML content with computed styles
    const htmlContent = container.innerHTML;
    console.log('Generated HTML content length:', htmlContent.length);
    
    // Clean up
    root.unmount();
    document.body.removeChild(container);
    
    // Send to server for PDF generation
    console.log(`Sending request to server endpoint: ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        styles: styles + pageBreakStyles,
        data: { fullName: filename.replace(/\.(pdf|tex|docx)$/i, '') }
      })
    });
    
    if (!response.ok) {
      let errorData = {};
      try {
         // Try to parse the JSON body from the server error response
         errorData = await response.json(); 
      } catch (parseError) {
         console.error("Could not parse error response JSON:", parseError);
         // Use status text if JSON parsing fails
         errorData = { message: response.statusText };
      }
      
      console.error('Server error:', response.status, errorData);
      
      // Create and throw an error object mimicking apiRequest's structure
      const error: any = new Error((errorData as any).message || 'Failed to generate PDF');
      error.statusCode = response.status; 
      error.data = errorData; // Attach the full parsed data
      throw error; // Throw the custom error object
    }
    
    // Get the PDF blob
    const pdfBlob = await response.blob();
    console.log('Received PDF blob:', pdfBlob.size, 'bytes');
    
    // Verify the blob is a valid PDF
    if (pdfBlob.type !== 'application/pdf') {
      console.error('Invalid PDF type:', pdfBlob.type);
      throw new Error('Invalid PDF generated');
    }
    
    // Skip URL verification that's causing CSP issues
    // Just return the blob directly
    console.log('PDF successfully generated');
    return pdfBlob;
    
  } catch (error) {
    console.error(`Error in PDF generation wrapper for ${endpoint}:`, error);
    throw error; 
  }
} 