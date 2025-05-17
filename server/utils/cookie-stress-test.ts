/**
 * Cookie Management Stress Test
 * 
 * This script tests the cookie management system under load by simulating
 * a large number of cookie operations in quick succession.
 * 
 * Run with: npx tsx server/utils/cookie-stress-test.ts
 */

import { CookieManager } from './cookie-manager';
import { Request, Response, CookieOptions } from 'express';

// Mock express objects
const createMockRequest = (cookies = {}): Partial<Request> => {
  return { cookies };
};

const createMockResponse = (): Partial<Response> => {
  return {
    cookie: function(name: string, val: string, options?: CookieOptions): any {
      // Mock implementation
      return this;
    },
    clearCookie: function(name: string, options?: CookieOptions): any {
      // Mock implementation
      return this;
    }
  };
};

// Performance testing parameters
const NUM_ITERATIONS = 10000;
const BATCH_SIZE = 1000;
const OPERATIONS = ['set', 'get', 'clear', 'prefs'] as const;

async function runStressTest() {
  console.log('Cookie Management Stress Test');
  console.log('=============================');
  console.log(`Iterations: ${NUM_ITERATIONS}, Batch Size: ${BATCH_SIZE}`);
  
  // Create cookie manager
  const cookieManager = new CookieManager('stresstest');
  
  // Create mock objects
  const req = createMockRequest({
    'stresstest.existing': 'value',
    'stresstest.preferences': JSON.stringify({ theme: 'dark' })
  });
  const res = createMockResponse();
  
  // Store operation timings
  const timings: Record<typeof OPERATIONS[number], number[]> = {
    set: [],
    get: [],
    clear: [],
    prefs: []
  };
  
  // Warm up phase
  console.log('\nWarm up phase...');
  for (let i = 0; i < 100; i++) {
    cookieManager.setCookie(res as Response, `test${i}`, 'value');
    cookieManager.getCookie(req as Request, `test${i}`);
    cookieManager.clearCookie(res as Response, `test${i}`);
    cookieManager.getUserPreferences(req as Request);
  }
  
  // Stress test each operation
  for (const operation of OPERATIONS) {
    console.log(`\nTesting ${operation} operation...`);
    
    // Run in batches to avoid blocking the event loop
    for (let batch = 0; batch < NUM_ITERATIONS / BATCH_SIZE; batch++) {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      for (let i = 0; i < BATCH_SIZE; i++) {
        const start = process.hrtime.bigint();
        
        // Run operation
        switch (operation) {
          case 'set':
            cookieManager.setCookie(res as Response, `test${i}`, 'value');
            break;
          case 'get':
            cookieManager.getCookie(req as Request, 'existing');
            break;
          case 'clear':
            cookieManager.clearCookie(res as Response, `test${i}`);
            break;
          case 'prefs':
            cookieManager.getUserPreferences(req as Request);
            break;
        }
        
        const end = process.hrtime.bigint();
        timings[operation].push(Number(end - start) / 1000000); // Convert to ms
      }
      
      process.stdout.write('.');
    }
    
    // Calculate stats
    const times = timings[operation];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    // Output results
    console.log(`\n${operation.padEnd(8)} | avg: ${avg.toFixed(4)} ms | min: ${min.toFixed(4)} ms | max: ${max.toFixed(4)} ms`);
  }
  
  // Check memory usage
  const memoryUsage = process.memoryUsage();
  console.log('\nMemory Usage:');
  console.log(`RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\nStress test completed!');
}

// Run the test
runStressTest().catch(console.error); 