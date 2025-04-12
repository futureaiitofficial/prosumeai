import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TemplateFactory } from '@/templates/core/TemplateFactory';
import { templateRegistry } from '@/templates/base/TemplateRegistry';

/**
 * Hook to manage template access and availability
 */
export function useTemplates(type: 'resume' | 'cover-letter' = 'resume') {
  const [loading, setLoading] = useState(true);

  // Get all available templates from the registry
  const registeredTemplates = type === 'resume' 
    ? TemplateFactory.getInstance().getRegisteredTypes()
    : Object.keys(templateRegistry.getAll());
    
  // Query for active templates from the API
  const { data: activeTemplatesData, isLoading: isActiveTemplatesLoading } = useQuery({
    queryKey: ['/api/templates/active'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/templates/active');
        if (!response.ok) {
          throw new Error('Failed to fetch active templates');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching active templates:', error);
        return { resumeTemplates: [], coverLetterTemplates: [] };
      }
    }
  });
  
  // Extract active template IDs based on type
  const activeTemplates = type === 'resume'
    ? activeTemplatesData?.resumeTemplates || []
    : activeTemplatesData?.coverLetterTemplates || [];
    
  // Map active templates to their IDs for easier lookup
  const activeTemplateIds = activeTemplates.map((template: any) => template.id.toString());
  
  // Filter available templates based on active status
  const availableTemplates = registeredTemplates.filter(templateId => {
    // If we don't have active templates data yet, show all templates
    if (isActiveTemplatesLoading) return true;
    
    // If we have active templates data, filter by active status
    // Check if the template appears in our active templates by ID
    return activeTemplateIds.includes(templateId);
  });

  useEffect(() => {
    // Initialize templates if needed
    if (type === 'resume') {
      TemplateFactory.getInstance().getRegisteredTypes().forEach(templateType => {
        TemplateFactory.getInstance().getTemplate(templateType);
      });
    }
    
    setLoading(false);
  }, [type]);

  /**
   * Check if a template is available for the current user
   */
  const canUseTemplate = (templateId: string): boolean => {
    return availableTemplates.includes(templateId);
  };

  /**
   * Get all available templates
   */
  const getAvailableTemplates = (): string[] => {
    return availableTemplates;
  };

  return {
    canUseTemplate,
    getAvailableTemplates,
    availableTemplates,
    allRegisteredTemplates: registeredTemplates,
    loading: loading || isActiveTemplatesLoading
  };
} 