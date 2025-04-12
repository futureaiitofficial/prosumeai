# Template System Documentation

This document provides a comprehensive guide on how to create, customize, and register new resume templates in the ProsumeAI system.

## Table of Contents

- [Template System Documentation](#template-system-documentation)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [File Structure](#file-structure)
  - [Creating a New Template](#creating-a-new-template)
  - [Template Customization](#template-customization)
  - [Registering Templates](#registering-templates)
  - [Preview Integration](#preview-integration)
    - [Styling Best Practices](#styling-best-practices)
  - [Export Methods](#export-methods)
  - [Troubleshooting](#troubleshooting)
    - [Template Not Appearing in Selection](#template-not-appearing-in-selection)
    - [Template Rendering Issues](#template-rendering-issues)
    - [Preview Scaling Issues](#preview-scaling-issues)
  - [Summary](#summary)

## Overview

The template system is built using a class-based architecture where each template extends a `BaseTemplate` class. This approach provides consistency across templates while allowing for customization. Templates are registered with a factory pattern that manages their creation and access.

## File Structure

```
client/src/templates/
├── core/                  # Core template system
│   ├── BaseTemplate.ts    # Base class for all templates
│   ├── TemplateFactory.ts # Factory for creating templates
│   └── types.ts           # Type definitions for the template system
├── config/
│   └── defaultConfig.ts   # Default customization options and metadata
├── implementations/       # Template implementations
│   ├── ModernTemplate.tsx # Modern template implementation
│   └── ProfessionalTemplate.tsx # Professional template implementation
├── services/              # Template-related services
└── registerTemplates.ts   # Registry for all templates
```

## Creating a New Template

To create a new template, follow these steps:

1. Create a new file in `client/src/templates/implementations/` (e.g., `MinimalistTemplate.tsx`)
2. Extend the `BaseTemplate` class
3. Implement the required methods, including `renderPreview` and export methods

Here's a skeleton example:

```tsx
import React from 'react';
import { BaseTemplate } from '../core/BaseTemplate';
import { minimalistCustomization } from '../config/defaultConfig';
import { type ResumeData } from '@/types/resume';

// Define metadata for the template
const metadata = {
  id: 'minimalist',
  name: 'Minimalist',
  description: 'A clean, minimalist template with elegant typography.',
  isAtsOptimized: true,
  version: '1.0.0',
  thumbnail: '/templates/minimalist.png',
  category: 'professional',
  tags: ['minimalist', 'clean', 'simple']
};

export class MinimalistTemplate extends BaseTemplate {
  constructor() {
    super(metadata, minimalistCustomization);
  }

  renderPreview(data: ResumeData): JSX.Element {
    const { colors, fonts, spacing, layout } = this.customization;

    // Define your styles
    const containerStyle: React.CSSProperties = {
      width: '210mm', // A4 width
      minHeight: '297mm', // A4 height
      maxWidth: '100%',
      backgroundColor: colors.background,
      fontFamily: fonts.body,
      fontSize: '10pt',
      padding: spacing.sectionGap,
      color: colors.text,
      height: '100%',
      margin: '0 auto',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      boxSizing: 'border-box'
    };

    // Main template rendering code
    return (
      <div style={containerStyle}>
        {/* Template content goes here */}
        {/* ... */}
      </div>
    );
  }

  // Implement export methods - these will be implemented later
  async exportToPDF(data: ResumeData): Promise<Blob> {
    throw new Error('PDF export not implemented');
  }

  async exportToLaTeX(data: ResumeData): Promise<string> {
    throw new Error('LaTeX export not implemented');
  }

  async exportToHTML(data: ResumeData): Promise<string> {
    throw new Error('HTML export not implemented');
  }

  async exportToDOCX(data: ResumeData): Promise<Blob> {
    throw new Error('DOCX export not implemented');
  }
}
```

## Template Customization

All templates should use customization options defined in `client/src/templates/config/defaultConfig.ts`. To add customization for a new template:

1. Edit `defaultConfig.ts` to add your template's customization

```typescript
export const minimalistCustomization: TemplateCustomization = {
  ...defaultCustomization,
  colors: {
    ...defaultCustomization.colors,
    primary: '#18181b',   // Zinc dark
    secondary: '#71717a', // Zinc medium
    accent: '#a1a1aa'     // Zinc light
  },
  fonts: {
    heading: 'Helvetica',
    body: 'Helvetica'
  },
  layout: {
    ...defaultCustomization.layout,
    sidebar: 'none'
  }
};

// Add template metadata to the templateMetadata object
export const templateMetadata = {
  // ... existing templates
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'A simple and clean design focusing on essential information',
    version: '1.0.0',
    thumbnail: '/templates/minimalist-preview.png',
    isDefault: false,
    category: 'simple',
    tags: ['minimal', 'clean', 'simple'],
    isAtsOptimized: true
  },
  // ...
};
```

## Registering Templates

After creating a template, you need to register it with the template factory:

1. Open `client/src/templates/registerTemplates.ts`
2. Import your new template
3. Register it with the factory

```typescript
import { TemplateFactory } from './core/TemplateFactory';
import { ModernTemplate } from './implementations/ModernTemplate';
import { ProfessionalTemplate } from './implementations/ProfessionalTemplate';
import { MinimalistTemplate } from './implementations/MinimalistTemplate';
// Import other templates as they are created

let registered = false;

export function registerTemplates() {
  if (registered) {
    console.log("Templates already registered, skipping");
    return;
  }

  console.log("Registering templates...");
  const factory = TemplateFactory.getInstance();

  // Register templates
  factory.registerTemplateType('modern', ModernTemplate);
  factory.registerTemplateType('professional', ProfessionalTemplate);
  factory.registerTemplateType('minimalist', MinimalistTemplate);
  // Register other templates as implemented
  
  // Create instances of each template to ensure they're ready
  try {
    const modernTemplate = factory.createTemplate('modern');
    const professionalTemplate = factory.createTemplate('professional');
    const minimalistTemplate = factory.createTemplate('minimalist');
    
    console.log("Templates registered:", factory.getRegisteredTypes());
  } catch (error) {
    console.error("Error creating templates:", error);
  }
  
  registered = true;
}
```

## Preview Integration

Templates should be designed to work in both the full resume preview and the smaller template selection thumbnails. Key considerations:

1. Use proper A4 dimensions (210mm × 297mm)
2. Center content and use responsive layouts
3. Include proper scaling for template selection

### Styling Best Practices

- Use `React.CSSProperties` for inline styling
- Apply `margin: '0 auto'` to center templates
- Set proper font sizes and line heights
- Use flexbox for layout
- Include appropriate padding and spacing

## Export Methods

Each template must implement these export methods:

1. `exportToPDF`: Export the resume as a PDF file
2. `exportToLaTeX`: Export the resume as LaTeX code
3. `exportToHTML`: Export the resume as HTML code
4. `exportToDOCX`: Export the resume as a Word document

These methods will be implemented later as more export functionality is added.

## Troubleshooting

### Template Not Appearing in Selection

- Check if the template is properly registered in `registerTemplates.ts`
- Verify the template constructor is correctly passing metadata
- Check the browser console for any errors

### Template Rendering Issues

- Ensure all required elements in the resume data are handled with conditional rendering
- Check that styles are properly applied with correct units
- Verify that the template fits within the container dimensions
- Use `console.log` to debug rendering issues

### Preview Scaling Issues

- Adjust the scale factor in template selection if the preview is too large/small
- Ensure proper centering with flexbox
- Check that all container sizes use appropriate units

## Summary

Creating and integrating a new template involves:
1. Creating a new template class that extends `BaseTemplate`
2. Defining template styles and customization options
3. Implementing the `renderPreview` method
4. Adding customization options to `defaultConfig.ts`
5. Registering the template in `registerTemplates.ts`

Following these steps ensures that templates are consistently implemented and properly integrated into the application. 