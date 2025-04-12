import { type TemplateCustomization } from '../base/ResumeTemplate';

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  preview: string;
  isAtsOptimized: boolean;
  customization: TemplateCustomization;
}

export const templates: Record<string, TemplateConfig> = {
  latex: {
    id: 'latex',
    name: 'LaTeX Professional',
    description: 'A classic professional template with traditional formatting that works well for corporate roles.',
    preview: '/templates/latex-preview.png',
    isAtsOptimized: true,
    customization: {
      colors: {
        primary: '#000000',
        secondary: '#333333',
        text: '#000000',
        background: '#ffffff'
      },
      fonts: {
        heading: 'Times New Roman',
        body: 'Times New Roman'
      },
      spacing: {
        margins: '1rem',
        lineHeight: 1.5,
        sectionSpacing: '1.5rem'
      }
    }
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'A contemporary design with a sidebar for skills and contact info. Great for creative professionals.',
    preview: '/templates/modern-preview.png',
    isAtsOptimized: true,
    customization: {
      colors: {
        primary: '#2563eb',
        secondary: '#0891b2',
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
    }
  }
}; 