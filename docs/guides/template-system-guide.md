# ProsumeAI Template System Guide

## Overview

The ProsumeAI template system provides a flexible framework for managing resume and cover letter templates. This guide explains the current architecture, registration process, and how to create new templates based on the latest implementation.

## Architecture

The template system consists of several key components:

1. **Dual Base Class System** - Two different base template classes for compatibility
2. **Template Factory** - Central manager for template instantiation and registration
3. **Template Registration** - Centralized registration system for resume templates
4. **Cover Letter Templates** - Metadata-based system for cover letter templates
5. **Admin Dashboard** - Interface for managing active templates
6. **User Selection Interface** - Frontend template selection with previews

## Template Architecture

### Base Classes

The system currently uses two base template classes for backward compatibility:

#### 1. `BaseTemplate` (from `../core/BaseTemplate`)
- Used by newer templates (ElegantDividerTemplate, MinimalistAtsTemplate)
- Requires `metadata` property and `renderPreview` method
- More comprehensive interface with validation and ATS scoring

#### 2. `BaseTemplate` (from `../base/ResumeTemplate`)  
- Used by some templates (ProfessionalTemplate)
- Requires `name`, `description`, `preview` properties and `render` method
- Simpler interface focused on rendering

### Template Interface Requirements

For maximum compatibility, new templates should implement both interfaces:

```typescript
export class NewTemplate extends BaseTemplate {
  // Properties for base/ResumeTemplate compatibility
  name = 'Template Name';
  description = 'Template description';
  preview = '/templates/template-preview.png';

  // Metadata for core/BaseTemplate compatibility
  metadata = {
    id: 'template-id',
    name: 'Template Name',
    description: 'Template description',
    isAtsOptimized: true,
    version: '1.0.0',
    thumbnail: '/templates/template-preview.png',
    category: 'modern',
    tags: ['modern', 'clean', 'ats-friendly']
  };

  // Both render methods for compatibility
  render(data: ResumeData): JSX.Element {
    // Main implementation
  }

  renderPreview(data: ResumeData): JSX.Element {
    return this.render(data);
  }

  // Required interface methods
  async exportToPDF(data: ResumeData): Promise<Blob> { /* implementation */ }
  async exportToLaTeX(data: ResumeData): Promise<string> { /* implementation */ }
  async exportToHTML(data: ResumeData): Promise<string> { /* implementation */ }
  async exportToDOCX(data: ResumeData): Promise<Blob> { /* implementation */ }
  validate(data: ResumeData): any { /* implementation */ }
  getATSCompatibilityScore(data: ResumeData): number { /* implementation */ }
}
```

## Creating New Resume Templates

### Step 1: Create Template Implementation

Create your template file in `client/src/templates/implementations/`:

