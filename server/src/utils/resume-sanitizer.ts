import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import { z } from 'zod';
import { isEncrypted, safeDecrypt, safeEncrypt } from '../../utils/encryption';

export interface SanitizedResumeData {
  // All string fields properly sanitized
  fullName?: string;
  email?: string;
  phone?: string;
  targetJobTitle?: string;
  jobDescription?: string;
  summary?: string;
  city?: string;
  state?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  location?: string;
  country?: string;
  
  // Sanitized arrays
  skills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  
  // Sanitized JSONB objects
  workExperience?: SanitizedWorkExperience[];
  education?: SanitizedEducation[];
  projects?: SanitizedProject[];
  certifications?: SanitizedCertification[];
  publications?: SanitizedPublication[];
  skillCategories?: { [key: string]: string[] };
  
  // Template and metadata
  template?: string;
  title?: string;
  isComplete?: boolean;
  currentStep?: string;
  useSkillCategories?: boolean;
  keywordsOptimization?: string;
}

interface SanitizedWorkExperience {
  id?: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  achievements?: string[];
}

interface SanitizedEducation {
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
}

interface SanitizedProject {
  id?: string;
  name: string;
  description?: string;
  url?: string;
  technologies?: string[];
  date?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

interface SanitizedCertification {
  id?: string;
  name: string;
  issuer: string;
  date: string;
  expires?: boolean;
  expiryDate?: string;
  description?: string;
  url?: string;
}

interface SanitizedPublication {
  id?: string;
  title: string;
  publisher: string;
  authors: string;
  publicationDate?: string;
  url?: string;
  description?: string;
}

// Deep sanitization for all resume data
export function sanitizeResumeData(data: any): SanitizedResumeData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid resume data');
  }

  return {
    // Sanitize basic text fields - removed overly restrictive character validation for names
    fullName: sanitizeText(data.fullName, { maxLength: 100 }),
    email: sanitizeEmail(data.email),
    phone: sanitizePhone(data.phone),
    targetJobTitle: sanitizeText(data.targetJobTitle, { maxLength: 200, required: true }),
    jobDescription: sanitizeHtml(data.jobDescription, { maxLength: 10000 }),
    summary: sanitizeHtml(data.summary, { maxLength: 1000 }),
    city: sanitizeText(data.city, { maxLength: 100 }),
    state: sanitizeText(data.state, { maxLength: 100 }),
    location: sanitizeText(data.location, { maxLength: 200 }),
    country: sanitizeText(data.country, { maxLength: 100 }),
    
    // Sanitize URLs
    linkedinUrl: sanitizeUrl(data.linkedinUrl, { allowedDomains: ['linkedin.com'] }),
    portfolioUrl: sanitizeUrl(data.portfolioUrl),
    
    // Sanitize arrays
    skills: sanitizeStringArray(data.skills, { maxLength: 50, maxItems: 50 }),
    technicalSkills: sanitizeStringArray(data.technicalSkills, { maxLength: 50, maxItems: 50 }),
    softSkills: sanitizeStringArray(data.softSkills, { maxLength: 50, maxItems: 50 }),
    
    // Sanitize complex objects
    workExperience: sanitizeWorkExperience(data.workExperience),
    education: sanitizeEducation(data.education),
    projects: sanitizeProjects(data.projects),
    certifications: sanitizeCertifications(data.certifications),
    publications: sanitizePublications(data.publications),
    skillCategories: sanitizeSkillCategories(data.skillCategories),
    
    // Sanitize metadata
    template: sanitizeText(data.template, { maxLength: 50, allowedChars: /^[a-z\-_]*$/ }),
    title: sanitizeText(data.title, { maxLength: 200 }),
    isComplete: Boolean(data.isComplete),
    currentStep: sanitizeText(data.currentStep, { maxLength: 50, allowedChars: /^[a-z\-_]*$/ }),
    useSkillCategories: Boolean(data.useSkillCategories),
    keywordsOptimization: sanitizeText(data.keywordsOptimization, { maxLength: 1000 })
  };
}

