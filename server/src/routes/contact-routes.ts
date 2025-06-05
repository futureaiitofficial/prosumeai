import { Express, Request, Response } from "express";
import { db } from "../../config/db";
import { smtpSettings, brandingSettings } from "@shared/schema";
import * as nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import validator from "validator";

// Rate limiter specifically for contact form
const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 contact form submissions per windowMs
  message: {
    error: "TOO_MANY_REQUESTS",
    message: "Too many contact form submissions. Please wait 15 minutes before trying again."
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests in count
  skipSuccessfulRequests: true,
  // Custom key generator to include user agent for better tracking
  keyGenerator: (req: Request) => {
    return `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
  }
});

// Additional rate limiter for captcha requests to prevent abuse
const captchaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 captcha requests per 5 minutes per IP
  message: {
    error: "TOO_MANY_CAPTCHA_REQUESTS",
    message: "Too many captcha requests. Please wait a moment."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schema using Zod
const contactFormSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-\.\']+$/, "Name contains invalid characters"),
  
  email: z.string()
    .min(1, "Email is required")
    .max(254, "Email must be less than 254 characters")
    .email("Invalid email format")
    .refine((email) => validator.isEmail(email), "Invalid email format"),
  
  subject: z.enum(["general", "support", "billing", "partnership", "other"], {
    errorMap: () => ({ message: "Invalid subject selection" })
  }),
  
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be less than 5000 characters"),
  
  // Honeypot field - should be empty
  website: z.string().optional().refine((val) => !val || val === "", "Bot detected"),
  
  // Simple math captcha
  mathAnswer: z.number()
    .int("Math answer must be an integer")
    .min(0, "Math answer must be positive")
    .max(20, "Math answer seems incorrect"),
  
  // CSRF-like protection - form timestamp
  formTimestamp: z.number()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const now = Date.now();
      const timeDiff = now - val;
      // Form should be filled for at least 3 seconds but not more than 30 minutes
      return timeDiff >= 3000 && timeDiff <= 30 * 60 * 1000;
    }, "Form submission timing is suspicious")
});

// Define BrandingSettings interface
interface BrandingSettings {
  appName: string;
  appTagline: string;
  logoUrl: string;
  faviconUrl: string;
  enableDarkMode: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  footerText: string;
  customCss?: string;
  customJs?: string;
}

// Contact form data interface
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
  mathAnswer?: number;
  formTimestamp?: number;
}

// Enhanced security logging
function logSecurityEvent(event: string, details: any, req: Request) {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    origin: req.get('Origin'),
    details,
    sessionId: req.sessionID
  };
  
  console.log(`[SECURITY] ${event}:`, JSON.stringify(securityLog, null, 2));
  
  // In production, you might want to send this to a security monitoring service
  // or store in a dedicated security log table
}

// Input sanitization function
function sanitizeInput(input: string): string {
  // Remove any HTML tags and dangerous characters
  let sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
  
  // Additional sanitization
  sanitized = validator.escape(sanitized);
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

// Validate email more thoroughly
function validateEmail(email: string): boolean {
  // Basic format check
  if (!validator.isEmail(email)) {
    return false;
  }
  
  // Check for common disposable email domains
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
    'mailinator.com', 'trash-mail.com', 'temp-mail.org',
    'throwaway.email', 'getnada.com', 'maildrop.cc', 
    'sharklasers.com', 'guerrillamailblock.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return false;
  }
  
  // Check for suspicious patterns
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return false;
  }
  
  // Check for suspicious character combinations
  if (/[<>{}[\]\\|;:&$%@"'*()?+=]/.test(email.split('@')[0])) {
    return false;
  }
  
  return true;
}

// Check for suspicious content patterns
function detectSuspiciousContent(text: string): boolean {
  const suspiciousPatterns = [
    // SQL injection patterns
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s/i,
    // Script injection patterns
    /<script|javascript:|on\w+\s*=/i,
    // Command injection patterns
    /(\||&|;|`|\$\()/,
    // Excessive repeated characters (potential spam)
    /(.)\1{10,}/,
    // Multiple URLs (potential spam)
    /(https?:\/\/[^\s]+.*){3,}/i,
    // Common spam phrases
    /(viagra|cialis|pharmacy|casino|poker|lottery|winner|congratulations|million dollars)/i,
    // Suspicious file extensions
    /\.(exe|bat|cmd|scr|vbs|jar|com|pif)/i,
    // Common XSS attempts
    /(alert\(|confirm\(|prompt\(|document\.)/i,
    // Base64 encoded content (often used in attacks)
    /[a-zA-Z0-9+\/]{50,}={0,2}/
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(text));
}

// Check for suspicious request headers
function validateRequestHeaders(req: Request): { valid: boolean; reason?: string } {
  // Check for missing or suspicious User-Agent
  const userAgent = req.get('User-Agent');
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, reason: 'Missing or suspicious User-Agent' };
  }
  
  // Check for suspicious User-Agent patterns (bots, scanners)
  const suspiciousUAPatterns = [
    /curl|wget|python-requests|java\/|bot|crawler|spider|scraper/i,
    /automated|script|tool|scanner|nikto|sqlmap/i
  ];
  
  if (suspiciousUAPatterns.some(pattern => pattern.test(userAgent))) {
    return { valid: false, reason: 'Automated tool detected' };
  }
  
  // Check Accept header - be more lenient for API requests
  const accept = req.get('Accept');
  if (!accept) {
    return { valid: false, reason: 'Missing Accept header' };
  }
  
  // For API endpoints, accept common fetch headers
  const validAcceptPatterns = [
    'text/html',           // Browser navigation
    'application/json',    // API requests
    '*/*',                 // Fetch default
    'application/*',       // Generic application types
    'text/*'               // Generic text types
  ];
  
  const hasValidAccept = validAcceptPatterns.some(pattern => {
    if (pattern.includes('*')) {
      // Handle wildcard patterns
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(accept);
    }
    return accept.includes(pattern);
  });
  
  if (!hasValidAccept) {
    return { valid: false, reason: 'Invalid Accept header' };
  }
  
  return { valid: true };
}

// Generate simple math captcha
function generateMathCaptcha(): { question: string; answer: number } {
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let num1: number, num2: number, answer: number;
  
  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 10) + 5; // Ensure positive result
      num2 = Math.floor(Math.random() * 5) + 1;
      answer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 5) + 1;
      num2 = Math.floor(Math.random() * 5) + 1;
      answer = num1 * num2;
      break;
    default:
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 + num2;
  }
  
  return {
    question: `What is ${num1} ${operation} ${num2}?`,
    answer
  };
}

