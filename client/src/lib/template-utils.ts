import { coverLetterTemplateMetadata } from '@/templates/registerCoverLetterTemplates';
import { TemplateFactory } from '@/templates/core/TemplateFactory';
import { apiRequest } from '@/lib/queryClient';

// All available resume templates
const RESUME_TEMPLATES = [
  'professional',
  'elegant-divider',
  'minimalist-ats'
];

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