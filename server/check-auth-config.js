#!/usr/bin/env node

/**
 * Session and Auth Configuration Check Script
 * 
 * This script verifies the session and authentication configuration of your server
 * to help diagnose login issues in production.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;
const ENV = process.env.NODE_ENV || 'development';

async function main() {
  console.log('====================================');
  console.log('Session and Auth Configuration Check');
  console.log('====================================\n');
  
  console.log(`Environment: ${ENV}`);
  console.log(`Base URL: ${BASE_URL}\n`);
  
  // Check environment variables
  checkEnvironmentVariables();
  
  // Check cookie configuration
  checkCookieConfiguration();
  
  // Check CORS configuration
  checkCorsConfiguration();
  
  // Check server connectivity
  await checkServerConnectivity();
  
  console.log('\n====================================');
  console.log('Configuration check complete');
  console.log('====================================');
}

function checkEnvironmentVariables() {
  console.log('Checking environment variables...');
  
  const criticalVars = [
    { name: 'SESSION_SECRET', description: 'Secret key for session encryption', value: process.env.SESSION_SECRET },
    { name: 'COOKIE_DOMAIN', description: 'Cookie domain setting', value: process.env.COOKIE_DOMAIN },
    { name: 'DISABLE_SECURE_COOKIE', description: 'Disable secure cookie flag', value: process.env.DISABLE_SECURE_COOKIE },
    { name: 'CORS_ORIGIN', description: 'CORS allowed origins', value: process.env.CORS_ORIGIN }
  ];
  
  let issues = 0;
  
  criticalVars.forEach(variable => {
    if (!variable.value) {
      console.log(`  ❌ ${variable.name} is not set (${variable.description})`);
      issues++;
    } else {
      console.log(`  ✅ ${variable.name} is set to: ${variable.value}`);
    }
  });
  
  if (ENV === 'production') {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'ATScribe-secret-key') {
      console.log('  ⚠️  WARNING: Using default or missing SESSION_SECRET in production is a security risk');
      issues++;
    }
    
    if (process.env.DISABLE_SECURE_COOKIE === 'true') {
      console.log('  ⚠️  WARNING: DISABLE_SECURE_COOKIE is set to true in production');
      issues++;
    }
  }
  
  if (issues === 0) {
    console.log('  ✅ All critical environment variables are configured correctly');
  } else {
    console.log(`  ⚠️  Found ${issues} issue(s) with environment variables`);
  }
  
  console.log('');
}

function checkCookieConfiguration() {
  console.log('Checking cookie configuration...');
  
  try {
    // Look for cookie configuration in code files
    const authFile = fs.readFileSync(path.join(__dirname, 'config/auth.ts'), 'utf8');
    
    // Check cookie settings
    const sameSiteSetting = authFile.match(/sameSite:.*['"](.+)['"]/);
    if (sameSiteSetting) {
      console.log(`  ✅ Found sameSite cookie setting: ${sameSiteSetting[1]}`);
      
      // Check for potential issues with sameSite setting
      if (ENV === 'production' && sameSiteSetting[1] === 'strict') {
        console.log('  ⚠️  WARNING: sameSite=strict may cause login issues if your frontend is not on the exact same origin');
      } else if (ENV === 'production' && sameSiteSetting[1] === 'none' && !authFile.includes('secure: true')) {
        console.log('  ❌ ERROR: sameSite=none requires secure=true for cookies to work in modern browsers');
      }
    } else {
      console.log('  ⚠️  Could not determine sameSite cookie setting');
    }
    
    // Check secure setting
    const secureSetting = authFile.match(/secure:.*(\w+)/);
    if (secureSetting) {
      console.log(`  ✅ Found secure cookie setting: ${secureSetting[1]}`);
      
      if (ENV === 'production' && !secureSetting[1].includes('true') && !secureSetting[1].includes('useSecure')) {
        console.log('  ⚠️  WARNING: secure cookies are disabled in production');
      }
    } else {
      console.log('  ⚠️  Could not determine secure cookie setting');
    }
    
    // Check domain setting
    const domainSetting = authFile.match(/domain:.*['"](.*?)['"]/);
    if (domainSetting) {
      console.log(`  ✅ Found domain cookie setting: ${domainSetting[1]}`);
    } else if (authFile.includes('process.env.COOKIE_DOMAIN')) {
      console.log(`  ✅ Found domain cookie setting from environment: ${process.env.COOKIE_DOMAIN || '(not set)'}`);
    } else {
      console.log('  ⚠️  Could not determine domain cookie setting');
    }
    
  } catch (error) {
    console.log(`  ❌ Error checking cookie configuration: ${error.message}`);
  }
  
  console.log('');
}

function checkCorsConfiguration() {
  console.log('Checking CORS configuration...');
  
  try {
    // Look for CORS configuration in server file
    const serverFile = fs.readFileSync(path.join(__dirname, 'index.ts'), 'utf8');
    
    // Check origin setting
    if (serverFile.includes('origin:')) {
      console.log('  ✅ Found CORS origin setting');
      
      if (serverFile.includes('process.env.CORS_ORIGIN')) {
        console.log(`  ✅ CORS origin from environment: ${process.env.CORS_ORIGIN || '(not set, allowing any origin)'}`);
      } else if (serverFile.includes('true')) {
        console.log('  ⚠️  CORS is configured to allow any origin');
      }
    } else {
      console.log('  ❌ Could not find CORS origin setting');
    }
    
    // Check credentials setting
    if (serverFile.includes('credentials: true')) {
      console.log('  ✅ CORS credentials setting is enabled');
    } else {
      console.log('  ❌ CORS credentials setting is not enabled, which is required for cookies to be sent');
    }
    
    // Check headers
    if (serverFile.includes('exposedHeaders:')) {
      console.log('  ✅ CORS exposedHeaders setting found');
    }
    
  } catch (error) {
    console.log(`  ❌ Error checking CORS configuration: ${error.message}`);
  }
  
  console.log('');
}

async function checkServerConnectivity() {
  console.log('Checking server connectivity...');
  
  try {
    // Check health endpoint
    console.log('  Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`, {
      validateStatus: () => true
    });
    
    if (healthResponse.status === 200) {
      console.log(`  ✅ Health endpoint responded with status ${healthResponse.status}`);
      console.log(`  ✅ Response data: ${JSON.stringify(healthResponse.data)}`);
    } else {
      console.log(`  ❌ Health endpoint responded with status ${healthResponse.status}`);
    }
    
    // Check headers
    console.log('  ✅ Response headers:');
    Object.entries(healthResponse.headers).forEach(([key, value]) => {
      console.log(`    - ${key}: ${value}`);
    });
    
    // Look for cookie related headers
    const hasSetCookie = Object.keys(healthResponse.headers).some(header => 
      header.toLowerCase() === 'set-cookie'
    );
    
    if (hasSetCookie) {
      console.log('  ✅ Server is setting cookies');
    } else {
      console.log('  ℹ️  Server did not set any cookies on this endpoint (expected for health check)');
    }
    
  } catch (error) {
    console.log(`  ❌ Error connecting to server: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('  ❌ Connection refused. Is the server running?');
    }
  }
}

// Run the main function
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
}); 