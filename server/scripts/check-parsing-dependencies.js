// Check if PDF and DOCX parsing dependencies are installed correctly
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../../');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Check if a package is installed
function isPackageInstalled(packageName) {
  try {
    // Try to require the package to see if it's installed
    require.resolve(packageName);
    return true;
  } catch (error) {
    return false;
  }
}

// Check if a specific version of a package is installed
function getPackageVersion(packageName) {
  try {
    const packagePath = require.resolve(`${packageName}/package.json`);
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return null;
  }
}

// Main function
async function main() {
  console.log(`${colors.blue}Checking resume parsing dependencies...${colors.reset}\n`);
  
  // Check PDF parsing dependencies
  console.log(`${colors.blue}Checking PDF parsing dependencies:${colors.reset}`);
  const pdfParseInstalled = isPackageInstalled('pdf-parse');
  if (pdfParseInstalled) {
    const version = getPackageVersion('pdf-parse');
    console.log(`${colors.green}✓ pdf-parse is installed${version ? ` (version: ${version})` : ''}${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ pdf-parse is NOT installed${colors.reset}`);
    console.log(`${colors.yellow}To install, run: npm install pdf-parse${colors.reset}`);
  }
  
  // Check DOCX parsing dependencies
  console.log(`\n${colors.blue}Checking DOCX parsing dependencies:${colors.reset}`);
  const mammothInstalled = isPackageInstalled('mammoth');
  if (mammothInstalled) {
    const version = getPackageVersion('mammoth');
    console.log(`${colors.green}✓ mammoth is installed${version ? ` (version: ${version})` : ''}${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ mammoth is NOT installed${colors.reset}`);
    console.log(`${colors.yellow}To install, run: npm install mammoth${colors.reset}`);
  }
  
  // Check DOC parsing command-line tools
  console.log(`\n${colors.blue}Checking DOC parsing CLI tools:${colors.reset}`);
  
  // List of CLI tools to check
  const cliTools = [
    { name: 'antiword', installInstructions: 'brew install antiword (macOS) or apt-get install antiword (Linux)' },
    { name: 'catdoc', installInstructions: 'brew install catdoc (macOS) or apt-get install catdoc (Linux)' },
    { name: 'textutil', installInstructions: 'Built-in on macOS, not available on Linux' }
  ];
  
  let anyCliToolInstalled = false;
  
  // Check each CLI tool
  for (const tool of cliTools) {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      await execAsync(`which ${tool.name}`);
      anyCliToolInstalled = true;
      console.log(`${colors.green}✓ ${tool.name} is installed${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}✗ ${tool.name} is NOT installed${colors.reset}`);
      console.log(`  ${colors.yellow}To install: ${tool.installInstructions}${colors.reset}`);
    }
  }
  
  if (!anyCliToolInstalled) {
    console.log(`${colors.yellow}No DOC parsing CLI tools found. This will limit the parsing of .doc files.${colors.reset}`);
  }
  
  // Summary
  console.log('\n' + '-'.repeat(60));
  if (pdfParseInstalled && mammothInstalled) {
    console.log(`${colors.green}✓ All core document parsing libraries are installed.${colors.reset}`);
    console.log(`${colors.green}✓ PDF and DOCX parsing should work correctly.${colors.reset}`);
    
    if (!anyCliToolInstalled) {
      console.log(`${colors.yellow}! DOC file parsing may be limited without CLI tools.${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ DOC file parsing is available via CLI tools.${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ Some required document parsing libraries are missing.${colors.reset}`);
    console.log(`${colors.yellow}Please install the missing dependencies listed above.${colors.reset}`);
  }
  
  console.log('-'.repeat(60));
}

main().catch(error => {
  console.error(`${colors.red}Error checking dependencies:${colors.reset}`, error);
  process.exit(1);
}); 