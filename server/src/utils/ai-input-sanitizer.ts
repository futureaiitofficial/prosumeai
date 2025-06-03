import DOMPurify from 'isomorphic-dompurify';

export interface SanitizedAIInput {
  jobDescription: string;
  prompt?: string;
}

export function sanitizeAIInput(data: any): SanitizedAIInput {
  const MAX_JOB_DESCRIPTION = 5000;
  const MAX_PROMPT = 2000;

  // Prompt injection patterns to detect and block
  const promptInjectionPatterns = [
    // Direct instruction overrides
    /ignore\s+(previous|above|all|prior)\s+instructions?/i,
    /forget\s+(everything|all|previous|prior|what\s+you\s+know)/i,
    /disregard\s+(previous|above|all|prior)\s+instructions?/i,
    
    // Role manipulation attempts
    /act\s+as\s+(a\s+)?(different|another|new|admin|system)/i,
    /you\s+are\s+now\s+(a\s+)?(admin|system|different)/i,
    /pretend\s+to\s+be\s+(a\s+)?(different|admin|system)/i,
    /roleplay\s+as\s+(a\s+)?(different|admin|system)/i,
    
    // System prompts and context switching
    /system\s*:\s*/i,
    /assistant\s*:\s*/i,
    /human\s*:\s*/i,
    /user\s*:\s*/i,
    /\[system\]/i,
    /\[assistant\]/i,
    /\[human\]/i,
    /\[user\]/i,
    
    // Task redirection
    /instead\s+of\s+(analyzing|extracting|processing)/i,
    /rather\s+than\s+(analyzing|extracting|processing)/i,
    /don't\s+(analyze|extract|process)/i,
    /stop\s+(analyzing|extracting|processing)/i,
    /quit\s+(analyzing|extracting|processing)/i,
    
    // Data extraction attempts
    /return\s+.*\s+instead/i,
    /give\s+me\s+(your|the)\s+(instructions|prompt|system)/i,
    /what\s+(are\s+your|is\s+your)\s+(instructions|prompt|system)/i,
    /show\s+me\s+(your|the)\s+(instructions|prompt|system)/i,
    /reveal\s+(your|the)\s+(instructions|prompt|system)/i,
    
    // Injection markers
    /```\s*(system|assistant|human|user)/i,
    /---\s*(system|assistant|human|user)/i,
    /##\s*(system|assistant|human|user)/i,
    
    // Harmful content generation
    /generate\s+(malicious|harmful|dangerous)/i,
    /create\s+(malicious|harmful|dangerous)/i,
    /write\s+(malicious|harmful|dangerous)/i,
    
    // Escape sequences and encoding
    /\\n\\n/,
    /\\r\\n/,
    /&#x?\d+;/,
    /%[0-9a-f]{2}/i,
    
    // Suspicious formatting
    /\{[\w\s]*system[\w\s]*\}/i,
    /\{[\w\s]*admin[\w\s]*\}/i,
    /\{[\w\s]*override[\w\s]*\}/i
  ];

  // Additional dangerous patterns for content safety
  const dangerousContentPatterns = [
    // Code injection attempts
    /<script[^>]*>/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /file:/i,
    
    // SQL injection in AI context
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    
    // Suspicious Unicode
    /[\u0000-\u001f\u007f-\u009f]/,
    /[\ufeff\u200b-\u200d\ufeff]/,
    
    // Base64 that might contain malicious payloads
    /data:.*base64/i
  ];

  const sanitizeJobDescription = (text: string): string => {
    if (!text) {
      throw new Error('VALIDATION_ERROR: Job description is required');
    }

    // Trim and basic validation
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new Error('VALIDATION_ERROR: Job description cannot be empty');
    }

    // Check for prompt injection attempts
    promptInjectionPatterns.forEach((pattern, index) => {
      if (pattern.test(trimmed)) {
        console.log(`[SECURITY] AI Input PROMPT_INJECTION_ATTEMPT (pattern ${index + 1}): ${trimmed.substring(0, 100)}...`);
        throw new Error('SECURITY_VIOLATION: Prompt injection attempt detected');
      }
    });

    // Check for dangerous content
    dangerousContentPatterns.forEach((pattern, index) => {
      if (pattern.test(trimmed)) {
        console.log(`[SECURITY] AI Input DANGEROUS_CONTENT (pattern ${index + 1}): ${trimmed.substring(0, 100)}...`);
        throw new Error('SECURITY_VIOLATION: Dangerous content detected');
      }
    });

    // Remove HTML tags completely for AI input
    const cleaned = DOMPurify.sanitize(trimmed, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

    // Length validation
    if (cleaned.length > MAX_JOB_DESCRIPTION) {
      console.log(`[SECURITY] AI Input JOB_DESCRIPTION_TOO_LONG: ${cleaned.length}/${MAX_JOB_DESCRIPTION} characters`);
      throw new Error(`VALIDATION_ERROR: Job description too long (${cleaned.length}/${MAX_JOB_DESCRIPTION})`);
    }

    if (cleaned.length < 50) {
      throw new Error('VALIDATION_ERROR: Job description too short for analysis (minimum 50 characters)');
    }

    // Check for repetitive content (potential DoS)
    const uniqueChars = new Set(cleaned.toLowerCase()).size;
    if (uniqueChars < 10 && cleaned.length > 100) {
      console.log(`[SECURITY] AI Input REPETITIVE_CONTENT: Only ${uniqueChars} unique characters in ${cleaned.length} character text`);
      throw new Error('VALIDATION_ERROR: Content appears to be repetitive or low-quality');
    }

    return cleaned;
  };

  const sanitizePrompt = (text: string): string => {
    if (!text) return '';

    const trimmed = text.trim();

    // Check for prompt injection in general prompts
    promptInjectionPatterns.forEach((pattern, index) => {
      if (pattern.test(trimmed)) {
        console.log(`[SECURITY] AI Input PROMPT_INJECTION in prompt (pattern ${index + 1}): ${trimmed.substring(0, 50)}...`);
        throw new Error('SECURITY_VIOLATION: Prompt injection detected in AI request');
      }
    });

    // Check for dangerous content in prompts
    dangerousContentPatterns.forEach(pattern => {
      if (pattern.test(trimmed)) {
        console.log(`[SECURITY] AI Input DANGEROUS_CONTENT in prompt: ${trimmed.substring(0, 50)}...`);
        throw new Error('SECURITY_VIOLATION: Dangerous content in prompt');
      }
    });

    // Remove HTML
    const cleaned = DOMPurify.sanitize(trimmed, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

    if (cleaned.length > MAX_PROMPT) {
      console.log(`[SECURITY] AI Input PROMPT_TOO_LONG: ${cleaned.length}/${MAX_PROMPT} characters`);
    }

    return cleaned.slice(0, MAX_PROMPT);
  };

  try {
    const result = {
      jobDescription: sanitizeJobDescription(data.jobDescription),
      prompt: data.prompt ? sanitizePrompt(data.prompt) : undefined
    };

    console.log(`[SECURITY] AI Input successfully sanitized: ${result.jobDescription.length} chars, prompt: ${result.prompt ? result.prompt.length : 0} chars`);
    return result;
  } catch (error: any) {
    console.log(`[SECURITY] AI Input SANITIZATION_FAILED: ${error.message}`);
    throw error;
  }
}

// Sanitize AI response before sending to client
export function sanitizeAIResponse(response: any): any {
  if (typeof response === 'string') {
    // Remove any potential script injections from AI responses
    const cleaned = DOMPurify.sanitize(response, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
    
    // Additional checks for AI-generated malicious content
    const suspiciousPatterns = [
      /<script/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi
    ];
    
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(cleaned)) {
        console.log(`[SECURITY] AI Response SUSPICIOUS_CONTENT_REMOVED: ${cleaned.substring(0, 50)}...`);
        return cleaned.replace(pattern, '[REMOVED]');
      }
    });
    
    return cleaned;
  }

  if (Array.isArray(response)) {
    return response.map(item => sanitizeAIResponse(item));
  }

  if (typeof response === 'object' && response !== null) {
    const sanitized: any = {};
    Object.keys(response).forEach(key => {
      // Validate that the key is expected
      const allowedKeys = [
        'technicalSkills', 'softSkills', 'education', 'responsibilities',
        'industryTerms', 'tools', 'certifications', 'keywords', 'skills'
      ];
      
      if (allowedKeys.includes(key)) {
        sanitized[key] = sanitizeAIResponse(response[key]);
      } else {
        console.log(`[SECURITY] AI Response UNEXPECTED_FIELD_REMOVED: ${key}`);
      }
    });
    return sanitized;
  }

  return response;
}

// Validate that AI response structure is safe
export function validateAIResponseStructure(response: any): boolean {
  const expectedStructure = {
    technicalSkills: 'array',
    softSkills: 'array',
    education: 'array',
    responsibilities: 'array',
    industryTerms: 'array',
    tools: 'array',
    certifications: 'array'
  };

  // Check that response is an object
  if (typeof response !== 'object' || response === null) {
    console.log('[SECURITY] AI Response INVALID_STRUCTURE: Not an object');
    throw new Error('VALIDATION_ERROR: Invalid AI response structure');
  }

  // Check each expected field
  for (const [field, expectedType] of Object.entries(expectedStructure)) {
    if (response[field] !== undefined) {
      if (expectedType === 'array' && !Array.isArray(response[field])) {
        console.log(`[SECURITY] AI Response INVALID_FIELD_TYPE: ${field} should be array`);
        throw new Error(`VALIDATION_ERROR: Field ${field} should be an array`);
      }
      
      // Validate array contents if it's an array
      if (Array.isArray(response[field])) {
        if (response[field].length > 100) {
          console.log(`[SECURITY] AI Response ARRAY_TOO_LARGE: ${field} has ${response[field].length} items`);
          throw new Error(`VALIDATION_ERROR: Too many items in ${field}`);
        }
        
        // Check each item in the array
        response[field].forEach((item: any, index: number) => {
          if (typeof item !== 'string') {
            console.log(`[SECURITY] AI Response INVALID_ARRAY_ITEM: ${field}[${index}] is not a string`);
            throw new Error(`VALIDATION_ERROR: Invalid item type in ${field}`);
          }
          
          if (item.length > 200) {
            console.log(`[SECURITY] AI Response ITEM_TOO_LONG: ${field}[${index}] is ${item.length} characters`);
            throw new Error(`VALIDATION_ERROR: Item too long in ${field}`);
          }
        });
      }
    }
  }

  return true;
}

// Create a safe wrapper for AI input
export function createSafeAIPrompt(jobDescription: string, analysisType: string = 'general'): string {
  // Pre-sanitize the job description
  const sanitized = sanitizeAIInput({ jobDescription });
  
  // Create a safe prompt template that's resistant to injection
  const safePrompts = {
    keyword_extraction: `As a professional resume optimization expert, extract relevant keywords from the following job description. Focus only on skills, technologies, qualifications, and job-related terms. Return only a JSON object with categorized arrays.

Job Description (sanitized input):
${sanitized.jobDescription}

Respond only with valid JSON in this exact format:
{
  "technicalSkills": [],
  "softSkills": [],
  "tools": [],
  "certifications": [],
  "education": [],
  "industryTerms": []
}`,
    
    general: `Analyze the following job description and extract relevant professional information. Focus on job-related content only.

Job Description:
${sanitized.jobDescription}

Provide a structured analysis focusing on professional requirements and qualifications.`
  };
  
  return safePrompts[analysisType as keyof typeof safePrompts] || safePrompts.general;
} 