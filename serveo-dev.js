#!/usr/bin/env node

/**
 * Serveo tunnel startup script for ProsumeAI
 * This script starts both the client and server with Serveo for better performance
 * Serveo works over SSH and doesn't require any additional software installation
 */

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Kill any Drizzle Studio processes that might be running
const killDrizzleStudio = async () => {
  return new Promise((resolve) => {
    console.log('Checking for Drizzle Studio processes...');
    const killDrizzleProcess = spawn('pgrep', ['-f', 'drizzle-kit studio'], { 
      stdio: 'pipe',
      shell: true 
    });

    killDrizzleProcess.stdout.on('data', (data) => {
      const pids = data.toString().trim().split('\n');
      if (pids.length > 0 && pids[0] !== '') {
        console.log(`Found ${pids.length} Drizzle Studio processes, killing them...`);
        pids.forEach(pid => {
          try {
            process.kill(parseInt(pid), 'SIGTERM');
            console.log(`Killed Drizzle Studio process ${pid}`);
          } catch (err) {
            console.log(`Failed to kill process: ${err.message}`);
          }
        });
      } else {
        console.log('No Drizzle Studio processes found.');
      }
    });

    killDrizzleProcess.on('close', () => {
      resolve();
    });
  });
};

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

// Kill any existing SSH tunnel processes
const killSSHTunnels = async () => {
  return new Promise((resolve) => {
    console.log('Checking for existing SSH tunnels...');
    const killSSHProcess = spawn('pgrep', ['-f', 'ssh -R'], { 
      stdio: 'pipe',
      shell: true 
    });

    killSSHProcess.stdout.on('data', (data) => {
      const pids = data.toString().trim().split('\n');
      if (pids.length > 0 && pids[0] !== '') {
        console.log(`Found ${pids.length} SSH tunnel processes, killing them...`);
        pids.forEach(pid => {
          try {
            process.kill(parseInt(pid), 'SIGTERM');
            console.log(`Killed SSH tunnel process ${pid}`);
          } catch (err) {
            console.log(`Failed to kill process: ${err.message}`);
          }
        });
      } else {
        console.log('No SSH tunnel processes found.');
      }
    });

    killSSHProcess.on('close', () => {
      resolve();
    });
  });
};

// Start the main process
const startServeoServer = async () => {
  // First kill any Drizzle Studio instances
  await killDrizzleStudio();
  
  // Kill any existing SSH tunnels
  await killSSHTunnels();
  
  // Then check and kill processes on required ports
  await checkPorts();
  
  // Load environment variables from .env.development if it exists
  const envPath = resolve(__dirname, '.env.development');
  if (fs.existsSync(envPath)) {
    console.log('Loading environment variables from .env.development');
    dotenv.config({ path: envPath });
  }

  console.log('Starting ProsumeAI in Serveo tunnel mode...');

  // Set the tunnel environment variable
  const tunnelEnv = {
    ...process.env,
    NODE_ENV: 'development',
    VITE_IS_TUNNEL: 'true',
    DISABLE_DRIZZLE_STUDIO: 'true', // Prevent Drizzle Studio from launching
    DRIZZLE_STUDIO: 'false', // Additional flag to prevent studio
    NO_STUDIO: 'true' // Yet another flag to try to prevent studio
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

  // Kill any Drizzle Studio that might have started
  setTimeout(async () => {
    await killDrizzleStudio();
  }, 2000);

  // Give the client some time to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Start Serveo SSH tunnel
  try {
    console.log('Starting Serveo SSH tunnel...');
    
    // Create the SSH tunnel to Serveo
    const serveoProcess = spawn('ssh', ['-R', '80:localhost:5173', 'serveo.net'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });
    
    let serveoUrl = null;
    
    // Parse the output to get the Serveo URL
    serveoProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Serveo: ${output}`);
      
      // Extract the URL from the Serveo output
      if (output.includes('Forwarding HTTP traffic from')) {
        const match = output.match(/https?:\/\/([a-zA-Z0-9-]+\.serveo\.net)/);
        if (match && match[0]) {
          serveoUrl = match[0];
          console.log(`\n---------------------------------------`);
          console.log(`🚇 Serveo Tunnel URL: ${serveoUrl}`);
          console.log(`---------------------------------------\n`);
        }
      }
    });
    
    serveoProcess.stderr.on('data', (data) => {
      console.error(`Serveo error: ${data}`);
    });
    
    // Handle Serveo process errors
    serveoProcess.on('error', (error) => {
      console.error('Failed to start Serveo tunnel:', error);
    });
    
    // Periodically check and kill any Drizzle Studio instances
    const drizzleKillInterval = setInterval(async () => {
      await killDrizzleStudio();
    }, 30000); // Check less frequently (every 30 seconds)

    // Handle process exit
    process.on('SIGINT', () => {
      console.log('Shutting down Serveo tunnel and servers...');
      clearInterval(drizzleKillInterval);
      serveoProcess.kill();
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
      clearInterval(drizzleKillInterval);
      serveoProcess.kill();
    });

    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
      clearInterval(drizzleKillInterval);
      serveoProcess.kill();
    });
    
    // Handle Serveo process exit
    serveoProcess.on('exit', (code) => {
      console.log(`Serveo process exited with code ${code}`);
      // Don't exit the main process if Serveo exits, try to restart it
      if (code !== 0) {
        console.log('Attempting to restart Serveo tunnel...');
        // Simple restart attempt by creating a new process
        const newServeoProcess = spawn('ssh', ['-R', '80:localhost:5173', 'serveo.net'], {
          stdio: 'inherit',
          shell: false
        });
        newServeoProcess.on('error', (error) => {
          console.error('Failed to restart Serveo tunnel:', error);
        });
      }
    });
    
  } catch (err) {
    console.error('Failed to start Serveo tunnel:', err);
    clientProcess.kill('SIGINT');
    serverProcess.kill('SIGINT');
    process.exit(1);
  }
};

// Start the process
startServeoServer().catch(err => {
  console.error('Error in Serveo server:', err);
  process.exit(1);
}); 