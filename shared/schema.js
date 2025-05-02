"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertPaymentTransactionSchema = exports.insertFeatureUsageSchema = exports.insertUserSubscriptionSchema = exports.insertPlanFeatureSchema = exports.insertFeatureSchema = exports.insertPlanPricingSchema = exports.insertSubscriptionPlanSchema = exports.insertApiKeySchema = exports.insertCoverLetterTemplateSchema = exports.insertResumeTemplateSchema = exports.insertJobApplicationSchema = exports.insertCoverLetterSchema = exports.insertResumeSchema = exports.insertJobDescriptionSchema = exports.insertAppSettingsSchema = exports.insertUserSchema = exports.paymentWebhookEvents = exports.paymentMethods = exports.paymentGatewayConfigs = exports.userBillingDetails = exports.documentVersions = exports.disputes = exports.paymentTransactions = exports.featureUsage = exports.userSubscriptions = exports.planFeatures = exports.features = exports.planPricing = exports.subscriptionPlans = exports.disputeStatusEnum = exports.paymentStatusEnum = exports.PaymentGatewayEnum = exports.subscriptionStatusEnum = exports.resetFrequencyEnum = exports.limitTypeEnum = exports.featureTypeEnum = exports.currencyEnum = exports.targetRegionEnum = exports.billingCycleEnum = exports.apiKeys = exports.session = exports.coverLetterTemplates = exports.resumeTemplates = exports.jobApplications = exports.coverLetters = exports.resumes = exports.jobDescriptions = exports.appSettings = exports.users = exports.jobApplicationStatus = void 0;
exports.insertPaymentWebhookEventSchema = exports.insertPaymentMethodSchema = exports.insertPaymentGatewayConfigSchema = exports.insertUserBillingDetailsSchema = exports.insertDocumentVersionSchema = exports.insertDisputeSchema = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
var zod_1 = require("zod");
// Define job application status enum
exports.jobApplicationStatus = (0, pg_core_1.pgEnum)('job_application_status', [
    'applied',
    'screening',
    'interview',
    'assessment',
    'offer',
    'rejected',
    'accepted'
]);
// User Schema
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    fullName: (0, pg_core_1.text)("full_name").notNull(),
    isAdmin: (0, pg_core_1.boolean)("is_admin").default(false).notNull(),
    lastLogin: (0, pg_core_1.timestamp)("last_login"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// App Settings Schema
exports.appSettings = (0, pg_core_1.pgTable)("app_settings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    key: (0, pg_core_1.text)("key").notNull().unique(),
    value: (0, pg_core_1.jsonb)("value").notNull(),
    category: (0, pg_core_1.text)("category").notNull(), // 'general', 'email', 'security', etc.
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Job Descriptions Schema
exports.jobDescriptions = (0, pg_core_1.pgTable)("job_descriptions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }),
    title: (0, pg_core_1.text)("title").notNull(),
    company: (0, pg_core_1.text)("company").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Enhanced Resume Schema with sections
exports.resumes = (0, pg_core_1.pgTable)("resumes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }),
    title: (0, pg_core_1.text)("title").notNull(),
    targetJobTitle: (0, pg_core_1.text)("target_job_title").notNull(),
    companyName: (0, pg_core_1.text)("company_name"),
    jobDescription: (0, pg_core_1.text)("job_description"),
    template: (0, pg_core_1.text)("template").notNull(),
    // Personal Info
    fullName: (0, pg_core_1.text)("full_name"),
    email: (0, pg_core_1.text)("email"),
    phone: (0, pg_core_1.text)("phone"),
    location: (0, pg_core_1.text)("location"),
    country: (0, pg_core_1.text)("country"),
    city: (0, pg_core_1.text)("city"),
    state: (0, pg_core_1.text)("state"),
    linkedinUrl: (0, pg_core_1.text)("linkedin_url"),
    portfolioUrl: (0, pg_core_1.text)("portfolio_url"),
    // Professional Summary
    summary: (0, pg_core_1.text)("summary"),
    // Work Experience - stored as JSON array
    workExperience: (0, pg_core_1.jsonb)("work_experience"),
    // Education - stored as JSON array
    education: (0, pg_core_1.jsonb)("education"),
    // Skills - stored as arrays
    skills: (0, pg_core_1.text)("skills").array(),
    technicalSkills: (0, pg_core_1.text)("technical_skills").array(),
    softSkills: (0, pg_core_1.text)("soft_skills").array(),
    useSkillCategories: (0, pg_core_1.boolean)("use_skill_categories").default(false),
    // Additional sections
    certifications: (0, pg_core_1.jsonb)("certifications"),
    projects: (0, pg_core_1.jsonb)("projects"),
    // ATS optimization fields
    keywordsOptimization: (0, pg_core_1.text)("keywords_optimization"),
    // Resume completion status
    isComplete: (0, pg_core_1.boolean)("is_complete").default(false),
    currentStep: (0, pg_core_1.text)("current_step").default("details"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Cover Letter Schema
exports.coverLetters = (0, pg_core_1.pgTable)("cover_letters", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }),
    title: (0, pg_core_1.text)("title").notNull(),
    // Job information
    jobTitle: (0, pg_core_1.text)("job_title").notNull(),
    // Company information
    company: (0, pg_core_1.text)("company").notNull(),
    recipientName: (0, pg_core_1.text)("recipient_name"),
    // Personal information
    fullName: (0, pg_core_1.text)("full_name"),
    email: (0, pg_core_1.text)("email"),
    phone: (0, pg_core_1.text)("phone"),
    address: (0, pg_core_1.text)("address"),
    resumeId: (0, pg_core_1.integer)("resume_id").references(function () { return exports.resumes.id; }),
    // Cover letter content
    content: (0, pg_core_1.text)("content").notNull(),
    // Job description (for AI and reference)
    jobDescription: (0, pg_core_1.text)("job_description"),
    // Template information
    template: (0, pg_core_1.text)("template").notNull().default("standard"),
    // Draft status
    isDraft: (0, pg_core_1.boolean)("is_draft").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Job Application Schema
exports.jobApplications = (0, pg_core_1.pgTable)("job_applications", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }),
    company: (0, pg_core_1.text)("company").notNull(),
    jobTitle: (0, pg_core_1.text)("job_title").notNull(),
    jobDescription: (0, pg_core_1.text)("job_description"),
    location: (0, pg_core_1.text)("location"),
    workType: (0, pg_core_1.text)("work_type"), // "onsite", "hybrid", "remote"
    salary: (0, pg_core_1.text)("salary"),
    jobUrl: (0, pg_core_1.text)("job_url"),
    status: (0, exports.jobApplicationStatus)("status").notNull().default('applied'),
    statusHistory: (0, pg_core_1.jsonb)("status_history"), // Array of status changes with dates
    appliedAt: (0, pg_core_1.timestamp)("applied_at").defaultNow(),
    resumeId: (0, pg_core_1.integer)("resume_id").references(function () { return exports.resumes.id; }),
    coverLetterId: (0, pg_core_1.integer)("cover_letter_id").references(function () { return exports.coverLetters.id; }),
    contactName: (0, pg_core_1.text)("contact_name"),
    contactEmail: (0, pg_core_1.text)("contact_email"),
    contactPhone: (0, pg_core_1.text)("contact_phone"),
    notes: (0, pg_core_1.text)("notes"),
    priority: (0, pg_core_1.text)("priority"), // "high", "medium", "low" 
    deadlineDate: (0, pg_core_1.timestamp)("deadline_date"),
    interviewDate: (0, pg_core_1.timestamp)("interview_date"),
    interviewType: (0, pg_core_1.text)("interview_type"), // "phone", "video", "onsite", etc.
    interviewNotes: (0, pg_core_1.text)("interview_notes"),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Resume Templates Schema
exports.resumeTemplates = (0, pg_core_1.pgTable)("resume_templates", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description").default("").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    thumbnail: (0, pg_core_1.text)("thumbnail").default("").notNull(),
    isDefault: (0, pg_core_1.boolean)("is_default").default(false).notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Cover Letter Templates Schema
exports.coverLetterTemplates = (0, pg_core_1.pgTable)("cover_letter_templates", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description").default("").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    thumbnail: (0, pg_core_1.text)("thumbnail").default("").notNull(),
    isDefault: (0, pg_core_1.boolean)("is_default").default(false).notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Session Table Schema (for connect-pg-simple)
exports.session = (0, pg_core_1.pgTable)("session", {
    sid: (0, pg_core_1.varchar)("sid").primaryKey(), // Session ID
    sess: (0, pg_core_1.jsonb)("sess").notNull(), // Session data
    expire: (0, pg_core_1.timestamp)("expire", { precision: 6, withTimezone: false }).notNull() // Expiry timestamp
}, function (table) {
    return {
        expireIdx: (0, pg_core_1.index)("IDX_session_expire").on(table.expire), // Index on expire column
    };
});
// API Keys Schema
exports.apiKeys = (0, pg_core_1.pgTable)("api_keys", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    service: (0, pg_core_1.text)("service").notNull().default("openai"), // The service this key is for (e.g., 'openai', 'anthropic', etc.)
    key: (0, pg_core_1.text)("key").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    lastUsed: (0, pg_core_1.timestamp)("last_used"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// ============= Subscription SaaS Model Schemas =============
// Subscription Billing Cycle Enum
exports.billingCycleEnum = (0, pg_core_1.pgEnum)('billing_cycle', [
    'MONTHLY',
    'YEARLY'
]);
// Region Target Enum
exports.targetRegionEnum = (0, pg_core_1.pgEnum)('target_region', [
    'INDIA',
    'GLOBAL'
]);
// Currency Enum
exports.currencyEnum = (0, pg_core_1.pgEnum)('currency', [
    'INR',
    'USD'
]);
// Feature Type Enum
exports.featureTypeEnum = (0, pg_core_1.pgEnum)('feature_type', [
    'ESSENTIAL',
    'ADVANCED',
    'PROFESSIONAL'
]);
// Limit Type Enum
exports.limitTypeEnum = (0, pg_core_1.pgEnum)('limit_type', [
    'UNLIMITED',
    'COUNT',
    'BOOLEAN'
]);
// Reset Frequency Enum
exports.resetFrequencyEnum = (0, pg_core_1.pgEnum)('reset_frequency', [
    'NEVER',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'YEARLY'
]);
// Subscription Status Enum
exports.subscriptionStatusEnum = (0, pg_core_1.pgEnum)('subscription_status', [
    'ACTIVE',
    'GRACE_PERIOD',
    'EXPIRED',
    'CANCELLED'
]);
// Payment Gateway Enum
exports.PaymentGatewayEnum = (0, pg_core_1.pgEnum)('payment_gateway', [
    'STRIPE',
    'RAZORPAY',
    'PAYPAL',
    'NONE'
]);
// Payment Status Enum
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)('payment_status', [
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
]);
// Dispute Status Enum
exports.disputeStatusEnum = (0, pg_core_1.pgEnum)('dispute_status', [
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED',
    'REJECTED'
]);
// Subscription Plans Table
exports.subscriptionPlans = (0, pg_core_1.pgTable)("subscription_plans", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    billingCycle: (0, exports.billingCycleEnum)("billing_cycle").notNull(),
    isFeatured: (0, pg_core_1.boolean)("is_featured").default(false).notNull(),
    isFreemium: (0, pg_core_1.boolean)("is_freemium").default(false).notNull(),
    active: (0, pg_core_1.boolean)("active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Plan Pricing Table for region-specific pricing
exports.planPricing = (0, pg_core_1.pgTable)("plan_pricing", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    planId: (0, pg_core_1.integer)("plan_id").notNull().references(function () { return exports.subscriptionPlans.id; }),
    targetRegion: (0, exports.targetRegionEnum)("target_region").notNull(),
    currency: (0, exports.currencyEnum)("currency").notNull(),
    price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
}, function (table) {
    return {
        uniquePlanRegion: (0, pg_core_1.unique)().on(table.planId, table.targetRegion)
    };
});
// Features Table
exports.features = (0, pg_core_1.pgTable)("features", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    code: (0, pg_core_1.text)("code").notNull().unique(),
    description: (0, pg_core_1.text)("description").notNull(),
    featureType: (0, exports.featureTypeEnum)("feature_type").notNull(),
    isCountable: (0, pg_core_1.boolean)("is_countable").default(true).notNull(),
    isTokenBased: (0, pg_core_1.boolean)("is_token_based").default(false).notNull(),
    costFactor: (0, pg_core_1.decimal)("cost_factor", { precision: 10, scale: 4 }).default("1.0000"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Plan Features Table
exports.planFeatures = (0, pg_core_1.pgTable)("plan_features", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    planId: (0, pg_core_1.integer)("plan_id").notNull().references(function () { return exports.subscriptionPlans.id; }),
    featureId: (0, pg_core_1.integer)("feature_id").notNull().references(function () { return exports.features.id; }),
    limitType: (0, exports.limitTypeEnum)("limit_type").notNull(),
    limitValue: (0, pg_core_1.integer)("limit_value"),
    isEnabled: (0, pg_core_1.boolean)("is_enabled").default(false).notNull(),
    resetFrequency: (0, exports.resetFrequencyEnum)("reset_frequency"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
}, function (table) {
    return {
        uniquePlanFeature: (0, pg_core_1.unique)().on(table.planId, table.featureId)
    };
});
// User Subscriptions Table
exports.userSubscriptions = (0, pg_core_1.pgTable)("user_subscriptions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }),
    planId: (0, pg_core_1.integer)("plan_id").notNull().references(function () { return exports.subscriptionPlans.id; }),
    startDate: (0, pg_core_1.timestamp)("start_date").notNull(),
    endDate: (0, pg_core_1.timestamp)("end_date").notNull(),
    status: (0, exports.subscriptionStatusEnum)("status").notNull().default('ACTIVE'),
    autoRenew: (0, pg_core_1.boolean)("auto_renew").default(false).notNull(),
    cancelDate: (0, pg_core_1.timestamp)("cancel_date"),
    gracePeriodEnd: (0, pg_core_1.timestamp)("grace_period_end"),
    paymentGateway: (0, exports.PaymentGatewayEnum)("payment_gateway"),
    paymentReference: (0, pg_core_1.text)("payment_reference"),
    previousPlanId: (0, pg_core_1.integer)("previous_plan_id"),
    upgradeDate: (0, pg_core_1.timestamp)("upgrade_date"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Feature Usage Table
exports.featureUsage = (0, pg_core_1.pgTable)("feature_usage", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }),
    featureId: (0, pg_core_1.integer)("feature_id").notNull().references(function () { return exports.features.id; }),
    usageCount: (0, pg_core_1.integer)("usage_count").default(0).notNull(),
    aiModelType: (0, pg_core_1.text)("ai_model_type"),
    aiTokenCount: (0, pg_core_1.integer)("ai_token_count"),
    aiCost: (0, pg_core_1.decimal)("ai_cost", { precision: 10, scale: 4 }),
    lastUsed: (0, pg_core_1.timestamp)("last_used").defaultNow(),
    resetDate: (0, pg_core_1.timestamp)("reset_date"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
}, function (table) {
    return {
        uniqueUserFeature: (0, pg_core_1.unique)().on(table.userId, table.featureId)
    };
});
// Payment Transactions Table
exports.paymentTransactions = (0, pg_core_1.pgTable)("payment_transactions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }),
    subscriptionId: (0, pg_core_1.integer)("subscription_id").notNull().references(function () { return exports.userSubscriptions.id; }),
    amount: (0, pg_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    currency: (0, exports.currencyEnum)("currency").notNull(),
    gateway: (0, exports.PaymentGatewayEnum)("gateway").notNull(),
    gatewayTransactionId: (0, pg_core_1.text)("gateway_transaction_id"),
    status: (0, exports.paymentStatusEnum)("status").notNull().default('PENDING'),
    refundReason: (0, pg_core_1.text)("refund_reason"),
    refundAmount: (0, pg_core_1.decimal)("refund_amount", { precision: 10, scale: 2 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Disputes Table
exports.disputes = (0, pg_core_1.pgTable)("disputes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    transactionId: (0, pg_core_1.integer)("transaction_id").notNull().references(function () { return exports.paymentTransactions.id; }),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }),
    reason: (0, pg_core_1.text)("reason").notNull(),
    status: (0, exports.disputeStatusEnum)("status").notNull().default('OPEN'),
    resolutionNotes: (0, pg_core_1.text)("resolution_notes"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
    resolvedAt: (0, pg_core_1.timestamp)("resolved_at")
});
// Document Version Table
exports.documentVersions = (0, pg_core_1.pgTable)("document_versions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }),
    documentId: (0, pg_core_1.integer)("document_id").notNull(),
    documentType: (0, pg_core_1.text)("document_type").notNull(), // 'RESUME' or 'COVER_LETTER'
    versionNumber: (0, pg_core_1.integer)("version_number").notNull(),
    contentHash: (0, pg_core_1.text)("content_hash").notNull(),
    isSignificantChange: (0, pg_core_1.boolean)("is_significant_change").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow()
}, function (table) {
    return {
        uniqueDocumentVersion: (0, pg_core_1.unique)().on(table.documentId, table.documentType, table.versionNumber)
    };
});
// User Billing Details Schema
exports.userBillingDetails = (0, pg_core_1.pgTable)("user_billing_details", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }).unique(),
    country: (0, pg_core_1.text)("country").notNull(),
    addressLine1: (0, pg_core_1.text)("address_line_1").notNull(),
    addressLine2: (0, pg_core_1.text)("address_line_2"),
    city: (0, pg_core_1.text)("city").notNull(),
    state: (0, pg_core_1.text)("state").notNull(),
    postalCode: (0, pg_core_1.text)("postal_code").notNull(),
    phoneNumber: (0, pg_core_1.text)("phone_number"),
    taxId: (0, pg_core_1.text)("tax_id"), // For GST in India, VAT/Tax ID for other countries
    companyName: (0, pg_core_1.text)("company_name"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Payment Gateway Configurations Table (more specialized than general apiKeys)
exports.paymentGatewayConfigs = (0, pg_core_1.pgTable)("payment_gateway_configs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    service: (0, exports.PaymentGatewayEnum)("service").notNull(),
    key: (0, pg_core_1.text)("key").notNull(), // Encrypted API key
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    isDefault: (0, pg_core_1.boolean)("is_default").default(false).notNull(),
    configOptions: (0, pg_core_1.jsonb)("config_options").default({}), // For additional options like webhook secrets
    lastUsed: (0, pg_core_1.timestamp)("last_used"),
    testMode: (0, pg_core_1.boolean)("test_mode").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Saved Payment Methods Table
exports.paymentMethods = (0, pg_core_1.pgTable)("payment_methods", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(function () { return exports.users.id; }),
    gateway: (0, exports.PaymentGatewayEnum)("gateway").notNull(),
    type: (0, pg_core_1.text)("type").notNull(), // "card", "upi", "netbanking", etc.
    lastFour: (0, pg_core_1.text)("last_four"), // Last 4 digits of card or partial payment info
    expiryMonth: (0, pg_core_1.integer)("expiry_month"),
    expiryYear: (0, pg_core_1.integer)("expiry_year"),
    isDefault: (0, pg_core_1.boolean)("is_default").default(false).notNull(),
    // In a real implementation, you would store tokenized payment information securely
    gatewayPaymentMethodId: (0, pg_core_1.text)("gateway_payment_method_id").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
    deletedAt: (0, pg_core_1.timestamp)("deleted_at")
});
// Payment Webhook Events Table
exports.paymentWebhookEvents = (0, pg_core_1.pgTable)("payment_webhook_events", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    gateway: (0, exports.PaymentGatewayEnum)("gateway").notNull(),
    eventType: (0, pg_core_1.text)("event_type").notNull(), // e.g., "payment.success", "subscription.created"
    eventId: (0, pg_core_1.text)("event_id").notNull(), // ID from payment gateway
    rawData: (0, pg_core_1.jsonb)("raw_data").notNull(), // Complete webhook payload
    processed: (0, pg_core_1.boolean)("processed").default(false).notNull(),
    processingErrors: (0, pg_core_1.text)("processing_errors"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
// Insert Schemas
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertAppSettingsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.appSettings).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertJobDescriptionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.jobDescriptions).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertResumeSchema = (0, drizzle_zod_1.createInsertSchema)(exports.resumes).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertCoverLetterSchema = (0, drizzle_zod_1.createInsertSchema)(exports.coverLetters).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertJobApplicationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.jobApplications)
    .omit({
    id: true,
    appliedAt: true,
    updatedAt: true
})
    .extend({
    // Add stricter validation for required fields
    company: zod_1.z.string().min(1, "Company name is required"),
    jobTitle: zod_1.z.string().min(1, "Job title is required"),
    // Validate status using enum values
    status: zod_1.z.enum(['applied', 'screening', 'interview', 'assessment', 'offer', 'rejected', 'accepted']).default('applied'),
    // Allow deadline date to be a string (ISO date) or a Date object
    deadlineDate: zod_1.z.string().nullable().optional(),
    // Allow interview date to be a string (ISO date) or a Date object
    interviewDate: zod_1.z.string().nullable().optional(),
    // Allow interview type to be a string
    interviewType: zod_1.z.string().nullable().optional(),
    // Allow interview notes to be a string
    interviewNotes: zod_1.z.string().nullable().optional()
});
exports.insertResumeTemplateSchema = (0, drizzle_zod_1.createInsertSchema)(exports.resumeTemplates).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertCoverLetterTemplateSchema = (0, drizzle_zod_1.createInsertSchema)(exports.coverLetterTemplates).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertApiKeySchema = (0, drizzle_zod_1.createInsertSchema)(exports.apiKeys);
exports.insertSubscriptionPlanSchema = (0, drizzle_zod_1.createInsertSchema)(exports.subscriptionPlans).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPlanPricingSchema = (0, drizzle_zod_1.createInsertSchema)(exports.planPricing).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertFeatureSchema = (0, drizzle_zod_1.createInsertSchema)(exports.features).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPlanFeatureSchema = (0, drizzle_zod_1.createInsertSchema)(exports.planFeatures).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertUserSubscriptionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userSubscriptions).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertFeatureUsageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.featureUsage).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPaymentTransactionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.paymentTransactions).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertDisputeSchema = (0, drizzle_zod_1.createInsertSchema)(exports.disputes).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    resolvedAt: true
});
exports.insertDocumentVersionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.documentVersions).omit({
    id: true,
    createdAt: true
});
exports.insertUserBillingDetailsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userBillingDetails).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPaymentGatewayConfigSchema = (0, drizzle_zod_1.createInsertSchema)(exports.paymentGatewayConfigs).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPaymentMethodSchema = (0, drizzle_zod_1.createInsertSchema)(exports.paymentMethods).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
});
exports.insertPaymentWebhookEventSchema = (0, drizzle_zod_1.createInsertSchema)(exports.paymentWebhookEvents).omit({
    id: true,
    createdAt: true
});
