import { Express, Request, Response } from "express";
import { requireAdmin } from "server/middleware/admin";
import { db } from "../../../config/db";
import { smtpSettings, brandingSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
// Import nodemailer using correct ES module syntax
import * as nodemailer from "nodemailer";

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

// Beautiful HTML email template for the test email
const getTestEmailTemplate = (branding: BrandingSettings) => {
  const primaryColor = branding?.primaryColor || "#4f46e5";
  const secondaryColor = branding?.secondaryColor || "#10b981";
  const appName = branding?.appName || "atScribe";
  const logoUrl = branding?.logoUrl || "/logo.png";
  const footerText = branding?.footerText || "© 2023 atScribe. All rights reserved.";

  // Use absolute URL for logo
  const baseUrl = process.env.ORIGIN_URL || process.env.VITE_APP_URL || process.env.BASE_URL || "http://localhost:5173";
  const absoluteLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMTP Test Email</title>
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
      .success-box {
        background-color: #e6f7ef;
        border-left: 4px solid ${secondaryColor};
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
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
      .features {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        margin: 20px 0;
      }
      .feature {
        flex-basis: 48%;
        margin-bottom: 15px;
      }
      .feature-icon {
        color: ${primaryColor};
        font-weight: bold;
        margin-right: 5px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <img src="${absoluteLogoUrl}" alt="${appName} Logo" class="logo">
        <h1>SMTP Configuration Test</h1>
      </div>
      <div class="content">
        <div class="success-box">
          <h2>✅ Email Delivery Success!</h2>
          <p>Congratulations! If you're reading this email, your SMTP configuration is working correctly.</p>
        </div>
        
        <p>Your email service is now properly set up for <span class="highlight">${appName}</span>. This means your application can now send:</p>
        
        <div class="features">
          <div class="feature">
            <p><span class="feature-icon">→</span> Password reset emails</p>
          </div>
          <div class="feature">
            <p><span class="feature-icon">→</span> User welcome messages</p>
          </div>
          <div class="feature">
            <p><span class="feature-icon">→</span> Application notifications</p>
          </div>
          <div class="feature">
            <p><span class="feature-icon">→</span> System alerts</p>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <h3>What's Next?</h3>
        <p>Now that your email service is configured, you may want to:</p>
        <ul>
          <li>Customize email templates</li>
          <li>Set up automated emails</li>
          <li>Configure email delivery schedules</li>
        </ul>
        
        <a href="${baseUrl}/admin/settings" class="button">Back to Settings</a>
        
        <p>If you have any questions or need assistance, please contact your system administrator.</p>
      </div>
      <div class="footer">
        <p>${footerText}</p>
        <p>This is an automated message. Please do not reply.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Registers SMTP settings admin routes
 */
export function registerSmtpRoutes(app: Express) {
  // Get SMTP settings
  app.get("/api/admin/smtp-settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await db.select().from(smtpSettings).limit(1);
      
      if (settings.length === 0) {
        return res.status(404).json({ message: "SMTP settings not found" });
      }
      
      // Mask the password for security
      const result = {
        ...settings[0],
        password: settings[0].password ? "••••••••" : ""
      };
      
      return res.json(result);
    } catch (error) {
      console.error("Error fetching SMTP settings:", error);
      return res.status(500).json({ message: "Failed to fetch SMTP settings" });
    }
  });
  
  // Update SMTP settings
  app.post("/api/admin/smtp-settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { host, port, username, password, encryption, senderName, senderEmail, enabled } = req.body;
      
      // Validation
      if (!host && enabled) {
        return res.status(400).json({ message: "SMTP host is required when SMTP is enabled" });
      }
      
      if (!username && enabled) {
        return res.status(400).json({ message: "SMTP username is required when SMTP is enabled" });
      }
      
      // Check if settings already exist
      const existingSettings = await db.select().from(smtpSettings).limit(1);
      
      let updatedSettings;
      
      if (existingSettings.length > 0) {
        // Update existing settings
        const updateData: any = {
          host,
          port,
          username,
          encryption,
          senderName,
          senderEmail,
          enabled,
          updatedAt: new Date()
        };
        
        // Only update password if it's provided and not the masked version
        if (password && password !== "••••••••") {
          updateData.password = password;
        }
        
        updatedSettings = await db
          .update(smtpSettings)
          .set(updateData)
          .where(eq(smtpSettings.id, existingSettings[0].id))
          .returning();
      } else {
        // Create new settings
        updatedSettings = await db
          .insert(smtpSettings)
          .values({
            host,
            port,
            username,
            password,
            encryption,
            senderName,
            senderEmail,
            enabled
          })
          .returning();
      }
      
      // Mask the password in the response
      const result = {
        ...updatedSettings[0],
        password: updatedSettings[0].password ? "••••••••" : ""
      };
      
      return res.json(result);
    } catch (error) {
      console.error("Error updating SMTP settings:", error);
      return res.status(500).json({ message: "Failed to update SMTP settings" });
    }
  });
  
  // Test SMTP connection
  app.post("/api/admin/smtp-settings/test", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ message: "Test email address is required" });
      }
      
      // Get SMTP settings
      const settings = await db.select().from(smtpSettings).limit(1);
      
      if (settings.length === 0) {
        return res.status(404).json({ message: "SMTP settings not found" });
      }
      
      const smtpConfig = settings[0];
      
      if (!smtpConfig.enabled) {
        return res.status(400).json({ message: "SMTP is not enabled" });
      }
      
      if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
        return res.status(400).json({ message: "SMTP configuration is incomplete" });
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
        secure: smtpConfig.encryption === 'ssl', // true for SSL
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password
        },
        tls: {
          // Do not fail on invalid certificates
          rejectUnauthorized: false
        }
      });
      
      // Generate beautiful email HTML
      const htmlTemplate = getTestEmailTemplate(branding);
      
      // Get app name from branding for subject line
      const appName = branding.appName || "atScribe";
      
      // Send test email
      const info = await transporter.sendMail({
        from: `"${smtpConfig.senderName}" <${smtpConfig.senderEmail}>`,
        to: testEmail,
        subject: `${appName} - SMTP Configuration Test`,
        text: `SMTP Test Successful! If you're viewing this, your email settings are working correctly.`,
        html: htmlTemplate
      });
      
      return res.json({ 
        message: "Test email sent successfully",
        messageId: info.messageId
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      return res.status(500).json({ 
        message: "Failed to send test email",
        error: error.message
      });
    }
  });
} 