// Text sanitization with strict validation
export function sanitizeText(input: any, options: {
  maxLength?: number;
  allowedChars?: RegExp;
  required?: boolean;
} = {}): string {
  if (!input) return options.required ? '' : '';
  
  let sanitized: string;
  let wasEncrypted = false;
  
  // Check if the input is already encrypted
  if (typeof input === 'string' && isEncrypted(input)) {
    try {
      // Decrypt the text for validation and sanitization
      sanitized = String(safeDecrypt(input)).trim();
      wasEncrypted = true;
    } catch (error) {
      throw new Error('Failed to decrypt text for validation');
    }
  } else {
    sanitized = String(input).trim();
  }
  
  const originalInput = sanitized;
  
  // Check for clearly malicious content that should always be rejected
  const dangerousPatterns = [
    /<script[^>]*>.*?alert\s*\([^)]*\).*?<\/script>.*\w/gi, // Script with alert followed by other content
    /<script[^>]*>.*?fetch\s*\(/gi,      // Script tags with fetch
    /<script[^>]*>.*?document\./gi,      // Script tags accessing document
    /<script[^>]*>.*?window\./gi,        // Script tags accessing window
    /<script[^>]*>.*?location\./gi,      // Script tags accessing location
    /<script[^>]*>.*?cookie/gi,          // Script tags accessing cookies
    /javascript:\s*document\./gi,        // JavaScript protocol with document access
    /on\w+\s*=.*?fetch\s*\(/gi,         // Event handlers with fetch
    /on\w+\s*=.*?document\./gi          // Event handlers with document access
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Text contains potentially malicious content');
    }
  }
  
  // Remove HTML tags first with DOMPurify
  sanitized = DOMPurify.sanitize(sanitized, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur']
  });
  
  // Check for remaining malicious content after sanitization
  // Only throw if there are clear SQL injection patterns or dangerous protocols
  const sqlInjectionPatterns = [
    /'\s*(or|and)\s*'?\s*'?\s*(=|<|>)/gi,  // ' OR '1'='1
    /'\s*(union|select)\s+.*(from|where)/gi,  // ' UNION SELECT * FROM
    /;\s*(drop|delete|truncate|alter)\s+/gi,  // ; DROP TABLE
    /--\s*\w/g,  // SQL comments with content (-- comment)
    /\/\*.*\*\//g,  // Block comments /* */
    /';\s*(insert|update|delete)/gi,  // '; INSERT INTO
    /\b(exec|execute)\s*\(/gi,  // exec( or execute(
    /\b(sp_|xp_)\w+/gi,  // stored procedures
    /(0x[0-9a-f]+|char\s*\()/gi,  // hex encoding or char() functions
    /'\s*(;|$)/g  // quotes followed by semicolon or end
  ];
  
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Text contains potentially malicious content');
    }
  }
  
  // Check for dangerous protocols that survived sanitization
  if (/javascript:|vbscript:|data:text\/html/gi.test(sanitized)) {
    throw new Error('Text contains potentially malicious content');
  }
  
  // Check allowed characters (but only if specified)
  if (options.allowedChars && !options.allowedChars.test(sanitized)) {
    throw new Error('Text contains invalid characters');
  }
  
  // Truncate if too long
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  // Only escape if we detected potential HTML in the original input and it's not for names/special chars
  if (/<|>|&/.test(originalInput) && !options.allowedChars) {
    sanitized = validator.escape(sanitized);
  }
  
  // If the original input was encrypted, return the encrypted version
  if (wasEncrypted) {
    return safeEncrypt(sanitized);
  }
  
  return sanitized;
}

