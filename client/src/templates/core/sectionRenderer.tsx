import React from 'react';

interface ResumeData {
  summary?: string;
  workExperience?: any[];
  education?: any[];
  skills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  projects?: any[];
  certifications?: any[];
  publications?: any[];
  useSkillCategories?: boolean;
  sectionOrder?: string[];
}

interface SectionRenderer {
  summary: () => React.ReactNode;
  workExperience: () => React.ReactNode;
  education: () => React.ReactNode;
  skills: () => React.ReactNode;
  projects: () => React.ReactNode;
  certifications: () => React.ReactNode;
  publications: () => React.ReactNode;
}

/**
 * Helper function to render resume sections in the order specified by sectionOrder.
 * If sectionOrder is not provided, it uses a default order.
 */
export function renderSections(
  data: ResumeData,
  renderers: SectionRenderer
): React.ReactNode[] {
  // Default section order if not provided
  const defaultOrder = ["summary", "workExperience", "education", "skills", "projects", "certifications", "publications"];
  
  // Use provided section order or default, ensure it's always an array
  const order = Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0 
    ? data.sectionOrder 
    : defaultOrder;
  
  // Only render sections that have corresponding renderers
  const validSections = order.filter(section => 
    section in renderers && 
    typeof renderers[section as keyof SectionRenderer] === 'function'
  );
  
  // Render sections in specified order
  return validSections.map(section => {
    const renderer = renderers[section as keyof SectionRenderer];
    return renderer();
  });
} 