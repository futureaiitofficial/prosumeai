import { coverLetterTemplateMetadata } from '@/templates/registerCoverLetterTemplates';
import { TemplateFactory } from '@/templates/core/TemplateFactory';
import { featureAccessModal } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';

// Premium resume templates - now empty as all templates are free
const PREMIUM_RESUME_TEMPLATES: string[] = [];

// Basic resume templates - now includes all templates
const BASIC_RESUME_TEMPLATES = [
  'professional',
  'elegant-divider',
  'minimalist-ats'
];

/**
 * Check if a resume template is premium
 */
export function isResumeTemplatePremium(templateId: string): boolean {
  // All templates are now free
  return false;
}

/**
 * Check if a cover letter template is premium
 */
export function isCoverLetterTemplatePremium(templateId: string): boolean {
  // All templates are now free
  return false;
}

/**
 * Check if user has access to a specific template based on their subscription
 */
export function checkTemplateAccess(
  templateId: string, 
  templateType: 'resume' | 'cover-letter',
  hasFeatureAccess: boolean
): boolean {
  // All templates are now freely accessible
  return true;
}

/**
 * Check template access using the API
 */
export async function checkTemplateAccessAPI(
  templateId: string,
  templateType: 'resume' | 'cover-letter'
): Promise<boolean> {
  // All templates are now freely accessible
  return true;
}

/**
 * Handle template selection with access check
 */
export function handleTemplateSelection(
  templateId: string,
  templateType: 'resume' | 'cover-letter',
  hasFeatureAccess: boolean,
  onSelect: (templateId: string) => void
): void {
  // No premium check needed anymore, all templates are accessible
  onSelect(templateId);
} 