// HTML content sanitization (for descriptions)
export function sanitizeHtml(input: any, options: {
  maxLength?: number;
} = {}): string {
  if (!input) return '';
  
  let sanitized: string;
  let wasEncrypted = false;
  
  // Check if the input is already encrypted
  if (typeof input === 'string' && isEncrypted(input)) {
    try {
      // Decrypt the HTML for validation and sanitization
      sanitized = String(safeDecrypt(input)).trim();
      wasEncrypted = true;
    } catch (error) {
      throw new Error('Failed to decrypt HTML for validation');
    }
  } else {
    sanitized = String(input).trim();
  }
  
  // Use DOMPurify with restricted tags
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'href', 'src']
  });
  
  // Check for actual SQL injection patterns (more specific than just SQL keywords)
  const sqlInjectionPatterns = [
    /'\s*(or|and)\s*'?\s*'?\s*(=|<|>)/gi,  // ' OR '1'='1
    /'\s*(union|select)\s+.*(from|where)/gi,  // ' UNION SELECT * FROM
    /;\s*(drop|delete|truncate|alter)\s+/gi,  // ; DROP TABLE
    /--\s*\w/g,  // SQL comments with content (-- comment)
    /\/\*.*\*\//g,  // Block comments /* */
    /';\s*(insert|update|delete)/gi,  // '; INSERT INTO
    /\b(exec|execute)\s*\(/gi,  // exec( or execute(
    /\b(sp_|xp_)\w+/gi,  // stored procedures
    /(0x[0-9a-f]+|char\s*\()/gi,  // hex encoding or char() functions
    /'\s*(;|$)/g  // quotes followed by semicolon or end
  ];
  
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('HTML content contains potentially malicious SQL patterns');
    }
  }
  
  // Truncate if too long
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  // If the original input was encrypted, return the encrypted version
  if (wasEncrypted) {
    return safeEncrypt(sanitized);
  }
  
  return sanitized;
}

// URL sanitization with domain validation
export function sanitizeUrl(input: any, options: {
  allowedDomains?: string[];
  required?: boolean;
} = {}): string {
  if (!input) return options.required ? '' : '';
  
  let url: string;
  let wasEncrypted = false;
  
  // Check if the input is already encrypted
  if (typeof input === 'string' && isEncrypted(input)) {
    try {
      // Decrypt the URL for validation
      url = String(safeDecrypt(input)).trim();
      wasEncrypted = true;
    } catch (error) {
      throw new Error('Failed to decrypt URL for validation');
    }
  } else {
    url = String(input).trim();
  }
  
  // Return empty string for empty input (not an error)
  if (!url) {
    return '';
  }
  
  // Log the URL being validated for debugging
  console.log(`[DEBUG] Validating URL: "${url}"`);
  
  // Remove dangerous protocols
  if (/^(javascript|data|vbscript|file|ftp|chrome|chrome-extension|moz-extension):/i.test(url)) {
    console.log(`[DEBUG] URL rejected for dangerous protocol: "${url}"`);
    throw new Error('URL protocol not allowed. Please use http:// or https:// URLs only.');
  }
  
  // Check for suspicious URL patterns first
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /%3Cscript/i,
    /%3C/i,
    /%3E/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      console.log(`[DEBUG] URL rejected for suspicious pattern: "${url}"`);
      throw new Error('URL contains invalid characters. Please enter a valid website URL.');
    }
  }
  
  // Add https if no protocol (be more flexible here)
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
    console.log(`[DEBUG] Added https:// prefix, new URL: "${url}"`);
  }
  
  // More flexible URL validation with better error messages
  try {
    // First try to parse as URL to catch obvious format issues
    const urlObj = new URL(url);
    console.log(`[DEBUG] URL parsed successfully, hostname: "${urlObj.hostname}"`);
    
    // Basic checks for valid URL structure
    if (!urlObj.hostname || urlObj.hostname.length < 1) {
      console.log(`[DEBUG] URL rejected for empty hostname: "${url}"`);
      throw new Error('Please enter a valid website URL (e.g., www.example.com)');
    }
    
    // Check for at least one dot in hostname (basic domain validation)
    if (!urlObj.hostname.includes('.')) {
      console.log(`[DEBUG] URL rejected for missing dot in hostname: "${url}"`);
      throw new Error('Please enter a valid website URL with a domain (e.g., www.example.com)');
    }
    
    // Check hostname length
    if (urlObj.hostname.length > 253) {
      console.log(`[DEBUG] URL rejected for hostname too long: "${url}"`);
      throw new Error('URL domain is too long. Please use a shorter URL.');
    }
    
    // Check for allowed domains if specified
    if (options.allowedDomains) {
      const domain = urlObj.hostname.replace(/^www\./, '');
      console.log(`[DEBUG] Checking domain "${domain}" against allowed domains: ${options.allowedDomains.join(', ')}`);
      if (!options.allowedDomains.some(allowed => domain.includes(allowed))) {
        if (options.allowedDomains.includes('linkedin.com')) {
          console.log(`[DEBUG] URL rejected for not being LinkedIn: "${url}"`);
          throw new Error('LinkedIn URL must be from linkedin.com (e.g., linkedin.com/in/yourname)');
        } else {
          console.log(`[DEBUG] URL rejected for domain not allowed: "${url}"`);
          throw new Error(`URL domain not allowed. Please use one of: ${options.allowedDomains.join(', ')}`);
        }
      }
    }
    
  } catch (error: any) {
    console.log(`[DEBUG] URL validation error: "${error.message}" for URL: "${url}"`);
    
    // If it's one of our custom error messages, re-throw it
    if (error.message.includes('Please enter a valid') || 
        error.message.includes('LinkedIn URL must be') || 
        error.message.includes('URL domain not allowed') ||
        error.message.includes('URL domain is too long')) {
      throw error;
    }
    
    // For other URL parsing errors, provide a helpful message
    throw new Error('Invalid URL format. Please enter a complete URL (e.g., https://www.example.com)');
  }
  
  // More lenient final validation using validator library
  const validatorOptions = {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: true, // Allow underscores in domain names
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
    disallow_auth: false
  };
  
  console.log(`[DEBUG] Running validator.isURL check on: "${url}"`);
  
  if (!validator.isURL(url, validatorOptions)) {
    console.log(`[DEBUG] validator.isURL rejected URL: "${url}"`);
    
    // Try a more permissive approach - just check if it's a valid URL structure
    try {
      new URL(url);
      console.log(`[DEBUG] URL passes basic URL constructor test, allowing it: "${url}"`);
      // If URL constructor works, accept it even if validator rejects it
    } catch (e) {
      console.log(`[DEBUG] URL fails both validator and URL constructor: "${url}"`);
      throw new Error('Invalid URL format. Please enter a complete URL (e.g., https://www.example.com)');
    }
  } else {
    console.log(`[DEBUG] URL passed validator.isURL check: "${url}"`);
  }
  
  // If the original input was encrypted, return the encrypted version
  if (wasEncrypted) {
    return safeEncrypt(url);
  }
  
  console.log(`[DEBUG] URL validation successful, returning: "${url}"`);
  return url;
}

