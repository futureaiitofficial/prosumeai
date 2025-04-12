-- This script creates a new user 'testuser' and makes them an admin
-- Check if the user exists
DO $$
BEGIN
    -- First check if the user already exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser') THEN
        -- Insert the new user with admin privileges
        -- Using a simple hashed password 'password' (this is for testing only)
        -- In a real scenario, you would generate a proper password hash
        INSERT INTO users (username, email, password, full_name, is_admin, created_at, updated_at)
        VALUES ('testuser', 'test@example.com', 
                -- Using a dummy hashed password - in production you'd use a proper hash function
                '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8.salt', 
                'Test User', 
                true, 
                NOW(), 
                NOW());
        
        RAISE NOTICE 'User testuser created with admin privileges';
    ELSE
        -- Update existing user to be an admin
        UPDATE users SET is_admin = true WHERE username = 'testuser';
        RAISE NOTICE 'Existing user testuser updated to have admin privileges';
    END IF;
END
$$; 