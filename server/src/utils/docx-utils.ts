import fs from 'fs';
import { Packer, HeadingLevel, Paragraph, TextRun } from 'docx';
import * as path from 'path';
import * as unzipper from 'unzipper';

/**
 * Extract text from a DOCX file
 * This improved implementation handles DOCX parsing by properly recognizing
 * a DOCX file as a ZIP archive containing XML documents
 */
export async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    console.log(`Processing DOCX file: ${filePath}`);
    
    // Read the file as a buffer
    const buffer = fs.readFileSync(filePath);
    
    // If the file doesn't exist or is too small, return early
    if (!buffer || buffer.length < 100) {
      console.error('Invalid DOCX file: file too small or empty');
      return 'Invalid document format';
    }
    
    // Check if the file is a valid DOCX (ZIP) file
    // DOCX files start with PK header (ZIP signature)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
      console.error('Invalid DOCX file: incorrect header signature');
      return 'Invalid document format - Not a valid DOCX file';
    }

    // First method - try to directly extract content from XML using regex
    // This is faster but less reliable than unzipping
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000000)); // Limit to avoid memory issues
    
    // Match any text content
    const paragraphRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let match;
    let extractedText = '';
    
    while ((match = paragraphRegex.exec(content)) !== null) {
      if (match[1]) {
        extractedText += match[1] + ' ';
      }
    }
    
    // If we got text with the simple method, return it
    if (extractedText.length > 20) {
      console.log(`Extracted ${extractedText.length} characters using simple method`);
      return extractedText;
    }
    
    // Fallback method - write to temp file and extract using unzipper
    console.log('Simple extraction failed, trying full unzip method');
    
    // Create a temporary directory for extraction
    const tempDir = path.join('uploads', 'temp_' + Date.now());
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Extract the document.xml file from the DOCX which contains the main content
    try {
      const directory = await unzipper.Open.buffer(buffer);
      const docXmlFile = directory.files.find((file: any) => file.path === 'word/document.xml');
      
      if (!docXmlFile) {
        console.error('document.xml not found in DOCX');
        return 'Could not extract document content';
      }
      
      // Extract and get the content
      const xmlContent = await docXmlFile.buffer();
      const xmlString = xmlContent.toString();
      
      // Extract text content from XML with better structure preservation
      let documentText = '';
      
      // First find paragraphs to separate them properly
      const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
      let paragraphMatch;
      let paragraphs = [];
      
      while ((paragraphMatch = paragraphRegex.exec(xmlString)) !== null) {
        if (paragraphMatch[1]) {
          paragraphs.push(paragraphMatch[1]);
        }
      }
      
      // Look for paragraph styles that might indicate headings
      const styleRegex = /<w:pStyle\s+w:val="([^"]+)"/g;
      const headingStyles = ['Heading1', 'Heading2', 'Heading3', 'Title', 'Subtitle', 'heading 1', 'heading 2', 'heading 3'];
      
      // Process each paragraph
      for (const para of paragraphs) {
        // Check paragraph style for heading
        let isHeading = false;
        let headingLevel = 0;
        let styleMatch;
        
        // Reset the style regex for this paragraph
        styleRegex.lastIndex = 0;
        
        while ((styleMatch = styleRegex.exec(para)) !== null) {
          const style = styleMatch[1];
          
          if (headingStyles.some(h => style.toLowerCase().includes(h.toLowerCase()))) {
            isHeading = true;
            
            // Try to determine heading level
            if (style.toLowerCase().includes('1') || style.toLowerCase().includes('title')) {
              headingLevel = 1;
            } else if (style.toLowerCase().includes('2') || style.toLowerCase().includes('subtitle')) {
              headingLevel = 2;
            } else if (style.toLowerCase().includes('3')) {
              headingLevel = 3;
            } else {
              headingLevel = 1; // Default to heading level 1
            }
          }
        }
        
        // Check if paragraph is a bullet/numbered list item
        const isBulletPoint = para.includes('<w:numPr>') || para.includes('<w:numId ');
        
        // Check if this might be a section label (like "EDUCATION" or "SKILLS")
        // by looking for paragraphs with all caps text and bold formatting
        const isAllCaps = para.includes('<w:caps/>') || para.includes('<w:caps w:val="true"/>');
        const isBold = para.includes('<w:b/>') || para.includes('<w:b w:val="true"/>');
        
        // Extract text from the paragraph
        const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
        let textMatch;
        let paraText = '';
        
        while ((textMatch = textRegex.exec(para)) !== null) {
          if (textMatch[1]) {
            paraText += textMatch[1] + ' ';
          }
        }
        
        paraText = paraText.trim();
        
        // Check if text is in all caps (another way to detect section headers)
        const textIsAllCaps = paraText === paraText.toUpperCase() && paraText.length > 3;
        
        // Add the paragraph to our document text
        if (paraText) {
          // For headings or section labels, make them stand out
          if (isHeading || (isAllCaps && isBold) || textIsAllCaps) {
            // Add extra line break before sections
            documentText += '\n\n';
            
            // Format based on level
            if (headingLevel === 1 || textIsAllCaps) {
              documentText += '# ' + paraText.toUpperCase() + '\n\n';
            } else if (headingLevel === 2) {
              documentText += '## ' + paraText + '\n\n';
            } else if (headingLevel === 3) {
              documentText += '### ' + paraText + '\n\n';
            } else {
              documentText += paraText.toUpperCase() + '\n\n';
            }
          }
          // For bullet points, prefix with a bullet character
          else if (isBulletPoint) {
            documentText += '• ' + paraText + '\n';
          } 
          // Regular paragraph
          else {
            documentText += paraText + '\n';
          }
        }
      }
      
      // Clean up temp directory
      try {
        fs.rmdirSync(tempDir, { recursive: true });
      } catch (cleanupError) {
        console.error('Error cleaning up temp directory:', cleanupError);
      }
      
      console.log(`Extracted ${documentText.length} characters using unzip method`);
      
      if (documentText.length > 0) {
        return documentText;
      } else {
        return 'No text content found in document';
      }
    } catch (unzipError) {
      console.error('Error unzipping DOCX:', unzipError);
      return 'Error extracting document content';
    }
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    // Return informative message on error
    return 'Error processing document';
  }
}