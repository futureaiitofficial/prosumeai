# Adding Templates to ProsumeAI with Feature Flags

This document provides a step-by-step guide on how to add new resume and cover letter templates to ProsumeAI while properly integrating them with the feature management system.

## Table of Contents

- [Adding Templates to ProsumeAI with Feature Flags](#adding-templates-to-prosumeai-with-feature-flags)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Resume Templates](#resume-templates)
    - [1. Create the Template Implementation](#1-create-the-template-implementation)
    - [2. Register the Template](#2-register-the-template)
  - [Cover Letter Templates](#cover-letter-templates)
    - [1. Create the Template Implementation](#1-create-the-template-implementation-1)
    - [2. Register the Template](#2-register-the-template-1)
  - [Feature Flag Integration](#feature-flag-integration)
    - [1. Update Feature Flags in the Backend](#1-update-feature-flags-in-the-backend)
    - [2. Update Available Templates in Feature Management](#2-update-available-templates-in-feature-management)
  - [UI Integration](#ui-integration)
    - [1. Cover Letter Builder Updates](#1-cover-letter-builder-updates)
    - [2. Template Selection UI](#2-template-selection-ui)
  - [Template Assets](#template-assets)
  - [Testing Your Integration](#testing-your-integration)
  - [Naming Conventions](#naming-conventions)
  - [Troubleshooting](#troubleshooting)

## Overview

The template integration workflow follows these steps:

```
┌─ Template Implementation ─┐   ┌─ Template Registry ─┐   ┌─ Feature Management ─┐
│ - Code the template       │──▶│ - Register template │──▶│ - Create feature flag │
│ - Define metadata         │   │ - Export for use    │   │ - Set template IDs    │
└─────────────────────────────┘   └─────────────────────┘   └─────────────────────────┘
```

## Resume Templates

### 1. Create the Template Implementation

Create a new file in `client/src/templates/implementations/` with the naming pattern `[TemplateName]Template.tsx`:

```tsx
import React from 'react';
import { BaseTemplate } from '../core/BaseTemplate';
import { defaultCustomization } from '../config/defaultConfig';
import { type ResumeData } from '@/types/resume';
import { generatePDFFromReactElement } from '../utils/exportUtils';

// Define template metadata
const metadata = {
  id: 'your-template-id',           // Lowercase with hyphens
  name: 'Your Template Name',       // User-friendly name
  description: 'Template description with key features.',
  isAtsOptimized: true,             // Is it ATS-friendly?
  version: '1.0.0',
  thumbnail: '/templates/your-template-id.png',
  category: 'professional',         // Category (professional, creative, etc.)
  tags: ['tag1', 'tag2', 'tag3']    // Search/filter tags
};

export class YourTemplateNameTemplate extends BaseTemplate {
  constructor() {
    super(metadata, defaultCustomization);
  }

  renderPreview(data: ResumeData): JSX.Element {
    console.log("YourTemplateNameTemplate rendering with data:", data);
    const { colors, fonts } = this.customization;

    // Define your template styles
    const containerStyle: React.CSSProperties = {
      width: '210mm', // A4 width
      height: 'auto',
      maxWidth: '100%',
      backgroundColor: colors.background || '#ffffff',
      fontFamily: fonts.body || '"Times New Roman", serif',
      fontSize: '9pt',
      padding: '8mm',
      color: colors.text || '#000000',
      margin: '0 auto',
      boxSizing: 'border-box',
      lineHeight: '1.3',
      overflow: 'visible',
      position: 'relative'
    };

    // Implement your template layout
    return (
      <div style={containerStyle} className="resume-container">
        {/* Header section */}
        <div className="resume-header">
          <h1>{data.fullName}</h1>
          {/* Add other header elements */}
        </div>
        
        {/* Other sections like experience, education, skills, etc. */}
      </div>
    );
  }
}
```

### 2. Register the Template

Update `client/src/templates/registerTemplates.ts` to include your new template:

```tsx
import { TemplateFactory } from './core/TemplateFactory';
import { ProfessionalTemplate } from './implementations/ProfessionalTemplate';
import { ElegantDividerTemplate } from './implementations/ElegantDividerTemplate';
import { MinimalistAtsTemplate } from './implementations/MinimalistAtsTemplate';
import { YourTemplateNameTemplate } from './implementations/YourTemplateNameTemplate';  // Import your template

let registered = false;

export function registerTemplates(): TemplateFactory {
  if (registered) {
    console.log("Templates already registered, skipping");
    return;
  }

  console.log("Registering templates...");
  const factory = TemplateFactory.getInstance();

  // Register templates
  factory.registerTemplateType('professional', ProfessionalTemplate);
  factory.registerTemplateType('elegant-divider', ElegantDividerTemplate);
  factory.registerTemplateType('minimalist-ats', MinimalistAtsTemplate);
  factory.registerTemplateType('your-template-id', YourTemplateNameTemplate);  // Register your template
  
  // Create instances
  try {
    const professionalTemplate = factory.createTemplate('professional');
    const elegantDividerTemplate = factory.createTemplate('elegant-divider');
    const minimalistAtsTemplate = factory.createTemplate('minimalist-ats');
    const yourTemplate = factory.createTemplate('your-template-id');  // Create your template
    
    console.log("Templates registered:", factory.getRegisteredTypes());
  } catch (error) {
    console.error("Error creating templates:", error);
  }
  
  registered = true;
  return factory;
}
```

## Cover Letter Templates

### 1. Create the Template Implementation

Create a new file in `client/src/templates/implementations/cover-letter/[TemplateName]CoverLetter.tsx`:

```tsx
import React from "react";
import { CoverLetterTemplateProps } from "@/templates/types";

export const YourTemplateCoverLetter: React.FC<CoverLetterTemplateProps> = ({ 
  data, 
  customCss = "",
  setRef 
}) => {
  // Format date if provided, otherwise use current date
  const formattedDate = data.date || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get data with fallbacks
  const fullName = data.fullName || 'Your Name';
  const phone = data.phone || 'Phone Number';
  const email = data.email || 'Email Address';
  const address = data.address || 'City, State';
  const recipientName = data.recipientName || 'Hiring Manager';
  const companyName = data.companyName || 'Company Name';
  const content = data.content || 'Your cover letter content will appear here...';

  return (
    <div
      ref={setRef}
      className="cover-letter-your-template-name bg-white font-sans w-full"
    >
      <div className="px-10 py-10 max-w-[210mm] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-xl font-bold mb-1">{fullName}</h1>
          <div className="text-sm text-gray-700 space-y-0.5">
            <p>{email}</p>
            <p>{phone}</p>
            <p>{address}</p>
          </div>
          <div className="mt-4 text-sm text-gray-700">{formattedDate}</div>
        </header>

        {/* Recipient */}
        <section className="mb-8">
          <p className="font-medium">{recipientName}</p>
          <p>{companyName}</p>
        </section>

        {/* Content */}
        <section className="mb-8 whitespace-pre-wrap leading-relaxed">
          {content}
        </section>

        {/* Footer */}
        <footer>
          <p className="mb-6">Sincerely,</p>
          <p className="font-medium">{fullName}</p>
        </footer>
      </div>

      <style jsx global>{`
        ${customCss}
        
        @media print {
          .cover-letter-your-template-name {
            width: 210mm;
            height: 297mm;
            padding: 25mm 20mm;
          }
        }
      `}</style>
    </div>
  );
};

export default YourTemplateCoverLetter;
```

### 2. Register the Template

Update `client/src/templates/registerCoverLetterTemplates.ts` to include your new template:

```tsx
import { StandardCoverLetter } from './implementations/cover-letter/StandardCoverLetter';
import { ModernCoverLetter } from './implementations/cover-letter/ModernCoverLetter';
import { YourTemplateCoverLetter } from './implementations/cover-letter/YourTemplateCoverLetter'; // Import your template

// Template metadata
export const coverLetterTemplateMetadata = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Traditional cover letter format suitable for formal applications',
    premium: false,
    version: '1.0.0',
    thumbnail: '/templates/cl-standard.png',
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Modern design with contemporary styling for creative roles',
    premium: true,
    version: '1.0.0',
    thumbnail: '/templates/cl-modern.png',
  },
  'your-template-id': {  // Add your template metadata
    id: 'your-template-id',
    name: 'Your Template Name',
    description: 'Your template description',
    premium: true,  // Set to true if it's a premium template
    version: '1.0.0',
    thumbnail: '/templates/cl-your-template-id.png',
  }
};

// Mapping of template IDs to their component implementations
export const coverLetterTemplates = {
  standard: StandardCoverLetter,
  modern: ModernCoverLetter,
  'your-template-id': YourTemplateCoverLetter, // Register your template
};

// ... rest of file remains the same
```

## Feature Flag Integration

### 1. Update Feature Flags in the Backend

Edit `server/index.ts` to add your templates to the appropriate feature flag:

```typescript
// For a new resume template that's premium:
{
  name: "Premium Resume Templates",
  key: "resume_templates_premium",
  description: "Access to premium resume templates (Elegant Divider, Minimalist ATS, Your Template Name)",
  enabled: true,
  templateIds: ["elegant-divider", "minimalist-ats", "your-template-id"] // Add your template ID
}

// For a new cover letter template that's premium:
{
  name: "Premium Cover Letter Templates",
  key: "cover_letter_templates_premium",
  description: "Access to premium cover letter templates (Modern, Your Template Name)",
  enabled: true,
  templateIds: ["modern", "your-template-id"] // Add your template ID
}

// For a basic (free) template, add to the basic feature flag instead:
{
  name: "Professional Resume Template",
  key: "resume_templates_basic",
  description: "Access to the Professional resume template",
  enabled: true,
  templateIds: ["professional", "your-basic-template-id"] // Add your basic template ID
}
```

### 2. Update Available Templates in Feature Management

Update the `availableTemplates` array in `client/src/components/admin/feature-management.tsx`:

```typescript
// Define available templates
const availableTemplates: TemplateInfo[] = [
  // ... existing templates
  {
    id: 'your-template-id',
    name: 'Your Template Name',
    type: 'resume', // or 'cover-letter'
    premium: true,  // true for premium, false for basic
    description: 'Your template description here'
  }
];
```

## UI Integration

### 1. Cover Letter Builder Updates

If you've added a cover letter template, update the template previews in `client/src/pages/cover-letter-builder.tsx`:

```typescript
// Cover letter template previews
const templatePreviews = {
  standard: "Standard template with a clean, professional layout that works for most industries",
  modern: "Modern template with a contemporary design and styling for forward-thinking companies",
  'your-template-id': "Your template description here"
};
```

Also update the dynamic import section in the same file:

```typescript
// Dynamically import the selected template component
let TemplateComponent;
try {
  if (templateName === 'modern') {
    const module = await import('@/templates/implementations/cover-letter/ModernCoverLetter');
    TemplateComponent = module.default;
  } else if (templateName === 'your-template-id') {
    const module = await import('@/templates/implementations/cover-letter/YourTemplateCoverLetter');
    TemplateComponent = module.default;
  } else {
    // Default to standard
    const module = await import('@/templates/implementations/cover-letter/StandardCoverLetter');
    TemplateComponent = module.default;
  }
} catch (error) {
  console.error("Error importing template:", error);
  throw new Error(`Failed to load template: ${templateName}`);
}
```

### 2. Template Selection UI

Update the template selection dropdown in `client/src/pages/cover-letters.tsx`:

```tsx
<Select
  value={formData.template}
  onValueChange={handleSelectChange}
>
  <SelectTrigger>
    <SelectValue placeholder="Select template" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="standard">Standard</SelectItem>
    <SelectItem value="modern">Modern</SelectItem>
    <SelectItem value="your-template-id">Your Template Name</SelectItem>
  </SelectContent>
</Select>
```

## Template Assets

Create and add thumbnail images for your templates:

1. **For resume templates:**
   - Create a PNG image (recommended size: 600x400px)
   - Save to `public/templates/your-template-id.png`

2. **For cover letter templates:**
   - Create a PNG image (recommended size: 600x400px)
   - Save to `public/templates/cl-your-template-id.png`

Ensure the images are high quality but optimized for web to keep the bundle size reasonable.

## Testing Your Integration

1. **Test Template Rendering:**
   - Create a resume/cover letter using your template
   - Check that all sections display correctly
   - Verify responsive behavior

2. **Test Feature Flag Integration:**
   - Log in as a user with a free plan
   - Confirm they only see free templates
   - Log in as a user with a premium plan
   - Confirm they see both free and premium templates

3. **Test PDF Generation:**
   - Generate a PDF using your template
   - Check that the PDF renders correctly
   - Verify that all sections are properly laid out in the PDF

4. **Test Admin Interface:**
   - Go to the Feature Management in the admin panel
   - Verify your template appears in the available templates list
   - Test assigning the template to different plans

## Naming Conventions

Follow these naming conventions for consistency:

| Item | Convention | Example |
|------|------------|---------|
| Template ID | Lowercase with hyphens | `elegant-divider` |
| Template Class | PascalCase + "Template" | `ElegantDividerTemplate` |
| Cover Letter Component | PascalCase + "CoverLetter" | `ModernCoverLetter` |
| Feature Flag Key | Snake case with suffix | `resume_templates_premium` |
| Feature Name | Human-readable name | `Premium Resume Templates` |
| Template File | PascalCase with suffix | `ElegantDividerTemplate.tsx` |
| Cover Letter File | PascalCase with suffix | `ModernCoverLetter.tsx` |

## Troubleshooting

- **Template not appearing in selection**:
  - Verify the template is properly registered in the appropriate registry file
  - Check for console errors during registration
  - Ensure the template ID matches between registration and UI

- **Template not rendering correctly**:
  - Check browser console for rendering errors
  - Verify your template handles all required resume/cover letter fields
  - Test with sample data to ensure conditional rendering works

- **Feature flag issues**:
  - Confirm the template ID is added to the correct feature flag
  - Check that the feature flag is enabled
  - Verify that the user's plan has access to the feature flag

- **Templates not appearing in admin interface**:
  - Ensure the template is added to the `availableTemplates` array in feature-management.tsx
  - Check that the type ('resume' or 'cover-letter') is correct
  - Verify the premium flag matches your intended access level 