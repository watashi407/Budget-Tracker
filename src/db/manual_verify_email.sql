-- =============================================
-- MANUAL EMAIL VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify a user
-- =============================================

-- 1. Replace 'YOUR_EMAIL_HERE' with the actual email address
-- 2. Run the script

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'YOUR_EMAIL_HERE';

-- 3. Verify the change (Optional)
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'YOUR_EMAIL_HERE';
