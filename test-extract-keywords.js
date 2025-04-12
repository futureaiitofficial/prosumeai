// Test script for the extract-keywords endpoint
import fetch from 'node-fetch';

async function testExtractKeywords() {
  try {
    console.log('Testing extract-keywords endpoint...');
    
    const jobDescription = `
    Senior Software Engineer - Full Stack
    
    We are looking for a Senior Software Engineer with experience in React, Node.js, and TypeScript to join our team.
    You'll be responsible for building and maintaining our web applications and APIs.
    
    Requirements:
    - 5+ years of experience in software development
    - Strong experience with React, Redux, and modern JavaScript
    - Experience with Node.js and Express.js
    - TypeScript expertise
    - Experience with databases (PostgreSQL, MongoDB)
    - Understanding of CI/CD pipelines
    - Excellent problem-solving skills
    
    Nice to have:
    - Experience with AWS or other cloud platforms
    - Knowledge of GraphQL
    - Experience with Docker and Kubernetes
    `;
    
    console.log('Sending request to extract-keywords endpoint...');
    const response = await fetch('http://localhost:3000/api/ai/extract-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobDescription }),
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('Test successful!');
    } else {
      console.error('Test failed!');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testExtractKeywords(); 