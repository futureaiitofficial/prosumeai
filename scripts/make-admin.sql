-- This script makes the user 'testuser' an admin
UPDATE users SET is_admin = true WHERE username = 'testuser'; 