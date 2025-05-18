import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
// Import PDF parser and mammoth using dynamic import for ES modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Promisify exec for async use
const execAsync = util.promisify(exec);

/**
 * Extracts text content from various document formats
 * This is a utility function to get plain text that can then be processed by AI
 */
export async function extractDocumentText(filePath: string): Promise<string> {
  try {
    console.log(`Extracting text from file: ${filePath}`);
    // Check file extension to determine the format
    const fileExt = filePath.toLowerCase().split('.').pop();
    
    // Handle text files directly
    if (fileExt === 'txt') {
      return fs.readFileSync(filePath, 'utf8');
    }
    
    // Handle PDF files using pdf-parse
    if (fileExt === 'pdf') {
      try {
        console.log(`Extracting text from PDF: ${filePath}`);
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        
        // data.text contains all the text content
        if (data.text) {
          console.log(`Successfully extracted ${data.text.length} characters from PDF`);
          return data.text;
        } else {
          throw new Error('PDF parsing returned empty text');
        }
      } catch (pdfError: any) {
        console.error('PDF extraction error:', pdfError);
        throw new Error(`PDF parsing failed: ${pdfError.message || 'Unknown error'}`);
      }
    }
    
    // For DOCX files, use mammoth library
    if (fileExt === 'docx') {
      try {
        console.log(`Extracting text from DOCX using mammoth: ${filePath}`);
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer });
        
        if (result && result.value) {
          console.log(`Successfully extracted ${result.value.length} characters from DOCX`);
          return result.value;
        } else {
          console.warn('Mammoth extraction returned empty result, falling back to basic extraction');
        }
      } catch (docxError: any) {
        console.error('DOCX extraction error:', docxError);
        console.log('Falling back to basic text extraction...');
      }
    }
    
    // For DOC files, try to use external tools
    if (fileExt === 'doc') {
      try {
        // Try to use external tools like antiword if available
        try {
          console.log(`Attempting to extract text from DOC using CLI tools: ${filePath}`);
          const { stdout } = await execAsync(`antiword "${filePath}" || catdoc "${filePath}" || textutil -convert txt "${filePath}" -stdout`);
          if (stdout && stdout.length > 100) {
            console.log(`Successfully extracted ${stdout.length} characters from DOC using CLI tool`);
            return stdout;
          }
        } catch (cliError) {
          // CLI tool not available, fall back to basic extraction
          console.log('CLI extraction tool not available, falling back to basic extraction');
        }
      } catch (docError) {
        console.error('DOC extraction error:', docError);
      }
    }

    // Fallback for binary files using basic extraction
    console.log('Using fallback basic text extraction method');
    let textContent = '';
    
    // Read the file as a buffer
    const buffer = fs.readFileSync(filePath);
    
    // Basic text extraction - converts binary to text and cleans it
    textContent = buffer.toString('utf8')
      // Clean common binary artifacts
      .replace(/\x00/g, '') // Remove null bytes
      .replace(/[^\x20-\x7E\r\n]/g, ' ') // Replace non-printable chars with spaces
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    console.log(`Extracted ${textContent.length} characters using basic extraction`);
    return textContent;
  } catch (error: any) {
    console.error('Error extracting document text:', error);
    throw new Error(`Failed to extract text from document: ${error.message}`);
  }
}

/**
 * Simple parser for resume text
 * @param filePath Path to resume file
 * @returns Parsed resume data
 */
