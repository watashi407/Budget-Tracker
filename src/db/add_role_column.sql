-- ============================================
-- Role-Based Access Control Setup (SAFE VERSION)
-- Run fix_rls_policies.sql FIRST if you have 500 errors
-- Then run this file
-- ============================================

-- 1. Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Update any NULL roles to 'user'
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- 3. Create index for faster role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 4. Create a SECURITY DEFINER function to check admin status
-- This bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================
-- NOTE: The is_admin() function can be used in your app
-- to check admin status without causing policy recursion.
-- 
-- For admin-only features, check is_admin() in your application
-- code rather than in RLS policies to avoid complexity.
-- ============================================

-- To make a user an admin, run:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'USER_UUID_HERE';
-- 
-- To check current roles:
-- SELECT id, full_name, role FROM public.profiles;