// Email sanitization
export function sanitizeEmail(input: any): string {
  if (!input) return '';
  
  let email: string;
  
  // Check if the input is already encrypted
  if (typeof input === 'string' && isEncrypted(input)) {
    try {
      // Decrypt the email for validation
      email = String(safeDecrypt(input)).trim().toLowerCase();
    } catch (error) {
      throw new Error('Failed to decrypt email for validation');
    }
  } else {
    email = String(input).trim().toLowerCase();
  }
  
  // Check for XSS in email
  if (/<|>|script|javascript|onload|onerror/i.test(email)) {
    throw new Error('Email contains invalid characters');
  }
  
  // Check length first
  if (email.length > 254) {
    throw new Error('Email too long');
  }
  
  if (!validator.isEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  // If the original input was encrypted, return the encrypted version
  // If it wasn't encrypted, return the sanitized plaintext email
  if (typeof input === 'string' && isEncrypted(input)) {
    return safeEncrypt(email);
  }
  
  return email;
}

// Phone sanitization
export function sanitizePhone(input: any): string {
  if (!input) return '';
  
  let phone: string;
  let wasEncrypted = false;
  
  // Check if the input is already encrypted
  if (typeof input === 'string' && isEncrypted(input)) {
    try {
      // Decrypt the phone for validation
      phone = String(safeDecrypt(input)).trim();
      wasEncrypted = true;
    } catch (error) {
      throw new Error('Failed to decrypt phone for validation');
    }
  } else {
    phone = String(input).trim();
  }
  
  // Remove HTML and script tags
  phone = DOMPurify.sanitize(phone, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  
  // Remove all non-digit characters except + and spaces
  phone = phone.replace(/[^\d\+\s\-\(\)]/g, '');
  
  // Basic phone validation
  if (phone && !/^[\+]?[\d\s\-\(\)]{7,20}$/.test(phone)) {
    throw new Error('Invalid phone format');
  }
  
  // If the original input was encrypted, return the encrypted version
  if (wasEncrypted) {
    return safeEncrypt(phone);
  }
  
  return phone;
}

// Array sanitization
export function sanitizeStringArray(input: any, options: {
  maxLength?: number;
  maxItems?: number;
} = {}): string[] {
  if (!Array.isArray(input)) return [];
  
  const sanitized = input
    .slice(0, options.maxItems || 100) // Limit array size
    .map(item => {
      try {
        return sanitizeText(item, { maxLength: options.maxLength });
      } catch {
        return ''; // Filter out items that fail sanitization
      }
    })
    .filter(Boolean); // Remove empty strings
  
  return sanitized;
}

// Work Experience sanitization
export function sanitizeWorkExperience(input: any): SanitizedWorkExperience[] {
  if (!Array.isArray(input)) return [];
  
  return input.slice(0, 20).map((exp: any) => {
    if (!exp || typeof exp !== 'object') {
      throw new Error('Invalid work experience data');
    }
    
    return {
      id: sanitizeText(exp.id, { maxLength: 50 }),
      company: sanitizeText(exp.company, { maxLength: 200, required: true }),
      position: sanitizeText(exp.position, { maxLength: 200, required: true }),
      location: sanitizeText(exp.location, { maxLength: 200 }),
      startDate: sanitizeDate(exp.startDate),
      endDate: sanitizeDate(exp.endDate),
      current: Boolean(exp.current),
      description: sanitizeHtml(exp.description, { maxLength: 2000 }),
      achievements: sanitizeStringArray(exp.achievements, { maxLength: 500, maxItems: 20 })
    };
  });
}

// Education sanitization
export function sanitizeEducation(input: any): SanitizedEducation[] {
  if (!Array.isArray(input)) return [];
  
  return input.slice(0, 10).map((edu: any) => {
    if (!edu || typeof edu !== 'object') {
      throw new Error('Invalid education data');
    }
    
    return {
      id: sanitizeText(edu.id, { maxLength: 50 }),
      institution: sanitizeText(edu.institution, { maxLength: 200, required: true }),
      degree: sanitizeText(edu.degree, { maxLength: 200, required: true }),
      fieldOfStudy: sanitizeText(edu.fieldOfStudy, { maxLength: 200 }),
      city: sanitizeText(edu.city, { maxLength: 100 }),
      country: sanitizeText(edu.country, { maxLength: 100 }),
      startDate: sanitizeDate(edu.startDate),
      endDate: sanitizeDate(edu.endDate),
      current: Boolean(edu.current),
      description: sanitizeHtml(edu.description, { maxLength: 1000 })
    };
  });
}

// Projects sanitization
export function sanitizeProjects(input: any): SanitizedProject[] {
  if (!Array.isArray(input)) return [];
  
  return input.slice(0, 15).map((project: any) => {
    if (!project || typeof project !== 'object') {
      throw new Error('Invalid project data');
    }
    
    return {
      id: sanitizeText(project.id, { maxLength: 50 }),
      name: sanitizeText(project.name, { maxLength: 200, required: true }),
      description: sanitizeHtml(project.description, { maxLength: 1500 }),
      url: sanitizeUrl(project.url),
      technologies: sanitizeStringArray(project.technologies, { maxLength: 50, maxItems: 20 }),
      date: sanitizeDate(project.date),
      startDate: sanitizeDate(project.startDate),
      endDate: sanitizeDate(project.endDate),
      current: Boolean(project.current)
    };
  });
}

// Certifications sanitization
export function sanitizeCertifications(input: any): SanitizedCertification[] {
  if (!Array.isArray(input)) return [];
  
  return input.slice(0, 20).map((cert: any) => {
    if (!cert || typeof cert !== 'object') {
      throw new Error('Invalid certification data');
    }
    
    return {
      id: sanitizeText(cert.id, { maxLength: 50 }),
      name: sanitizeText(cert.name, { maxLength: 200, required: true }),
      issuer: sanitizeText(cert.issuer, { maxLength: 200, required: true }),
      date: sanitizeDate(cert.date) || '',
      expires: Boolean(cert.expires),
      expiryDate: sanitizeDate(cert.expiryDate),
      description: sanitizeHtml(cert.description, { maxLength: 500 }),
      url: sanitizeUrl(cert.url)
    };
  });
}

// Publications sanitization
export function sanitizePublications(input: any): SanitizedPublication[] {
  if (!Array.isArray(input)) return [];
  
  return input.slice(0, 15).map((pub: any) => {
    if (!pub || typeof pub !== 'object') {
      throw new Error('Invalid publication data');
    }
    
    return {
      id: sanitizeText(pub.id, { maxLength: 50 }),
      title: sanitizeText(pub.title, { maxLength: 300, required: true }),
      publisher: sanitizeText(pub.publisher, { maxLength: 200, required: true }),
      authors: sanitizeText(pub.authors, { maxLength: 500, required: true }),
      publicationDate: sanitizeDate(pub.publicationDate),
      url: sanitizeUrl(pub.url),
      description: sanitizeHtml(pub.description, { maxLength: 1000 })
    };
  });
}

// Skill categories sanitization
export function sanitizeSkillCategories(input: any): { [key: string]: string[] } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }
  
  const sanitized: { [key: string]: string[] } = {};
  const maxCategories = 20;
  const maxSkillsPerCategory = 50;
  let categoryCount = 0;
  
  for (const [key, value] of Object.entries(input)) {
    if (categoryCount >= maxCategories) break;
    
    try {
      // Sanitize category name (sanitizeText already handles SQL injection checks)
      const sanitizedKey = sanitizeText(key, { maxLength: 100 });
      
      if (Array.isArray(value)) {
        const skills = value
          .slice(0, maxSkillsPerCategory)
          .map(skill => {
            try {
              // Sanitize each skill (sanitizeText already handles SQL injection checks)
              return sanitizeText(skill, { maxLength: 200 });
            } catch {
              return ''; // Filter out items that fail sanitization
            }
          })
          .filter(Boolean);
        
        if (skills.length > 0) {
          sanitized[sanitizedKey] = skills;
          categoryCount++;
        }
      }
    } catch (error) {
      // Skip problematic categories but throw if it's a security violation
      if (error instanceof Error && error.message.includes('malicious')) {
        throw error;
      }
      continue;
    }
  }
  
  return sanitized;
}

