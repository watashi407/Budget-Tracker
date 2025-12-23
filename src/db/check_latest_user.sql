-- CHECK USER VERIFICATION STATUS
-- Replace 'YOUR_EMAIL' with the email you want to check
SELECT 
    email, 
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'VERIFIED ✅' 
        ELSE 'UNVERIFIED ❌' 
    END as status
FROM auth.users 
WHERE email = 'YOUR_EMAIL'  -- <--- Put email here
   OR email IS NOT NULL     -- Remove this line to search specific email only
ORDER BY created_at DESC 
LIMIT 5;
