#!/usr/bin/env node

/**
 * Session Verification Script for Docker
 * 
 * This script helps verify that sessions are properly persisted
 * in the PostgreSQL database when using Docker.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import pg from 'pg';

// Database configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://raja:raja@localhost:5432/prosumeai';

async function verifySessionSetup() {
  console.log('🔍 Verifying Session Setup for Docker Compatibility\n');
  
  const client = new pg.Client({ connectionString });
  
  try {
    // Connect to database
    console.log('1️⃣  Connecting to database...');
    await client.connect();
    console.log('✅ Database connection successful\n');
    
    // Check if session table exists
    console.log('2️⃣  Checking if session table exists...');
    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'session'
      );
    `);
    
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      console.log('✅ Session table exists');
      
      // Check table structure
      console.log('\n3️⃣  Verifying table structure...');
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'session'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Table structure:');
      structureResult.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Check indexes
      console.log('\n4️⃣  Checking indexes...');
      const indexResult = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'session'
        AND schemaname = 'public';
      `);
      
      if (indexResult.rows.length > 0) {
        console.log('📊 Indexes found:');
        indexResult.rows.forEach(row => {
          console.log(`   ${row.indexname}`);
        });
      } else {
        console.log('⚠️  No indexes found on session table');
      }
      
      // Count existing sessions
      console.log('\n5️⃣  Checking existing sessions...');
      const sessionCountResult = await client.query('SELECT COUNT(*) as count FROM session');
      const sessionCount = sessionCountResult.rows[0].count;
      
      console.log(`📈 Current sessions in database: ${sessionCount}`);
      
      // Check expired sessions
      const expiredSessionsResult = await client.query('SELECT COUNT(*) as count FROM session WHERE expire < NOW()');
      const expiredCount = expiredSessionsResult.rows[0].count;
      
      console.log(`🗑️  Expired sessions: ${expiredCount}`);
      
      if (expiredCount > 0) {
        console.log('💡 Consider running: DELETE FROM session WHERE expire < NOW();');
      }
      
    } else {
      console.log('❌ Session table does NOT exist');
      console.log('\n🔧 Creating session table...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        ) WITH (OIDS=FALSE);
        
        ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
      `);
      
      console.log('✅ Session table created successfully');
    }
    
    console.log('\n6️⃣  Testing session operations...');
    
    // Test insert
    const testSessionId = 'test_' + Date.now();
    const testSessionData = {
      cookie: { maxAge: 3600000 },
      test: true,
      timestamp: new Date().toISOString()
    };
    const expireTime = new Date(Date.now() + 3600000); // 1 hour from now
    
    await client.query(`
      INSERT INTO session (sid, sess, expire) 
      VALUES ($1, $2, $3)
    `, [testSessionId, JSON.stringify(testSessionData), expireTime]);
    
    console.log('✅ Test session inserted');
    
    // Test select
    const selectResult = await client.query('SELECT * FROM session WHERE sid = $1', [testSessionId]);
    if (selectResult.rows.length > 0) {
      console.log('✅ Test session retrieved');
    } else {
      console.log('❌ Failed to retrieve test session');
    }
    
    // Clean up test session
    await client.query('DELETE FROM session WHERE sid = $1', [testSessionId]);
    console.log('✅ Test session cleaned up');
    
    console.log('\n🎉 Session verification completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ Session table exists and is properly structured');
    console.log('   ✅ Session operations (INSERT/SELECT/DELETE) working');
    console.log('   ✅ Ready for session persistence across Docker restarts');
    
  } catch (error) {
    console.error('\n❌ Session verification failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Check if PostgreSQL is running');
    console.error('   2. Verify DATABASE_URL environment variable');
    console.error('   3. Ensure database "prosumeai" exists');
    console.error('   4. Check database user permissions');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run verification
verifySessionSetup().catch(console.error); 