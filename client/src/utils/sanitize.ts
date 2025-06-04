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
  
  // More specific SQL injection protection (less broad patterns)
  const sqlPatterns = [
    // Actual SQL injection attempts (more specific)
    /'\s*(or|and)\s*'?\s*'?\s*(=|1=1|true)/gi, // ' OR '1'='1 or ' AND true
    /'\s*(union\s+select|select\s+\*\s+from)/gi, // ' UNION SELECT or SELECT * FROM
    /;\s*(drop|delete|truncate|alter)\s+/gi, // ; DROP TABLE etc
    /(--|#|\/\*)/g, // SQL comment markers
    /exec(\s|\+)+(s|x)p\w+/gi, // exec sp
    /SLEEP\(\s*\d+\s*\)/gi, // SLEEP()
    /BENCHMARK\(\s*\d+\s*,\s*.+\s*\)/gi, // BENCHMARK()
    /WAITFOR\s+DELAY\s+'\d+:\d+:\d+'/gi, // WAITFOR DELAY
  ];
  
  // Replace all SQL patterns with safe alternatives
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, (match) => `filtered-${match}`);
  });
  
  // Only encode dangerous HTML entities (be more selective)
  sanitized = sanitized
    .replace(/<script/gi, '&lt;script')
    .replace(/<\/script>/gi, '&lt;/script&gt;')
    .replace(/javascript:/gi, 'javascript-filtered:')
    .replace(/vbscript:/gi, 'vbscript-filtered:')
    .replace(/data:text\/html/gi, 'data-filtered:text/html');
  
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