# ATScribe SaaS Model

## Table of Contents
- [Introduction](#introduction)
- [Database Schema](#database-schema)
- [Subscription Plans and Pricing](#subscription-plans-and-pricing)
- [Feature Access Management](#feature-access-management)
- [Payment Processing](#payment-processing)
- [User Experience](#user-experience)
- [Administration](#administration)
- [Security and Compliance](#security-and-compliance)
- [Implementation Roadmap](#implementation-roadmap)

## Introduction

This document outlines the SaaS model for ATScribe, a resume and job application management platform. The model includes region-specific pricing (India vs Global), multiple payment gateways, feature access controls, and comprehensive usage tracking.

### Core Principles

1. **Region-specific Pricing**: Different pricing for Indian market (INR) and Global market (USD)
2. **Robust Server-side Control**: No client-side trust for feature access
3. **Transparent Usage Limits**: Clear tracking and display of usage limits
4. **Flexible Subscription Management**: Support for trials, freemium, upgrades, and downgrades
5. **Admin-controlled Features**: All features and limits managed through admin panel

### Core Features Under Management

- Resume Creation and Templates
- Cover Letter Generation
- Job Application Tracking
- Keyword Generation (ATS Optimization)
- AI-powered Content Generation
- PDF Generation and Export

## Database Schema

### Subscription Plans Table
```
- id: UUID
- name: String (e.g., "Basic India", "Premium Global")
- description: String
- price: Decimal
- currency: Enum (INR, USD)
- billing_cycle: Enum (MONTHLY, YEARLY)
- target_region: Enum (INDIA, GLOBAL)
- is_featured: Boolean
- is_freemium: Boolean
- active: Boolean
- created_at: Timestamp
- updated_at: Timestamp
```

### Features Table
```
- id: UUID
- name: String
- code: String (unique identifier for the feature)
- description: String
- feature_type: Enum (CORE, PREMIUM, ENTERPRISE)
- is_countable: Boolean
- cost_factor: Decimal (for AI-based features)
- created_at: Timestamp
- updated_at: Timestamp
```

### Plan Features Table
```
- id: UUID
- plan_id: Foreign Key
- feature_id: Foreign Key
- limit_type: Enum (UNLIMITED, COUNT, BOOLEAN)
- limit_value: Integer (null for BOOLEAN or UNLIMITED types)
- reset_frequency: Enum (NEVER, DAILY, WEEKLY, MONTHLY, YEARLY)
- created_at: Timestamp
- updated_at: Timestamp
```

### User Subscriptions Table
```
- id: UUID
- user_id: Foreign Key
- plan_id: Foreign Key
- start_date: Date
- end_date: Date
- auto_renew: Boolean
- payment_gateway: String
- payment_reference: String
- status: Enum (ACTIVE, GRACE_PERIOD, EXPIRED, CANCELLED)
- is_trial: Boolean
- trial_expiry_date: Date
- converted_from_trial: Boolean
- grace_period_end: Timestamp
- previous_plan_id: UUID
- upgrade_date: Timestamp
- created_at: Timestamp
- updated_at: Timestamp
```

### Feature Usage Table
```
- id: UUID
- user_id: Foreign Key
- feature_id: Foreign Key
- usage_count: Integer
- ai_model_type: String (for AI features)
- ai_token_count: Integer (for token-based pricing)
- ai_cost: Decimal (for financial tracking)
- last_used: Timestamp
- reset_date: Date (for recurring limits)
- created_at: Timestamp
- updated_at: Timestamp
```

### Payment Transactions Table
```
- id: UUID
- user_id: Foreign Key
- subscription_id: Foreign Key
- amount: Decimal
- currency: Enum (INR, USD)
- gateway: Enum (RAZORPAY, STRIPE, PAYPAL)
- gateway_transaction_id: String
- status: Enum (PENDING, COMPLETED, FAILED, REFUNDED)
- refund_reason: String
- refund_amount: Decimal
- created_at: Timestamp
- updated_at: Timestamp
```

### Disputes Table
```
- id: UUID
- transaction_id: Foreign Key
- user_id: Foreign Key
- reason: String
- status: Enum (OPEN, UNDER_REVIEW, RESOLVED, REJECTED)
- resolution_notes: String
- created_at: Timestamp
- updated_at: Timestamp
- resolved_at: Timestamp
```

## Subscription Plans and Pricing

### Freemium Tier
- **Free forever** with limited functionality
- Available in all regions
- Includes:
  - 2 resume creations
  - 1 cover letter
  - 10 keyword analyses
  - 5 job application tracking slots
  - Watermarked PDF exports
  - Basic AI features only

### Regional Tiers - India (INR)

#### Basic India
- ₹499/month or ₹4,999/year (16% savings)
- Includes:
  - 5 resume creations
  - 5 cover letters
  - 50 keyword analyses
  - 25 job application tracking slots
  - Standard AI features

#### Premium India
- ₹999/month or ₹9,999/year (16% savings)
- Includes:
  - 15 resume creations
  - 15 cover letters
  - Unlimited keyword analyses
  - 100 job application tracking slots
  - Premium AI features
  - Priority support

#### Enterprise India
- ₹2,499/month or ₹24,999/year (16% savings)
- Includes:
  - Unlimited resume creations
  - Unlimited cover letters
  - Unlimited keyword analyses
  - Unlimited job applications
  - Advanced AI features
  - Dedicated support
  - Custom branding options

### Regional Tiers - Global (USD)

#### Basic Global
- $9.99/month or $99.99/year (16% savings)
- Includes:
  - 5 resume creations
  - 5 cover letters
  - 50 keyword analyses
  - 25 job application tracking slots
  - Standard AI features

#### Premium Global
- $19.99/month or $199.99/year (16% savings)
- Includes:
  - 15 resume creations
  - 15 cover letters
  - Unlimited keyword analyses
  - 100 job application tracking slots
  - Premium AI features
  - Priority support

#### Enterprise Global
- $49.99/month or $499.99/year (16% savings)
- Includes:
  - Unlimited resume creations
  - Unlimited cover letters
  - Unlimited keyword analyses
  - Unlimited job applications
  - Advanced AI features
  - Dedicated support
  - Custom branding options

### Free Trial
- 14-day full access to Premium tier
- No credit card required
- Automatic downgrade to Freemium after trial period
- Conversion incentives at 3, 7, and 13 days

## Feature Access Management

### Server-Side Feature Control Module

```javascript
// Core functions
isFeatureEnabled(userId, featureCode): Boolean
getRemainingUsage(userId, featureCode): Number
incrementUsage(userId, featureCode, tokenCount?: Number): Boolean
resetUsageCounts(): Scheduled job
estimateTokenUsage(text): Number // For AI features
checkContentVersioning(userId, contentId, contentHash): Boolean // Check for significant changes
```

### Feature Codes for Access Control

| Feature Code | Description | Countable |
|--------------|-------------|-----------|
| RESUME_CREATE | Create new resume | Yes |
| RESUME_TEMPLATE | Access premium templates | Yes |
| RESUME_EXPORT | Export to PDF | Yes |
| RESUME_VERSION | Create new version of resume | Yes |
| COVER_LETTER_CREATE | Create new cover letter | Yes |
| COVER_LETTER_TEMPLATE | Access premium templates | Yes |
| COVER_LETTER_EXPORT | Export to PDF | Yes |
| COVER_LETTER_VERSION | Create new version of cover letter | Yes |
| JOB_APP_CREATE | Create job application | Yes |
| JOB_APP_TRACK | Track status changes | Yes |
| KEYWORD_ANALYZE | Analyze job description | Yes |
| AI_CONTENT_GEN | AI content generation | Yes (token-based) |
| AI_KEYWORD_EXTRACT | Extract keywords with AI | Yes (token-based) |
| AI_RESUME_ENHANCE | AI resume enhancement | Yes (token-based) |

### Integration Points

#### Resume Creation (resume-template-routes.ts)
```javascript
// Before allowing resume creation
const canCreateResume = await featureControl.isFeatureEnabled(req.user.id, 'RESUME_CREATE');
if (!canCreateResume) {
  return res.status(403).json({ message: "Feature not available on your plan" });
}

// After successful creation
await featureControl.incrementUsage(req.user.id, 'RESUME_CREATE');
```

#### Cover Letter Creation (cover-letter-template-routes.ts)
```javascript
// Before allowing cover letter creation
const canCreateCoverLetter = await featureControl.isFeatureEnabled(req.user.id, 'COVER_LETTER_CREATE');
if (!canCreateCoverLetter) {
  return res.status(403).json({ message: "Feature not available on your plan" });
}

// After successful creation
await featureControl.incrementUsage(req.user.id, 'COVER_LETTER_CREATE');
```

#### AI Features (ai.ts)
```javascript
// Before using AI feature
const canUseAI = await featureControl.isFeatureEnabled(req.user.id, 'AI_CONTENT_GEN');
if (!canUseAI) {
  return res.status(403).json({ message: "AI features not available on your plan" });
}

// Estimate token usage before making API call
const estimatedTokens = featureControl.estimateTokenUsage(prompt);

// After successful AI generation
await featureControl.incrementUsage(req.user.id, 'AI_CONTENT_GEN', estimatedTokens);
```

#### Keyword Generation (keyword-generator.tsx backend route)
```javascript
// Before allowing keyword generation
const canUseKeywordGenerator = await featureControl.isFeatureEnabled(req.user.id, 'KEYWORD_ANALYZE');
if (!canUseKeywordGenerator) {
  return res.status(403).json({ message: "Keyword analysis not available on your plan" });
}

// After successful generation
await featureControl.incrementUsage(req.user.id, 'KEYWORD_ANALYZE');
```

#### Job Application Tracking (job-applications-routes.ts)
```javascript
// Before allowing new job application creation
const canCreateJobApp = await featureControl.isFeatureEnabled(req.user.id, 'JOB_APP_CREATE');
if (!canCreateJobApp) {
  return res.status(403).json({ message: "Job application tracking not available on your plan" });
}

// After successful creation
await featureControl.incrementUsage(req.user.id, 'JOB_APP_CREATE');
```

## Payment Processing

### Payment Gateway Selection

1. **For INR Payments (India)**
   - Primary: Razorpay
   - Fallback: Stripe (if available in India)

2. **For USD Payments (Global)**
   - Primary: Stripe
   - Alternative: PayPal

### Payment Flow

1. User selects subscription plan
2. System determines appropriate gateway based on:
   - User's detected region
   - Selected currency
   - Plan type
3. User redirected to gateway's checkout
4. After successful payment:
   - Create transaction record
   - Update user subscription status
   - Grant immediate access to features
5. Webhook handlers capture payment status changes

### Handling Renewals

```javascript
// Scheduled job to check upcoming renewals
async function processRenewals() {
  const pendingRenewals = await getSubscriptionsToRenew(nextDays=3);
  
  for (const subscription of pendingRenewals) {
    // Pre-authorize payment
    const paymentResult = await initiateRenewalPayment(subscription);
    
    if (paymentResult.success) {
      // Update subscription dates
      await extendSubscription(subscription.id, subscription.billing_cycle);
      // Send success notification
      await sendRenewalSuccess(subscription.user_id);
    } else {
      // Mark for retry or grace period
      await markRenewalFailed(subscription.id);
      // Send failure notification
      await sendRenewalFailure(subscription.user_id, paymentResult.error);
    }
  }
}
```

### Refund Processing

- Full refunds available within 7 days of purchase if no usage
- Partial prorated refunds based on usage percentage
- Admin approval required for refunds after 7 days
- Automated refunds for service outages (calculated by downtime duration)

## User Experience

### Usage Dashboard

- Visual display of feature usage vs. limits
- Progress bars with color coding:
  - Green: 0-75% used
  - Yellow: 75-90% used
  - Red: 90-100% used
- Predictive usage based on current patterns
- Clear CTAs for upgrading when limits approached

### Notification System

- Automated notifications at:
  - 75% usage: "You're approaching your limit"
  - 90% usage: "You're almost at your limit"
  - 100% usage: "You've reached your limit"
- Trial expiration reminders at 7, 3, and 1 days remaining
- Renewal reminders 3 days before billing
- Payment success/failure notifications

### Grace Period Experience

- Read-only access to created content
- Clear messaging about subscription status
- Easy one-click renewal option
- Countdown timer showing days remaining in grace period

### Upgrade/Downgrade Experience

- Side-by-side comparison of current vs. new plan
- Transparent display of prorated charges/credits
- Preview of new limits and features
- Confirmation of billing changes
- Immediate access to new features on upgrade

## Administration

### Admin Portal Sections

#### Plan Management
- Create/edit/delete subscription plans
- Set pricing by region and currency
- Configure plan features and limits
- Toggle plan availability
- Manage promotional offers and discounts

#### User Subscription Management
- View all user subscriptions
- Filter by plan, status, region
- Manually adjust subscription status
- Override feature limits for specific users
- Add subscription notes
- Process refunds and cancellations

#### Feature Management
- Define available features
- Set default limits by plan tier
- View feature usage analytics
- Adjust global feature parameters
- Enable/disable features system-wide

#### Payment Management
- View all transactions
- Filter by gateway, status, date range
- Process manual refunds
- Resolve payment disputes
- Generate financial reports
- Reconcile gateway transactions

#### Analytics Dashboard
- Subscription metrics:
  - Total subscribers by plan
  - Conversion rates
  - Churn rates
  - Average revenue per user
- Feature usage metrics:
  - Most/least used features
  - Feature usage by plan tier
  - AI token consumption trends
- Financial metrics:
  - Monthly recurring revenue
  - Annual recurring revenue
  - Revenue by region/currency
  - Refund rate

### Admin APIs

```
GET    /api/admin/plans
POST   /api/admin/plans
GET    /api/admin/plans/:id
PUT    /api/admin/plans/:id
DELETE /api/admin/plans/:id

GET    /api/admin/features
POST   /api/admin/features
GET    /api/admin/features/:id
PUT    /api/admin/features/:id
DELETE /api/admin/features/:id

GET    /api/admin/subscriptions
GET    /api/admin/subscriptions/:id
PUT    /api/admin/subscriptions/:id/status
PUT    /api/admin/subscriptions/:id/override-limits

GET    /api/admin/transactions
GET    /api/admin/transactions/:id
POST   /api/admin/transactions/:id/refund

GET    /api/admin/analytics/subscriptions
GET    /api/admin/analytics/features
GET    /api/admin/analytics/revenue
```

## Security and Compliance

### Security Measures

- All feature validation performed server-side
- JWT tokens with signed subscription data
- Rate limiting to prevent abuse
- Audit logging for subscription changes
- Secure handling of payment information
- Regular security testing
- Admin action audit trail

### Data Privacy Compliance

#### GDPR Compliance (EU Users)
- Explicit consent for data processing
- Right to be forgotten implementation
- Data export functionality
- Processing records for AI operations
- Data minimization in feature usage tracking

#### CCPA Compliance (California Users)
- California user identification
- Do Not Sell My Personal Information implementation
- Enhanced disclosure for AI analysis
- Access logs for personal data

### Data Handling

- Encryption of personal information at rest
- Data separation between subscription and content
- Clear data retention policies:
  - Subscription data: 7 years (tax requirements)
  - Usage data: 2 years
  - Content data: 1 year after account deletion
  - Payment data: 7 years (financial regulations)
- Automated data purging

## Implementation Roadmap

### Phase 1: Core Subscription Infrastructure (Weeks 1-4)
- Database schema implementation
- Basic subscription management
- Freemium tier implementation
- Feature access control middleware
- Basic admin panel

### Phase 2: Payment Processing (Weeks 5-8)
- Razorpay integration (INR)
- Stripe integration (USD)
- Payment webhook handling
- Subscription lifecycle management
- Basic reporting

### Phase 3: Advanced Feature Control (Weeks 9-12)
- Feature usage tracking
- AI token consumption tracking
- Usage notifications
- User dashboard
- Enhanced admin controls

### Phase 4: UX Enhancement (Weeks 13-16)
- Usage visualization
- Upgrade/downgrade flows
- Trial conversion optimization
- Grace period handling
- Email notification system

### Phase 5: Analytics and Optimization (Weeks 17-20)
- Subscription analytics
- Revenue reporting
- Feature usage analytics
- Conversion optimization
- Performance optimization

### Phase 6: Compliance and Security (Weeks 21-24)
- GDPR implementation
- CCPA implementation
- Security hardening
- Audit logging
- Data retention implementation

### Phase 7: Scaling and Resilience (Weeks 25-28)
- Database optimization
- Caching implementation
- Load balancing
- High availability configuration
- Backup and recovery procedures

## Anti-Abuse Measures

### Content Version Tracking

To prevent users from circumventing usage limits by repeatedly modifying and exporting the same document:

```
- Resume and cover letter content is hashed to detect substantial changes
- Minor modifications (spacing, punctuation, formatting) are identified as the same document
- Each document export counts against export limits regardless of content
- Significant modifications are tracked as document versions, counting against version limits
```

### Document Version Table
```
- id: UUID
- user_id: Foreign Key
- document_id: Foreign Key
- document_type: Enum (RESUME, COVER_LETTER)
- version_number: Integer
- content_hash: String
- is_significant_change: Boolean
- created_at: Timestamp
```

### Export Limits and Tracking

Each subscription plan includes separate limits for:
- Document creations (new unique documents)
- Document versions (significant modifications to existing documents)
- Document exports (PDF or other format generation)

```javascript
// Before allowing document export
const canExportResume = await featureControl.isFeatureEnabled(req.user.id, 'RESUME_EXPORT');
if (!canExportResume) {
  return res.status(403).json({ message: "Export feature not available on your plan" });
}

// After successful export
await featureControl.incrementUsage(req.user.id, 'RESUME_EXPORT');
```

### Modification Detection

```javascript
// When saving a document
const contentHash = generateContentHash(documentContent);
const isSignificantChange = await featureControl.checkContentVersioning(
  req.user.id, 
  documentId, 
  contentHash
);

if (isSignificantChange) {
  // Check if user can create a new version
  const canCreateVersion = await featureControl.isFeatureEnabled(req.user.id, 'RESUME_VERSION');
  if (!canCreateVersion) {
    return res.status(403).json({ 
      message: "You've reached your limit for resume versions. Upgrade your plan to make more significant changes."
    });
  }
  
  // Create new version and increment usage
  await createNewDocumentVersion(req.user.id, documentId, contentHash);
  await featureControl.incrementUsage(req.user.id, 'RESUME_VERSION');
} else {
  // Minor change, update existing version without counting against limits
  await updateExistingVersion(documentId, documentContent);
}
``` 