# Prosume - Professional Resume & Job Application Manager

Prosume is a comprehensive job application management platform that empowers job seekers with advanced AI-driven resume parsing, tracking, and career progression tools. The platform provides intelligent resume enhancement, career transition support, and personalized job application insights through an interactive Kanban-style interface.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Admin Dashboard](#admin-dashboard)
- [AI Features](#ai-features)
- [Contributing](#contributing)
- [License](#license)

## Features

### Resume Builder
- Step-by-step workflow with template selection
- Resume parsing from DOCX files
- Section-by-section form-filling with live A4/Letter preview
- AI-powered summary generation and ATS optimization
- Export to multiple formats (PDF, DOCX, LaTeX)

### Cover Letter Generator
- Template-based workflow similar to resume builder
- AI-driven personalization based on job description and resume
- Company research integration for targeted content
- Export to multiple formats

### Job Applications Tracker
- Comprehensive job application details storage
- Status tracking with history (Applied, Interview, Offer, etc.)
- Multiple view options: Table, Card, and Kanban board
- Linking to resumes and cover letters
- Advanced filtering and sorting

### Admin Dashboard
- User management system
- Resume and cover letter template management
- Pricing plans configuration
- System status monitoring
- Statistics dashboard

## Tech Stack

- **Frontend**:
  - React.js with TypeScript
  - Tailwind CSS for styling
  - shadcn/ui component library
  - TanStack Query for data fetching
  - Wouter for routing
  - Zod for schema validation

- **Backend**:
  - Express.js server
  - PostgreSQL database 
  - Drizzle ORM for database operations
  - Passport.js for authentication
  - Multer for file uploads

- **AI Integration**:
  - OpenAI GPT for resume parsing and content generation
  - ATS scoring algorithm

- **Document Processing**:
  - PDF-lib for PDF generation
  - unzipper for document processing
  - pdf-parse for PDF text extraction
  - node-latex for LaTeX integration

## Project Structure

```
/
├── client/              # React frontend application
│   ├── src/             # Source code
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Page components
│   │   └── utils/       # Helper utilities
├── server/              # Express backend application
│   ├── middleware/      # Express middleware
│   ├── ai-resume-utils.ts   # AI utilities for resumes
│   ├── ai-cover-letter-utils.ts # AI utilities for cover letters
│   ├── auth.ts          # Authentication setup
│   ├── routes.ts        # API routes
│   ├── admin-routes.ts  # Admin-only routes
│   └── storage.ts       # Data storage interface
├── shared/              # Shared code between client and server
│   └── schema.ts        # Database schema definitions
├── scripts/             # Utility scripts
├── uploads/             # Directory for file uploads
└── temp/                # Temporary files directory
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- PostgreSQL database
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/prosume.git
   cd prosume
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and configure your settings
   - Required environment variables:
     - `DATABASE_URL`: PostgreSQL connection string
     - `SESSION_SECRET`: Secret for session encryption
     - `OPENAI_API_KEY`: OpenAI API key for AI features

4. Initialize the database:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. The application will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Log in with username and password
- `POST /api/logout` - Log out current user
- `GET /api/user` - Get currently authenticated user

### Resumes
- `GET /api/resumes` - Get all resumes for the current user
- `GET /api/resumes/:id` - Get a specific resume
- `POST /api/resumes` - Create a new resume
- `PATCH /api/resumes/:id` - Update a resume
- `DELETE /api/resumes/:id` - Delete a resume
- `GET /api/resumes/:id/pdf` - Generate PDF for a resume
- `POST /api/resumes/parse` - Parse a resume from uploaded file

### Cover Letters
- `GET /api/cover-letters` - Get all cover letters for the current user
- `GET /api/cover-letters/:id` - Get a specific cover letter
- `POST /api/cover-letters` - Create a new cover letter
- `PATCH /api/cover-letters/:id` - Update a cover letter
- `DELETE /api/cover-letters/:id` - Delete a cover letter
- `GET /api/cover-letters/:id/pdf` - Generate PDF for a cover letter

### Job Applications
- `GET /api/job-applications` - Get all job applications for the current user
- `GET /api/job-applications/:id` - Get a specific job application
- `POST /api/job-applications` - Create a new job application
- `PATCH /api/job-applications/:id` - Update a job application
- `DELETE /api/job-applications/:id` - Delete a job application
- `POST /api/job-applications/:id/status-history` - Add status history entry

### AI Enhancement
- `POST /api/ai/resume/summary` - Generate professional summary
- `POST /api/ai/resume/experience` - Enhance work experience points
- `POST /api/ai/resume/skills` - Extract relevant skills from job description
- `POST /api/ai/resume/project` - Enhance project description
- `POST /api/ai/resume/ats-score` - Calculate ATS score for a resume
- `POST /api/ai/cover-letter/generate` - Generate a cover letter
- `POST /api/ai/cover-letter/enhance` - Enhance an existing cover letter
- `POST /api/ai/cover-letter/analyze` - Analyze cover letter strength

### Admin Routes
- `GET /api/admin/check` - Check if current user is admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get specific user
- `PATCH /api/admin/users/:id` - Update a user
- `DELETE /api/admin/users/:id` - Delete a user
- `POST /api/admin/promote` - Promote a user to admin
- `POST /api/admin/demote` - Demote a user from admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/templates` - Get resume templates
- `POST /api/admin/templates` - Create a resume template
- `PATCH /api/admin/templates/:id` - Update a resume template
- `DELETE /api/admin/templates/:id` - Delete a resume template
- `GET /api/admin/pricing-plans` - Get pricing plans
- `POST /api/admin/init` - Initialize first admin (special purpose)

## Authentication

The application uses session-based authentication with Passport.js:

1. **Registration**: Create a new user account through `/api/register`
2. **Login**: Authenticate with username/password through `/api/login`
3. **Session Management**: Authenticated sessions are maintained with cookies
4. **Access Control**: Certain routes require authentication, admin routes require admin privileges

## Database Schema

The application uses PostgreSQL with Drizzle ORM. Main entities include:

- **Users**: User accounts with authentication info
  - Fields: id, username, email, password, fullName, isAdmin, createdAt, updatedAt

- **Resumes**: Resume documents
  - Fields: id, userId, title, targetJobTitle, fullName, email, phone, location, linkedinUrl, portfolioUrl, summary, workExperience, education, skills, certifications, projects, etc.

- **Cover Letters**: Cover letter documents
  - Fields: id, userId, title, targetPosition, recipientName, recipientTitle, companyName, letterDate, content, resumeId, createdAt, updatedAt

- **Job Applications**: Job application tracking
  - Fields: id, userId, company, jobTitle, jobDescription, location, workType, status, statusHistory, appliedAt, resumeId, coverLetterId, etc.

- **Job Descriptions**: Job postings
  - Fields: id, userId, title, company, description, requirements, responsibilities, createdAt, updatedAt

- **Templates**: Resume and cover letter templates
  - Fields: id, name, type, content, thumbnail, isDefault, createdAt, updatedAt

## Admin Dashboard

The admin dashboard provides tools for managing the application:

1. **Overview**: System statistics and status
2. **Users Management**: CRUD operations for user accounts
3. **Templates Management**: Manage resume and cover letter templates
4. **Pricing Plans**: Configure subscription options
5. **Debug Panel**: Troubleshooting tools for admins

### Creating the First Admin

To create the first admin user:
1. Register a normal user account
2. Use the special endpoint `/api/admin/init` with the user ID to promote to admin
3. After the first admin is created, use the admin dashboard to manage other admins

## AI Features

The application integrates with OpenAI's GPT to provide AI-enhanced features:

1. **Resume Parsing**: Extract structured information from resume documents
2. **Summary Generation**: Create professional summaries tailored to job descriptions
3. **Experience Enhancement**: Improve work experience bullets to match target roles
4. **ATS Optimization**: Score and optimize resumes for Applicant Tracking Systems
5. **Cover Letter Generation**: Create personalized cover letters based on resume and job data

### API Key Configuration

To use AI features, you need an OpenAI API key:
1. Create an account at [OpenAI](https://platform.openai.com/)
2. Generate an API key
3. Add it to your `.env` file as `OPENAI_API_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.