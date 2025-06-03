export interface ResumeData {
  id?: string;
  fullName: string;
  targetJobTitle?: string;
  jobDescription?: string;
  email: string;
  phone?: string;
  location?: string;
  country?: string;
  city?: string;
  state?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  summary?: string;
  template?: string;
  
  // Skills - Legacy support (backward compatibility)
  skills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  useSkillCategories?: boolean; // Whether to categorize skills into technical and soft skills
  
  // New flexible skill categories system
  skillCategories?: {
    [categoryName: string]: string[]; // e.g., { "Programming Languages": ["JavaScript", "Python"], "Tools": ["Docker", "AWS"] }
  };
  
  // Work Experience
  workExperience?: {
    id?: string;
    position: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    achievements?: string[];
  }[];
  
  // Education
  education?: {
    id?: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    city?: string;
    country?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }[];
  
  // Projects
  projects?: {
    id?: string;
    name: string;
    description?: string;
    url?: string;
    technologies?: string[];
    date?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
  }[];
  
  // Certifications
  certifications?: {
    id?: string;
    name: string;
    issuer: string;
    date: string;
    description?: string;
    url?: string;
  }[];
} 