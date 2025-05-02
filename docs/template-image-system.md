# Template Image System Documentation

## Overview

This document explains how template images are managed in the ATScribe system. It covers the relationship between templates and their images, how images are stored, displayed, and the troubleshooting steps for common issues.

## System Architecture

The template image system consists of these key components:

1. **Database Records** - Templates stored in the database with `thumbnail` fields referencing image paths
2. **File System Storage** - Image files stored in the `public/images/templates` directory
3. **Admin Interface** - UI for uploading and managing template images
4. **Public API** - Endpoints for retrieving template images for display in the app
5. **Template Factory** - Frontend component that renders templates using the images

## How Images Are Stored and Referenced

### Storage Location

Template images are stored in the file system at:
```
/public/images/templates/
```

### Database References

Each template record in the database contains a `thumbnail` field that stores the path to the image:
```json
{
  "id": 1,
  "name": "Professional",
  "thumbnail": "/images/templates/template-1-1234567890.png",
  "isActive": true,
  // other fields...
}
```

## API Endpoints

### Admin Endpoints

- `GET /api/admin/templates/images` - List all template images
- `POST /api/admin/templates/:id/image` - Upload an image for a template
- `DELETE /api/admin/templates/images/:filename` - Delete a template image
- `GET /api/debug/template-images` - Utility to automatically repair template-image associations

### Public Endpoints

- `GET /api/templates/images` - Get images for active templates
- `GET /api/templates/active` - Get all active templates including thumbnail references

## Image-Template Association Process

1. **Upload Process**:
   - User uploads an image through the admin interface
   - Image is saved to the file system with a unique filename
   - The template's `thumbnail` field is updated with the path to the image

2. **Retrieval Process**:
   - Frontend requests active templates via `/api/templates/active`
   - Frontend requests template images via `/api/templates/images`
   - The template selection component matches templates with their images

3. **Matching Logic**:
   - Primary matching: Direct path comparison between template.thumbnail and image path
   - Secondary matching: Template name or ID pattern matching with image filename
   - Fallback: Images can be manually assigned through the admin interface

## Key Requirements

For template images to display correctly:

1. The template must be marked as **active** in the database
2. The template must have a valid `thumbnail` value that points to an existing image
3. The image file must exist in the `/public/images/templates/` directory
4. The template must be registered in the template factory (for frontend rendering)

## Troubleshooting

### Common Issues

1. **Images not appearing in the frontend**:
   - Verify the template is active in the database
   - Check if the template has a valid thumbnail path
   - Ensure the image file exists in the correct location

2. **Images visible in admin but not in the application**:
   - The public API endpoint filters images to only show those for active templates
   - Check that templates are active and have valid thumbnail paths

### Repair Tools

The system includes several tools to repair template-image associations:

1. **Browser-based repair**:
   - In the admin panel, use the "Repair Associations" button to match templates with images

2. **Server-side repair**:
   - Use the "Server Repair" button to trigger the `/api/debug/template-images` endpoint
   - This scans all templates and images and updates database records automatically

3. **Manual assignment**:
   - Edit a template and manually select an image from the dropdown
   - This directly updates the template's thumbnail in the database

## Template Naming Conventions

For automatic image-template association to work efficiently:

1. **Template IDs**: Each template has a unique ID in the database
2. **Image Filenames**: Should include one of these patterns:
   - The template name in kebab case (e.g., `professional-template.png`)
   - The template ID (e.g., `template-1.png`)
   - Type and ID (e.g., `resume-1.png` or `cl-2.png`)

## Debug Mode

In non-production environments, you can add `?debug=true` to the `/api/templates/images` endpoint to return all images regardless of template association status. This is helpful for development and debugging.

## Code References

### Key Files

- `server/src/routes/template-routes.ts` - API endpoints for templates and images
- `server/src/routes/admin-routes.ts` - Admin API endpoints for image upload
- `client/src/components/admin/templates-overview.tsx` - Admin UI for template management
- `client/src/components/resume-builder/template-selection.tsx` - Frontend template selection

### Critical Functions

- `getTemplatePreviewUrl()` in template-selection.tsx - Matches templates with images
- `updateTemplateThumbnail()` in templates-overview.tsx - Updates template records with image paths
- `/api/templates/images` endpoint - Filters and returns template images for the frontend

## Best Practices

1. **Naming Images**: Use consistent naming that includes the template name or ID
2. **Activating Templates**: Always ensure templates are marked as active
3. **Image Updates**: After uploading new images, use the repair tools to ensure associations
4. **Testing**: After making changes, test in both admin and user interfaces to verify visibility 