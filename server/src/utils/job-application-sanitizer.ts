import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export interface SanitizedJobApplication {
  company: string;
  jobTitle: string;
  notes?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  applicationDate?: string;
  status: string;
}

export function sanitizeJobApplicationData(data: any): SanitizedJobApplication {
  // SQL injection patterns to block
  const sqlPatterns = [
    /'/i,
    /;/i,
    /--/i,
    /\/\*/i,
    /\*\//i,
    /(DROP|SELECT|INSERT|UPDATE|DELETE|UNION)/i,
    /(ALTER|CREATE|TRUNCATE)/i,
    /(\bOR\b|\bAND\b).*[=<>]/i
  ];

  // XSS patterns to detect
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];

  const sanitizeText = (text: string, maxLength: number = 500, fieldName: string = 'field'): string => {
    if (!text) return '';
    
    // Check for SQL injection patterns
    sqlPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        console.log(`[SECURITY] Job Application SQL_INJECTION_ATTEMPT in ${fieldName}: ${text.substring(0, 50)}...`);
        throw new Error(`SECURITY_VIOLATION: SQL injection pattern detected in ${fieldName}`);
      }
    });

    // Check for XSS patterns before sanitization
    xssPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        console.log(`[SECURITY] Job Application XSS_ATTEMPT in ${fieldName}: ${text.substring(0, 50)}...`);
      }
    });
    
    // Sanitize HTML and limit length
    const cleaned = DOMPurify.sanitize(text, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
    
    if (cleaned.length > maxLength) {
      console.log(`[SECURITY] Job Application CONTENT_TOO_LONG in ${fieldName}: ${cleaned.length}/${maxLength} characters`);
    }
    
    return cleaned.slice(0, maxLength);
  };

  // Validate required fields
  if (!data.company?.trim()) {
    throw new Error('VALIDATION_ERROR: Company name is required');
  }

  if (!data.jobTitle?.trim()) {
    throw new Error('VALIDATION_ERROR: Job title is required');
  }

  try {
    return {
      company: sanitizeText(data.company, 200, 'company'),
      jobTitle: sanitizeText(data.jobTitle, 200, 'jobTitle'),
      notes: data.notes ? sanitizeText(data.notes, 2000, 'notes') : undefined,
      contactEmail: data.contactEmail ? sanitizeEmail(data.contactEmail) : undefined,
      contactPhone: data.contactPhone ? sanitizePhone(data.contactPhone) : undefined,
      contactName: data.contactName ? sanitizeText(data.contactName, 100, 'contactName') : undefined,
      applicationDate: data.applicationDate ? sanitizeDate(data.applicationDate) : undefined,
      status: sanitizeText(data.status || 'applied', 50, 'status')
    };
  } catch (error: any) {
    console.log(`[SECURITY] Job Application SANITIZATION_FAILED: ${error.message}`);
    throw error;
  }
}

export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Remove any HTML first
  const cleaned = DOMPurify.sanitize(email, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+=/gi,
    /data:/gi
  ];

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(cleaned)) {
      console.log(`[SECURITY] Job Application SUSPICIOUS_EMAIL: ${cleaned}`);
      throw new Error('SECURITY_VIOLATION: Suspicious content in email field');
    }
  });
  
  // Validate email format
  if (!validator.isEmail(cleaned)) {
    throw new Error('VALIDATION_ERROR: Invalid email format');
  }
  
  // Additional length check
  if (cleaned.length > 254) {
    throw new Error('VALIDATION_ERROR: Email address too long');
  }
  
  return cleaned.toLowerCase();
}

