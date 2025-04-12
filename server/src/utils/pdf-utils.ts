import fs from 'fs';

/**
 * Extract text from a PDF file using a simple approach
 * This is a fallback function that extracts readable text from PDF files
 * without relying on external PDF parsing libraries
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Read the file as a buffer
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString();
    
    // Simple PDF text extraction - this is basic but will find readable strings
    // It's not a full PDF parser but extracts what's available as plain text
    let extractedText = '';
    
    // Look for text between common PDF text markers
    const textMarkers = [
      /\(([^\)]+)\)/g,             // Text in parentheses
      /\/Text\s*\[([^\]]+)\]/g,    // Text array objects
      /\/Contents\s*\(([^\)]+)\)/g // Contents in streams
    ];
    
    for (const marker of textMarkers) {
      const matches = content.match(marker) || [];
      extractedText += matches.join(' ') + '\n';
    }
    
    // Clean up common PDF character encodings
    extractedText = extractedText
      .replace(/\\(\d{3}|n|r|t|f|\\|\(|\))/g, ' ') // Escape sequences
      .replace(/\s+/g, ' ')                         // Normalize whitespace
      .trim();
    
    // If we couldn't extract any text using the markers, fallback to a simple text extraction
    if (!extractedText) {
      // Remove binary data and keep only printable ASCII characters
      extractedText = content.replace(/[^\x20-\x7E\r\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    console.log(`Extracted ${extractedText.length} characters from PDF`);
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    // Return empty string on error, caller should handle this case
    return '';
  }
}