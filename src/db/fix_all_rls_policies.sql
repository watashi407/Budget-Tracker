-- ============================================
-- Complete RLS Policy Fix for All Tables
-- Run this in Supabase SQL Editor to ensure
-- all tables have proper INSERT/UPDATE/DELETE policies
-- ============================================

-- 1. TRANSACTIONS TABLE
-- Ensure users can INSERT their own transactions
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (user_id = auth.uid());

-- 2. BUDGETS TABLE
DROP POLICY IF EXISTS "Users can create own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;

CREATE POLICY "Users can view own budgets"
    ON public.budgets FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budgets"
    ON public.budgets FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own budgets"
    ON public.budgets FOR DELETE
    USING (user_id = auth.uid());

-- 3. PROFILES TABLE (already has policies, but ensure completeness)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

-- 4. ATTACHMENTS TABLE
DROP POLICY IF EXISTS "Users can view own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can create own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can delete own attachments" ON public.attachments;

CREATE POLICY "Users can view own attachments"
    ON public.attachments FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own attachments"
    ON public.attachments FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own attachments"
    ON public.attachments FOR DELETE
    USING (user_id = auth.uid());

-- 5. Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.attachments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- Done! All tables should now allow CRUD operations
-- for authenticated users on their own data.
-- ============================================
