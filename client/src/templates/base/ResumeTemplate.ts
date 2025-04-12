import { type ResumeData } from '@/types/resume';

export interface TemplateCustomization {
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    margins: string;
    lineHeight: number;
    sectionSpacing: string;
  };
}

export interface ATSScore {
  score: number;
  suggestions: string[];
  keywordMatches: string[];
  missingKeywords: string[];
  formatIssues: string[];
}

export interface ResumeTemplateInterface {
  name: string;
  description: string;
  preview: string;
  customization: TemplateCustomization;
  
  render(data: ResumeData): JSX.Element;
  getPreview(): JSX.Element;
  validate(data: ResumeData): boolean;
  checkATSCompatibility(data: ResumeData): ATSScore;
  export(data: ResumeData, format: 'pdf' | 'docx' | 'latex' | 'html'): Promise<Blob>;
}

export abstract class BaseTemplate implements ResumeTemplateInterface {
  abstract name: string;
  abstract description: string;
  abstract preview: string;
  
  customization: TemplateCustomization = {
    colors: {
      primary: '#2563eb',
      secondary: '#475569',
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
  };

  abstract render(data: ResumeData): JSX.Element;

  getPreview(): JSX.Element {
    // Default preview implementation
    return this.render({
      title: 'Sample Resume',
      targetJobTitle: 'Software Engineer',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      location: 'New York, NY',
      summary: 'Experienced software engineer with expertise in...',
      workExperience: [],
      education: [],
      skills: ['JavaScript', 'React', 'Node.js'],
      technicalSkills: [],
      softSkills: [],
      certifications: [],
      projects: [],
      template: 'default'
    });
  }

  validate(data: ResumeData): boolean {
    // Basic validation
    if (!data.fullName || !data.email || !data.targetJobTitle) {
      return false;
    }
    return true;
  }

  checkATSCompatibility(data: ResumeData): ATSScore {
    // Basic ATS compatibility check
    const score = {
      score: 0,
      suggestions: [],
      keywordMatches: [],
      missingKeywords: [],
      formatIssues: []
    };

    // Check for basic requirements
    if (!data.fullName) score.formatIssues.push('Missing full name');
    if (!data.email) score.formatIssues.push('Missing email');
    if (!data.phone) score.formatIssues.push('Missing phone number');
    if (!data.location) score.formatIssues.push('Missing location');
    if (!data.summary) score.formatIssues.push('Missing professional summary');

    // Calculate score based on completeness
    score.score = this.calculateATSScore(data);

    return score;
  }

  protected calculateATSScore(data: ResumeData): number {
    let score = 100;
    
    // Deduct points for missing essential information
    if (!data.fullName) score -= 10;
    if (!data.email) score -= 10;
    if (!data.phone) score -= 5;
    if (!data.location) score -= 5;
    if (!data.summary) score -= 10;
    if (!data.workExperience?.length) score -= 20;
    if (!data.education?.length) score -= 15;
    if (!data.skills?.length) score -= 15;
    
    return Math.max(0, score);
  }

  async export(data: ResumeData, format: 'pdf' | 'docx' | 'latex' | 'html'): Promise<Blob> {
    // Default export implementation (can be overridden by specific templates)
    throw new Error('Export not implemented for this template');
  }
} 