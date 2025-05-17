#!/usr/bin/env node

// Direct login test script to validate server authentication without the React frontend

import fetch from 'node-fetch';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('==== Authentication Test ====');
  
  // Get username
  const username = await new Promise(resolve => {
    rl.question('Enter username: ', (answer) => {
      resolve(answer);
    });
  });
  
  // Get password
  const password = await new Promise(resolve => {
    rl.question('Enter password: ', (answer) => {
      resolve(answer);
    });
  });
  
  console.log(`\nTesting login for user: ${username}`);
  
  try {
    // Make login request
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log(`Login response status: ${loginResponse.status}`);
    
    // Get cookies from response
    const cookies = loginResponse.headers.raw()['set-cookie'];
    console.log('Set-Cookie headers:', cookies || 'None');
    
    if (loginResponse.ok) {
      const userData = await loginResponse.json();
      console.log('Login successful!');
      console.log('User data:', JSON.stringify(userData, null, 2));
      
      // Try to access protected endpoint
      console.log('\nTesting protected endpoint access...');
      const userResponse = await fetch(`${BASE_URL}/api/user`, {
        headers: {
          'Cookie': cookies?.join('; ') || ''
        }
      });
      
      console.log(`User endpoint status: ${userResponse.status}`);
      
      if (userResponse.ok) {
        const user = await userResponse.json();
        console.log('User data fetched successfully!');
        console.log(JSON.stringify(user, null, 2));
      } else {
        console.log('Failed to access protected endpoint.');
        try {
          const errorData = await userResponse.text();
          console.log('Error:', errorData);
        } catch (e) {
          console.log('Could not parse error response');
        }
      }
    } else {
      console.log('Login failed.');
      try {
        const errorData = await loginResponse.text();
        console.log('Error:', errorData);
      } catch (e) {
        console.log('Could not parse error response');
      }
    }
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    rl.close();
  }
}

testLogin(); 