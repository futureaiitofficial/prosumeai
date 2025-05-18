// Install document parsing dependencies
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { execSync } from 'child_process';
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
    require.resolve(packageName);
    return true;
  } catch (error) {
    return false;
  }
}

// Install npm packages if not already installed
async function installNpmPackages() {
  const packages = [
    { name: 'pdf-parse', description: 'PDF parsing library' },
    { name: 'mammoth', description: 'DOCX parsing library' },
  ];

  let installCount = 0;
  
  for (const pkg of packages) {
    if (!isPackageInstalled(pkg.name)) {
      console.log(`${colors.yellow}Installing ${pkg.name} (${pkg.description})...${colors.reset}`);
      try {
        execSync(`npm install ${pkg.name}`, { cwd: rootDir, stdio: 'inherit' });
        console.log(`${colors.green}✓ Successfully installed ${pkg.name}${colors.reset}`);
        installCount++;
      } catch (error) {
        console.error(`${colors.red}Failed to install ${pkg.name}:${colors.reset}`, error);
      }
    } else {
      console.log(`${colors.green}✓ ${pkg.name} is already installed${colors.reset}`);
    }
  }
  
  return installCount;
}

// Detect operating system
function getOperatingSystem() {
  const platform = process.platform;
  if (platform === 'darwin') return 'mac';
  if (platform === 'linux') return 'linux';
  if (platform === 'win32') return 'windows';
  return 'unknown';
}

// Install system dependencies based on OS
async function installSystemDependencies() {
  const os = getOperatingSystem();
  
  if (os === 'unknown') {
    console.log(`${colors.yellow}Unsupported OS: ${process.platform}. Cannot install system dependencies.${colors.reset}`);
    return;
  }
  
  console.log(`${colors.blue}Detected operating system: ${os}${colors.reset}`);
  
  if (os === 'windows') {
    console.log(`${colors.yellow}On Windows, please manually install these tools if needed:${colors.reset}`);
    console.log(`${colors.yellow}- antiword (for DOC parsing)${colors.reset}`);
    console.log(`${colors.yellow}- catdoc (for DOC parsing)${colors.reset}`);
    return;
  }
  
  // Check if we have package managers
  let hasBrew = false;
  let hasApt = false;
  
  try {
    execSync('which brew', { stdio: 'ignore' });
    hasBrew = true;
  } catch (error) {
    // brew not installed
  }
  
  try {
    execSync('which apt-get', { stdio: 'ignore' });
    hasApt = true;
  } catch (error) {
    // apt-get not installed
  }
  
  // Install CLI tools
  if (os === 'mac' && hasBrew) {
    console.log(`${colors.blue}Installing CLI tools with Homebrew...${colors.reset}`);
    try {
      execSync('brew install antiword catdoc', { stdio: 'inherit' });
      console.log(`${colors.green}✓ Successfully installed antiword and catdoc${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Failed to install CLI tools:${colors.reset}`, error);
    }
  } else if (os === 'linux' && hasApt) {
    console.log(`${colors.blue}Installing CLI tools with apt-get...${colors.reset}`);
    try {
      execSync('sudo apt-get update && sudo apt-get install -y antiword catdoc', { stdio: 'inherit' });
      console.log(`${colors.green}✓ Successfully installed antiword and catdoc${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Failed to install CLI tools:${colors.reset}`, error);
    }
  } else {
    console.log(`${colors.yellow}No compatible package manager found (brew on macOS or apt-get on Linux).${colors.reset}`);
    console.log(`${colors.yellow}Please manually install antiword and catdoc.${colors.reset}`);
  }
}

// Main function
async function main() {
  console.log(`${colors.blue}Installing document parsing dependencies...${colors.reset}\n`);
  
  // Install npm packages
  console.log(`${colors.blue}Checking and installing npm packages:${colors.reset}`);
  const npmInstallCount = await installNpmPackages();
  
  // Install system dependencies
  console.log(`\n${colors.blue}Checking and installing system dependencies:${colors.reset}`);
  await installSystemDependencies();
  
  // Summary
  console.log('\n' + '-'.repeat(60));
  console.log(`${colors.green}✓ Installation process completed.${colors.reset}`);
  if (npmInstallCount > 0) {
    console.log(`${colors.green}✓ Installed ${npmInstallCount} npm package(s).${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ All required npm packages were already installed.${colors.reset}`);
  }
  console.log('-'.repeat(60));
  
  console.log(`\n${colors.blue}You can verify the installation by running:${colors.reset}`);
  console.log(`${colors.yellow}npm run check:parsing${colors.reset}`);
}

main().catch(error => {
  console.error(`${colors.red}Error installing dependencies:${colors.reset}`, error);
  process.exit(1);
}); 