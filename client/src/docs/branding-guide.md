# ProsumeAI Branding Guide for Developers

This guide explains how to use the ProsumeAI branding system to ensure consistent branding across the application.

## Overview

The branding system uses React Context to provide branding information throughout the application. This allows for easy updates to branding elements (app name, tagline, etc.) without having to modify individual components.

## Branding Provider

The BrandingProvider is located at `@/components/branding/branding-provider.tsx`. It fetches branding information from the server and makes it available via a React Context.

### Available Branding Properties

The branding context provides the following properties:

- `appName`: The name of the application (e.g., "ProsumeAI" or "ATScribe")
- `appTagline`: A short description of the application
- `footerText`: The text displayed in the footer (supports a {year} placeholder)
- `logoUrl`: URL to the application logo
- `faviconUrl`: URL to the favicon
- `primaryColor`: Primary brand color
- `secondaryColor`: Secondary brand color
- `tertiaryColor`: Tertiary brand color

## How to Use

### 1. Using the Branding Context in Components

Import the `useBranding` hook to access branding information in your components:

```tsx
import { useBranding } from '@/components/branding/branding-provider';

function MyComponent() {
  const branding = useBranding();
  
  return (
    <div>
      <h1>{branding.appName}</h1>
      <p>{branding.appTagline}</p>
    </div>
  );
}
```

### 2. Using Branding in Meta Tags (SEO)

For page titles, descriptions, and other SEO-related content:

```tsx
import Head from 'next/head';
import { useBranding } from '@/components/branding/branding-provider';

function MyPage() {
  const branding = useBranding();
  
  return (
    <>
      <Head>
        <title>{branding.appName} | My Page Title</title>
        <meta 
          name="description" 
          content={`${branding.appName} helps you create professional resumes and cover letters.`} 
        />
        <meta property="og:title" content={`${branding.appName} | My Page Title`} />
      </Head>
      
      {/* Page content */}
    </>
  );
}
```

### 3. Using Branding in URLs and Links

For email addresses, social media URLs, and other URLs:

```tsx
const branding = useBranding();

// For email addresses
<a href={`mailto:support@${branding.appName.toLowerCase()}.com`}>Contact Support</a>

// For website URLs
<a href={`https://${branding.appName.toLowerCase()}.com/about`}>About Us</a>
```

### 4. Using Branding for Dynamic Alternatives

You can use branding properties to conditionally render content:

```tsx
const branding = useBranding();

// Conditionally display different content based on the app name
{branding.appName === "ProsumeAI" ? (
  <p>Welcome to ProsumeAI!</p>
) : (
  <p>Welcome to our platform!</p>
)}
```

## Best Practices

1. **Always use branding context** for app name, tagline, and other brand elements instead of hardcoding them.

2. **Use template literals** to embed branding properties within larger strings.

3. **Check for null values** when the branding data is still loading:

```tsx
const branding = useBranding();

return (
  <div>
    {branding.appName ? (
      <h1>Welcome to {branding.appName}</h1>
    ) : (
      <h1>Loading...</h1>
    )}
  </div>
);
```

4. **Leverage component composition** for complex layouts:

```tsx
function PageHeader() {
  const branding = useBranding();
  
  return (
    <header>
      <img src={branding.logoUrl} alt={`${branding.appName} logo`} />
      <h1>{branding.appName}</h1>
    </header>
  );
}
```

## Adding New Branding Properties

If you need to add new branding properties:

1. Update the `BrandingData` interface in `branding-provider.tsx`
2. Update the default values in the provider component
3. Update the API endpoint to include the new property
4. Update the admin branding settings to include an input for the new property

## Debugging

If branding elements are not displaying correctly:

1. Check the network requests to ensure the branding data is being loaded correctly
2. Verify that the component is using the `useBranding` hook
3. Ensure the property you're accessing exists in the branding data
4. Check that the BrandingProvider is properly wrapping your application in `App.tsx`

## Example Implementation

Here's a complete example of a component using the branding system:

```tsx
import React from 'react';
import { useBranding } from '@/components/branding/branding-provider';

const HeroSection: React.FC = () => {
  const branding = useBranding();
  
  return (
    <section className="hero">
      <h1>Welcome to {branding.appName}</h1>
      <p>{branding.appTagline}</p>
      <a href={`mailto:info@${branding.appName.toLowerCase()}.com`}>Contact Us</a>
    </section>
  );
};

export default HeroSection;
```

## Conclusion

Using the branding system ensures consistency across the application and makes it easier to update branding elements in the future. Always use the branding context instead of hardcoding brand names, colors, or other brand elements in your components. 