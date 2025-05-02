# ATScribe Cookie Management System

## Overview

The ATScribe cookie management system provides a centralized, secure approach to handling cookies throughout the application. It implements best practices for cookie security and privacy compliance.

## Architecture

The cookie management system consists of:

1. **CookieManager Class** - A utility class that handles cookie operations
2. **Express Middleware** - Integration with Express via cookie-parser
3. **Response Enhancement** - Custom methods added to the response object
4. **Session Integration** - Works alongside our session management

## Key Features

- 🔒 **Secure By Default** - All cookies use secure, httpOnly flags in production
- 🌐 **Environment-Aware** - Adapts settings based on development/production environment
- 🧩 **Prefix Namespacing** - All cookies use a consistent naming prefix
- ⏱️ **Automatic Expiry** - Configurable expiration times based on cookie purpose
- 🔄 **Centralized Management** - Single point of control for all cookie operations

## Usage Examples

### Setting a Cookie

```typescript
// Using the cookieManager directly
cookieManager.setCookie(res, 'user-preference', JSON.stringify(preferences));

// Using the enhanced response object
res.setCookie('user-preference', JSON.stringify(preferences));
```

### Getting a Cookie Value

```typescript
// Using the cookieManager directly
const preference = cookieManager.getCookie(req, 'user-preference');

// Using the enhanced request object
const preference = req.getCookie('user-preference');
```

### Clearing a Cookie

```typescript
// Using the cookieManager directly
cookieManager.clearCookie(res, 'user-preference');

// Using the enhanced response object
res.clearCookie('user-preference');
```

### Setting User Preferences

```typescript
const userPrefs = {
  theme: 'dark',
  fontSize: 'medium',
  notifications: true
};

cookieManager.setUserPreferences(res, userPrefs);
```

### Getting User Preferences

```typescript
const userPrefs = cookieManager.getUserPreferences(req);
// or
const userPrefs = req.getUserPreferences();
```

## Cookie Types and Purposes

The system handles different types of cookies:

1. **Session Cookies** - Managed by express-session for authentication
2. **Preference Cookies** - Store user interface preferences
3. **Consent Cookies** - Track user consent for privacy compliance
4. **Temporary Tokens** - Short-lived tokens for operations like password reset

## Security Considerations

- All cookies use the HttpOnly flag when possible to prevent XSS attacks
- Session cookies are secured with SameSite protection against CSRF
- Production environments enforce Secure flag to require HTTPS
- Cookie prefixing prevents cookie bombing attacks
- Automatic expiry reduces the risk of cookie theft

## Privacy Compliance

The cookie management system supports GDPR and similar privacy regulations:

- Tracks user consent in a dedicated cookie
- Can be configured to only set essential cookies without consent
- Supports clearing all non-essential cookies on consent withdrawal

## Extending the System

To add a new cookie type:

1. Define a new method in the CookieManager class
2. Set appropriate security settings based on the cookie purpose
3. Use consistent error handling and logging
4. Update documentation on cookie usage

## Debugging

For development environments, the application provides debugging endpoints:

- `/api/debug/cookie-test` - Test cookie setting and retrieval
- `/api/debug/auth` - View authentication and session cookies

## Configuration

Cookie behavior can be configured using environment variables:

- `COOKIE_DOMAIN` - Domain for cookies in production
- `COOKIE_SECRET` - Secret for signed cookies
- `SESSION_SECRET` - Secret for session cookies
- `SESSION_MAX_AGE` - Maximum age for session cookies 