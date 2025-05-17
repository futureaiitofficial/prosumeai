// PM2 Ecosystem Configuration
module.exports = {
  apps: [
    {
      name: 'prosumeai-server',
      script: 'dist/server/server/index.js',
      instances: 'max', // Use max CPUs for Node.js cluster mode
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      error_file: 'logs/server-error.log',
      out_file: 'logs/server-out.log',
      time: true,
      wait_ready: true, // Wait for process.send('ready')
      listen_timeout: 30000, // Wait 30s for the app to boot before considering it failed
      kill_timeout: 5000, // Give the app 5s to handle graceful shutdown
      restart_delay: 3000, // Wait 3s after crash before restarting
    }
  ]
}; 