import express from 'express';
import cors from 'cors';

const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Add a simple route to clear cookies
app.get('/clear-cookies', (req, res) => {
  // Clear browser cookies
  res.clearCookie('ATScribe.sid');
  
  res.send(`
    <html>
      <head>
        <title>Session Cleared</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            margin-top: 100px;
            background-color: #f8fafc;
          }
          .container {
            max-width: 500px;
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
            border-left: 4px solid #3b82f6;
          }
          .steps {
            margin-bottom: 10px;
          }
        </style>
        <script>
          // Clear all localStorage and sessionStorage
          window.localStorage.clear();
          window.sessionStorage.clear();
          
          // Delete all cookies
          document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        </script>
      </head>
      <body>
        <div class="container">
          <h1>Session Cleared!</h1>
          <p>All cookies and session data have been cleared from your browser.</p>
          
          <div class="instructions">
            <div class="steps"><strong>Step 1:</strong> Close this tab</div>
            <div class="steps"><strong>Step 2:</strong> Open a new tab and navigate to <code>http://localhost:5173</code></div>
            <div class="steps"><strong>Step 3:</strong> Try logging in with your username and password</div>
          </div>
          
          <p>If you still have issues, try clearing your browser cache completely:</p>
          <ul style="text-align: left;">
            <li>Chrome: Ctrl+Shift+Delete</li>
            <li>Firefox: Ctrl+Shift+Delete</li>
            <li>Safari: Option+Command+E</li>
          </ul>
          
          <a href="http://localhost:5173" class="button">Go to Login Page</a>
        </div>
      </body>
    </html>
  `);
});

// Start server on a different port to avoid conflicts
const PORT = 4005;
app.listen(PORT, () => {
  console.log(`Session clearing server running at http://localhost:${PORT}/clear-cookies`);
  console.log(`Open this URL in your browser to clear your session cookies`);
}); 