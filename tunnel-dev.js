#!/usr/bin/env node

/**
 * Tunnel startup script for ProsumeAI
 * This script starts both the client and server with localtunnel
 */

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import localtunnel from 'localtunnel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// First, check for and kill processes on required ports
console.log('Checking for processes on ports 3000 and 4000...');

const checkPorts = async () => {
  // Check port 3000
  return new Promise((resolve) => {
    const checkPort3000 = spawn('lsof', ['-ti:3000'], { 
      stdio: 'pipe',
      shell: true 
    });

    checkPort3000.stdout.on('data', (data) => {
      const pid = data.toString().trim();
      if (pid) {
        console.log(`Port 3000 is in use by process ${pid}, killing it...`);
        try {
          process.kill(parseInt(pid), 'SIGTERM');
          console.log(`Process ${pid} killed successfully.`);
        } catch (err) {
          console.log(`Failed to kill process: ${err.message}`);
        }
      }
    });

    checkPort3000.on('close', () => {
      // Now check port 4000
      const checkPort4000 = spawn('lsof', ['-ti:4000'], { 
        stdio: 'pipe',
        shell: true 
      });

      checkPort4000.stdout.on('data', (data) => {
        const pid = data.toString().trim();
        if (pid) {
          console.log(`Port 4000 is in use by process ${pid}, killing it...`);
          try {
            process.kill(parseInt(pid), 'SIGTERM');
            console.log(`Process ${pid} killed successfully.`);
          } catch (err) {
            console.log(`Failed to kill process: ${err.message}`);
          }
        }
      });

      checkPort4000.on('close', () => {
        resolve();
      });
    });
  });
};

// Start the main process
const startTunnelServer = async () => {
  // Wait for port checks to complete
  await checkPorts();
  
  // Load environment variables from .env.development if it exists
  const envPath = resolve(__dirname, '.env.development');
  if (fs.existsSync(envPath)) {
    console.log('Loading environment variables from .env.development');
    dotenv.config({ path: envPath });
  }

  console.log('Starting ProsumeAI in tunnel mode...');

  // Set the tunnel environment variable
  const tunnelEnv = {
    ...process.env,
    NODE_ENV: 'development',
    VITE_IS_TUNNEL: 'true'
  };

  // Start the API server first to ensure it's ready for connections
  console.log('Starting API server on port 4000...');
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    cwd: __dirname,
    env: {
      ...tunnelEnv,
      PORT: 4000, // Explicitly set port to 4000
      DATABASE_URL: process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/prosumeai'
    },
    stdio: 'inherit'
  });

  // Wait for server to start before starting client
  console.log('Waiting for API server to start...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Start the Vite dev server for the client
  console.log('Starting Vite client on port 5173...');
  const clientProcess = spawn('npx', ['vite', '--config', resolve(__dirname, 'vite.config.ts'), '--host', '0.0.0.0'], {
    cwd: __dirname,
    env: {
      ...tunnelEnv,
      VITE_API_URL: 'http://localhost:4000'
    },
    stdio: 'inherit'
  });

  // Give the client some time to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Start the tunnel
  try {
    console.log('Starting localtunnel...');
    const tunnel = await localtunnel({ port: 5173 });
    
    console.log(`\n---------------------------------------`);
    console.log(`🚇 Tunnel URL: ${tunnel.url}`);
    console.log(`---------------------------------------\n`);
    
    // Handle tunnel close
    tunnel.on('close', () => {
      console.log('Tunnel closed');
      clientProcess.kill('SIGINT');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (err) {
    console.error('Failed to start tunnel:', err);
    clientProcess.kill('SIGINT');
    serverProcess.kill('SIGINT');
    process.exit(1);
  }

  // Handle process exit
  process.on('SIGINT', () => {
    console.log('Shutting down tunnel and servers...');
    clientProcess.kill('SIGINT');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });

  // Log any errors
  clientProcess.on('error', (error) => {
    console.error('Client process error:', error);
  });

  serverProcess.on('error', (error) => {
    console.error('Server process error:', error);
  });

  // Handle process exit
  clientProcess.on('exit', (code) => {
    console.log(`Client process exited with code ${code}`);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
};

// Start the process
startTunnelServer().catch(err => {
  console.error('Error in tunnel server:', err);
  process.exit(1);
}); 