import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, unique, primaryKey, varchar, index, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define job application status enum
export const jobApplicationStatus = pgEnum('job_application_status', [
  'applied',
  'screening',
  'interview',
  'assessment',
  'offer',
  'rejected',
  'accepted'
]);

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  lastLogin: timestamp("last_login"),
  razorpayCustomerId: text("razorpay_customer_id"),
  lastPasswordChange: timestamp("last_password_change"),
  passwordHistory: jsonb("password_history"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockoutUntil: timestamp("lockout_until"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpiry: timestamp("reset_password_expiry"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// App Settings Schema
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  category: text("category").notNull(), // 'general', 'email', 'security', etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Branding Settings Schema
export const brandingSettings = pgTable("branding_settings", {
  id: serial("id").primaryKey(),
  appName: text("app_name").notNull().default("ast"),
  appTagline: text("app_tagline").default("AI-powered resume and career tools"),
  logoUrl: text("logo_url").default("/logo.png"),
  faviconUrl: text("favicon_url").default("/favicon.ico"),
  enableDarkMode: boolean("enable_dark_mode").default(true).notNull(),
  primaryColor: text("primary_color").default("#4f46e5").notNull(),
  secondaryColor: text("secondary_color").default("#10b981").notNull(),
  accentColor: text("accent_color").default("#f97316").notNull(),
  footerText: text("footer_text").default("© 2023 atScribe. All rights reserved."),
  customCss: text("custom_css"),
  customJs: text("custom_js"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Job Descriptions Schema
export const jobDescriptions = pgTable("job_descriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Enhanced Resume Schema with sections
export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  targetJobTitle: text("target_job_title").notNull(),
  companyName: text("company_name"),
  jobDescription: text("job_description"),
  template: text("template").notNull(),
  
  // Personal Info
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  country: text("country"),
  city: text("city"),
  state: text("state"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  
  // Professional Summary
  summary: text("summary"),
  
  // Work Experience - stored as JSON array
  workExperience: jsonb("work_experience"),
  
  // Education - stored as JSON array
  education: jsonb("education"),
  
  // Skills - stored as arrays
  skills: text("skills").array(),
  technicalSkills: text("technical_skills").array(),
  softSkills: text("soft_skills").array(),
  useSkillCategories: boolean("use_skill_categories").default(false),
  skillCategories: jsonb("skill_categories"), // New flexible skills categorization
  
  // Additional sections
  certifications: jsonb("certifications"),
  projects: jsonb("projects"),
  publications: jsonb("publications"),
  
  // ATS optimization fields
  keywordsOptimization: text("keywords_optimization"),
  
  // Resume completion status
  isComplete: boolean("is_complete").default(false),
  currentStep: text("current_step").default("details"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Cover Letter Schema
export const coverLetters = pgTable("cover_letters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  
  // Job information
  jobTitle: text("job_title").notNull(),
  
  // Company information
  company: text("company").notNull(),
  recipientName: text("recipient_name"),
  
  // Personal information
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  resumeId: integer("resume_id").references(() => resumes.id),
  
  // Cover letter content
  content: text("content").notNull(),
  
  // Job description (for AI and reference)
  jobDescription: text("job_description"),
  
  // Template information
  template: text("template").notNull().default("standard"),
  
  // Draft status
  isDraft: boolean("is_draft").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Job Application Schema
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  company: text("company").notNull(),
  jobTitle: text("job_title").notNull(),
  jobDescription: text("job_description"),
  location: text("location"),
  workType: text("work_type"), // "onsite", "hybrid", "remote"
  salary: text("salary"),
  jobUrl: text("job_url"),
  status: jobApplicationStatus("status").notNull().default('applied'),
  statusHistory: jsonb("status_history"), // Array of status changes with dates
  appliedAt: timestamp("applied_at").defaultNow(),
  resumeId: integer("resume_id").references(() => resumes.id),
  coverLetterId: integer("cover_letter_id").references(() => coverLetters.id),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
  priority: text("priority"), // "high", "medium", "low" 
  deadlineDate: timestamp("deadline_date"),
  interviewDate: timestamp("interview_date"),
  interviewType: text("interview_type"), // "phone", "video", "onsite", etc.
  interviewNotes: text("interview_notes"),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Resume Templates Schema
export const resumeTemplates = pgTable("resume_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  content: text("content").notNull(),
  thumbnail: text("thumbnail").default("").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Cover Letter Templates Schema
export const coverLetterTemplates = pgTable("cover_letter_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  content: text("content").notNull(),
  thumbnail: text("thumbnail").default("").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Session Table Schema (for connect-pg-simple)
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(), // Session ID
  sess: jsonb("sess").notNull(),     // Session data
  expire: timestamp("expire", { precision: 6, withTimezone: false }).notNull() // Expiry timestamp
}, (table) => {
  return {
    expireIdx: index("IDX_session_expire").on(table.expire), // Index on expire column
  };
});

// API Keys Schema
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  service: text("service").notNull().default("openai"), // The service this key is for (e.g., 'openai', 'anthropic', etc.)
  key: text("key").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============= Subscription SaaS Model Schemas =============

// Subscription Billing Cycle Enum
export const billingCycleEnum = pgEnum('billing_cycle', [
  'MONTHLY',
  'YEARLY'
]);

// Region Target Enum
export const targetRegionEnum = pgEnum('target_region', [
  'INDIA',
  'GLOBAL'
]);

// Currency Enum
export const currencyEnum = pgEnum('currency', [
  'INR',
  'USD'
]);

// Feature Type Enum
export const featureTypeEnum = pgEnum('feature_type', [
  'ESSENTIAL',
  'ADVANCED',
  'PROFESSIONAL'
]);

// Limit Type Enum
export const limitTypeEnum = pgEnum('limit_type', [
  'UNLIMITED',
  'COUNT',
  'BOOLEAN'
]);

// Reset Frequency Enum
export const resetFrequencyEnum = pgEnum('reset_frequency', [
  'NEVER',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY'
]);

// Subscription Status Enum
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'ACTIVE',
  'GRACE_PERIOD',
  'EXPIRED',
  'CANCELLED'
]);

// Plan Change Type Enum
export const planChangeTypeEnum = pgEnum('plan_change_type', [
  'UPGRADE',
  'DOWNGRADE'
]);

// Payment Gateway Enum
export const PaymentGatewayEnum = pgEnum('payment_gateway', [
  'RAZORPAY',
  'NONE'
]);

// Payment Status Enum
export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED'
]);

// Dispute Status Enum
export const disputeStatusEnum = pgEnum('dispute_status', [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED'
]);

// Subscription Plans Table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isFreemium: boolean("is_freemium").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Plan Pricing Table for region-specific pricing
export const planPricing = pgTable("plan_pricing", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  targetRegion: targetRegionEnum("target_region").notNull(),
  currency: currencyEnum("currency").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    uniquePlanRegion: unique().on(table.planId, table.targetRegion)
  };
});

// Features Table
export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  featureType: featureTypeEnum("feature_type").notNull(),
  isCountable: boolean("is_countable").default(true).notNull(),
  isTokenBased: boolean("is_token_based").default(false).notNull(),
  costFactor: decimal("cost_factor", { precision: 10, scale: 4 }).default("1.0000"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Plan Features Table
export const planFeatures = pgTable("plan_features", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  featureId: integer("feature_id").notNull().references(() => features.id),
  limitType: limitTypeEnum("limit_type").notNull(),
  limitValue: integer("limit_value"),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  resetFrequency: resetFrequencyEnum("reset_frequency"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    uniquePlanFeature: unique().on(table.planId, table.featureId)
  };
});

// User Subscriptions Table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  status: subscriptionStatusEnum("status").notNull().default('ACTIVE'),
  autoRenew: boolean("auto_renew").notNull().default(true),
  gracePeriodEnd: timestamp("grace_period_end"),
  cancelDate: timestamp("cancel_date"),
  upgradeDate: timestamp("upgrade_date"),
  previousPlanId: integer("previous_plan_id"),
  paymentGateway: PaymentGatewayEnum("payment_gateway"),
  paymentReference: text("payment_reference"),
  pendingPlanChangeTo: integer("pending_plan_change_to"),
  pendingPlanChangeDate: timestamp("pending_plan_change_date"),
  pendingPlanChangeType: planChangeTypeEnum("pending_plan_change_type"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Feature Usage Table
export const featureUsage = pgTable("feature_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  featureId: integer("feature_id").notNull().references(() => features.id),
  usageCount: integer("usage_count").default(0).notNull(),
  aiModelType: text("ai_model_type"),
  aiTokenCount: integer("ai_token_count"),
  aiCost: decimal("ai_cost", { precision: 10, scale: 4 }),
  lastUsed: timestamp("last_used").defaultNow(),
  resetDate: timestamp("reset_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    uniqueUserFeature: unique().on(table.userId, table.featureId)
  };
});

// Payment Transactions Table
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").notNull().references(() => userSubscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull(),
  gateway: PaymentGatewayEnum("gateway").notNull(),
  gatewayTransactionId: text("gateway_transaction_id"),
  status: paymentStatusEnum("status").notNull().default('PENDING'),
  refundReason: text("refund_reason"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Disputes Table
export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => paymentTransactions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: disputeStatusEnum("status").notNull().default('OPEN'),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at")
});

// Document Version Table
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentId: integer("document_id").notNull(),
  documentType: text("document_type").notNull(), // 'RESUME' or 'COVER_LETTER'
  versionNumber: integer("version_number").notNull(),
  contentHash: text("content_hash").notNull(),
  isSignificantChange: boolean("is_significant_change").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    uniqueDocumentVersion: unique().on(table.documentId, table.documentType, table.versionNumber)
  };
});

