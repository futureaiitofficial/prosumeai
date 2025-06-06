/**
 * Shared type definitions for ProsumeAI
 */

// User model shared properties
export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  role?: string;
}

// Resume data structure
export interface ResumeData {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  summary?: string;
  workExperience?: WorkExperience[];
  education?: Education[];
  skills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  useSkillCategories?: boolean;
  skillCategories?: { [categoryName: string]: string[] };
  projects?: Project[];
  certifications?: Certification[];
  publications?: Publication[];
  // Properties added for UI formatting
  contactSeparator?: string;
  formattedLinkedinUrl?: string;
  formattedPortfolioUrl?: string;
}

export interface WorkExperience {
  id?: number;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  achievements?: string[];
}

export interface Education {
  id?: number;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  city?: string;
  country?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  gpa?: string;
}

export interface Project {
  id?: number;
  name: string;
  description?: string;
  url?: string;
  technologies?: string[];
  date?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  detail?: string;
  link?: string;
}

export interface Certification {
  id?: number;
  name: string;
  issuer: string;
  date: string;
  description?: string;
  url?: string;
  expires?: boolean;
  expiryDate?: string;
}

export interface Publication {
  id?: string;
  title: string;
  publisher: string;
  authors: string;
  publicationDate?: string | null;
  url?: string | null;
  description?: string;
}

// Template customization types
export interface TemplateCustomization {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  spacing: {
    sectionGap: string;
    itemGap: string;
    sectionSpacing?: string;
  };
  borders: {
    width: string;
    color: string;
    style: string;
  };
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      role?: string;
    }
  }
}

// Extend express-session to include custom session data
declare module 'express-session' {
  interface SessionData {
    mathCaptchaAnswer?: number;
  }
} 