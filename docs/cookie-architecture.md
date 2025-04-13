# ProsumeAI Cookie Management Architecture

## Overview

ProsumeAI's cookie management architecture provides a robust, secure system for handling user sessions, preferences, and authentication. This document outlines the architecture, components, installation process, and best practices.

## Table of Contents

1. [Core Components](#core-components)
2. [Security Features](#security-features)
3. [Installation](#installation)
4. [Usage Examples](#usage-examples)
5. [Database Integration](#database-integration)
6. [Configuration](#configuration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Core Components

### CookieManager Class

The central component is the `CookieManager` class located in `server/utils/cookie-manager.ts`. This class provides:

```typescript
export class CookieManager {
  constructor(appName = 'prosumeai', environment = 'development') { /*...*/ }
  
  // Core methods
  setCookie(res, name, value, options = {}) { /*...*/ }
  getCookie(req, name) { /*...*/ }
  clearCookie(res, name, options = {}) { /*...*/ }
  clearAllCookies(req, res) { /*...*/ }
  
  // Specialized methods
  setUserPreferences(res, preferences) { /*...*/ }
  getUserPreferences(req) { /*...*/ }
  setConsentCookie(res, consentGiven) { /*...*/ }
  setTemporaryToken(res, tokenType, token) { /*...*/ }
}
```

### Express Integration

We've extended Express.js with middleware that makes cookie management seamless:

```typescript
// In server/index.ts
app.use(cookieParser(cookieSecret));

// Enhanced Request/Response objects
app.use((req, res, next) => {
  // Add custom methods to response object
  res.setCookie = (name, value, options = {}) => {
    cookieManager.setCookie(res, name, value, options);
  };
  
  // Add helper to get cookie from request
  req.getCookie = (name) => {
    return cookieManager.getCookie(req, name);
  };
  
  next();
});
```

### Security Middleware

The architecture includes rate limiting middleware for authentication endpoints:

```typescript
// In server/middleware/rate-limit.ts
export const authRateLimiter = async (req, res, next) => {
  // Rate limiting logic
};

export const penalizeFailedLogin = async (username, ip) => {
  // Progressive penalty system
};
```

## Security Features

### Cookie Hardening

All cookies created through this system have:

- **HttpOnly flag** (when appropriate) to prevent JavaScript access
- **Secure flag** in production to ensure HTTPS-only
- **SameSite** protection (strict in production, lax in development)
- **Prefix namespacing** to prevent cookie bombing attacks
- **Automatic expiry** based on cookie purpose

### Rate Limiting

The system includes sophisticated rate limiting for authentication:

- IP-based rate limiting for all authentication attempts
- Username-specific rate limiting to prevent account targeting
- Progressive penalties for failed login attempts
- Configurable thresholds via environment variables

### Session Management

Enhanced session security includes:

- Session regeneration on logout to prevent session fixation
- Secure cookie settings for session cookies
- Session store using PostgreSQL for persistence across application restarts
- Last login tracking for security auditing

## Installation

### Automatic Installation

Use the provided installation script:

```bash
./install-cookie-manager.sh
```

This script will:
1. Install required dependencies
2. Run database migrations to add the `lastLogin` field
3. Set up necessary environment variables
4. Run tests to verify functionality

### Manual Installation

1. Install dependencies:
   ```bash
   npm install cookie-parser @types/cookie-parser rate-limiter-flexible --save
   ```

2. Run database migration:
   ```bash
   npm run db:migrate
   ```

3. Add middleware to your Express app:
   ```typescript
   import cookieParser from 'cookie-parser';
   import { cookieManager } from './utils/cookie-manager';
   
   app.use(cookieParser(process.env.COOKIE_SECRET));
   ```

## Usage Examples

### Setting a Cookie

```typescript
// Using enhanced Response object
res.setCookie('user-preference', JSON.stringify(preferences));

// Or directly
cookieManager.setCookie(res, 'user-preference', JSON.stringify(preferences));
```

### Getting a Cookie Value

```typescript
// Using enhanced Request object
const preference = req.getCookie('user-preference');

// Or directly
const preference = cookieManager.getCookie(req, 'user-preference');
```

### Managing User Preferences

```typescript
// Saving preferences
const userPrefs = { theme: 'dark', fontSize: 'medium' };
cookieManager.setUserPreferences(res, userPrefs);

// Retrieving preferences
const preferences = cookieManager.getUserPreferences(req);
if (preferences?.theme === 'dark') {
  // Apply dark theme
}
```

### Handling Rate Limiting

```typescript
// Apply rate limiting to login endpoint
app.post('/api/login', authRateLimiter, (req, res) => {
  // Login logic
});

// After failed login:
penalizeFailedLogin(username, req.ip)
  .catch(err => console.error('Failed to penalize login attempt:', err));
```

## Database Integration

The system integrates with the database to track user login times:

### Schema

The `users` table has been enhanced with a `lastLogin` column:

```typescript
// In shared/schema.ts
export const users = pgTable("users", {
  // Existing fields...
  lastLogin: timestamp("last_login"),
  // Other fields...
});
```

### Last Login Tracking

When a user logs in, their last login time is recorded:

```typescript
// In server/config/auth.ts - during login flow
storage.updateUser(user.id, { lastLogin: new Date() })
  .catch(err => console.error(`Failed to update last login time: ${err}`));
```

## Configuration

Configure the cookie system through environment variables:

```bash
# .env file
# Cookie Security
COOKIE_SECRET=your-secure-cookie-secret
COOKIE_DOMAIN=yourdomain.com  # Production only
SESSION_SECRET=your-secure-session-secret
SESSION_MAX_AGE=604800000  # 7 days in milliseconds

# Rate Limiting
AUTH_RATE_LIMIT_ATTEMPTS=5  # Max login attempts
AUTH_RATE_LIMIT_DURATION=900  # Duration in seconds (15 mins)
AUTH_RATE_LIMIT_BLOCK=3600  # Block duration in seconds (1 hour)
```

## Testing

The architecture includes comprehensive tests:

### Unit Tests

Run unit tests with:

```bash
npm run test:cookies
```

These tests verify:
- Cookie setting and retrieval
- Environment-specific configurations
- User preference handling
- Cookie clearing functionality

### Stress Testing

Test performance under load:

```bash
npm run test:cookie-stress
```

This simulates high volumes of cookie operations to ensure performance remains excellent under load.

## Troubleshooting

### Database Connection Issues

If you see errors like "database does not exist":

1. Ensure PostgreSQL is running
2. Create the database if needed:
   ```sql
   CREATE DATABASE prosumeai;
   ```
3. Verify your `DATABASE_URL` in `.env` is correct:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/prosumeai
   ```

### Missing Environment Variables

If environment variables aren't being loaded:

1. Ensure your `.env` file exists in the project root
2. Verify it contains all required variables
3. For shell scripts, you may need to explicitly load the variables:
   ```bash
   export $(grep -v '^#' .env | xargs)
   ```

### Port Conflicts

If you see "address already in use" errors:

1. Find the process using port 3000:
   ```bash
   lsof -i :3000
   ```
2. Stop that process:
   ```bash
   kill -9 [PID]
   ```
3. Or modify your server to use a different port:
   ```typescript
   const port = process.env.PORT || 3000;
   ```

## Performance Considerations

The cookie management system is designed for high performance:

- Operations take fractions of a millisecond (typically < 0.001ms)
- Memory usage is minimal
- Batched operations are supported for high-volume scenarios

This architecture ensures ProsumeAI can scale to handle more users while maintaining robust security and excellent performance. 