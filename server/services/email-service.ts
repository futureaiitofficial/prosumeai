// Import nodemailer using correct ES module syntax
import * as nodemailer from "nodemailer";
import { db } from '../config/db';
import { smtpSettings, brandingSettings, emailTemplates, users } from '@shared/schema';
import { eq, and } from "drizzle-orm";

// Import the BrandingSettings type from the branding provider
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

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailTemplateData {
  templateType: string;
  variables: Record<string, string | number | boolean | null>;
}

// Template processor function to replace variables in templates
function processTemplate(template: string, variables: Record<string, string | number | boolean | null>): string {
  return template.replace(/{{(\w+)}}/g, (match, variable) => {
    return variables[variable] !== undefined ? String(variables[variable]) : match;
  });
}

// Password reset email template
const getPasswordResetTemplate = (username: string, resetLink: string, branding: BrandingSettings) => {
  const primaryColor = branding?.primaryColor || "#4f46e5";
  const secondaryColor = branding?.secondaryColor || "#10b981";
  const appName = branding?.appName || "atScribe";
  const logoUrl = branding?.logoUrl || "/logo.png";
  const footerText = branding?.footerText || "© 2025 atScribe. All rights reserved.";

  // Use absolute URL for logo - prioritize production environment variables
  const baseUrl = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || "http://localhost:5173";
  const absoluteLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
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
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        display: inline-block;
        background-color: ${secondaryColor};
        color: white;
        text-decoration: none;
        padding: 14px 30px;
        border-radius: 4px;
        font-weight: bold;
      }
      .alert-box {
        background-color: #fff8e6;
        border-left: 4px solid #f59e0b;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .divider {
        height: 1px;
        background-color: #eaeaea;
        margin: 25px 0;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <img src="${absoluteLogoUrl}" alt="${appName} Logo" class="logo">
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <h2>Hello ${username},</h2>
        
        <p>We received a request to reset your password for your ${appName} account. If you did not make this request, you can safely ignore this email.</p>
        
        <div class="button-container">
          <a href="${resetLink}" class="button">Reset Your Password</a>
        </div>
        
        <p>This password reset link will expire in 24 hours for security reasons.</p>
        
        <div class="alert-box">
          <p><strong>Security Tip:</strong> Never share your password with anyone. ${appName} support team will never ask for your password.</p>
        </div>
        
        <div class="divider"></div>
        
        <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; font-size: 14px; color: #666;">${resetLink}</p>
      </div>
      <div class="footer">
        <p>${footerText}</p>
        <p>If you didn't request this password reset, please contact support immediately.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Welcome email template
const getWelcomeTemplate = (username: string, branding: BrandingSettings) => {
  const primaryColor = branding?.primaryColor || "#4f46e5";
  const secondaryColor = branding?.secondaryColor || "#10b981";
  const accentColor = branding?.accentColor || "#f97316";
  const appName = branding?.appName || "atScribe";
  const appTagline = branding?.appTagline || "AI-powered resume and career tools";
  const logoUrl = branding?.logoUrl || "/logo.png";
  const footerText = branding?.footerText || "© 2023 atScribe. All rights reserved.";

  // Use absolute URL for logo - prioritize production environment variables
  const baseUrl = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || "http://localhost:5173";
  const absoluteLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${appName}!</title>
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
        padding: 30px 20px;
        text-align: center;
      }
      .logo {
        max-height: 70px;
        margin-bottom: 15px;
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
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        display: inline-block;
        background-color: ${secondaryColor};
        color: white;
        text-decoration: none;
        padding: 14px 30px;
        border-radius: 4px;
        font-weight: bold;
      }
      .feature-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        margin: 30px 0;
      }
      .feature {
        flex-basis: 48%;
        margin-bottom: 20px;
        padding: 15px;
        background-color: #f9f9f9;
        border-radius: 6px;
      }
      .feature-title {
        color: ${primaryColor};
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 16px;
      }
      .divider {
        height: 1px;
        background-color: #eaeaea;
        margin: 25px 0;
      }
      .tagline {
        font-style: italic;
        color: #888;
        text-align: center;
        margin: 20px 0;
      }
      h1 {
        margin: 5px 0;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <img src="${absoluteLogoUrl}" alt="${appName} Logo" class="logo">
        <h1>Welcome to ${appName}!</h1>
        <p>${appTagline}</p>
      </div>
      <div class="content">
        <h2>Hello ${username},</h2>
        
        <p>Thank you for joining ${appName}! We're excited to have you on board and can't wait to help you advance your career with our powerful tools.</p>
        
        <div class="button-container">
          <a href="${baseUrl}/dashboard" class="button">Get Started Now</a>
        </div>
        
        <p class="tagline">Your success is just a few clicks away!</p>
        
        <div class="feature-container">
          <div class="feature">
            <h3 class="feature-title">AI-Powered Resumes</h3>
            <p>Create professional resumes tailored to specific job descriptions with just a few clicks.</p>
          </div>
          <div class="feature">
            <h3 class="feature-title">Custom Cover Letters</h3>
            <p>Generate personalized cover letters that highlight your unique qualifications.</p>
          </div>
          <div class="feature">
            <h3 class="feature-title">Job Application Tracking</h3>
            <p>Keep track of all your job applications in one organized dashboard.</p>
          </div>
          <div class="feature">
            <h3 class="feature-title">Career Insights</h3>
            <p>Get valuable insights and recommendations to improve your job search.</p>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <p>If you have any questions or need assistance, our support team is always ready to help. Just reply to this email or visit our help center.</p>
        
        <p>Best regards,<br>The ${appName} Team</p>
      </div>
      <div class="footer">
        <p>${footerText}</p>
        <p>You received this email because you signed up for ${appName}.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

export class EmailService {
  private static instance: EmailService;
  private transporter: any = null;
  private settings: any = null;
  private initialized = false;
  private brandingData: BrandingSettings | null = null;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Get the current branding data
   * @returns The current branding settings or null if not initialized
   */
  public getBrandingData(): BrandingSettings | null {
    return this.brandingData;
  }

  public async init(): Promise<boolean> {
    try {
      // Load SMTP settings from database
      const settings = await db.select().from(smtpSettings).limit(1);
      
      if (settings.length === 0 || !settings[0].enabled) {
        console.warn('SMTP is not configured or not enabled');
        this.initialized = false;
        return false;
      }
      
      const smtpConfig = settings[0];
      
      if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
        console.warn('SMTP configuration is incomplete');
        this.initialized = false;
        return false;
      }
      
      // Load branding settings
      const brandingResult = await db.select().from(brandingSettings).limit(1);
      if (brandingResult.length > 0) {
        this.brandingData = brandingResult[0] as BrandingSettings;
      } else {
        // Set default branding settings if not available in database
        this.brandingData = {
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
      
      // Store settings for later reference
      this.settings = smtpConfig;
      
      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: parseInt(smtpConfig.port),
        secure: smtpConfig.encryption === 'ssl', // true for SSL
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password
        },
        tls: {
          // Do not fail on invalid certificates
          rejectUnauthorized: false
        },
        // Docker-specific configuration to improve delivery
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 10,
        // Add proper identification for Docker environments
        name: process.env.SMTP_HELO_NAME || 'atscribe.com',
        // Enable debug logging for troubleshooting
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development'
      });
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.initialized = false;
      return false;
    }
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Check if service is initialized
      if (!this.initialized || !this.transporter || !this.settings) {
        await this.init();
        
        // If initialization failed, return false
        if (!this.initialized || !this.transporter) {
          return false;
        }
      }
      
      // Generate Message-ID with domain matching sender email
      const domain = this.settings.senderEmail.split('@')[1];
      const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@${domain}>`;
      
      // Enhanced headers for Docker environments to improve delivery
      const enhancedHeaders = {
        'Message-ID': messageId,
        'X-Mailer': 'ProsumeAI-Docker',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'List-Unsubscribe': `<mailto:unsubscribe@${domain}?subject=Unsubscribe>`,
        'Precedence': 'Bulk',
        // Docker-specific headers to improve reputation
        'X-Originating-IP': process.env.HOST_IP || '[host.docker.internal]',
        'X-Docker-Container': process.env.HOSTNAME || 'prosumeai-app',
        'X-Authentication-Results': `${domain}; none`,
        // Add DKIM-like signature placeholder
        'DKIM-Signature': `v=1; a=rsa-sha256; d=${domain}; s=default; c=relaxed/relaxed;`,
        // Add proper return path
        'Return-Path': this.settings.senderEmail,
        'Sender': this.settings.senderEmail
      };
      
      // Send email with enhanced configuration
      const info = await this.transporter.sendMail({
        from: `"${this.settings.senderName}" <${this.settings.senderEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo || this.settings.senderEmail,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
        headers: enhancedHeaders,
        // Add envelope configuration for better delivery
        envelope: {
          from: this.settings.senderEmail,
          to: Array.isArray(options.to) ? options.to : [options.to]
        },
        // Set message priority
        priority: 'normal',
        // Add tracking headers
        encoding: 'utf8'
      });
      
      console.log('Email sent:', info.messageId);
      console.log('Email response:', info.response);
      
      // Log delivery status for debugging
      if (info.accepted && info.accepted.length > 0) {
        console.log('✅ Email accepted for:', info.accepted.join(', '));
      }
      if (info.rejected && info.rejected.length > 0) {
        console.log('❌ Email rejected for:', info.rejected.join(', '));
      }
      
      return true;
    } catch (error: any) {
      console.error('Failed to send email:', error);
      console.error('Error details:', {
        code: error.code,
        response: error.response,
        command: error.command
      });
      return false;
    }
  }

  /**
   * Get an email template from the database
   * @param templateType The type of template to retrieve (e.g., 'welcome', 'password_reset')
   * @param useDefault Whether to get the default template (true) or any active template (false)
   */
  public async getEmailTemplate(templateType: string, useDefault: boolean = true): Promise<any | null> {
    try {
      // Create the WHERE condition based on the useDefault parameter
      const conditions = useDefault
        ? and(
            eq(emailTemplates.templateType, templateType),
            eq(emailTemplates.isDefault, true)
          )
        : and(
            eq(emailTemplates.templateType, templateType),
            eq(emailTemplates.isActive, true)
          );
      
      // Execute the query with the appropriate conditions
      const templates = await db
        .select()
        .from(emailTemplates)
        .where(conditions)
        .limit(1);
      
      if (templates.length === 0) {
        console.warn(`No ${useDefault ? 'default' : 'active'} template found for type: ${templateType}`);
        return null;
      }
      
      return templates[0];
    } catch (error) {
      console.error(`Error fetching email template ${templateType}:`, error);
      return null;
    }
  }

  /**
   * Send an email using a template
   * @param to Recipient email address
   * @param templateData Template type and variables to replace in the template
   * @returns Boolean indicating success or failure
   */
  public async sendTemplatedEmail(to: string | string[], templateData: EmailTemplateData): Promise<boolean> {
    try {
      // Get the template
      const template = await this.getEmailTemplate(templateData.templateType);
      
      if (!template) {
        console.error(`Template not found for type: ${templateData.templateType}`);
        return false;
      }
      
      // Ensure branding data is loaded
      if (!this.brandingData) {
        await this.init();
      }
      
      // Add branding data to variables
      const variables = {
        ...templateData.variables,
        appName: this.brandingData?.appName || 'atScribe',
        appTagline: this.brandingData?.appTagline || 'AI-powered resume and career tools',
        primaryColor: this.brandingData?.primaryColor || '#4f46e5',
        secondaryColor: this.brandingData?.secondaryColor || '#10b981',
        accentColor: this.brandingData?.accentColor || '#f97316',
        footerText: this.brandingData?.footerText || '© 2023 atScribe. All rights reserved.'
      };
      
      // Process the templates
      const subject = processTemplate(template.subject, variables);
      const html = processTemplate(template.htmlContent, variables);
      const text = processTemplate(template.textContent, variables);
      
      // Send the email
      return await this.sendEmail({
        to,
        subject,
        html,
        text
      });
    } catch (error) {
      console.error('Error sending templated email:', error);
      return false;
    }
  }

  // Static helper method for sending emails without needing to call getInstance
  public static async sendEmail(options: EmailOptions): Promise<boolean> {
    const instance = EmailService.getInstance();
    return await instance.sendEmail(options);
  }
  
  /**
   * Static helper method for sending templated emails
   */
  public static async sendTemplatedEmail(to: string | string[], templateData: EmailTemplateData): Promise<boolean> {
    const instance = EmailService.getInstance();
    return await instance.sendTemplatedEmail(to, templateData);
  }
  
  // Send a password reset email
  public static async sendPasswordResetEmail(to: string, resetLink: string, username: string): Promise<boolean> {
    const instance = EmailService.getInstance();
    
    try {
      // Try to send using template from database
      const result = await instance.sendTemplatedEmail(to, {
        templateType: 'password_reset',
        variables: {
          username,
          resetLink
        }
      });
      
      if (result) {
        return true;
      }
      
      // Fallback to hardcoded template if no database template exists
      console.log('Falling back to hardcoded password reset template');
      
      // Ensure branding data is loaded
      if (!instance.brandingData) {
        await instance.init();
      }
      
      // Generate HTML with branding
      const html = getPasswordResetTemplate(username, resetLink, instance.brandingData as BrandingSettings);
      
      // Generate plain text version
      const text = `Hello ${username}, 
      
We received a request to reset your password. To proceed with the password reset, please click the following link: ${resetLink}. 

This link will expire in 24 hours.

If you did not request a password reset, please ignore this email or contact support if you have concerns.`;
      
      return await instance.sendEmail({
        to,
        subject: "Password Reset Request",
        html,
        text
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }
  
  // Send a welcome email
  public static async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    const instance = EmailService.getInstance();
    
    try {
      // Try to send using template from database
      const result = await instance.sendTemplatedEmail(to, {
        templateType: 'welcome',
        variables: {
          username
        }
      });
      
      if (result) {
        return true;
      }
      
      // Fallback to hardcoded template if no database template exists
      console.log('Falling back to hardcoded welcome template');
      
      // Ensure branding data is loaded
      if (!instance.brandingData) {
        await instance.init();
      }
      
      // Generate HTML with branding
      const html = getWelcomeTemplate(username, instance.brandingData as BrandingSettings);
      
      // Get app name from branding for subject line
      const appName = instance.brandingData?.appName || "atScribe";
      
      // Generate plain text version
      const text = `Hello ${username}, 
      
Thank you for joining ${appName}! We're excited to help you create professional resumes and advance your career.

With ${appName}, you can:
- Create AI-powered resumes tailored to specific job descriptions
- Generate customized cover letters
- Track your job applications
- And much more!

If you have any questions or need assistance, please don't hesitate to contact our support team.`;
      
      return await instance.sendEmail({
        to,
        subject: `Welcome to ${appName}!`,
        html,
        text
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }
  
  // Send email verification email
  public static async sendEmailVerificationEmail(to: string, username: string, verificationLink: string): Promise<boolean> {
    return await EmailService.sendTemplatedEmail(to, {
      templateType: 'email_verification',
      variables: {
        username,
        verificationLink,
        appName: EmailService.getInstance().getBrandingData()?.appName || 'atScribe'
      }
    });
  }
  
  // Send password changed notification
  public static async sendPasswordChangedEmail(to: string, username: string, resetLink: string): Promise<boolean> {
    return await EmailService.sendTemplatedEmail(to, {
      templateType: 'password_changed',
      variables: {
        username,
        resetLink,
        changeTime: new Date().toLocaleString()
      }
    });
  }
  
  // Send login alert email
  public static async sendLoginAlertEmail(to: string, username: string, loginInfo: {
    time: string,
    device: string,
    location: string,
    ipAddress: string
  }, resetLink: string): Promise<boolean> {
    return await EmailService.sendTemplatedEmail(to, {
      templateType: 'login_alert',
      variables: {
        username,
        resetLink,
        loginTime: loginInfo.time,
        device: loginInfo.device,
        location: loginInfo.location,
        ipAddress: loginInfo.ipAddress
      }
    });
  }

  /**
   * Send a 2FA verification code email
   * @param to Email address
   * @param username Username
   * @param code Verification code
   * @param expiryMinutes Code expiry in minutes
   * @returns Success or failure
   */
  public static async sendTwoFactorCodeEmail(to: string, username: string, code: string, expiryMinutes: number = 10): Promise<boolean> {
    const instance = EmailService.getInstance();
    
    try {
      // Try to send using template from database
      const result = await instance.sendTemplatedEmail(to, {
        templateType: 'two_factor_code',
        variables: {
          username,
          code,
          expiryMinutes
        }
      });
      
      if (result) {
        return true;
      }
      
      // Fallback to hardcoded template if no database template exists
      console.log('Falling back to hardcoded 2FA code template');
      
      // Ensure branding data is loaded
      if (!instance.brandingData) {
        await instance.init();
      }
      
      // Get branding colors
      const primaryColor = instance.brandingData?.primaryColor || '#4f46e5';
      const appName = instance.brandingData?.appName || "atScribe";
      
      // Generate HTML for verification code email
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Two-Factor Authentication Code</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${primaryColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #e5e7eb; border-top: none; }
    .code { font-size: 32px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 5px; color: ${primaryColor}; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .warning { background-color: #fee2e2; border: 1px solid #fecaca; padding: 10px; border-radius: 5px; margin: 20px 0; color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Two-Factor Authentication</h1>
    </div>
    <div class="content">
      <p>Hello ${username},</p>
      <p>You are receiving this email because you are attempting to log in to your ${appName} account or complete a secure action that requires verification. To proceed, please use the following verification code:</p>
      
      <div class="code">${code}</div>
      
      <p>This code will expire in ${expiryMinutes} minutes.</p>
      
      <div class="warning">
        <strong>Important Security Notice:</strong> If you did not request this code, please ignore this email and consider changing your password immediately.
      </div>
      
      <p>Thank you for keeping your account secure!</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
      
      // Generate plain text version
      const text = `Hello ${username},

You are receiving this email because you are attempting to log in to your ${appName} account or complete a secure action that requires verification. To proceed, please use the following verification code:

${code}

This code will expire in ${expiryMinutes} minutes.

IMPORTANT SECURITY NOTICE: If you did not request this code, please ignore this email and consider changing your password immediately.

Thank you for keeping your account secure!

This is an automated message, please do not reply to this email.`;
      
      return await instance.sendEmail({
        to,
        subject: "Your Two-Factor Authentication Code",
        html,
        text
      });
    } catch (error) {
      console.error('Error sending 2FA verification code email:', error);
      return false;
    }
  }
}

/**
 * Helper function to get user's email by user ID
 */
export async function getUserEmailById(userId: number): Promise<string | null> {
  try {
    const user = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    return user.length > 0 ? user[0].email : null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}

/**
 * Helper function to get user's username by user ID
 */
export async function getUsernameById(userId: number): Promise<string | null> {
  try {
    const user = await db.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1);
    return user.length > 0 ? user[0].username : null;
  } catch (error) {
    console.error('Error getting username:', error);
    return null;
  }
} 