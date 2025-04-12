import { type ResumeData } from '@/types/resume';
import { templates } from '../config/templateConfig';
import { type ATSScore } from '../base/ResumeTemplate';

export function validateTemplateData(data: ResumeData): boolean {
  const requiredFields = ['fullName', 'email', 'targetJobTitle'];
  return requiredFields.every(field => Boolean(data[field as keyof ResumeData]));
}

export function getTemplateById(id: string) {
  return templates[id];
}

export function getDefaultTemplate() {
  return Object.values(templates).find(template => template.isDefault) || templates.latex;
}

export function getATSOptimizedTemplates() {
  return Object.values(templates).filter(template => template.isAtsOptimized);
}

export function calculateATSScore(data: ResumeData): ATSScore {
  const score: ATSScore = {
    score: 100,
    suggestions: [],
    keywordMatches: [],
    missingKeywords: [],
    formatIssues: []
  };

  // Check for required fields
  const requiredFields = [
    { field: 'fullName', label: 'Full Name', weight: 10 },
    { field: 'email', label: 'Email', weight: 10 },
    { field: 'phone', label: 'Phone Number', weight: 5 },
    { field: 'location', label: 'Location', weight: 5 },
    { field: 'summary', label: 'Professional Summary', weight: 10 }
  ];

  requiredFields.forEach(({ field, label, weight }) => {
    if (!data[field as keyof ResumeData]) {
      score.score -= weight;
      score.formatIssues.push(`Missing ${label}`);
    }
  });

  // Check work experience
  if (!data.workExperience?.length) {
    score.score -= 20;
    score.formatIssues.push('No work experience listed');
  } else {
    data.workExperience.forEach((exp, index) => {
      if (!exp.description) {
        score.suggestions.push(`Add description for work experience at ${exp.company}`);
      }
      if (!exp.achievements?.length) {
        score.suggestions.push(`Add achievements for work experience at ${exp.company}`);
      }
    });
  }

  // Check education
  if (!data.education?.length) {
    score.score -= 15;
    score.formatIssues.push('No education history listed');
  }

  // Check skills
  if (!data.skills?.length && !data.technicalSkills?.length && !data.softSkills?.length) {
    score.score -= 15;
    score.formatIssues.push('No skills listed');
  }

  // Ensure score doesn't go below 0
  score.score = Math.max(0, score.score);

  return score;
}

export function generatePDF(data: ResumeData): Promise<Blob> {
  // Implementation for PDF generation
  throw new Error('PDF generation not implemented');
}

export function generateDOCX(data: ResumeData): Promise<Blob> {
  // Implementation for DOCX generation
  throw new Error('DOCX generation not implemented');
}

export function generateHTML(data: ResumeData): Promise<Blob> {
  // Implementation for HTML generation
  throw new Error('HTML generation not implemented');
}

export function generateLaTeX(data: ResumeData): Promise<Blob> {
  // Implementation for LaTeX generation
  throw new Error('LaTeX generation not implemented');
} 