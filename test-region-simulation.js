/**
 * Region Testing Simulation Script
 * 
 * This script simulates how our API would respond to different IP addresses
 * by mocking the ipapi.co service responses.
 */

import fetch from 'node-fetch';

// Mock implementation of the region detection logic
async function detectRegion(ip) {
  console.log(`Detecting region for IP: ${ip}`);
  
  // Skip actual geolocation for localhost/development
  if (ip === '127.0.0.1' || ip === '::1' || ip.includes('192.168.') || ip.includes('10.0.')) {
    console.log('Development environment detected, returning GLOBAL as default');
    return { region: 'GLOBAL', currency: 'USD' };
  }
  
  try {
    // Simulate IP geolocation API response
    // In production this would call: fetch(`https://ipapi.co/${ip}/json/`)
    let mockGeoResponse;
    
    // Indian IP simulation
    if (ip === '103.37.201.90') {
      mockGeoResponse = {
        ip: '103.37.201.90',
        country_code: 'IN',
        country_name: 'India',
        region_code: 'KA',
        region_name: 'Karnataka',
        city: 'Bangalore',
        zip_code: '560001',
        time_zone: 'Asia/Kolkata',
        latitude: 12.9634,
        longitude: 77.5855,
        country_calling_code: '+91'
      };
    } 
    // US IP simulation
    else if (ip === '172.217.14.206') {
      mockGeoResponse = {
        ip: '172.217.14.206',
        country_code: 'US',
        country_name: 'United States',
        region_code: 'CA',
        region_name: 'California',
        city: 'Mountain View',
        zip_code: '94043',
        time_zone: 'America/Los_Angeles',
        latitude: 37.4223,
        longitude: -122.0847,
        country_calling_code: '+1'
      };
    }
    // UK IP simulation
    else if (ip === '51.36.68.30') {
      mockGeoResponse = {
        ip: '51.36.68.30',
        country_code: 'GB',
        country_name: 'United Kingdom',
        region_code: 'ENG',
        region_name: 'England',
        city: 'London',
        zip_code: 'EC1A',
        time_zone: 'Europe/London',
        latitude: 51.5074,
        longitude: -0.1278,
        country_calling_code: '+44'
      };
    }
    // Unknown IP fallback
    else {
      mockGeoResponse = {
        error: true,
        reason: 'Invalid IP address'
      };
    }
    
    console.log('IP Geolocation response:', mockGeoResponse);
    
    if (mockGeoResponse.error) {
      throw new Error(`Geolocation API error: ${mockGeoResponse.reason}`);
    }
    
    // Determine region based on country code
    const country = mockGeoResponse.country_code;
    
    // Check if user is in India
    if (country === 'IN') {
      return { region: 'INDIA', currency: 'INR', country };
    } else {
      return { region: 'GLOBAL', currency: 'USD', country };
    }
  } catch (geoError) {
    console.error('Error with geolocation service:', geoError);
    // Default to GLOBAL if geolocation fails
    return { region: 'GLOBAL', currency: 'USD', error: 'Geolocation failed' };
  }
}

// Simulate subscription plan pricing retrieval based on region
function getPlanPricing(planId, region) {
  // Mock database of plan pricing
  const pricingDatabase = {
    // Plan ID 1: Basic Plan
    1: {
      'GLOBAL': { id: 1, planId: 1, targetRegion: 'GLOBAL', currency: 'USD', price: '9.99' },
      'INDIA': { id: 2, planId: 1, targetRegion: 'INDIA', currency: 'INR', price: '399' }
    },
    // Plan ID 2: Pro Plan
    2: {
      'GLOBAL': { id: 3, planId: 2, targetRegion: 'GLOBAL', currency: 'USD', price: '19.99' },
      'INDIA': { id: 4, planId: 2, targetRegion: 'INDIA', currency: 'INR', price: '799' }
    },
    // Plan ID 3: Enterprise Plan (only has GLOBAL pricing)
    3: {
      'GLOBAL': { id: 5, planId: 3, targetRegion: 'GLOBAL', currency: 'USD', price: '99.99' }
    }
  };
  
  // Get pricing for the specified plan and region
  const planPricing = pricingDatabase[planId] || {};
  const regionPricing = planPricing[region];
  
  // If no pricing for this region, try GLOBAL
  if (!regionPricing && region !== 'GLOBAL') {
    console.log(`No pricing found for plan ${planId} in region ${region}, falling back to GLOBAL`);
    return planPricing['GLOBAL'];
  }
  
  return regionPricing;
}