// Beautiful HTML email template for contact form submissions
const getContactEmailTemplate = (formData: ContactFormData, branding: BrandingSettings) => {
  const primaryColor = branding?.primaryColor || "#4f46e5";
  const secondaryColor = branding?.secondaryColor || "#10b981";
  const appName = branding?.appName || "atScribe";
  const logoUrl = branding?.logoUrl || "/logo.png";
  const footerText = branding?.footerText || "© 2023 atScribe. All rights reserved.";

  // Use absolute URL for logo
  const baseUrl = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || "http://localhost:3000";
  const absoluteLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f5f7fa;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      .header {
        background-color: ${primaryColor};
        color: white;
        padding: 20px;
        text-align: center;
      }
      .logo {
        max-height: 60px;
        margin-bottom: 10px;
      }
      .content {
        padding: 30px 20px;
      }
      .footer {
        background-color: #f5f5f5;
        padding: 15px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .info-box {
        background-color: #f0f9ff;
        border-left: 4px solid ${primaryColor};
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .message-box {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 20px;
        margin: 20px 0;
        border-radius: 6px;
      }
      .highlight {
        color: ${primaryColor};
        font-weight: bold;
      }
      .divider {
        height: 1px;
        background-color: #eaeaea;
        margin: 25px 0;
      }
      .contact-details {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        margin: 20px 0;
      }
      .detail-item {
        flex-basis: 48%;
        margin-bottom: 15px;
      }
      .detail-label {
        font-weight: bold;
        color: ${primaryColor};
        margin-bottom: 5px;
      }
      .detail-value {
        color: #555;
      }
      .priority-banner {
        background-color: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 12px;
        margin: 15px 0;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <img src="${absoluteLogoUrl}" alt="${appName} Logo" class="logo">
        <h1>📬 New Contact Form Submission</h1>
      </div>
      <div class="content">
        <div class="info-box">
          <h2>📝 Contact Form Details</h2>
          <p>A new message has been received through the ${appName} contact form.</p>
        </div>
        
        <div class="contact-details">
          <div class="detail-item">
            <div class="detail-label">👤 Name:</div>
            <div class="detail-value">${validator.escape(formData.name)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">📧 Email:</div>
            <div class="detail-value">${validator.escape(formData.email)}</div>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">📋 Subject:</div>
          <div class="detail-value">${validator.escape(formData.subject)}</div>
        </div>
        
        <div class="divider"></div>
        
        <h3>💬 Message Content:</h3>
        <div class="message-box">
          <p style="margin: 0; white-space: pre-wrap;">${validator.escape(formData.message)}</p>
        </div>
        
        <div class="priority-banner">
          <strong>⚡ Action Required:</strong> Please respond to this inquiry within 24 hours to maintain excellent customer service.
        </div>
        
        <div class="divider"></div>
        
        <h3>📊 Next Steps:</h3>
        <ul>
          <li>Review the message content above</li>
          <li>Reply directly to <strong>${validator.escape(formData.email)}</strong></li>
          <li>Log this inquiry in your support system</li>
          <li>Follow up if needed within 24-48 hours</li>
        </ul>
        
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <div class="footer">
        <p>${footerText}</p>
        <p>This is an automated message from the ${appName} contact form.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Auto-reply email template for the person who submitted the form
const getAutoReplyTemplate = (formData: ContactFormData, branding: BrandingSettings) => {
  const primaryColor = branding?.primaryColor || "#4f46e5";
  const secondaryColor = branding?.secondaryColor || "#10b981";
  const appName = branding?.appName || "atScribe";
  const logoUrl = branding?.logoUrl || "/logo.png";
  const footerText = branding?.footerText || "© 2023 atScribe. All rights reserved.";

  // Use absolute URL for logo
  const baseUrl = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || "http://localhost:3000";
  const absoluteLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank you for contacting ${appName}</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f5f7fa;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      .header {
        background-color: ${primaryColor};
        color: white;
        padding: 20px;
        text-align: center;
      }
      .logo {
        max-height: 60px;
        margin-bottom: 10px;
      }
      .content {
        padding: 30px 20px;
      }
      .footer {
        background-color: #f5f5f5;
        padding: 15px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .success-box {
        background-color: #ecfdf5;
        border-left: 4px solid ${secondaryColor};
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .highlight {
        color: ${primaryColor};
        font-weight: bold;
      }
      .button {
        display: inline-block;
        background-color: ${secondaryColor};
        color: white;
        text-decoration: none;
        padding: 12px 25px;
        border-radius: 4px;
        margin: 15px 0;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <img src="${absoluteLogoUrl}" alt="${appName} Logo" class="logo">
        <h1>✅ Message Received!</h1>
      </div>
      <div class="content">
        <h2>Hi ${validator.escape(formData.name)},</h2>
        
        <div class="success-box">
          <h3>🎉 Thank you for reaching out!</h3>
          <p>We've successfully received your message and our support team will review it shortly.</p>
        </div>
        
        <p>Here's a summary of your inquiry:</p>
        <ul>
          <li><strong>Subject:</strong> ${validator.escape(formData.subject)}</li>
          <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        
        <h3>What's Next?</h3>
        <p>Our team typically responds to inquiries within <span class="highlight">24 hours</span>. We'll send our response directly to <strong>${validator.escape(formData.email)}</strong>.</p>
        
        <p>In the meantime, you might find these resources helpful:</p>
        <ul>
          <li><a href="${baseUrl}/pricing" style="color: ${primaryColor};">View our pricing plans</a></li>
          <li><a href="${baseUrl}/about" style="color: ${primaryColor};">Learn more about ${appName}</a></li>
          <li><a href="${baseUrl}/register" style="color: ${primaryColor};">Create your free account</a></li>
        </ul>
        
        <a href="${baseUrl}" class="button">Visit ${appName}</a>
        
        <p>If you have any urgent questions, please don't hesitate to reach out again.</p>
        
        <p>Best regards,<br>
        The ${appName} Support Team</p>
      </div>
      <div class="footer">
        <p>${footerText}</p>
        <p>You're receiving this because you contacted us through our website.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Registers contact form routes with comprehensive security protection
 */
export function registerContactRoutes(app: Express) {
  // Get math captcha question with rate limiting
  app.get("/api/contact/captcha", captchaLimiter, (req: Request, res: Response) => {
    try {
      // Validate request headers
      const headerValidation = validateRequestHeaders(req);
      if (!headerValidation.valid) {
        logSecurityEvent('SUSPICIOUS_CAPTCHA_REQUEST', {
          reason: headerValidation.reason,
          headers: {
            userAgent: req.get('User-Agent'),
            accept: req.get('Accept'),
            referer: req.get('Referer')
          }
        }, req);
        
        return res.status(400).json({
          error: "INVALID_REQUEST",
          message: "Invalid request headers"
        });
      }

      const captcha = generateMathCaptcha();
      
      // Store answer in session for verification
      req.session.mathCaptchaAnswer = captcha.answer;
      
      res.json({
        question: captcha.question,
        timestamp: Date.now() // For form timing validation
      });
    } catch (error) {
      console.error('Error generating captcha:', error);
      res.status(500).json({
        error: "CAPTCHA_ERROR",
        message: "Unable to generate security question"
      });
    }
  });

  // Handle contact form submission with comprehensive security
  app.post("/api/contact", contactFormLimiter, async (req: Request, res: Response) => {
    const submissionStartTime = Date.now();
    
    try {
      // Validate request headers first
      const headerValidation = validateRequestHeaders(req);
      if (!headerValidation.valid) {
        logSecurityEvent('SUSPICIOUS_FORM_SUBMISSION', {
          reason: headerValidation.reason,
          headers: {
            userAgent: req.get('User-Agent'),
            accept: req.get('Accept'),
            referer: req.get('Referer'),
            origin: req.get('Origin')
          }
        }, req);
        
        return res.status(400).json({ 
          message: "Invalid request",
          error: "INVALID_HEADERS"
        });
      }
      
      // Parse and validate request body
      let validatedData: any;
      
      try {
        validatedData = contactFormSchema.parse(req.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.errors[0];
          
          logSecurityEvent('FORM_VALIDATION_FAILED', {
            errors: error.errors,
            formData: {
              nameLength: req.body.name?.length || 0,
              emailFormat: req.body.email,
              messageLength: req.body.message?.length || 0
            }
          }, req);
          
          return res.status(400).json({ 
            message: firstError.message,
            error: "VALIDATION_ERROR",
            field: firstError.path[0]
          });
        }
        return res.status(400).json({ 
          message: "Invalid request data",
          error: "INVALID_DATA"
        });
      }
      
      const { name, email, subject, message, website, mathAnswer, formTimestamp } = validatedData;
      
      // Honeypot check - if website field is filled, it's likely a bot
      if (website && website.trim() !== '') {
        logSecurityEvent('BOT_DETECTED', {
          reason: 'Honeypot field filled',
          honeypotValue: website,
          email: email
        }, req);
        
        console.log(`Bot detected: honeypot field filled with "${website}"`);
        return res.status(400).json({ 
          message: "Invalid request",
          error: "BOT_DETECTED"
        });
      }
      
      // Math captcha verification
      if (!req.session.mathCaptchaAnswer || mathAnswer !== req.session.mathCaptchaAnswer) {
        logSecurityEvent('CAPTCHA_FAILED', {
          providedAnswer: mathAnswer,
          expectedAnswer: req.session.mathCaptchaAnswer,
          email: email
        }, req);
        
        return res.status(400).json({ 
          message: "Math verification failed. Please try again.",
          error: "CAPTCHA_FAILED"
        });
      }
      
      // Clear the captcha answer from session
      delete req.session.mathCaptchaAnswer;
      
      // Form timing validation
      if (formTimestamp) {
        const timeDiff = submissionStartTime - formTimestamp;
        if (timeDiff < 3000) {
          logSecurityEvent('FORM_SUBMITTED_TOO_FAST', {
            timeDifference: timeDiff,
            email: email
          }, req);
          
          return res.status(400).json({ 
            message: "Please take your time filling out the form",
            error: "TOO_FAST"
          });
        }
      }
      
      // Sanitize all input fields
      const sanitizedData = {
        name: sanitizeInput(name),
        email: email.toLowerCase().trim(),
        subject: sanitizeInput(subject),
        message: sanitizeInput(message)
      };
      
      // Additional email validation
      if (!validateEmail(sanitizedData.email)) {
        logSecurityEvent('INVALID_EMAIL', {
          email: sanitizedData.email,
          reason: 'Failed email validation'
        }, req);
        
        return res.status(400).json({ 
          message: "Please provide a valid email address",
          error: "INVALID_EMAIL"
        });
      }
      
      // Check for suspicious content
      const allText = `${sanitizedData.name} ${sanitizedData.message}`;
      if (detectSuspiciousContent(allText)) {
        logSecurityEvent('SUSPICIOUS_CONTENT', {
          email: sanitizedData.email,
          nameLength: sanitizedData.name.length,
          messageLength: sanitizedData.message.length,
          suspiciousText: allText.substring(0, 200) // Only log first 200 chars
        }, req);
        
        console.log(`Suspicious content detected in contact form from ${sanitizedData.email}`);
        return res.status(400).json({ 
          message: "Message contains prohibited content",
          error: "SUSPICIOUS_CONTENT"
        });
      }
      
      // Prevent extremely fast submissions (likely bots)
      const submissionTime = Date.now() - submissionStartTime;
      if (submissionTime < 1000) { // Less than 1 second
        logSecurityEvent('SUSPICIOUSLY_FAST_SUBMISSION', {
          submissionTime: submissionTime,
          email: sanitizedData.email
        }, req);
        
        console.log(`Suspiciously fast submission: ${submissionTime}ms from ${sanitizedData.email}`);
        return res.status(400).json({ 
          message: "Please take your time filling out the form",
          error: "TOO_FAST"
        });
      }
      
      // Get SMTP settings
      const settings = await db.select().from(smtpSettings).limit(1);
      
      if (settings.length === 0) {
        console.error("SMTP settings not found");
        return res.status(500).json({ 
          message: "Email service is not configured. Please try again later.",
          error: "SMTP_NOT_CONFIGURED"
        });
      }
      
      const smtpConfig = settings[0];
      
      if (!smtpConfig.enabled) {
        console.error("SMTP is not enabled");
        return res.status(500).json({ 
          message: "Email service is currently disabled. Please try again later.",
          error: "SMTP_DISABLED"
        });
      }
      
      if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
        console.error("SMTP configuration is incomplete");
        return res.status(500).json({ 
          message: "Email service configuration is incomplete. Please try again later.",
          error: "SMTP_INCOMPLETE"
        });
      }
      
      // Get branding settings
      const brandingData = await db.select().from(brandingSettings).limit(1);
      
      let branding: BrandingSettings;
      if (brandingData.length > 0) {
        branding = brandingData[0] as BrandingSettings;
      } else {
        // Default branding if not available in database
        branding = {
          appName: "atScribe",
          appTagline: "AI-powered resume and career tools",
          logoUrl: "/logo.png",
          faviconUrl: "/favicon.ico",
          enableDarkMode: true,
          primaryColor: "#4f46e5",
          secondaryColor: "#10b981",
          accentColor: "#f97316",
          footerText: "© 2023 atScribe. All rights reserved."
        };
      }
      
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: parseInt(smtpConfig.port),
        secure: smtpConfig.encryption === 'ssl',
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      const formData: ContactFormData = sanitizedData;
      
      // Generate email templates
      const supportEmailTemplate = getContactEmailTemplate(formData, branding);
      const autoReplyTemplate = getAutoReplyTemplate(formData, branding);
      
      const appName = branding.appName || "atScribe";
      const supportEmail = `support@${appName.toLowerCase()}.com`;
      
      try {
        // Send email to support team
        await transporter.sendMail({
          from: `"${smtpConfig.senderName}" <${smtpConfig.senderEmail}>`,
          to: supportEmail,
          replyTo: sanitizedData.email, // Allow support to reply directly to the sender
          subject: `[${appName} Contact] ${sanitizedData.subject}`,
          text: `New contact form submission from ${sanitizedData.name} (${sanitizedData.email})\n\nSubject: ${sanitizedData.subject}\n\nMessage:\n${sanitizedData.message}`,
          html: supportEmailTemplate
        });
        
        // Send auto-reply to the person who submitted the form
        await transporter.sendMail({
          from: `"${appName} Support" <${smtpConfig.senderEmail}>`,
          to: sanitizedData.email,
          subject: `Thank you for contacting ${appName}`,
          text: `Hi ${sanitizedData.name},\n\nThank you for reaching out! We've received your message and will respond within 24 hours.\n\nBest regards,\nThe ${appName} Support Team`,
          html: autoReplyTemplate
        });
        
        // Log successful submission
        logSecurityEvent('CONTACT_FORM_SUCCESS', {
          email: sanitizedData.email,
          subject: sanitizedData.subject,
          nameLength: sanitizedData.name.length,
          messageLength: sanitizedData.message.length,
          processingTime: Date.now() - submissionStartTime
        }, req);
        
        console.log(`Contact form submission processed successfully: ${sanitizedData.name} (${sanitizedData.email}) - ${sanitizedData.subject}`);
        
        return res.json({ 
          message: "Your message has been sent successfully! We'll get back to you within 24 hours.",
          success: true
        });
        
      } catch (emailError: any) {
        logSecurityEvent('EMAIL_SEND_FAILED', {
          email: sanitizedData.email,
          error: emailError.message
        }, req);
        
        console.error("Error sending contact form emails:", emailError);
        return res.status(500).json({ 
          message: "There was an issue sending your message. Please try again later.",
          error: "EMAIL_SEND_FAILED"
        });
      }
      
    } catch (error: any) {
      logSecurityEvent('CONTACT_FORM_ERROR', {
        error: error.message,
        stack: error.stack
      }, req);
      
      console.error("Error processing contact form:", error);
      return res.status(500).json({ 
        message: "An unexpected error occurred. Please try again later.",
        error: "INTERNAL_ERROR"
      });
    }
  });
} 