import { coverLetterTemplateMetadata } from '@/templates/registerCoverLetterTemplates';
import { TemplateFactory } from '@/templates/core/TemplateFactory';
import { registerTemplates } from '@/templates/registerTemplates';
import { apiRequest } from '@/lib/queryClient';

/**
 * Get all available resume templates dynamically from TemplateFactory
 */
export function getAvailableResumeTemplates(): string[] {
  try {
    // Ensure templates are registered
    registerTemplates();
    
    // Get template factory instance
    const factory = TemplateFactory.getInstance();
    return factory.getRegisteredTypes();
  } catch (error) {
    console.error('Error getting available resume templates:', error);
    return [];
  }
}

/**
 * Get all available cover letter templates dynamically
 */
export function getAvailableCoverLetterTemplates(): string[] {
  return Object.keys(coverLetterTemplateMetadata);
}

/**
 * Handle template selection
 */
export function handleTemplateSelection(
  templateId: string,
  templateType: 'resume' | 'cover-letter',
  onSelect: (templateId: string) => void
): void {
  // All templates are accessible
  onSelect(templateId);
} 