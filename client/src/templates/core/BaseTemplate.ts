import { type ResumeData } from '@/types/resume';
import {
  type ResumeTemplate,
  type TemplateCustomization,
  type ValidationResult,
  type ATSScore,
  type TemplateMetadata
} from './types';

export abstract class BaseTemplate implements ResumeTemplate {
  public readonly metadata: TemplateMetadata;
  private _customization: TemplateCustomization;

  constructor(metadata: TemplateMetadata, customization: TemplateCustomization) {
    this.metadata = metadata;
    this._customization = { ...customization };
  }

  // Core template information
  get id(): string {
    return this.metadata.id;
  }

  get name(): string {
    return this.metadata.name;
  }

  get description(): string {
    return this.metadata.description;
  }

  get version(): string {
    return this.metadata.version;
  }

  get thumbnail(): string | undefined {
    return this.metadata.thumbnail;
  }

  // Styling and customization
  get customization(): TemplateCustomization {
    return this._customization;
  }

  get defaultCustomization(): TemplateCustomization {
    return this._customization;
  }

  updateCustomization(customization: Partial<TemplateCustomization>): void {
    this._customization = {
      ...this._customization,
      ...customization,
      colors: {
        ...this._customization.colors,
        ...(customization.colors || {})
      },
      fonts: {
        ...this._customization.fonts,
        ...(customization.fonts || {})
      },
      spacing: {
        ...this._customization.spacing,
        ...(customization.spacing || {})
      },
      layout: {
        ...this._customization.layout,
        ...(customization.layout || {})
      }
    };
  }

  resetCustomization(): void {
    this._customization = { ...this.defaultCustomization };
  }

  // Abstract methods that must be implemented by specific templates
  abstract renderPreview(data: ResumeData): JSX.Element;

  // Export methods with default implementations
  async exportToPDF(data: ResumeData): Promise<Blob> {
    throw new Error('PDF export not implemented');
  }

  async exportToLaTeX(data: ResumeData): Promise<string> {
    throw new Error('LaTeX export not implemented');
  }

  async exportToHTML(data: ResumeData): Promise<string> {
    throw new Error('HTML export not implemented');
  }

  async exportToDOCX(data: ResumeData): Promise<Blob> {
    throw new Error('DOCX export not implemented');
  }

  // Validation with default implementation
  validate(data: ResumeData): ValidationResult {
    const issues: string[] = [];

    // Basic validation
    if (!data.fullName) {
      issues.push('Full name is required');
    }

    if (!data.email) {
      issues.push('Email is required');
    }

    if (!data.targetJobTitle) {
      issues.push('Target job title is recommended');
    }

    // Check sections
    if (!data.summary) {
      issues.push('Professional summary is recommended');
    }

    if (!data.workExperience?.length) {
      issues.push('Work experience section is recommended');
    }

    if (!data.education?.length) {
      issues.push('Education section is recommended');
    }

    if (!data.skills?.length && !data.technicalSkills?.length && !data.softSkills?.length) {
      issues.push('Skills section is recommended');
    }

    // Calculate score based on issues
    const score = Math.max(0, 100 - issues.length * 10);

    return {
      isValid: issues.length === 0,
      score,
      issues
    };
  }

  // ATS compatibility check with default implementation
  checkATSCompatibility(data: ResumeData): ATSScore {
    const score = {
      overall: 0,
      sections: {},
      suggestions: [],
      keywordMatches: [],
      missingKeywords: [],
      formatIssues: []
    };

    // Basic ATS checks
    if (!data.fullName || !data.email || !data.phone) {
      score.formatIssues.push('Missing essential contact information');
    }

    if (!data.summary) {
      score.suggestions.push('Add a professional summary to improve ATS score');
    }

    if (data.workExperience?.length > 0) {
      score.sections.experience = this.calculateExperienceScore(data.workExperience);
    }

    if (data.education?.length > 0) {
      score.sections.education = this.calculateEducationScore(data.education);
    }

    if (data.skills?.length > 0 || data.technicalSkills?.length > 0 || data.softSkills?.length > 0) {
      score.sections.skills = this.calculateSkillsScore(data);
    }

    // Calculate overall score
    const sectionScores = Object.values(score.sections);
    score.overall = sectionScores.length > 0
      ? sectionScores.reduce((acc, curr) => acc + curr, 0) / sectionScores.length
      : 0;

    return score;
  }

  // Helper methods for ATS scoring
  protected calculateExperienceScore(experience: any[]): number {
    let score = 0;
    const maxScore = 100;
    const criteria = {
      hasPosition: 20,
      hasCompany: 20,
      hasDates: 20,
      hasDescription: 20,
      hasAchievements: 20
    };

    experience.forEach(exp => {
      let expScore = 0;
      if (exp.position) expScore += criteria.hasPosition;
      if (exp.company) expScore += criteria.hasCompany;
      if (exp.startDate && (exp.endDate || exp.current)) expScore += criteria.hasDates;
      if (exp.description) expScore += criteria.hasDescription;
      if (exp.achievements?.length > 0) expScore += criteria.hasAchievements;
      score += expScore;
    });

    return Math.min((score / (experience.length * 100)) * 100, maxScore);
  }

  protected calculateEducationScore(education: any[]): number {
    let score = 0;
    const maxScore = 100;
    const criteria = {
      hasDegree: 30,
      hasInstitution: 30,
      hasDates: 20,
      hasFieldOfStudy: 20
    };

    education.forEach(edu => {
      let eduScore = 0;
      if (edu.degree) eduScore += criteria.hasDegree;
      if (edu.institution) eduScore += criteria.hasInstitution;
      if (edu.startDate && (edu.endDate || edu.current)) eduScore += criteria.hasDates;
      if (edu.fieldOfStudy) eduScore += criteria.hasFieldOfStudy;
      score += eduScore;
    });

    return Math.min((score / (education.length * 100)) * 100, maxScore);
  }

  protected calculateSkillsScore(data: ResumeData): number {
    const allSkills = [
      ...(data.skills || []),
      ...(data.technicalSkills || []),
      ...(data.softSkills || [])
    ];

    if (allSkills.length === 0) return 0;

    const maxScore = 100;
    const minSkills = 5;
    const optimalSkills = 15;
    const skillCount = allSkills.length;

    if (skillCount < minSkills) {
      return (skillCount / minSkills) * 70; // Max 70% if below minimum
    }

    if (skillCount >= optimalSkills) {
      return maxScore;
    }

    // Scale between 70% and 100% based on skill count between min and optimal
    return 70 + ((skillCount - minSkills) / (optimalSkills - minSkills)) * 30;
  }

  getATSCompatibilityScore(data: ResumeData): number {
    // Default ATS compatibility scoring
    let score = 100;
    const issues = this.validate(data).issues;
    
    // Deduct points for each issue
    score -= issues.length * 5;
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, score));
  }
} 