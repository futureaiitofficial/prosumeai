-- Check job_applications table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_applications'
ORDER BY ordinal_position;