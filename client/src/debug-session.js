console.log('=== Session Debug Tool ===');

// Function to check if cookies are enabled
function areCookiesEnabled() {
  try {
    document.cookie = "cookietest=1";
    const result = document.cookie.indexOf("cookietest=") !== -1;
    document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
    return result;
  } catch (e) {
    return false;
  }
}

// Function to check if in a secure context
function isSecureContext() {
  return window.isSecureContext;
}

// Function to get all cookies
function getAllCookies() {
  return document.cookie.split(';')
    .map(cookie => cookie.trim())
    .filter(cookie => cookie.length > 0)
    .reduce((obj, cookie) => {
      const [name, value] = cookie.split('=');
      obj[name] = value;
      return obj;
    }, {});
}

// Check session cookie
function checkSessionCookie() {
  const cookies = getAllCookies();
  const sessionCookieNames = [
    'ATScribe.sid',
    'connect.sid',
    'sid',
  ];
  
  const foundSessionCookies = sessionCookieNames.filter(name => cookies[name]);
  
  return {
    found: foundSessionCookies.length > 0,
    cookieNames: foundSessionCookies,
    cookies: cookies
  };
}

// Check local storage
function checkLocalStorage() {
  try {
    const keys = Object.keys(localStorage);
    const sessionKeys = keys.filter(key => 
      key.includes('session') || 
      key.includes('user') || 
      key.includes('auth') ||
      key.includes('token')
    );
    
    return {
      enabled: true,
      keys: keys,
      sessionRelatedKeys: sessionKeys,
      sessionInvalidated: localStorage.getItem('session_invalidated'),
      logoutReason: sessionStorage.getItem('logout_reason'),
      logoutTime: sessionStorage.getItem('logout_time')
    };
  } catch (e) {
    return {
      enabled: false,
      error: e.message
    };
  }
}

// Check for network issues
function checkNetwork() {
  return {
    online: navigator.onLine,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      saveData: navigator.connection.saveData,
      type: navigator.connection.type
    } : 'Not supported'
  };
}

// Get browser details
function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    platform: navigator.platform
  };
}

// Get site info
function getSiteInfo() {
  return {
    protocol: window.location.protocol,
    host: window.location.host,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    origin: window.location.origin
  };
}

// Test API endpoint
async function testApiEndpoint() {
  try {
    const startTime = Date.now();
    const response = await fetch('/api/health', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    const endTime = Date.now();
    
    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      timeTaken: endTime - startTime,
      headers: Array.from(response.headers.entries()).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {})
    };
  } catch (e) {
    return {
      error: e.message
    };
  }
}

// Test auth endpoint
async function testAuthEndpoint() {
  try {
    const startTime = Date.now();
    const response = await fetch('/api/user', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    const endTime = Date.now();
    
    let responseData = null;
    try {
      responseData = await response.json();
    } catch (e) {
      // Ignore JSON parsing errors
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      authenticated: response.status === 200,
      timeTaken: endTime - startTime,
      data: responseData,
      headers: Array.from(response.headers.entries()).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {})
    };
  } catch (e) {
    return {
      error: e.message
    };
  }
}

// Run all checks
async function runAllChecks() {
  const report = {
    timestamp: new Date().toISOString(),
    cookiesEnabled: areCookiesEnabled(),
    secureContext: isSecureContext(),
    cookies: checkSessionCookie(),
    localStorage: checkLocalStorage(),
    network: checkNetwork(),
    browser: getBrowserInfo(),
    site: getSiteInfo(),
    healthEndpoint: await testApiEndpoint(),
    authEndpoint: await testAuthEndpoint()
  };
  
  console.log('=== Session Debug Report ===');
  console.log(JSON.stringify(report, null, 2));
  
  // Create a text representation for copying
  const reportText = Object.entries(report)
    .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
    .join('\n\n');
    
  console.log('=== Copy this report ===');
  console.log(reportText);
  
  // Add report to the page for easy copying
  const debugDiv = document.createElement('div');
  debugDiv.style.position = 'fixed';
  debugDiv.style.top = '0';
  debugDiv.style.left = '0';
  debugDiv.style.right = '0';
  debugDiv.style.bottom = '0';
  debugDiv.style.padding = '20px';
  debugDiv.style.backgroundColor = '#fff';
  debugDiv.style.color = '#000';
  debugDiv.style.zIndex = '9999';
  debugDiv.style.overflow = 'auto';
  debugDiv.style.fontFamily = 'monospace';
  
  const closeButton = document.createElement('button');
  closeButton.innerText = 'Close';
  closeButton.style.position = 'fixed';
  closeButton.style.top = '10px';
  closeButton.style.right = '10px';
  closeButton.style.padding = '5px 10px';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(debugDiv);
  });
  
  const copyButton = document.createElement('button');
  copyButton.innerText = 'Copy to Clipboard';
  copyButton.style.position = 'fixed';
  copyButton.style.top = '10px';
  copyButton.style.right = '80px';
  copyButton.style.padding = '5px 10px';
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2))
      .then(() => {
        copyButton.innerText = 'Copied!';
        setTimeout(() => {
          copyButton.innerText = 'Copy to Clipboard';
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        copyButton.innerText = 'Failed to copy';
      });
  });
  
  const heading = document.createElement('h2');
  heading.innerText = 'Session Debug Report';
  
  const pre = document.createElement('pre');
  pre.innerText = JSON.stringify(report, null, 2);
  
  debugDiv.appendChild(closeButton);
  debugDiv.appendChild(copyButton);
  debugDiv.appendChild(heading);
  debugDiv.appendChild(pre);
  
  document.body.appendChild(debugDiv);
  
  return report;
}

// Run checks when loaded
runAllChecks();

// Expose to global scope for manual running
window.debugSession = {
  runAllChecks,
  checkSessionCookie,
  getAllCookies
};

console.log('Debug session tool loaded. Use window.debugSession.runAllChecks() to run checks again.'); 