```typescript
// client/src/templates/implementations/YourTemplate.tsx
import React from 'react';
import { BaseTemplate } from '../base/ResumeTemplate';
import { type ResumeData } from '@/types/resume';
import { generatePDFFromReactElement } from '../utils/exportUtils';
import { renderSections } from '../core/sectionRenderer';

export class YourTemplate extends BaseTemplate {
  // Required properties for base/ResumeTemplate
  name = 'Your Template Name';
  description = 'A description of your template';
  preview = '/templates/your-template.png';

  // Required metadata for core/BaseTemplate compatibility
  metadata = {
    id: 'your-template',
    name: 'Your Template Name', 
    description: 'A description of your template',
    isAtsOptimized: true, // Set based on your template's ATS optimization
    version: '1.0.0',
    thumbnail: '/templates/your-template.png',
    category: 'modern', // or 'professional', 'creative', etc.
    tags: ['modern', 'clean', 'sidebar'] // relevant tags
  };

  constructor() {
    super();
    // Set customization to match base/ResumeTemplate interface
    this.customization = {
      colors: {
        primary: '#2563eb',
        secondary: '#475569', 
        text: '#1f2937',
        background: '#ffffff'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      },
      spacing: {
        margins: '1rem',
        lineHeight: 1.5,
        sectionSpacing: '1.5rem'
      }
    };
  }

  render(data: ResumeData): JSX.Element {
    const { colors, fonts } = this.customization;

    // Use proper A4 dimensions for PDF export
    const containerStyle: React.CSSProperties = {
      width: '210mm',   // A4 width
      height: '297mm',  // A4 height
      minHeight: '297mm',
      maxHeight: '297mm',
      backgroundColor: '#ffffff',
      fontFamily: fonts.body,
      fontSize: '9pt', // Compact font size
      padding: '0',
      color: colors.text,
      margin: '0',
      boxSizing: 'border-box',
      lineHeight: '1.3',
      overflow: 'hidden', // Prevent content overflow
      position: 'relative'
    };

    return (
      <div style={containerStyle} className="resume-container" data-template-id="your-template">
        {/* Your template implementation */}
        <div>
          <h1>{data.fullName}</h1>
          <h2>{data.targetJobTitle}</h2>
          
          {/* Use renderSections for proper section ordering */}
          {renderSections(data, {
            summary: () => data.summary ? (
              <section>
                <h3>Professional Summary</h3>
                <p>{data.summary}</p>
              </section>
            ) : null,
            
            workExperience: () => data.workExperience?.length ? (
              <section>
                <h3>Experience</h3>
                {data.workExperience.map((exp, index) => (
                  <div key={exp.id || index}>
                    <h4>{exp.position}</h4>
                    <p>{exp.company}</p>
                    {/* Handle other fields safely */}
                  </div>
                ))}
              </section>
            ) : null,
            
            // Include all required section handlers
            education: () => null, // Implementation
            skills: () => null,    // Implementation  
            projects: () => null,  // Implementation
            certifications: () => null // Implementation
          })}
        </div>
      </div>
    );
  }

  // Compatibility method for core/BaseTemplate
  renderPreview(data: ResumeData): JSX.Element {
    return this.render(data);
  }

  // Required export methods
  async exportToPDF(data: ResumeData): Promise<Blob> {
    try {
      const filename = `${data.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Format URLs and other data for PDF export
      const dataWithFormattedUrls = { ...data } as any;
      
      // Format LinkedIn URL for display
      if (dataWithFormattedUrls.linkedinUrl) {
        try {
          const url = new URL(dataWithFormattedUrls.linkedinUrl);
          let host = url.hostname.replace('www.', '');
          dataWithFormattedUrls.formattedLinkedinUrl = host + url.pathname;
        } catch (e) {
          dataWithFormattedUrls.formattedLinkedinUrl = dataWithFormattedUrls.linkedinUrl;
        }
      }
      
      const element = this.render(dataWithFormattedUrls);
      return await generatePDFFromReactElement(element, filename);
    } catch (error) {
      console.error("Error in exportToPDF:", error);
      throw error;
    }
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

  validate(data: ResumeData): any {
    return super.validate(data);
  }

  getATSCompatibilityScore(data: ResumeData): number {
    let score = 85; // Base score
    
    if (!data.fullName) score -= 10;
    if (!data.email) score -= 10;
    if (!data.phone) score -= 5;
    if (!data.summary) score -= 10;
    if (!data.workExperience?.length) score -= 15;
    if (!data.skills?.length && !data.technicalSkills?.length) score -= 10;
    
    return Math.max(0, score);
  }

  // Required for base/ResumeTemplate compatibility
  async export(data: ResumeData, format: 'pdf' | 'docx' | 'latex' | 'html'): Promise<Blob> {
    if (format === 'pdf') {
      return this.exportToPDF(data);
    }
    throw new Error(`Export format ${format} not implemented`);
  }
}
```

### Step 2: Register the Template

Update `client/src/templates/registerTemplates.ts`:

```typescript
import { YourTemplate } from './implementations/YourTemplate';