// Mock pricing display function (similar to client-side implementation)
function getPriceDisplay(plan, userRegion) {
  // For freemium plans
  if (plan.isFreemium || !plan.pricing || plan.pricing.length === 0) {
    return 'Free';
  }
  
  // Find pricing for the user's region
  const userRegionPricing = plan.pricing.find(p => p.targetRegion === userRegion.region);
  
  // If found, use it
  if (userRegionPricing) {
    return `${userRegionPricing.price} ${userRegionPricing.currency}`;
  }
  
  // Fallback to global pricing
  const globalPricing = plan.pricing.find(p => p.targetRegion === 'GLOBAL');
  if (globalPricing) {
    return `${globalPricing.price} ${globalPricing.currency}`;
  }
  
  // Last resort fallback
  return plan.price && plan.price !== '0.00' ? `${plan.price} USD` : 'Free';
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Region-Based Pricing');
  console.log('==============================');
  
  // Test with Indian IP
  console.log('\n🇮🇳 Test with Indian IP (103.37.201.90)');
  const indiaRegion = await detectRegion('103.37.201.90');
  console.log('Detected region:', indiaRegion);
  
  // Get pricing for various plans using India region
  const plan1IndiaPrice = getPlanPricing(1, indiaRegion.region);
  const plan2IndiaPrice = getPlanPricing(2, indiaRegion.region);
  const plan3IndiaPrice = getPlanPricing(3, indiaRegion.region);
  
  console.log('Plan 1 pricing for Indian user:', plan1IndiaPrice);
  console.log('Plan 2 pricing for Indian user:', plan2IndiaPrice);
  console.log('Plan 3 pricing for Indian user:', plan3IndiaPrice); // Should fall back to GLOBAL
  
  // Test with US IP
  console.log('\n🇺🇸 Test with US IP (172.217.14.206)');
  const usRegion = await detectRegion('172.217.14.206');
  console.log('Detected region:', usRegion);
  
  // Get pricing for various plans using US region (GLOBAL)
  const plan1USPrice = getPlanPricing(1, usRegion.region);
  const plan2USPrice = getPlanPricing(2, usRegion.region);
  const plan3USPrice = getPlanPricing(3, usRegion.region);
  
  console.log('Plan 1 pricing for US user:', plan1USPrice);
  console.log('Plan 2 pricing for US user:', plan2USPrice);
  console.log('Plan 3 pricing for US user:', plan3USPrice);
  
  // Test with UK IP
  console.log('\n🇬🇧 Test with UK IP (51.36.68.30)');
  const ukRegion = await detectRegion('51.36.68.30');
  console.log('Detected region:', ukRegion);
  
  // Test invalid IP
  console.log('\n❓ Test with Invalid IP (999.999.999.999)');
  const unknownRegion = await detectRegion('999.999.999.999');
  console.log('Fallback region for invalid IP:', unknownRegion);
  
  // Test client-side display
  console.log('\n🖥️ Client-side price display simulation');
  
  // Simulate plans with pricing data
  const mockPlans = [
    {
      id: 1,
      name: 'Basic Plan',
      description: 'Great for personal use',
      billingCycle: 'MONTHLY',
      isFreemium: false,
      pricing: [
        { id: 1, planId: 1, targetRegion: 'GLOBAL', currency: 'USD', price: '9.99' },
        { id: 2, planId: 1, targetRegion: 'INDIA', currency: 'INR', price: '399' }
      ]
    },
    {
      id: 2,
      name: 'Pro Plan',
      description: 'Perfect for professionals',
      billingCycle: 'MONTHLY',
      isFreemium: false,
      pricing: [
        { id: 3, planId: 2, targetRegion: 'GLOBAL', currency: 'USD', price: '19.99' },
        { id: 4, planId: 2, targetRegion: 'INDIA', currency: 'INR', price: '799' }
      ]
    },
    {
      id: 3,
      name: 'Free Plan',
      description: 'Limited features',
      billingCycle: 'MONTHLY',
      isFreemium: true,
      pricing: []
    }
  ];
  
  console.log('Price display for Indian user:');
  mockPlans.forEach(plan => {
    console.log(`  - ${plan.name}: ${getPriceDisplay(plan, indiaRegion)}`);
  });
  
  console.log('Price display for US user:');
  mockPlans.forEach(plan => {
    console.log(`  - ${plan.name}: ${getPriceDisplay(plan, usRegion)}`);
  });
}

runTests(); 