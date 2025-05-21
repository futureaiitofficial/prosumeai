/**
 * PDF helper utilities for handling PDFs in the browser
 */

/**
 * Check if the browser can natively handle PDFs
 * @returns boolean indicating PDF support
 */
export function canBrowserHandlePDFs(): boolean {
  // Check if the mimeTypes object exists and has a PDF type
  const hasPdfMimeType = navigator.mimeTypes && 
    'application/pdf' in navigator.mimeTypes;

  // Check plugins for PDF support
  const hasPdfPlugin = navigator.plugins && 
    Array.from(navigator.plugins).some(p => 
      p.name.toLowerCase().includes('pdf') || 
      p.name.toLowerCase().includes('acrobat')
    );

  // Check if running on iOS (built-in PDF support)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
    !window.MSStream;

  // Check if running on macOS (Preview has good PDF support)
  const isMacOS = /Mac/.test(navigator.userAgent);

  return hasPdfMimeType || hasPdfPlugin || isIOS || isMacOS;
}

/**
 * Download a PDF file from a URL
 * @param url URL to the PDF file
 * @param filename Filename to save as
 */
export async function downloadPDF(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    if (blob.type !== 'application/pdf' && blob.type !== 'application/octet-stream') {
      console.warn(`Received unexpected content type: ${blob.type}`);
    }
    
    if (blob.size < 1000) {
      console.warn(`Received very small file (${blob.size} bytes), may be corrupt`);
    }
    
    // Create a download link
    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = objectUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(objectUrl);
    }, 100);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

/**
 * Try to open a PDF in a new tab/window
 * @param url URL to the PDF file
 * @returns The window reference if successful, null if blocked
 */
export function openPDFInNewTab(url: string): Window | null {
  return window.open(url, '_blank');
}

/**
 * Handle PDF viewing using the best approach for the current browser
 * @param url URL to the PDF file
 * @param filename Filename to use if downloading
 * @returns Promise that resolves when the operation completes
 */
export async function handlePDFViewing(url: string, filename: string): Promise<boolean> {
  try {
    // Check if browser can handle PDFs
    if (canBrowserHandlePDFs()) {
      // Try to open PDF in new tab
      const newWindow = openPDFInNewTab(url);
      
      if (!newWindow) {
        // If popup was blocked, try download instead
        await downloadPDF(url, filename);
      }
    } else {
      // Browser likely can't handle PDFs well, so force download
      await downloadPDF(url, filename);
    }
    
    return true;
  } catch (error) {
    console.error('Error handling PDF viewing:', error);
    
    // Last resort fallback
    try {
      window.open(url, '_blank');
      return true;
    } catch (e) {
      console.error('Final fallback failed:', e);
      return false;
    }
  }
} 