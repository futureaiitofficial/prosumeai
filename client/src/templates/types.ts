import { ReactNode, RefObject } from "react";

// Common types for all templates
export interface TemplateProps {
  customCss?: string;
  setRef?: (element: HTMLDivElement | null) => void;
}

// Template specific props
export interface ResumeTemplateProps extends TemplateProps {
  data: ResumeData;
}

export interface CoverLetterTemplateProps extends TemplateProps {
  data: CoverLetterData;
}

// Data types
export interface ResumeData {
  fullName?: string;
  professionalTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  skills?: string[];
  languages?: string[];
  workExperience?: WorkExperience[];
  education?: Education[];
  projects?: Project[];
  certifications?: Certification[];
  achievements?: Achievement[];
  customSections?: CustomSection[];
  [key: string]: any; // Allow for dynamic properties
}

export interface CoverLetterData {
  title?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  date?: string;
  recipientName?: string;
  companyName?: string;
  jobTitle?: string;
  content?: string;
  template?: string;
  letterStyle?: string;
  [key: string]: any; // Allow for dynamic properties
}

export interface WorkExperience {
  id?: string | number;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  description?: string;
  achievements?: string[];
  technologies?: string[];
}

export interface Education {
  id?: string | number;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  gpa?: string;
  achievements?: string[];
  coursework?: string[];
}

export interface Project {
  id?: string | number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  url?: string;
  technologies?: string[];
  achievements?: string[];
}

export interface Certification {
  id?: string | number;
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
  description?: string;
}

export interface Achievement {
  id?: string | number;
  title: string;
  date?: string;
  description?: string;
}

export interface CustomSection {
  id?: string | number;
  title: string;
  items: CustomSectionItem[];
}

export interface CustomSectionItem {
  id?: string | number;
  title: string;
  subtitle?: string;
  date?: string;
  location?: string;
  description?: string;
  bullets?: string[];
} 