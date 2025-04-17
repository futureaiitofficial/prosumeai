import { StandardCoverLetter } from './implementations/cover-letter/StandardCoverLetter';
import { ModernCoverLetter } from './implementations/cover-letter/ModernCoverLetter';

// Template metadata
export const coverLetterTemplateMetadata = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Traditional cover letter format suitable for formal applications',
    version: '1.0.0',
    thumbnail: '/templates/cl-standard.png',
    component: StandardCoverLetter
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Modern design with contemporary styling for creative roles',
    version: '1.0.0',
    thumbnail: '/templates/cl-modern.png',
    component: ModernCoverLetter
  }
};

// Mapping of template IDs to their component implementations
export const coverLetterTemplates = {
  standard: StandardCoverLetter,
  modern: ModernCoverLetter,
};

let registered = false;

export function registerCoverLetterTemplates() {
  if (registered) {
    console.log("Cover letter templates already registered, skipping");
    return;
  }

  console.log("Registering cover letter templates...");
  
  // Validate that all templates exist
  try {
    Object.entries(coverLetterTemplates).forEach(([id, Template]) => {
      if (!Template) {
        console.error(`Cover letter template ${id} is not properly defined`);
      }
    });
    
    console.log("Cover letter templates registered:", Object.keys(coverLetterTemplates));
  } catch (error) {
    console.error("Error registering cover letter templates:", error);
  }
  
  registered = true;
  return coverLetterTemplates;
} 