import { type ResumeData } from '@/types/resume';

export type ExportFormat = 'pdf' | 'latex' | 'html' | 'docx';

export type TemplateType = 'modern' | 'professional' | 'minimalist' | 'creative' | 'elegant' | 'corporate';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  isAtsOptimized: boolean;
  version: string;
  thumbnail: string;
  category: string;
  tags: string[];
  isDefault?: boolean;
}

export interface TemplateCustomization {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    sectionGap: string;
    itemGap: string;
  };
  layout: {
    maxWidth: string;
    sidebar: 'left' | 'right' | 'none';
  };
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface ATSScore {
  overall: number;
  sections: {
    [key: string]: number;
  };
  suggestions: string[];
  keywordMatches: string[];
  missingKeywords: string[];
  formatIssues: string[];
}

export interface ResumeTemplate {
  metadata: TemplateMetadata;
  customization: TemplateCustomization;
  renderPreview: (data: any) => JSX.Element;
  exportToPDF: (data: any) => Promise<Blob>;
  exportToLaTeX: (data: any) => Promise<string>;
  exportToHTML: (data: any) => Promise<string>;
  exportToDOCX: (data: any) => Promise<Blob>;
  validate: (data: any) => ValidationResult;
  getATSCompatibilityScore: (data: any) => number;
} 