export function registerTemplates(): TemplateFactory {
  if (registered) {
    console.log("Templates already registered, skipping");
    return TemplateFactory.getInstance(); // Return instance instead of undefined
  }

  console.log("Registering templates...");
  const factory = TemplateFactory.getInstance();
  
  // Register existing templates
  factory.registerTemplateType('professional', ProfessionalTemplate);
  factory.registerTemplateType('elegant-divider', ElegantDividerTemplate);
  factory.registerTemplateType('minimalist-ats', MinimalistAtsTemplate);
  factory.registerTemplateType('modern-sidebar', ModernSidebarTemplate);
  
  // Register your new template
  factory.registerTemplateType('your-template', YourTemplate);
  
  // Create instances to ensure they work
  try {
    const yourTemplate = factory.createTemplate('your-template');
    if (yourTemplate) {
      yourTemplate.name = 'Your Template Name'; // Ensure name is set
    }
    
    console.log("Your template created:", !!yourTemplate);
  } catch (error) {
    console.error("Error creating your template:", error);
  }
  
  registered = true;
  return factory;
}
```

## Best Practices for Template Development

### 1. ATS Optimization
- Use semantic HTML structure
- Avoid fancy styling that might confuse ATS systems
- Use plain text for skills (avoid colored tags)
- Maintain proper heading hierarchy (h1, h2, h3)
- Keep fonts simple and readable

### 2. Responsive Design
- Use A4 dimensions (`210mm x 297mm`) for PDF compatibility
- Set `overflow: hidden` to prevent content from exceeding page boundaries
- Use compact font sizes (9pt base) to fit more content
- Implement proper line heights and spacing

### 3. Content Organization
- Use `renderSections` to respect user's section ordering preferences
- Handle missing/optional data gracefully with conditional rendering
- Provide fallbacks for undefined properties
- Limit content in sidebars to prevent overflow
- **Ensure field name consistency** between forms and templates

#### Common Data Field Names:
**Publications:**
- `title` - Publication title
- `publisher` - Publisher/Journal name  
- `authors` - Authors (string or array)
- `publicationDate` - Publication date
- `url` - URL/DOI link
- `description` - Publication description/abstract

### 4. Type Safety
- Use `(data as any)` for accessing dynamic properties like `formattedLinkedinUrl`
- Handle optional array lengths safely: `(array?.length || 0) > 0`
- Check for existence before accessing nested properties
- **Handle array fields safely**: Use `Array.isArray(field) ? field.join(', ') : field` for fields that might be arrays or strings
- **Example**: `{Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors}` instead of `{pub.authors.join(', ')}`

### 5. Error Handling
- Wrap template rendering in try-catch blocks
- Provide meaningful error messages
- Gracefully handle missing template dependencies

## Template Preview Generation

Templates should include proper preview images:

1. **Create Preview Images**: Place preview images in `/public/images/templates/`
2. **Naming Convention**: Use `preview-{template-id}.png`
3. **Dimensions**: Recommended size is 400x600px (A4 aspect ratio)
4. **Quality**: Use high-quality images for better user experience

## Cover Letter Templates

Cover letter templates use a simpler metadata-based system:

```typescript
// client/src/templates/registerCoverLetterTemplates.ts
export const coverLetterTemplateMetadata = {
  'your-cover-letter': {
    id: 'your-cover-letter',
    name: 'Your Cover Letter',
    description: 'Description of your cover letter template',
    premium: false,
    version: '1.0.0',
    thumbnail: '/templates/cl-your-template.png',
    component: YourCoverLetterComponent
  }
};
```

## Admin Management

Templates are managed through the admin dashboard at `/admin/templates`:

1. **Activation**: New templates must be activated to appear in user selection
2. **Preview Management**: Upload preview images through the admin interface
3. **Usage Tracking**: Monitor template selection and usage statistics
4. **Metadata Editing**: Update template descriptions and settings

## Database Integration

Active templates are stored in the database with:
- `id`: Template identifier
- `name`: Display name
- `description`: Template description  
- `thumbnail`: Preview image URL
- `isActive`: Availability to users
- `type`: 'resume' or 'cover-letter'

## Testing Your Template

1. **Registration Test**: Verify template appears in factory registration logs
2. **Selection Test**: Check template appears in user template selection
3. **Rendering Test**: Ensure template renders correctly with sample data
4. **PDF Export Test**: Verify PDF generation works properly
5. **ATS Test**: Validate ATS-friendly structure and formatting

## Troubleshooting

### Template Not Appearing
- Check template registration in `registerTemplates.ts`
- Verify template constructor doesn't throw errors
- Ensure template has required properties and methods

### Rendering Issues
- Check for TypeScript errors in the console
- Verify all data properties are handled safely
- Ensure proper CSS units and A4 dimensions

### PDF Export Problems
- Check `generatePDFFromReactElement` import
- Verify container dimensions are set correctly
- Ensure no content overflows page boundaries

### TypeScript Errors
- Implement all required interface methods
- Use proper type assertions for dynamic properties
- Handle optional properties with safe checks

### Runtime Errors
- **"join is not a function"**: Occurs when trying to call `.join()` on non-array data
  - **Fix**: Use `Array.isArray(field) ? field.join(', ') : field`
  - **Common fields**: authors, skills, technologies, tags
  - **Root cause**: Data comes from different sources (user input, API) in varying formats

## Security Considerations

- Admin template management is protected by authentication
- Template code is executed client-side, so validate all user inputs
- Preview images should be validated for type and size
- Template activation requires admin privileges

This guide reflects the current template system architecture and should be updated as the system evolves.

## Template Registration and Management Flow

ProsumeAI uses a **dual-system architecture** where templates exist both as **code classes** (for rendering) and **database records** (for management). This section explains the complete flow from development to user selection.

### 1. 🛠️ Template Registration (Code Level)

Templates are registered through a two-step process:

#### Step A: Code Registration
```typescript
// client/src/templates/registerTemplates.ts
export function registerTemplates(): TemplateFactory {
  const factory = TemplateFactory.getInstance();
  
  // Register template classes with factory
  factory.registerTemplateType('professional', ProfessionalTemplate);
  factory.registerTemplateType('modern-sidebar', ModernSidebarTemplate);
  factory.registerTemplateType('minimalist-ats', MinimalistAtsTemplate);
  
  // Create instances to validate they work
  const modernSidebarTemplate = factory.createTemplate('modern-sidebar');
  
  return factory;
}
```

This registers the **template classes** with the `TemplateFactory` for client-side rendering.

#### Step B: Database Schema
Templates are stored in PostgreSQL tables:

```sql
-- Resume Templates Table
CREATE TABLE resume_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,                    -- Display name
  description TEXT DEFAULT '' NOT NULL,  -- Description
  content TEXT NOT NULL,                 -- Template content/HTML
  thumbnail TEXT DEFAULT '' NOT NULL,    -- Preview image path
  is_default BOOLEAN DEFAULT FALSE,      -- Is default template
  is_active BOOLEAN DEFAULT TRUE,        -- Available to users
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cover Letter Templates Table (same structure)
CREATE TABLE cover_letter_templates (
  -- Same fields as resume_templates
);
```

### 2. 🔄 Database Synchronization Process

#### Automatic Template Initialization
When an admin visits the templates page, the system automatically syncs code templates with the database:

```typescript
// client/src/components/admin/templates-overview.tsx
const ensureTemplatesMutation = useMutation({
  mutationFn: async () => {
    // Get registered templates from TemplateFactory
    const { resumeTemplates, coverLetterTemplates } = getRegisteredTemplateTypes();
    
    // Prepare template data for database
    const defaultTemplates = [
      ...resumeTemplates.map(templateId => {
        const factory = TemplateFactory.getInstance();
        const template = factory.getTemplate(templateId);
        return {
          name: template.metadata?.name || templateId,
          description: template.metadata?.description || "",
          category: "resume",
          content: "" // Content stored separately
        };
      })
    ];
    
    // Call API to ensure these templates exist in database
    await fetch('/api/admin/templates/ensure', {
      method: 'POST',
      body: JSON.stringify({ templates: defaultTemplates })
    });
  }
});
```

#### API Endpoint for Database Sync
```typescript
// server/src/routes/template-routes.ts
app.post("/api/admin/templates/ensure", requireAdmin, async (req, res) => {
  const { templates } = req.body;
  
  for (const template of templates) {
    // Check if template already exists in database
    const existingTemplate = await db
      .select()
      .from(resumeTemplates)
      .where(eq(resumeTemplates.name, template.name));
    
    if (!existingTemplate.length) {
      // Create new database record
      await db.insert(resumeTemplates).values({
        name: template.name,
        description: template.description,
        content: template.content,
        thumbnail: "",
        isDefault: false,
        isActive: true
      });
    }
  }
});
```

### 3. 👨‍💼 Admin Template Management

#### Admin Dashboard Features
The admin can manage templates through `/admin/templates`:

**Key Admin Capabilities:**

1. **Template Activation/Deactivation**
   ```typescript
   app.post("/api/admin/templates/:id/toggle-visibility", requireAdmin, async (req, res) => {
     const { isActive } = req.body;
     
     await db
       .update(resumeTemplates)
       .set({ isActive })
       .where(eq(resumeTemplates.id, templateId));
   });
   ```

2. **Preview Image Management**
   - Upload images to `/public/images/templates/`
   - Associate images with template records
   - Images are served via `/api/templates/images`

3. **Template Metadata Editing**
   - Edit names, descriptions
   - Set default templates
   - Monitor usage statistics (download counts)

4. **Template Status Overview**
   - View active/inactive status
   - See creation/update dates
   - Track usage metrics

#### Admin UI Components
```typescript
// client/src/components/admin/templates-overview.tsx
export function TemplatesOverview() {
  // Fetch all templates from database
  const { data: serverTemplates } = useQuery({
    queryKey: ["/api/admin/templates"],
    queryFn: async () => {
      const res = await fetch('/api/admin/templates');
      return res.json();
    }
  });

  // Handle template activation/deactivation
  const handleToggleActiveStatus = async (template) => {
    await fetch(`/api/admin/templates/${template.id}/toggle-visibility`, {
      method: 'POST',
      body: JSON.stringify({ 
        isActive: !template.isActive,
        type: template.type 
      })
    });
  };
}
```

### 4. 👥 User Template Selection

#### Public Template Access
Users see templates through the template selector:

```typescript
// client/src/components/templates/TemplateSelector.tsx
const getResumeTemplates = (): TemplateInfo[] => {
  // Get templates from TemplateFactory (code registration)
  registerTemplates();
  const factory = TemplateFactory.getInstance();
  const registeredTypes = factory.getRegisteredTypes();
  
  return registeredTypes.map(templateId => {
    const template = factory.getTemplate(templateId);
    return {
      id: templateId,
      name: template.metadata?.name,
      description: template.metadata?.description,
      preview: `/images/templates/preview-${templateId}.png`
    };
  });
};
```

#### Active Templates API
```typescript
// server/src/routes/template-routes.ts
app.get("/api/templates/active", async (req, res) => {
  // Get only active templates from database
  const activeTemplates = await db
    .select()
    .from(resumeTemplates)
    .where(eq(resumeTemplates.isActive, true));
    
  res.json(activeTemplates);
});
```

### 5. 🔄 Complete Flow Summary

```
Developer Creates Template Class
              ↓
