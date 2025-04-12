/**
 * Utility functions for sanitizing user input to prevent security issues
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 * This helps prevent XSS attacks and SQL injections
 * @param input The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove script tags and other dangerous HTML
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove or neutralize inline event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  
  // Remove dangerous iframes and objects
  sanitized = sanitized.replace(/<(iframe|object|embed).*?>.*?<\/\1>/gi, '');
  
  // More comprehensive SQL injection protection
  // These patterns could be used in SQL injections
  const sqlPatterns = [
    // SQL commands
    /(\b(select|insert|update|delete|drop|alter|create|exec|union|where|from|having|join)\b\s*)/gi,
    // SQL comment markers
    /(--|#|\/\*)/g,
    // Common SQL injection attempts
    /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi, // '%27 OR, 'OR
    /((\%27)|(\'))union((\%27)|(\'))/gi, // 'union'
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi, // = followed by a quote or comment
    /((\%27)|(\'))order\s+by\s+[0-9]/gi, // 'order by 1--
    /exec(\s|\+)+(s|x)p\w+/gi, // exec sp
    /SLEEP\(\s*\d+\s*\)/gi, // SLEEP()
    /BENCHMARK\(\s*\d+\s*,\s*.+\s*\)/gi, // BENCHMARK()
    /WAITFOR\s+DELAY\s+'\d+:\d+:\d+'/gi, // WAITFOR DELAY
  ];
  
  // Replace all SQL patterns with safe alternatives
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, (match) => `filtered-${match}`);
  });
  
  // Encode HTML entities for extra safety
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\$/g, '&#36;')
    .replace(/`/g, '&#96;');
  
  return sanitized;
}

/**
 * Sanitizes an object by sanitizing all string properties
 * @param obj The object to sanitize
 * @returns A new object with all string properties sanitized
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {} as T;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        result[key] = sanitizeInput(value) as any;
      } else if (Array.isArray(value)) {
        result[key] = value.map((item: any) => 
          typeof item === 'string' ? sanitizeInput(item) : 
          typeof item === 'object' ? sanitizeObject(item) : item
        ) as any;
      } else if (value !== null && typeof value === 'object') {
        result[key] = sanitizeObject(value) as any;
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}