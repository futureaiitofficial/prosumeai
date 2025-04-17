-- Fix any invalid status values first
UPDATE job_applications
SET status = 'applied'
WHERE status NOT IN ('applied', 'screening', 'interview', 'assessment', 'offer', 'rejected', 'accepted');

-- Temporarily allow NULL values to facilitate conversion
ALTER TABLE job_applications ALTER COLUMN status DROP NOT NULL;

-- Convert the column from text to enum
ALTER TABLE job_applications 
  ALTER COLUMN status TYPE job_application_status 
  USING status::job_application_status;

-- Restore NOT NULL constraint
ALTER TABLE job_applications ALTER COLUMN status SET NOT NULL;

-- Set default value
ALTER TABLE job_applications ALTER COLUMN status SET DEFAULT 'applied';

-- Verify the change
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'job_applications' AND column_name = 'status'; 