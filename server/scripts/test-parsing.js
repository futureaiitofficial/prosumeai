// Test script for document parsing
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractDocumentText } from '../simple-parser.ts';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Create a temporary test file
async function createTempTestFile(type) {
  const tempDir = path.join(__dirname, '../../temp');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  let filePath = '';
  
  if (type === 'txt') {
    filePath = path.join(tempDir, 'test-document.txt');
    const content = `
Test Resume Document
-------------------

John Doe
john.doe@example.com
(123) 456-7890

SUMMARY
-------
Experienced software developer with over 5 years of experience in full-stack development.

EXPERIENCE
----------
Senior Developer | ABC Tech Inc. | 2020-Present
- Developed and maintained web applications using React and Node.js
- Implemented CI/CD pipelines

Junior Developer | XYZ Software | 2018-2020
- Built responsive web interfaces
- Collaborated with designers

EDUCATION
---------
Bachelor of Science in Computer Science
University of Technology | 2018

SKILLS
------
JavaScript, TypeScript, React, Node.js, Python, SQL, MongoDB
`;
    fs.writeFileSync(filePath, content);
    console.log(`${colors.green}✓ Created test text file: ${filePath}${colors.reset}`);
  }
  
  return filePath;
}

// Test file parsing
async function testParsing() {
  console.log(`${colors.blue}Testing document parsing...${colors.reset}\n`);
  
  // Create a test text file
  const txtFilePath = await createTempTestFile('txt');
  
  // Test parsing text file
  console.log(`${colors.blue}Testing text file parsing...${colors.reset}`);
  try {
    const textContent = await extractDocumentText(txtFilePath);
    if (textContent && textContent.length > 0) {
      console.log(`${colors.green}✓ Successfully extracted ${textContent.length} characters from text file${colors.reset}`);
      console.log(`${colors.magenta}First 100 characters:${colors.reset}`);
      console.log(textContent.substring(0, 100) + '...');
    } else {
      console.log(`${colors.red}❌ Failed to extract content from text file${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error parsing text file: ${error.message}${colors.reset}`);
    return false;
  }
  
  console.log(`\n${colors.blue}Checking for PDF and DOCX parsing libraries...${colors.reset}`);
  
  // Check if pdf-parse is available
  try {
    const pdfParse = require('pdf-parse');
    console.log(`${colors.green}✓ pdf-parse library is available${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ pdf-parse library is not available: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Run 'npm run install:parsing' to install the required libraries${colors.reset}`);
  }
  
  // Check if mammoth is available
  try {
    const mammoth = require('mammoth');
    console.log(`${colors.green}✓ mammoth library is available${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ mammoth library is not available: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Run 'npm run install:parsing' to install the required libraries${colors.reset}`);
  }
  
  return true;
}

// Check CLI tools
async function checkCliTools() {
  console.log(`\n${colors.blue}Checking CLI tools for DOC parsing...${colors.reset}`);
  
  const cliTools = [
    { name: 'antiword', description: 'Used for DOC file parsing' },
    { name: 'catdoc', description: 'Alternative for DOC file parsing' },
    { name: 'textutil', description: 'Built-in macOS tool for text conversion' }
  ];
  
  let foundTools = 0;
  
  for (const tool of cliTools) {
    try {
      const { execSync } = require('child_process');
      execSync(`which ${tool.name}`, { stdio: 'ignore' });
      console.log(`${colors.green}✓ ${tool.name} is installed (${tool.description})${colors.reset}`);
      foundTools++;
    } catch (error) {
      console.log(`${colors.yellow}⚠ ${tool.name} is not installed (${tool.description})${colors.reset}`);
    }
  }
  
  if (foundTools === 0) {
    console.log(`${colors.yellow}⚠ No CLI tools for DOC parsing found. DOC file parsing may be limited.${colors.reset}`);
    console.log(`${colors.yellow}Run 'npm run install:parsing' to install the recommended CLI tools${colors.reset}`);
  }
}

// Run the tests
async function main() {
  console.log(`${colors.blue}========== DOCUMENT PARSING TEST ===========${colors.reset}\n`);
  
  const parsingResult = await testParsing();
  await checkCliTools();
  
  console.log(`\n${colors.blue}======== TEST SUMMARY ========${colors.reset}`);
  if (parsingResult) {
    console.log(`${colors.green}✓ Basic document parsing is working${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Document parsing test failed${colors.reset}`);
  }
  
  console.log(`\n${colors.blue}To ensure all parsing libraries are installed:${colors.reset}`);
  console.log(`${colors.yellow}1. Run 'npm run check:parsing' to check all dependencies${colors.reset}`);
  console.log(`${colors.yellow}2. Run 'npm run install:parsing' to install missing dependencies${colors.reset}`);
  
  console.log(`\n${colors.blue}=========================================${colors.reset}`);
}

main().catch(error => {
  console.error(`${colors.red}Error in test script:${colors.reset}`, error);
  process.exit(1);
}); 