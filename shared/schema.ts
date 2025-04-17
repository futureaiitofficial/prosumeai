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

// Types
export type User = typeof users.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type JobDescription = typeof jobDescriptions.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type CoverLetter = typeof coverLetters.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type ResumeTemplate = typeof resumeTemplates.$inferSelect;
export type CoverLetterTemplate = typeof coverLetterTemplates.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAppSetting = z.infer<typeof insertAppSettingsSchema>;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type InsertCoverLetter = z.infer<typeof insertCoverLetterSchema>;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type InsertResumeTemplate = z.infer<typeof insertResumeTemplateSchema>;
export type InsertCoverLetterTemplate = z.infer<typeof insertCoverLetterTemplateSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

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
  status: string; // We keep this as string since it's stored in the database as text within a JSONB field
  date: string;
  notes: string | null;
};