Register in registerTemplates.ts
              ↓
TemplateFactory Registration
              ↓
Admin Visits Templates Page
              ↓
Auto-sync to Database
              ↓
Database Records Created
              ↓
Admin Can Manage Templates
        ↓         ↓         ↓
  Activate/   Upload      Edit
  Deactivate  Preview    Metadata
              ↓
Active Templates Available to Users
              ↓
Users Select Templates
              ↓
Template Renders from Code
```

### 6. 🔑 Key Architecture Points

1. **Dual System**: Templates exist both as **code classes** (for rendering) and **database records** (for management)

2. **Admin Controls Visibility**: Only admin-activated templates appear to users

3. **Automatic Sync**: The system automatically creates database records for code-registered templates

4. **Preview Management**: Admins upload and manage template preview images

5. **Usage Tracking**: Database tracks download counts and usage statistics

6. **Type Safety**: Templates must implement proper interfaces and be registered correctly

### 7. 📋 Template Lifecycle

**Development Phase:**
- Developer creates template class
- Implements required interfaces
- Registers in `registerTemplates.ts`
- Tests locally

**Deployment Phase:**
- Code deployed to server
- Admin visits template management page
- Auto-sync creates database records
- Admin uploads preview images

**Production Phase:**
- Admin activates template
- Template becomes available to users
- Users can select and use template
- Usage metrics are tracked

This architecture allows developers to create templates in code while giving admins full control over which templates users can access, along with comprehensive management capabilities. 