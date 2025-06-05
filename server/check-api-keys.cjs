// Simple script to check OpenAI API keys in database
const { Client } = require('pg');

async function checkApiKeys() {
  // Use your local database connection
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/prosumeai'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check for OpenAI API keys
    const result = await client.query(`
      SELECT id, service, name, 
             CASE 
               WHEN length(key) > 10 THEN 'sk-proj-' || substring(key, 8, 4) || '***' || right(key, 4)
               ELSE 'Invalid key'
             END as masked_key,
             is_active, created_at, last_used
      FROM api_keys 
      WHERE service = 'openai'
      ORDER BY created_at DESC
    `);
    
    console.log(`\n📊 Found ${result.rows.length} OpenAI API key(s):\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ No OpenAI API keys found in database');
      console.log('💡 You need to add one through the admin panel');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   Key: ${row.masked_key}`);
        console.log(`   Active: ${row.is_active ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   Last Used: ${row.last_used || 'Never'}`);
        console.log('');
      });
      
      // Check which key is currently being used
      const activeKeys = result.rows.filter(row => row.is_active);
      if (activeKeys.length === 0) {
        console.log('⚠️  No active keys found! All keys are disabled.');
      } else if (activeKeys.length > 1) {
        console.log(`⚠️  Multiple active keys found (${activeKeys.length}). System will use most recently used.`);
      } else {
        console.log(`✅ Active key: "${activeKeys[0].name}"`);
      }
    }
    
    // Check environment variable
    console.log('\n🔧 Environment variable check:');
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey && envKey !== 'your_openai_api_key_here') {
      console.log(`✅ OPENAI_API_KEY is set: ${envKey.substring(0, 10)}***${envKey.slice(-4)}`);
    } else {
      console.log('❌ OPENAI_API_KEY is not set or has placeholder value');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Try these connection strings:');
      console.log('   - postgres://raja:raja@localhost:5432/prosumeai');
      console.log('   - postgres://postgres:admin@localhost:5432/prosumeai');
    }
  } finally {
    await client.end();
  }
}

checkApiKeys().catch(console.error); 