// User Billing Details Schema
export const userBillingDetails = pgTable("user_billing_details", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  fullName: text("full_name").notNull(),
  country: text("country").notNull(),  // ISO country code (e.g., 'US', 'IN')
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),      // ISO state code (e.g., 'CA', 'NY')
  postalCode: text("postal_code").notNull(),
  phoneNumber: text("phone_number"),
  taxId: text("tax_id"), // For GST in India, VAT/Tax ID for other countries
  companyName: text("company_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Payment Gateway Configurations Table (more specialized than general apiKeys)
export const paymentGatewayConfigs = pgTable("payment_gateway_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  service: PaymentGatewayEnum("service").notNull(),
  key: text("key").notNull(), // Encrypted API key
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  configOptions: jsonb("config_options").default({}), // For additional options like webhook secrets
  lastUsed: timestamp("last_used"),
  testMode: boolean("test_mode").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Saved Payment Methods Table
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gateway: PaymentGatewayEnum("gateway").notNull(),
  type: text("type").notNull(), // "card", "upi", "netbanking", etc.
  lastFour: text("last_four"), // Last 4 digits of card or partial payment info
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  isDefault: boolean("is_default").default(false).notNull(),
  // In a real implementation, you would store tokenized payment information securely
  gatewayPaymentMethodId: text("gateway_payment_method_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});

// Payment Webhook Events Table
export const paymentWebhookEvents = pgTable("payment_webhook_events", {
  id: serial("id").primaryKey(),
  gateway: PaymentGatewayEnum("gateway").notNull(),
  eventType: text("event_type").notNull(), // e.g., "payment.success", "subscription.created"
  eventId: text("event_id").notNull(), // ID from payment gateway
  rawData: jsonb("raw_data").notNull(), // Complete webhook payload
  processed: boolean("processed").default(false).notNull(),
  processingErrors: text("processing_errors"),
  createdAt: timestamp("created_at").defaultNow()
});

// Tax Type Enum
export const taxTypeEnum = pgEnum('tax_type', [
  'GST',
  'CGST',
  'SGST',
  'IGST'
]);

// Tax Settings Schema
export const taxSettings = pgTable("tax_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: taxTypeEnum("type").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  country: text("country").notNull(),  // ISO country code (e.g., 'US', 'IN')
  stateApplicable: text("state_applicable"),  // ISO state code (e.g., 'CA', 'NY')
  enabled: boolean("enabled").default(true).notNull(),
  applyToRegion: targetRegionEnum("apply_to_region").notNull(),
  applyCurrency: currencyEnum("apply_currency").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Company Tax Information Schema
export const companyTaxInfo = pgTable("company_tax_info", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),      // ISO state code (e.g., 'CA', 'NY')
  country: text("country").notNull(),  // ISO country code (e.g., 'US', 'IN')
  postalCode: text("postal_code").notNull(),
  gstin: text("gstin"),
  pan: text("pan"),
  taxRegNumber: text("tax_reg_number"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Invoice Settings Schema
export const invoiceSettings = pgTable("invoice_settings", {
  id: serial("id").primaryKey(),
  logoUrl: text("logo_url"),
  footerText: text("footer_text"),
  termsAndConditions: text("terms_and_conditions"),
  invoicePrefix: text("invoice_prefix").default("INV-"),
  showTaxBreakdown: boolean("show_tax_breakdown").default(true).notNull(),
  nextInvoiceNumber: integer("next_invoice_number").default(1000).notNull(),
  defaultDueDays: integer("default_due_days").default(15).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Invoice Schema
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  transactionId: integer("transaction_id").references(() => paymentTransactions.id),
  subscriptionId: integer("subscription_id").references(() => userSubscriptions.id),
  subscriptionPlan: text("subscription_plan"),
  nextPaymentDate: timestamp("next_payment_date"),
  gatewayTransactionId: text("gateway_transaction_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull(),
  status: text("status").notNull().default("paid"), // paid, pending, cancelled
  billingDetails: jsonb("billing_details").notNull(),
  companyDetails: jsonb("company_details").notNull(),
  taxDetails: jsonb("tax_details"),
  items: jsonb("items").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  notes: text("notes")
});

// SMTP Settings Schema
export const smtpSettings = pgTable("smtp_settings", {
  id: serial("id").primaryKey(),
  host: text("host").notNull(),
  port: text("port").notNull().default("587"),
  username: text("username").notNull(),
  password: text("password").notNull(),
  encryption: text("encryption").notNull().default("tls"), // 'none', 'ssl', 'tls'
  senderName: text("sender_name").notNull().default("atScribe"),
  senderEmail: text("sender_email").notNull().default("no-reply@atscribe.com"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Email Templates Schema
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  templateType: text("template_type").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(),
  variables: jsonb("variables"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBrandingSettingsSchema = createInsertSchema(brandingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertJobDescriptionSchema = createInsertSchema(jobDescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCoverLetterSchema = createInsertSchema(coverLetters).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications)
  .omit({
    id: true, 
    appliedAt: true,
    updatedAt: true
  })
  .extend({
    // Add stricter validation for required fields
    company: z.string().min(1, "Company name is required"),
    jobTitle: z.string().min(1, "Job title is required"),
    // Validate status using enum values
    status: z.enum(['applied', 'screening', 'interview', 'assessment', 'offer', 'rejected', 'accepted']).default('applied'),
    // Allow deadline date to be a string (ISO date) or a Date object
    deadlineDate: z.string().nullable().optional(),
    // Allow interview date to be a string (ISO date) or a Date object
    interviewDate: z.string().nullable().optional(),
    // Allow interview type to be a string
    interviewType: z.string().nullable().optional(),
    // Allow interview notes to be a string
    interviewNotes: z.string().nullable().optional()
  });

export const insertResumeTemplateSchema = createInsertSchema(resumeTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCoverLetterTemplateSchema = createInsertSchema(coverLetterTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertApiKeySchema = createInsertSchema(apiKeys);

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPlanPricingSchema = createInsertSchema(planPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFeatureSchema = createInsertSchema(features).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPlanFeatureSchema = createInsertSchema(planFeatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFeatureUsageSchema = createInsertSchema(featureUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true
});

export const insertUserBillingDetailsSchema = createInsertSchema(userBillingDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPaymentGatewayConfigSchema = createInsertSchema(paymentGatewayConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});

export const insertPaymentWebhookEventSchema = createInsertSchema(paymentWebhookEvents).omit({
  id: true,
  createdAt: true
});

export const insertSmtpSettingsSchema = createInsertSchema(smtpSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTaxSettingsSchema = createInsertSchema(taxSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCompanyTaxInfoSchema = createInsertSchema(companyTaxInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertInvoiceSettingsSchema = createInsertSchema(invoiceSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type BrandingSetting = typeof brandingSettings.$inferSelect;
export type JobDescription = typeof jobDescriptions.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type CoverLetter = typeof coverLetters.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type ResumeTemplate = typeof resumeTemplates.$inferSelect;
export type CoverLetterTemplate = typeof coverLetterTemplates.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAppSetting = z.infer<typeof insertAppSettingsSchema>;
export type InsertBrandingSetting = z.infer<typeof insertBrandingSettingsSchema>;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type InsertCoverLetter = z.infer<typeof insertCoverLetterSchema>;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type InsertResumeTemplate = z.infer<typeof insertResumeTemplateSchema>;
export type InsertCoverLetterTemplate = z.infer<typeof insertCoverLetterTemplateSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type PlanPricing = typeof planPricing.$inferSelect;
export type Feature = typeof features.$inferSelect;
export type PlanFeature = typeof planFeatures.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type FeatureUsage = typeof featureUsage.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type Dispute = typeof disputes.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type InsertPlanPricing = z.infer<typeof insertPlanPricingSchema>;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type InsertPlanFeature = z.infer<typeof insertPlanFeatureSchema>;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

export type InsertUserBillingDetails = z.infer<typeof insertUserBillingDetailsSchema>;

export type PaymentGatewayConfig = typeof paymentGatewayConfigs.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type PaymentWebhookEvent = typeof paymentWebhookEvents.$inferSelect;

export type InsertPaymentGatewayConfig = z.infer<typeof insertPaymentGatewayConfigSchema>;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type InsertPaymentWebhookEvent = z.infer<typeof insertPaymentWebhookEventSchema>;

export type SmtpSettings = typeof smtpSettings.$inferSelect;
export type InsertSmtpSettings = z.infer<typeof insertSmtpSettingsSchema>;

export type TaxSettings = typeof taxSettings.$inferSelect;
export type InsertTaxSettings = z.infer<typeof insertTaxSettingsSchema>;

export type CompanyTaxInfo = typeof companyTaxInfo.$inferSelect;
export type InsertCompanyTaxInfo = z.infer<typeof insertCompanyTaxInfoSchema>;

export type InvoiceSettings = typeof invoiceSettings.$inferSelect;
export type InsertInvoiceSettings = z.infer<typeof insertInvoiceSettingsSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// ============= Notification System Schemas =============

// Notification enums
export const notificationTypeEnum = pgEnum('notification_type', [
  'resume_created',
  'resume_downloaded',
  'resume_shared',
  'cover_letter_created',
  'job_application_created',
  'job_application_updated',
  'subscription_created',
  'subscription_activated',
  'subscription_renewed',
  'subscription_cancelled',
  'subscription_grace_period',
  'subscription_expiring',
  'subscription_expired',
  'password_reset',
  'account_update',
  'system_announcement',
  'custom_notification',
  'new_user_registered',
  'new_subscription',
  'payment_received',
  'payment_failed',
  'account_deletion',
  'support_request',
  'server_error',
  'security_alert',
  'admin_action_required'
]);

export const notificationCategoryEnum = pgEnum('notification_category', [
  'account',
  'resume',
  'cover_letter',
  'job_application',
  'subscription',
  'system',
  'security',
  'payment',
  'admin'
]);

export const notificationPriorityEnum = pgEnum('notification_priority', [
  'low',
  'normal',
  'high'
]);

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientId: integer("recipient_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").default({}),
  isRead: boolean("is_read").notNull().default(false),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  priority: notificationPriorityEnum("priority").notNull().default('normal'),
  category: notificationCategoryEnum("category").notNull(),
  action: jsonb("action")
});

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  enableEmailNotifications: boolean("enable_email_notifications").notNull().default(true),
  enablePushNotifications: boolean("enable_push_notifications").notNull().default(true),
  enableInAppNotifications: boolean("enable_in_app_notifications").notNull().default(true),
  enableSoundNotifications: boolean("enable_sound_notifications").notNull().default(true),
  soundVolume: decimal("sound_volume", { precision: 3, scale: 2 }).notNull().default('0.30'),
  accountNotifications: boolean("account_notifications").notNull().default(true),
  resumeNotifications: boolean("resume_notifications").notNull().default(true),
  coverLetterNotifications: boolean("cover_letter_notifications").notNull().default(true),
  jobApplicationNotifications: boolean("job_application_notifications").notNull().default(true),
  subscriptionNotifications: boolean("subscription_notifications").notNull().default(true),
  systemNotifications: boolean("system_notifications").notNull().default(true),
  dailyDigest: boolean("daily_digest").notNull().default(false),
  weeklyDigest: boolean("weekly_digest").notNull().default(false),
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(false),
  quietHoursStart: text("quiet_hours_start").default('22:00'),
  quietHoursEnd: text("quiet_hours_end").default('08:00'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => {
  return {
    userIdx: unique().on(table.userId)
  };
});

// Notification templates table
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  type: notificationTypeEnum("type").notNull(),
  titleTemplate: text("title_template").notNull(),
  messageTemplate: text("message_template").notNull(),
  emailSubjectTemplate: text("email_subject_template"),
  emailBodyTemplate: text("email_body_template"),
  isActive: boolean("is_active").notNull().default(true),
  variables: jsonb("variables").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => {
  return {
    typeIdx: unique().on(table.type)
  };
});

// Insert schemas for notifications
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Type definitions for notifications
export type Notification = typeof notifications.$inferSelect;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;

// Notification types for the frontend
export type NotificationAction = {
  type: 'link' | 'button';
  label: string;
  url?: string;
  payload?: Record<string, any>;
};

export interface NotificationData {
  id: number;
  recipientId: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  isSystem: boolean;
  createdAt: string;
  expiresAt?: string;
  priority: 'low' | 'normal' | 'high';
  category: string;
  action?: NotificationAction;
}

// Two Factor Authentication Schemas
export const twoFactorMethodEnum = pgEnum('two_factor_method', [
  'EMAIL',
  'AUTHENTICATOR_APP'
]);

export const userTwoFactor = pgTable("user_two_factor", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  enabled: boolean("enabled").default(false).notNull(),
  preferredMethod: twoFactorMethodEnum("preferred_method"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    userIdx: unique().on(table.userId)
  };
});

export const twoFactorBackupCodes = pgTable("two_factor_backup_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: text("code").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    uniqueCode: unique().on(table.userId, table.code)
  };
});

export const twoFactorEmail = pgTable("two_factor_email", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),
  token: text("token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    userIdx: unique().on(table.userId)
  };
});

export const twoFactorAuthenticator = pgTable("two_factor_authenticator", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  secret: text("secret").notNull(),
  recoveryCodes: jsonb("recovery_codes"),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    userIdx: unique().on(table.userId)
  };
});

export const twoFactorPolicy = pgTable("two_factor_policy", {
  id: serial("id").primaryKey(),
  enforceForAdmins: boolean("enforce_for_admins").default(false).notNull(),
  enforceForAllUsers: boolean("enforce_for_all_users").default(false).notNull(),
  allowedMethods: jsonb("allowed_methods").default(["EMAIL", "AUTHENTICATOR_APP"]).notNull(),
  rememberDeviceDays: integer("remember_device_days").default(30).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const twoFactorRememberedDevices = pgTable("two_factor_remembered_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceIdentifier: text("device_identifier").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    uniqueDevice: unique().on(table.userId, table.deviceIdentifier)
  };
});

// Insert Schemas for 2FA
export const insertUserTwoFactorSchema = createInsertSchema(userTwoFactor).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTwoFactorBackupCodesSchema = createInsertSchema(twoFactorBackupCodes).omit({
  id: true,
  createdAt: true
});

export const insertTwoFactorEmailSchema = createInsertSchema(twoFactorEmail).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTwoFactorAuthenticatorSchema = createInsertSchema(twoFactorAuthenticator).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTwoFactorPolicySchema = createInsertSchema(twoFactorPolicy).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTwoFactorRememberedDevicesSchema = createInsertSchema(twoFactorRememberedDevices).omit({
  id: true,
  createdAt: true
});

// Type definitions for 2FA
export type UserTwoFactor = typeof userTwoFactor.$inferSelect;
export type TwoFactorBackupCode = typeof twoFactorBackupCodes.$inferSelect;
export type TwoFactorEmail = typeof twoFactorEmail.$inferSelect;
export type TwoFactorAuthenticator = typeof twoFactorAuthenticator.$inferSelect;
export type TwoFactorPolicy = typeof twoFactorPolicy.$inferSelect;
export type TwoFactorRememberedDevice = typeof twoFactorRememberedDevices.$inferSelect;

export type InsertUserTwoFactor = z.infer<typeof insertUserTwoFactorSchema>;
export type InsertTwoFactorBackupCode = z.infer<typeof insertTwoFactorBackupCodesSchema>;
export type InsertTwoFactorEmail = z.infer<typeof insertTwoFactorEmailSchema>;
export type InsertTwoFactorAuthenticator = z.infer<typeof insertTwoFactorAuthenticatorSchema>;
export type InsertTwoFactorPolicy = z.infer<typeof insertTwoFactorPolicySchema>;
export type InsertTwoFactorRememberedDevice = z.infer<typeof insertTwoFactorRememberedDevicesSchema>;

// Resume-related type definitions for frontend
export type WorkExperience = {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
  achievements: string[];
};

export type Education = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
};

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expires: boolean;
  expiryDate: string | null;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string | null;
  current: boolean;
  url: string | null;
};

export type Publication = {
  id: string;
  title: string;
  publisher: string;
  authors: string;
  publicationDate: string;
  url: string | null;
  description: string;
};

// Job application status history entry
export type StatusHistoryEntry = {
  id: string;
  status: string; // We keep this as string since it's stored in the database as text within a JSONB field
  date: string;
  notes: string | null;
};

export type UserBillingDetails = typeof userBillingDetails.$inferSelect;

// ============= Blog System Schemas =============

// Blog post status enum
export const blogPostStatusEnum = pgEnum('blog_post_status', [
  'draft',
  'published',
  'archived',
  'scheduled'
]);

// Media type enum for blog media
export const mediaTypeEnum = pgEnum('media_type', [
  'image',
  'video',
  'audio',
  'document',
  'other'
]);

// Blog Media Table
export const blogMedia = pgTable("blog_media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // in bytes
  width: integer("width"), // for images
  height: integer("height"), // for images
  url: text("url").notNull(),
  alt: text("alt"),
  caption: text("caption"),
  type: mediaTypeEnum("type").notNull(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  isUsed: boolean("is_used").default(false).notNull(), // track if media is used in any content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Blog Categories Table
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id").references((): any => blogCategories.id),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  postCount: integer("post_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Blog Tags Table
export const blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").default("#4f46e5"),
  postCount: integer("post_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Blog Posts Table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  featuredImageAlt: text("featured_image_alt"),
  status: blogPostStatusEnum("status").notNull().default('draft'),
  
  // SEO Fields
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  metaTags: jsonb("meta_tags").default({}),
  canonicalUrl: text("canonical_url"),
  
  // Content Settings
  allowComments: boolean("allow_comments").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isSticky: boolean("is_sticky").default(false).notNull(),
  
  // Category and Author
  categoryId: integer("category_id").references(() => blogCategories.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  
  // Publishing Settings
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  
  // Analytics
  viewCount: integer("view_count").default(0).notNull(),
  readTime: integer("read_time"), // estimated read time in minutes
  
  // Content Structure
  tableOfContents: jsonb("table_of_contents"),
  customFields: jsonb("custom_fields").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Blog Post Tags Junction Table (Many-to-Many)
export const blogPostTags = pgTable("blog_post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  tagId: integer("tag_id").notNull().references(() => blogTags.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    uniquePostTag: unique().on(table.postId, table.tagId)
  };
});

// Blog Comments Table (optional for future)
export const blogComments = pgTable("blog_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  authorWebsite: text("author_website"),
  content: text("content").notNull(),
  parentId: integer("parent_id").references((): any => blogComments.id),
  isApproved: boolean("is_approved").default(false).notNull(),
  isSpam: boolean("is_spam").default(false).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Blog Settings Table
export const blogSettings = pgTable("blog_settings", {
  id: serial("id").primaryKey(),
  blogTitle: text("blog_title").notNull().default("Blog"),
  blogDescription: text("blog_description").default("Latest news and updates"),
  blogKeywords: text("blog_keywords"),
  postsPerPage: integer("posts_per_page").default(10).notNull(),
  allowComments: boolean("allow_comments").default(true).notNull(),
  moderateComments: boolean("moderate_comments").default(true).notNull(),
  enableRss: boolean("enable_rss").default(true).notNull(),
  enableSitemap: boolean("enable_sitemap").default(true).notNull(),
  featuredImageRequired: boolean("featured_image_required").default(false).notNull(),
  enableReadTime: boolean("enable_read_time").default(true).notNull(),
  enableTableOfContents: boolean("enable_table_of_contents").default(true).notNull(),
  socialShareButtons: jsonb("social_share_buttons").default(["twitter", "facebook", "linkedin", "email"]),
  customCss: text("custom_css"),
  customJs: text("custom_js"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Insert Schemas for Blog
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  postCount: true,
  createdAt: true,
  updatedAt: true
});

export const insertBlogTagSchema = createInsertSchema(blogTags).omit({
  id: true,
  postCount: true,
  createdAt: true,
  updatedAt: true
});

export const insertBlogMediaSchema = createInsertSchema(blogMedia).omit({
  id: true,
  isUsed: true,
  createdAt: true,
  updatedAt: true
});

export const insertBlogPostSchema = createInsertSchema(blogPosts)
  .omit({
    id: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    // Add custom validation for required fields
    title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
    content: z.string().min(1, "Content is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    excerpt: z.string().max(500, "Excerpt must be less than 500 characters").optional(),
    seoTitle: z.string().max(60, "SEO title should be less than 60 characters").optional(),
    seoDescription: z.string().max(160, "SEO description should be less than 160 characters").optional(),
    categoryId: z.number().positive().nullable().optional(),
    tags: z.array(z.number()).optional(), // For handling tag IDs
    scheduledAt: z.string().nullable().optional(),
    publishedAt: z.string().nullable().optional()
  });

export const insertBlogPostTagSchema = createInsertSchema(blogPostTags).omit({
  id: true,
  createdAt: true
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBlogSettingsSchema = createInsertSchema(blogSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Type definitions for Blog
export type BlogCategory = typeof blogCategories.$inferSelect;
export type BlogTag = typeof blogTags.$inferSelect;
export type BlogMedia = typeof blogMedia.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type BlogPostTag = typeof blogPostTags.$inferSelect;
export type BlogComment = typeof blogComments.$inferSelect;
export type BlogSettings = typeof blogSettings.$inferSelect;

export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;
export type InsertBlogMedia = z.infer<typeof insertBlogMediaSchema>;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type InsertBlogPostTag = z.infer<typeof insertBlogPostTagSchema>;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;
export type InsertBlogSettings = z.infer<typeof insertBlogSettingsSchema>;

// Blog frontend types
export interface BlogPostWithDetails extends BlogPost {
  category?: BlogCategory;
  author?: Pick<User, 'id' | 'username' | 'fullName'>;
  tags?: BlogTag[];
  commentsCount?: number;
}

export interface BlogCategoryWithPosts extends BlogCategory {
  posts?: BlogPost[];
  children?: BlogCategory[];
}
