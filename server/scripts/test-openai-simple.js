// Simple test script for OpenAI API key verification
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { ApiKeyManager } from '../src/utils/api-key-manager.ts';
import { db } from '../config/db.ts';
import { apiKeys } from '../../shared/schema.ts';
import { eq, and } from 'drizzle-orm';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function checkDatabaseApiKeys() {
  console.log(`${colors.blue}Checking database for OpenAI API keys...${colors.reset}`);
  
  try {
    const keys = await db.select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.service, 'openai'),
        eq(apiKeys.isActive, true)
      ));
    
    if (keys && keys.length > 0) {
      console.log(`${colors.green}✓ Found ${keys.length} active OpenAI API key(s) in the database.${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠ No active OpenAI API keys found in the database.${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error checking database for API keys: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Will fall back to environment variables.${colors.reset}`);
    return false;
  }
}

async function testOpenAI() {
  console.log(`${colors.blue}Testing OpenAI API connection...${colors.reset}\n`);
  
  // First try to get key from database using ApiKeyManager
  try {
    console.log(`${colors.blue}Trying to get OpenAI API key from ApiKeyManager...${colors.reset}`);
    const apiKey = await ApiKeyManager.getKeyWithFallback('openai', 'OPENAI_API_KEY');
    
    if (apiKey) {
      console.log(`${colors.green}✓ Successfully retrieved API key.${colors.reset}`);
      
      // Check database for available keys
      await checkDatabaseApiKeys();
      
      // Create OpenAI client
      const openai = new OpenAI({ apiKey });
      
      // Test the connection
      try {
        console.log(`${colors.blue}Sending test request to OpenAI API...${colors.reset}`);
        
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "Say hello!" }],
          max_tokens: 10
        });
        
        const content = response.choices[0]?.message?.content;
        
        if (content) {
          console.log(`${colors.green}✓ API connection successful!${colors.reset}`);
          console.log(`${colors.green}✓ Response: "${content}"${colors.reset}`);
          return true;
        } else {
          console.log(`${colors.red}❌ API response did not contain expected content.${colors.reset}`);
          return false;
        }
      } catch (error) {
        console.log(`${colors.red}❌ Error connecting to OpenAI API:${colors.reset}`);
        console.log(`${colors.red}${error.message}${colors.reset}`);
        
        // Provide specific guidance based on error message
        if (error.message.includes('401')) {
          console.log(`${colors.yellow}This appears to be an authentication error. Your API key may be invalid.${colors.reset}`);
        } else if (error.message.includes('429')) {
          console.log(`${colors.yellow}This appears to be a rate limit error. Your account may be at its usage limit.${colors.reset}`);
        } else if (error.message.includes('timeout')) {
          console.log(`${colors.yellow}This appears to be a timeout error. Check your network connection.${colors.reset}`);
        }
        
        return false;
      }
    } else {
      console.log(`${colors.red}❌ No API key available from ApiKeyManager or environment variables.${colors.reset}`);
      console.log(`${colors.yellow}Please add an API key in the admin panel or set the OPENAI_API_KEY environment variable.${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error using ApiKeyManager: ${error.message}${colors.reset}`);
    
    // Check if the error is because we couldn't connect to the database
    if (error.message.includes('database') || error.message.includes('connection')) {
      console.log(`${colors.yellow}Database connection issue. Checking environment variable as fallback...${colors.reset}`);
      
      // Fall back to direct environment variable check
      const envApiKey = process.env.OPENAI_API_KEY;
      if (envApiKey) {
        console.log(`${colors.green}✓ Found OPENAI_API_KEY in environment variables.${colors.reset}`);
        
        // Create OpenAI client with environment variable
        const openai = new OpenAI({ apiKey: envApiKey });
        
        try {
          console.log(`${colors.blue}Sending test request using environment API key...${colors.reset}`);
          
          const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Say hello!" }],
            max_tokens: 10
          });
          
          if (response.choices[0]?.message?.content) {
            console.log(`${colors.green}✓ API connection successful with environment variable!${colors.reset}`);
            return true;
          }
        } catch (apiError) {
          console.log(`${colors.red}❌ Error with environment API key: ${apiError.message}${colors.reset}`);
        }
      } else {
        console.log(`${colors.red}❌ OPENAI_API_KEY environment variable is not set.${colors.reset}`);
      }
    }
    
    return false;
  }
}

// Run the test
testOpenAI()
  .then(success => {
    if (success) {
      console.log(`\n${colors.green}✓ OpenAI API test completed successfully!${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ OpenAI API test failed.${colors.reset}`);
      console.log(`${colors.yellow}To add an API key, go to Admin > API Keys in the application.${colors.reset}`);
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(`${colors.red}Error running OpenAI test:${colors.reset}`, error);
    process.exit(1);
  }); 