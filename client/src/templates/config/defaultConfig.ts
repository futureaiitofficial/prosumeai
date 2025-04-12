import { type TemplateCustomization } from '../core/types';

export const defaultCustomization: TemplateCustomization = {
  colors: {
    primary: '#2563eb',    // Blue
    secondary: '#4b5563',   // Gray
    accent: '#ec4899',      // Pink
    background: '#ffffff',  // White
    text: '#1f2937',        // Dark gray
  },
  fonts: {
    heading: 'system-ui, -apple-system, sans-serif',
    body: 'system-ui, -apple-system, sans-serif',
  },
  spacing: {
    sectionGap: '1.5rem',
    itemGap: '1rem'
  },
  layout: {
    maxWidth: '210mm', // A4 width
    sidebar: 'left'
  }
};

export const modernCustomization: TemplateCustomization = {
  ...defaultCustomization,
  colors: {
    ...defaultCustomization.colors,
    primary: '#3b82f6',    // Blue
    secondary: '#6b7280',   // Gray
    accent: '#f97316',      // Orange
  },
  fonts: {
    heading: 'system-ui, -apple-system, sans-serif',
    body: 'system-ui, -apple-system, sans-serif',
  },
  layout: {
    ...defaultCustomization.layout,
    sidebar: 'left'
  }
};

export const professionalCustomization: TemplateCustomization = {
  ...defaultCustomization,
  colors: {
    ...defaultCustomization.colors,
    primary: '#1e293b',   // Slate darker
    secondary: '#334155', // Slate dark
    accent: '#0ea5e9'     // Sky blue
  },
  fonts: {
    heading: 'Times New Roman',
    body: 'Times New Roman'
  },
  layout: {
    ...defaultCustomization.layout,
    sidebar: 'none'
  }
};

export const minimalistCustomization: TemplateCustomization = {
  ...defaultCustomization,
  colors: {
    ...defaultCustomization.colors,
    primary: '#333333',
    secondary: '#666666',
    text: '#333333',
    background: '#ffffff',
    accent: '#808080'
  },
  fonts: {
    heading: '"Helvetica", "Arial", sans-serif',
    body: '"Helvetica", "Arial", sans-serif'
  },
  spacing: {
    sectionSpacing: '1rem'
  },
  layout: {
    ...defaultCustomization.layout,
    sidebar: 'none'
  }
};

export const elegantCustomization: TemplateCustomization = {
  ...defaultCustomization,
  colors: {
    ...defaultCustomization.colors,
    primary: '#292524',   // Stone dark
    secondary: '#57534e', // Stone medium
    accent: '#78716c'     // Stone light
  },
  fonts: {
    heading: 'Playfair Display',
    body: 'Lato'
  },
  layout: {
    ...defaultCustomization.layout,
    sidebar: 'left'
  }
};

export const corporateCustomization: TemplateCustomization = {
  ...defaultCustomization,
  colors: {
    ...defaultCustomization.colors,
    primary: '#0f172a',   // Navy
    secondary: '#1e293b', // Navy light
    accent: '#3b82f6'     // Blue
  },
  fonts: {
    heading: 'Arial',
    body: 'Arial'
  },
  layout: {
    ...defaultCustomization.layout,
    sidebar: 'none'
  }
};

// Template metadata
export const templateMetadata = {
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'A modern and sleek design with a focus on simplicity',
    version: '1.0.0',
    thumbnail: '/templates/modern-preview.png',
    isDefault: false,
    category: 'modern',
    tags: ['modern', 'sleek', 'simple'],
    isAtsOptimized: true
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'A traditional professional layout optimized for ATS systems',
    version: '1.0.0',
    thumbnail: '/templates/professional-preview.png',
    isDefault: true,
    category: 'professional',
    tags: ['traditional', 'ats-friendly', 'classic'],
    isAtsOptimized: true
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'A simple and clean design focusing on essential information',
    version: '1.0.0',
    thumbnail: '/templates/minimalist-preview.png',
    isDefault: false,
    category: 'simple',
    tags: ['minimal', 'clean', 'simple'],
    isAtsOptimized: true
  },
  'minimalist-ats': {
    id: 'minimalist-ats',
    name: 'Minimalist ATS',
    description: 'A clean, minimal layout optimized for ATS parsing with maximum readability.',
    version: '1.0.0',
    thumbnail: '/templates/minimalist-ats.png',
    isDefault: false,
    category: 'professional',
    tags: ['ats-friendly', 'minimal', 'clean', 'professional', 'simple'],
    isAtsOptimized: true
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'An elegant and sophisticated design with classic typography',
    version: '1.0.0',
    thumbnail: '/templates/elegant-preview.png',
    isDefault: false,
    category: 'professional',
    tags: ['elegant', 'sophisticated', 'classic'],
    isAtsOptimized: true
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'A professional corporate design for business environments',
    version: '1.0.0',
    thumbnail: '/templates/corporate-preview.png',
    isDefault: false,
    category: 'professional',
    tags: ['corporate', 'business', 'professional'],
    isAtsOptimized: true
  }
}; 