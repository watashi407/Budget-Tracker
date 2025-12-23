-- =============================================
-- PROFILES TABLE SETUP & METADATA SYNC TRIGGER
-- Run this in Supabase SQL Editor to cleanup and fix auth
-- =============================================

-- STEP 0: Clean up legacy triggers/functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;
DROP FUNCTION IF EXISTS public.sync_user_verified();
DROP TRIGGER IF EXISTS on_auth_user_change_v2 ON auth.users;
DROP FUNCTION IF EXISTS public.sync_user_verified_v2();

-- STEP 1: Ensure profiles table exists (WITHOUT verified column)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    currency TEXT DEFAULT 'USD'
);

-- Establish RLS (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;


-- STEP 2: Ensure columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Remove verified column if it exists
ALTER TABLE profiles DROP COLUMN IF EXISTS verified;

-- STEP 3: Create sync function for METADATA ONLY
CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- On INSERT: create profile
    IF TG_OP = 'INSERT' THEN
        INSERT INTO profiles (id, full_name, avatar_url, updated_at)
        VALUES (
            NEW.id, 
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'avatar_url',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
            avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
            updated_at = NOW();
    
    -- On UPDATE: sync metadata
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE profiles 
        SET full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
            avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- STEP 4: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_metadata_change ON auth.users;
CREATE TRIGGER on_auth_user_metadata_change
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION sync_user_metadata();

