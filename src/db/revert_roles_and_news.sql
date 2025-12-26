-- ============================================
-- Revert Roles and News Features (Fixed for Dependencies)
-- RUN THIS TO FIX PRODUCTION
-- ============================================

-- 1. Drop the News table and related policies
DROP TABLE IF EXISTS public.news CASCADE;

-- 2. Drop the is_admin function
DROP FUNCTION IF EXISTS public.is_admin();

-- 3. Drop the role column from profiles with CASCADE to remove dependent policies
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role CASCADE;

-- 4. Drop the index on role if it exists
DROP INDEX IF EXISTS idx_profiles_role;

-- ============================================
-- Reversion Complete
-- ============================================