export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove HTML first
  const cleaned = DOMPurify.sanitize(phone, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
  
  // Check for suspicious patterns
  if (/<script|javascript:|on\w+=/gi.test(cleaned)) {
    console.log(`[SECURITY] Job Application SUSPICIOUS_PHONE: ${cleaned}`);
    throw new Error('SECURITY_VIOLATION: Suspicious content in phone field');
  }
  
  // Allow only digits, spaces, parentheses, hyphens, and plus
  const phoneOnly = cleaned.replace(/[^0-9\s\-\(\)\+\.]/g, '');
  
  // Validate length
  if (phoneOnly.length < 7 || phoneOnly.length > 20) {
    throw new Error('VALIDATION_ERROR: Invalid phone number length');
  }
  
  return phoneOnly;
}

export function sanitizeDate(dateStr: string): string {
  if (!dateStr) return '';
  
  const cleaned = DOMPurify.sanitize(dateStr, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
  
  // Check for suspicious content
  if (/<script|javascript:|on\w+=/gi.test(cleaned)) {
    console.log(`[SECURITY] Job Application SUSPICIOUS_DATE: ${cleaned}`);
    throw new Error('SECURITY_VIOLATION: Suspicious content in date field');
  }
  
  // Validate ISO date format or common date formats
  const isValidDate = validator.isISO8601(cleaned) || 
                     /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ||
                     /^\d{2}\/\d{2}\/\d{4}$/.test(cleaned);
  
  if (!isValidDate) {
    throw new Error('VALIDATION_ERROR: Invalid date format');
  }
  
  return cleaned;
}

// Validate entire job application structure
export function validateJobApplicationStructure(data: any): boolean {
  const requiredFields = ['company', 'jobTitle'];
  const allowedFields = [
    'company', 'jobTitle', 'notes', 'contactEmail', 
    'contactPhone', 'contactName', 'applicationDate', 'status'
  ];

  // Check for required fields
  for (const field of requiredFields) {
    if (!data[field] || typeof data[field] !== 'string' || !data[field].trim()) {
      console.log(`[SECURITY] Job Application MISSING_REQUIRED_FIELD: ${field}`);
      throw new Error(`VALIDATION_ERROR: Required field missing: ${field}`);
    }
  }

  // Check for unexpected fields (potential injection)
  const providedFields = Object.keys(data);
  const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
  
  if (unexpectedFields.length > 0) {
    console.log(`[SECURITY] Job Application UNEXPECTED_FIELDS: ${unexpectedFields.join(', ')}`);
    throw new Error(`VALIDATION_ERROR: Unexpected fields detected: ${unexpectedFields.join(', ')}`);
  }

  return true;
}

// Detection patterns for advanced attacks
export function detectSuspiciousJobApplicationPatterns(data: any): string[] {
  const suspiciousPatterns: string[] = [];
  
  const checkText = (text: string, fieldName: string) => {
    if (!text) return;
    
    // Check for base64 encoded content
    if (/^[A-Za-z0-9+/]+=*$/.test(text) && text.length > 50) {
      suspiciousPatterns.push(`Base64-like content in ${fieldName}`);
    }
    
    // Check for excessive special characters
    const specialCharCount = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
    if (specialCharCount > text.length * 0.3) {
      suspiciousPatterns.push(`Excessive special characters in ${fieldName}`);
    }
    
    // Check for suspicious URLs
    if (/(?:data:|javascript:|vbscript:|file:)/gi.test(text)) {
      suspiciousPatterns.push(`Dangerous URL protocol in ${fieldName}`);
    }
    
    // Check for unicode obfuscation
    if (/[\u0000-\u001f\u007f-\u009f]/g.test(text)) {
      suspiciousPatterns.push(`Control characters detected in ${fieldName}`);
    }
  };
  
  // Check all text fields
  checkText(data.company, 'company');
  checkText(data.jobTitle, 'jobTitle');
  checkText(data.notes, 'notes');
  checkText(data.contactName, 'contactName');
  
  if (suspiciousPatterns.length > 0) {
    console.log(`[SECURITY] Job Application SUSPICIOUS_PATTERNS: ${suspiciousPatterns.join(', ')}`);
  }
  
  return suspiciousPatterns;
} 