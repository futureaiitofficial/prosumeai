# Job Application Status Enum Migration

This directory contains scripts for migrating the job application status field from a text type to an enum type.

## Overview

We've updated our job application status system to use a PostgreSQL enum type instead of plain text. This improves type safety and ensures only valid status values can be stored in the database.

The valid statuses are:
- applied
- screening
- interview
- assessment
- offer
- rejected
- accepted

## Running the Migration

To run the migration:

```bash
npm run db:push:enum
```

This script will:
1. Create the `job_application_status` enum type if it doesn't exist
2. Check if the column needs to be converted
3. Convert the `status` column from text to the enum type
4. Set the NOT NULL constraint and default value

## What Changes Were Made

1. **Database Schema**:
   - Added a PostgreSQL enum type `job_application_status`
   - Updated the job applications table to use this enum type
   - Set a default value of 'applied' for new applications

2. **Client-Side**:
   - Added a TypeScript enum `JobApplicationStatus` in `job-applications-enhanced.tsx`
   - Updated the status colors object to use the enum values
   - Updated the Kanban board in `kanban-view.tsx` to use the enum values

3. **Server-Side**:
   - Added a TypeScript type `JobApplicationStatus` in `job-applications-routes.ts`
   - Updated the status colors mapping to use the proper types

## Troubleshooting

If you encounter any issues during the migration:

1. Check the database logs for detailed error messages
2. Ensure all existing status values in the database match one of the enum values
3. If needed, you can manually update any non-matching status values:

```sql
UPDATE job_applications SET status = 'applied' WHERE status NOT IN ('applied', 'screening', 'interview', 'assessment', 'offer', 'rejected', 'accepted');
```

Then run the migration script again. 