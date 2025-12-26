-- ============================================
-- FIX: Remove problematic policies causing 500 errors
-- Run this FIRST to restore your database access
-- ============================================

-- Remove the problematic admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all budgets" ON public.budgets;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

-- ============================================
-- Your database should work again after running the above.
-- The original policies are still intact.
-- ============================================
