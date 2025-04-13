# ProsumeAI Template System Guide

## Overview

The ProsumeAI template system provides a flexible framework for managing resume and cover letter templates. This guide explains the architecture, registration process, and how to create new templates.

## Architecture

The template system consists of several key components:

1. **Template Registration** - Separate mechanisms for resume and cover letter templates
2. **Template Factory** - Central manager for template instantiation
3. **Admin Dashboard** - Interface for managing templates
4. **User Selection Interface** - Frontend for users to select templates

## Template Registration

### Resume Templates

Resume templates are registered through `TemplateFactory` in `registerTemplates.ts`:

```typescript
export function registerTemplates(): TemplateFactory {
  const factory = TemplateFactory.getInstance();
  
  // Register templates
  factory.registerTemplateType('professional', ProfessionalTemplate);
  factory.registerTemplateType('elegant-divider', ElegantDividerTemplate);
  factory.registerTemplateType('minimalist-ats', MinimalistAtsTemplate);
  
  // Create instances (validation)
  const professionalTemplate = factory.createTemplate('professional');
  // ...
}
```

### Cover Letter Templates

Cover letter templates use a metadata-based registry in `registerCoverLetterTemplates.ts`:

```typescript
export const coverLetterTemplateMetadata = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Traditional cover letter format...',
    premium: false,
    version: '1.0.0',
    thumbnail: '/templates/cl-standard.png',
    component: StandardCoverLetter
  },
  // Additional templates...
};
```

## Admin Management

Templates are managed through the admin dashboard (`templates-overview.tsx`), which allows:

- Activating/deactivating templates
- Managing preview images
- Editing template metadata
- Viewing template usage statistics

The dashboard interfaces with backend APIs:
- `/api/admin/templates` - Template management
- `/api/templates/images` - Template preview image management
- `/api/templates/active` - Active template management

## Creating New Templates

### Step 1: Create Template Implementation

#### For Resume Templates:

```typescript
// src/templates/implementations/NewTemplate.tsx
import { AbstractTemplate } from '../core/AbstractTemplate';
import { ResumeData } from '@/types/resume';

export class NewTemplate extends AbstractTemplate {
  public metadata = {
    name: 'New Template',
    description: 'Description of the template',
    isAtsOptimized: true // Set to true if optimized for ATS systems
  };

  public render(data: ResumeData): JSX.Element {
    return (
      <div className="resume-template">
        {/* Template implementation */}
      </div>
    );
  }
}
```

#### For Cover Letter Templates:

```typescript
// src/templates/implementations/cover-letter/NewCoverLetter.tsx
import React from 'react';
import { CoverLetterData } from '@/types/cover-letter';

export function NewCoverLetter({ data }: { data: CoverLetterData }): JSX.Element {
  return (
    <div className="cover-letter-template">
      {/* Template implementation */}
    </div>
  );
}
```

### Step 2: Register the Template

#### For Resume Templates:

Update `src/templates/registerTemplates.ts`:

```typescript
import { NewTemplate } from './implementations/NewTemplate';

export function registerTemplates(): TemplateFactory {
  // Existing code...
  factory.registerTemplateType('new-template-id', NewTemplate);
  // ...
}
```

#### For Cover Letter Templates:

Update `src/templates/registerCoverLetterTemplates.ts`:

```typescript
import { NewCoverLetter } from './implementations/cover-letter/NewCoverLetter';

export const coverLetterTemplateMetadata = {
  // Existing templates...
  newTemplate: {
    id: 'new-template-id',
    name: 'New Template',
    description: 'Description of the new cover letter template',
    premium: false,
    version: '1.0.0',
    thumbnail: '/templates/cl-new-template.png',
    component: NewCoverLetter
  }
};

export const coverLetterTemplates = {
  // Existing templates...
  'new-template-id': NewCoverLetter
};
```

### Step 3: Activate in Admin Dashboard

Once the code is deployed:

1. Navigate to the admin dashboard
2. Select the Templates tab
3. Find your new template
4. Click "Activate" to make it available to users
5. Upload a preview image for the template

## User Template Selection

The `template-selection.tsx` component handles the user-facing selection process. It:

1. Fetches active templates from the server
2. Displays template previews with metadata
3. Handles template selection

## Database Schema

Templates are stored in the database with the following structure:

- `id`: Unique identifier
- `name`: Template display name
- `description`: Template description
- `content`: Template content (if applicable)
- `thumbnail`: URL to preview image
- `isDefault`: Boolean indicating if template is default
- `isActive`: Boolean indicating if template is available to users
- `type`: Template type (resume or cover-letter)

## Security

The admin interface is protected by `AdminRoute`, which verifies admin status before rendering the template management UI:

```typescript
export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { isAdmin, isLoading } = useAdmin();

  if (!isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return <Route path={path} component={Component} />;
}
``` 