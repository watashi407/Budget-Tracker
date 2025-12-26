-- ============================================
-- News & Updates Feature Setup
-- Run this in your Supabase SQL Editor
-- ============================================

-- 0. Add 'role' column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
            CHECK (role IN ('admin', 'user'));
    END IF;
END $$;

-- 1. Create is_admin() function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1. Create news table
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index for sorting by date
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- Policy: Anyone can read news (Public Access)
DROP POLICY IF EXISTS "Public can view news" ON public.news;
CREATE POLICY "Public can view news"
    ON public.news FOR SELECT
    USING (true);

-- Policy: Only Admins can insert news
-- Uses the secure is_admin() function to avoid recursion
DROP POLICY IF EXISTS "Admins can insert news" ON public.news;
CREATE POLICY "Admins can insert news"
    ON public.news FOR INSERT
    WITH CHECK (
        public.is_admin()
    );

-- Policy: Only Admins can update news
DROP POLICY IF EXISTS "Admins can update news" ON public.news;
CREATE POLICY "Admins can update news"
    ON public.news FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policy: Only Admins can delete news
DROP POLICY IF EXISTS "Admins can delete news" ON public.news;
CREATE POLICY "Admins can delete news"
    ON public.news FOR DELETE
    USING (public.is_admin());

-- ============================================
-- Setup complete.
-- ============================================

-- ============================================
-- IMAGE ATTACHMENTS MIGRATION
-- Run this AFTER the news table exists
-- ============================================

-- Add image_url column for news images
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================
-- STORAGE SETUP (Manual step in Supabase Dashboard)
-- 1. Go to Storage -> Create new bucket
-- 2. Name: "news-images"
-- 3. Set to PUBLIC
-- ============================================

-- Storage policies for news-images bucket (run after creating bucket)
-- Allow anyone to view images
-- INSERT INTO storage.policies (name, bucket_id, mode, definition)
-- VALUES ('Public Access', 'news-images', 'SELECT', 'true');

-- Allow admins to upload images
-- CREATE POLICY "Admins can upload news images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'news-images' AND public.is_admin());