// Date sanitization
export function sanitizeDate(input: any): string {
  if (!input) return '';
  
  const date = String(input).trim();
  
  // Validate ISO date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    if (date) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    return '';
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }
  
  // Check for reasonable date ranges
  const year = dateObj.getFullYear();
  if (year < 1950 || year > 2050) {
    throw new Error('Date out of reasonable range');
  }
  
  return date;
}

// Additional security utility functions

// Check for suspicious patterns across all data
export function detectSuspiciousPatterns(data: any): string[] {
  const suspiciousPatterns = [
    /<script|javascript:|data:|vbscript:/i,
    /'\s*(or|and)\s*'?\s*'?\s*(=|<|>)/gi,  // SQL injection patterns
    /'\s*(union|select)\s+.*(from|where)/gi,
    /;\s*(drop|delete|truncate|alter)\s+/gi,
    /--\s*\w/g,  // SQL comments with content
    /\/\*.*\*\//g,  // Block comments
    /(\$\{|\$\(|<%|%>|\{\{|\}\})/g, // Template injection
    /(eval\(|Function\(|setTimeout\(|setInterval\()/gi,
    /(\bon\w+\s*=|href\s*=\s*["']?javascript:)/gi
  ];
  
  const warnings: string[] = [];
  const dataString = JSON.stringify(data);
  
  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(dataString)) {
      warnings.push(`Suspicious pattern ${index + 1} detected in data`);
    }
  });
  
  return warnings;
}

// Validate overall data structure
export function validateResumeStructure(data: any): void {
  if (!data || typeof data !== 'object') {
    throw new Error('Resume data must be an object');
  }
  
  // Check for required fields
  if (!data.targetJobTitle) {
    throw new Error('Target job title is required');
  }
  
  // Check data size limits
  const dataString = JSON.stringify(data);
  if (dataString.length > 1024 * 1024) { // 1MB limit
    throw new Error('Resume data too large');
  }
  
  // Check for suspicious patterns
  const warnings = detectSuspiciousPatterns(data);
  if (warnings.length > 0) {
    throw new Error(`Security check failed: ${warnings.join(', ')}`);
  }
} 