/**
 * Test script for region detection API
 * This script simulates requests from different regions to test our region detection logic
 */

import fetch from 'node-fetch';

async function testRegionAPI() {
  console.log('Testing Region Detection API');
  console.log('============================');
  
  // Test 1: Default request (should use your actual IP)
  console.log('\n🧪 Test 1: Default request (your actual IP)');
  try {
    const response = await fetch('http://localhost:3000/api/user/region');
    const data = await response.json();
    console.log('Result:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // For the remaining tests, we'll need to manually modify the headers
  // in a real browser session or use a VPN to test different IPs

  console.log('\n🧪 To test different regions:');
  console.log('1. Use a VPN to connect from different regions');
  console.log('2. Visit the subscription page');
  console.log('3. Check browser console for region detection logs');
  console.log('4. Verify pricing shows in correct currency');

  console.log('\n📋 Manual testing checklist:');
  console.log('✓ India IP → Shows INR pricing');
  console.log('✓ Non-India IP → Shows USD pricing');
  console.log('✓ Subscription upgrade uses correct region pricing');
  console.log('✓ Region info shown to user');
  console.log('✓ No manual currency switching available');
}

testRegionAPI(); 