export async function parseResume(filePath: string): Promise<any> {
  try {
    // Extract text from the file
    const text = await extractDocumentText(filePath);
    
    // Basic parsing - identify sections by common headings
    const sections: Record<string, string> = {};
    
    // Common section headers in resumes
    const sectionHeaders = [
      'EDUCATION',
      'EXPERIENCE',
      'WORK EXPERIENCE', 
      'EMPLOYMENT HISTORY',
      'SKILLS',
      'TECHNICAL SKILLS',
      'PROFESSIONAL SUMMARY',
      'SUMMARY',
      'PERSONAL INFORMATION',
      'CONTACT',
      'PROJECTS',
      'CERTIFICATIONS',
      'ACHIEVEMENTS',
      'LANGUAGES',
      'INTERESTS'
    ];
    
    // Split the text into lines for processing
    const lines = text.split(/\r?\n/);
    
    // First pass - identify sections
    let currentSection = 'HEADER';
    sections[currentSection] = '';
    
    for (const line of lines) {
      const cleanLine = line.trim().toUpperCase();
      
      // Check if this line is a section header
      const isHeader = sectionHeaders.some(header => 
        cleanLine === header || 
        cleanLine.startsWith(header + ':') || 
        cleanLine.startsWith(header + ' ')
      );
      
      if (isHeader) {
        // Extract the actual header name (convert to title case)
        const headerMatch = sectionHeaders.find(header => 
          cleanLine === header || 
          cleanLine.startsWith(header + ':') || 
          cleanLine.startsWith(header + ' ')
        );
        
        if (headerMatch) {
          currentSection = headerMatch;
          if (!sections[currentSection]) {
            sections[currentSection] = '';
          }
        }
      } else if (line.trim()) {
        // Add non-empty lines to the current section
        sections[currentSection] += line + '\n';
      }
    }
    
    // Enhanced extraction of personal info
    const personalInfo = {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedIn: '',
      website: ''
    };
    
    // Look for email with a more comprehensive regex
    // This will catch most standard email formats
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      personalInfo.email = emailMatch[0];
      console.log(`Found email: ${personalInfo.email}`);
    }
    
    // Enhanced phone number detection with international format support
    // This will match formats like: (123) 456-7890, 123-456-7890, +1 123 456 7890, etc.
    const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?(?:\d{3})\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      personalInfo.phone = phoneMatch[0];
      console.log(`Found phone: ${personalInfo.phone}`);
    }
    
    // Look for LinkedIn URL
    const linkedInRegex = /(?:linkedin\.com\/in\/|linkedin:)[a-zA-Z0-9_-]+/i;
    const linkedInMatch = text.match(linkedInRegex);
    if (linkedInMatch) {
      personalInfo.linkedIn = linkedInMatch[0];
      if (!personalInfo.linkedIn.startsWith('http')) {
        personalInfo.linkedIn = 'https://www.' + personalInfo.linkedIn;
      }
      console.log(`Found LinkedIn: ${personalInfo.linkedIn}`);
    }
    
    // Look for personal website
    const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?/gi;
    const websiteMatches = text.match(websiteRegex);
    if (websiteMatches) {
      // Filter out LinkedIn and common domains that aren't likely personal websites
      const websites = Array.from(websiteMatches).filter(url => 
        !url.includes('linkedin.com') && 
        !url.includes('google.com') && 
        !url.includes('facebook.com')
      );
      
      if (websites.length > 0) {
        personalInfo.website = websites[0];
        if (!personalInfo.website.startsWith('http')) {
          personalInfo.website = 'https://' + personalInfo.website;
        }
        console.log(`Found website: ${personalInfo.website}`);
      }
    }
    
    // Try to extract location/address
    // Look for patterns like "City, State" or "City, State ZIP"
    const locationRegex = /\b[A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*,\s*[A-Z]{2}(?:\s*\d{5})?\b/;
    const locationMatch = text.match(locationRegex);
    if (locationMatch) {
      personalInfo.location = locationMatch[0];
      console.log(`Found location: ${personalInfo.location}`);
    }
    
    // Try to extract name from first few lines or contact section
    let nameCandidate = '';
    
    // First check in HEADER or CONTACT sections
    const headerLines = sections['HEADER']?.split('\n') || [];
    const contactLines = sections['CONTACT']?.split('\n') || 
                         sections['PERSONAL INFORMATION']?.split('\n') || [];
    
    // Combine lines to check for name
    const potentialNameLines = [...headerLines.slice(0, 5), ...contactLines];
    
    for (const line of potentialNameLines) {
      // Skip line if it's too short or contains email/phone/url
      if (line.length < 3 || 
          emailRegex.test(line) || 
          phoneRegex.test(line) || 
          line.includes('@') ||
          line.includes('http') ||
          line.includes('www.')) {
        continue;
      }
      
      // Skip lines that are too long to be names
      if (line.length > 40) continue;
      
      // Skip lines that contain multiple commas (likely address)
      if ((line.match(/,/g) || []).length > 1) continue;
      
      // Good candidate for a name: 
      // - Relatively short line
      // - First few lines of document
      // - Doesn't contain typical non-name content
      // - Contains capital letters
      if (/[A-Z][a-z]/.test(line) && 
          !line.includes(':') && 
          line.length < 40 &&
          !line.includes('resume') &&
          !line.includes('curriculum') &&
          !line.includes('vitae')) {
        nameCandidate = line.trim();
        console.log(`Found possible name: ${nameCandidate}`);
        break;
      }
    }
    
    if (nameCandidate) {
      personalInfo.name = nameCandidate;
    }
    
    // Assemble the basic parsed data
    return {
      personalInfo,
      sections,
      fullText: text,
      message: 'Basic text extraction completed. This data requires further processing by AI.'
    };
  } catch (error: any) {
    console.error('Error in simple resume parser:', error);
    throw new Error(`Resume parsing failed: ${error.message}`);
  }
}