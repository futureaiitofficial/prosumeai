import { TemplateFactory } from './core/TemplateFactory';

import { ProfessionalTemplate } from './implementations/ProfessionalTemplate';
// import { CreativeTemplate } from './implementations/CreativeTemplate';
import { ElegantDividerTemplate } from './implementations/ElegantDividerTemplate';
import { MinimalistAtsTemplate } from './implementations/MinimalistAtsTemplate';
import { ModernSidebarTemplate } from './implementations/ModernSidebarTemplate';
// Import other template implementations as they are created

let registered = false;

export function registerTemplates(): TemplateFactory {
  if (registered) {
    console.log("Templates already registered, skipping");
    return;
  }

  console.log("Registering templates...");
  const factory = TemplateFactory.getInstance();

  // Register templates
  factory.registerTemplateType('professional', ProfessionalTemplate);
  // factory.registerTemplateType('creative', CreativeTemplate);
  factory.registerTemplateType('elegant-divider', ElegantDividerTemplate);
  factory.registerTemplateType('minimalist-ats', MinimalistAtsTemplate);
  factory.registerTemplateType('modern-sidebar', ModernSidebarTemplate);
  
  // Register other templates as they are implemented
  // factory.registerTemplateType('minimalist', MinimalistTemplate);
  // factory.registerTemplateType('elegant', ElegantTemplate);
  // factory.registerTemplateType('corporate', CorporateTemplate);

  // Create instances of each template to ensure they're ready
  try {
    const professionalTemplate = factory.createTemplate('professional');
    const elegantDividerTemplate = factory.createTemplate('elegant-divider');
    const minimalistAtsTemplate = factory.createTemplate('minimalist-ats');
    const modernSidebarTemplate = factory.createTemplate('modern-sidebar');
    
    // Ensure template names are consistent
    if (professionalTemplate && professionalTemplate.metadata) {
      professionalTemplate.metadata.name = 'Professional';
    }
    if (elegantDividerTemplate && elegantDividerTemplate.metadata) {
      elegantDividerTemplate.metadata.name = 'Elegant Divider';
    }
    if (minimalistAtsTemplate && minimalistAtsTemplate.metadata) {
      minimalistAtsTemplate.metadata.name = 'Minimalist ATS';
    }
    if (modernSidebarTemplate) {
      modernSidebarTemplate.name = 'Modern Sidebar';
    }
    
    console.log("Templates registered:", factory.getRegisteredTypes());
    console.log("Professional template created:", !!professionalTemplate);
    console.log("Elegant Divider template created:", !!elegantDividerTemplate);
    console.log("Minimalist ATS template created:", !!minimalistAtsTemplate);
    console.log("Modern Sidebar template created:", !!modernSidebarTemplate);
  } catch (error) {
    console.error("Error creating templates:", error);
  }
  
  registered = true;
  return factory;
} 