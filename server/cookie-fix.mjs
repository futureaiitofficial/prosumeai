// Quick Express server to help clear cookies during testing
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

// Add a simple route to clear cookies
app.get('/', (req, res) => {
  // Clear all possible cookie variants
  res.clearCookie('ATScribe.sid', { path: '/', domain: undefined });
  res.clearCookie('ATScribe.sid', { path: '/', secure: true, sameSite: 'none' });
  res.clearCookie('ATScribe.sid', { path: '/', secure: true, sameSite: 'lax' });
  res.clearCookie('ATScribe.sid', { path: '/', secure: false, sameSite: 'lax' });
  
  res.send(`
    <html>
      <head>
        <title>Cookie Reset Tool</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            margin-top: 50px;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
          h1 { color: #4338ca; }
          .button {
            display: inline-block;
            background-color: #4f46e5;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: bold;
          }
          .instructions {
            text-align: left;
            margin: 20px 0;
            padding: 15px;
            background-color: #f0f9ff;
            border: 1px solid #3b82f6;
            border-radius: 5px;
          }
          .code {
            background: #f1f5f9;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            margin: 10px 0;
            text-align: left;
          }
        </style>
        <script>
          // Function to clear all browser storage
          function clearAllStorage() {
            // Clear all localStorage
            localStorage.clear();
            
            // Clear all sessionStorage
            sessionStorage.clear();
            
            // Clear all cookies
            document.cookie.split(";").forEach(function(c) {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            document.getElementById('status').innerHTML = 'All browser storage cleared!';
          }
        </script>
      </head>
      <body>
        <div class="container">
          <h1>Session Cookie Reset Tool</h1>
          <p>All cookies have been cleared from the server side.</p>
          <p id="status"></p>
          
          <div class="instructions">
            <h3>Complete these steps:</h3>
            <ol>
              <li>Click the "Clear Browser Storage" button below</li>
              <li>Open Chrome DevTools (F12 or Right-click > Inspect)</li>
              <li>Go to Application tab > Cookies > localhost</li>
              <li>Verify there are no ATScribe.sid cookies</li>
              <li>Try logging in again at: <a href="http://localhost:3000/auth" target="_blank">http://localhost:3000/auth</a></li>
            </ol>
          </div>
          
          <div class="code">
            <strong>Current environment settings:</strong><br>
            COOKIE_SAMESITE=${process.env.COOKIE_SAMESITE || 'lax'}<br>
            DISABLE_SECURE_COOKIE=${process.env.DISABLE_SECURE_COOKIE || 'true'}<br>
            NODE_ENV=${process.env.NODE_ENV || 'development'}
          </div>
          
          <button onclick="clearAllStorage()" class="button">Clear Browser Storage</button>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Cookie reset tool running at http://localhost:${PORT}`);
  console.log('Open this URL in your browser to clear cookies');
}); 