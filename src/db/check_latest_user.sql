-- Run this to check the raw auth data for the last signed up user
SELECT 
    id, 
    email, 
    email_confirmed_at, 
    created_at,
    (email_confirmed_at IS NOT NULL) as is_confirmed
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;
