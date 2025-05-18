// Test script for OpenAI API key verification
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import OpenAI integration - Use tsx to execute TypeScript files
import { updateApiKey, OpenAIApi } from './openai.ts';
import { ApiKeyManager } from './src/utils/api-key-manager.ts';

// Import the database
import { db } from './config/db.ts';
import { apiKeys } from '../shared/schema.ts';
import { eq, and } from 'drizzle-orm';

async function main() {
  console.log('Testing OpenAI API key configuration...');
  
  // Try to update the API key
  console.log('Testing API key update...');
  const keyUpdated = await updateApiKey();
  
  if (!keyUpdated) {
    console.error('❌ Failed to update API key. Please check your configuration.');
    console.log('Checking available API keys in the database...');
    
    const keys = await db.select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.service, 'openai'),
        eq(apiKeys.isActive, true)
      ));
    
    if (keys && keys.length > 0) {
      console.log(`Found ${keys.length} active OpenAI API keys in the database.`);
      for (const key of keys) {
        console.log(`- Key ID: ${key.id}, Last Used: ${key.lastUsed || 'Never used'}`);
      }
    } else {
      console.log('❌ No active OpenAI API keys found in the database.');
    }
    
    console.log('\nChecking environment variable...');
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OPENAI_API_KEY environment variable is set.');
    } else {
      console.log('❌ OPENAI_API_KEY environment variable is NOT set.');
    }
    
    return;
  }
  
  console.log('✅ API key update successful.');
  
  // Try to make a simple API call
  console.log('\nTesting API call with a simple request...');
  try {
    const response = await OpenAIApi.chat({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello!' }],
      max_tokens: 10
    });
    
    console.log('✅ API call successful!');
    console.log(`Response: "${response.choices[0]?.message?.content}"`);
  } catch (error) {
    console.error('❌ API call failed:', error.message);
  }
  
  // Exit the process
  process.exit(0);
}

main().catch(error => {
  console.error('Error in test script:', error);
  process.exit(1);
}); 