import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, unique, primaryKey, varchar, index, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Subscription Plans Schema
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  currency: text("currency").notNull(), // "USD", "INR"
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  interval: text("interval").notNull(), // "monthly", "yearly"
  features: jsonb("features").notNull(), // JSON object with feature limits
  isActive: boolean("is_active").default(true).notNull(),
  trialDays: integer("trial_days").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User Subscriptions Schema 
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull(), // "active", "cancelled", "expired", "trialing"
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  paymentProcessor: text("payment_processor").notNull(), // "stripe", "razorpay", etc.
  paymentProcessorId: text("payment_processor_id").notNull(), // ID from payment processor
  metadata: jsonb("metadata"), // Additional payment-related data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Feature Usage Tracking Schema
export const featureUsage = pgTable("feature_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  featureKey: text("feature_key").notNull(), // e.g., "resumes", "cover_letters", "ai_tokens"
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  resetAt: timestamp("reset_at"), // When usage counter will reset
  billingCycleStart: timestamp("billing_cycle_start").notNull(),
  billingCycleEnd: timestamp("billing_cycle_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    userFeatureIdx: index("IDX_user_feature").on(table.userId, table.featureKey),
  };
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
  
  // Additional sections
  certifications: jsonb("certifications"),
  projects: jsonb("projects"),
  
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
  status: text("status").notNull(),
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

// Token Usage Schema
export const tokenUsage = pgTable("token_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  featureKey: text("feature_key").notNull(), // e.g., "resume_ai", "cover_letter_ai", etc.
  tokensUsed: integer("tokens_used").notNull(),
  model: text("model").notNull(), // The AI model used
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    userTokenUsageIdx: index("IDX_user_token_usage").on(table.userId, table.featureKey),
  };
});

// Interview Schema removed as per user request

// Resume Templates Schema
export const resumeTemplates = pgTable("resume_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  content: text("content").notNull(),
  thumbnail: text("thumbnail").default("").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  planRequired: text("plan_required"), // Minimum plan required to use this template
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
  planRequired: text("plan_required"), // Minimum plan required to use this template
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

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
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

export const insertTokenUsageSchema = createInsertSchema(tokenUsage).omit({
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
    // Allow deadline date to be a string (ISO date) or a Date object
    deadlineDate: z.string().nullable().optional(),
    // Allow interview date to be a string (ISO date) or a Date object
    interviewDate: z.string().nullable().optional(),
    // Allow interview type to be a string
    interviewType: z.string().nullable().optional(),
    // Allow interview notes to be a string
    interviewNotes: z.string().nullable().optional()
  });

// Insert schema for templates
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

// New insert schemas for settings and payment gateways
export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type FeatureUsage = typeof featureUsage.$inferSelect;
export type TokenUsageRecord = typeof tokenUsage.$inferSelect;
export type JobDescription = typeof jobDescriptions.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type CoverLetter = typeof coverLetters.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type ResumeTemplate = typeof resumeTemplates.$inferSelect;
export type CoverLetterTemplate = typeof coverLetterTemplates.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;
export type InsertTokenUsage = z.infer<typeof insertTokenUsageSchema>;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type InsertCoverLetter = z.infer<typeof insertCoverLetterSchema>;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type InsertResumeTemplate = z.infer<typeof insertResumeTemplateSchema>;
export type InsertCoverLetterTemplate = z.infer<typeof insertCoverLetterTemplateSchema>;

// Feature limits type definition
export type FeatureLimits = {
  maxResumes: number;
  maxCoverLetters: number;
  maxJobApplications: number;
  aiTokensPerMonth: number;
  customTemplates: boolean;
  advancedAiFeatures: boolean;
  priority: boolean;
  exportFormats: string[]; // pdf, doc, etc.
};

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

// Job application status history entry
export type StatusHistoryEntry = {
  id: string;
  status: string;
  date: string;
  notes: string | null;
};

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 10 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id').notNull(),
  userId: integer('user_id').references(() => users.id),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Add to existing type exports
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
