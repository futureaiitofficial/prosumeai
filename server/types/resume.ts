export interface ResumeData {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  city?: string;
  state?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  targetJobTitle: string;
  summary?: string;
  workExperience?: Array<{
    id?: string;
    position: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    achievements?: string[];
  }>;
  education?: Array<{
    id?: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }>;
  skills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  projects?: Array<{
    id?: string;
    name: string;
    description?: string;
    url?: string;
    technologies?: string[];
  }>;
  certifications?: Array<{
    id?: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
    description?: string;
  }>;
  useSkillCategories?: boolean;
} 