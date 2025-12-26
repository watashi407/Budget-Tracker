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
-- MULTI-IMAGE SUPPORT MIGRATION
-- Run this AFTER the news table exists
-- ============================================

-- Add images column as JSONB array (supports multiple images)
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Migrate existing image_url data to images array (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'news' 
        AND column_name = 'image_url'
    ) THEN
        UPDATE public.news 
        SET images = jsonb_build_array(image_url) 
        WHERE image_url IS NOT NULL AND images = '[]'::jsonb;
    END IF;
END $$;

-- ============================================
-- STORAGE POLICIES FOR news-images BUCKET
-- Run AFTER creating the bucket in Supabase Dashboard
-- ============================================

-- Allow authenticated admins to upload images
DROP POLICY IF EXISTS "Admins can upload news images" ON storage.objects;
CREATE POLICY "Admins can upload news images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'news-images' 
    AND public.is_admin()
);

-- Allow anyone to view news images (public bucket)
DROP POLICY IF EXISTS "Public can view news images" ON storage.objects;
CREATE POLICY "Public can view news images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'news-images');

-- Allow admins to delete news images
DROP POLICY IF EXISTS "Admins can delete news images" ON storage.objects;
CREATE POLICY "Admins can delete news images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'news-images' 
    AND public.is_admin()
);

-- Allow admins to update news images
DROP POLICY IF EXISTS "Admins can update news images" ON storage.objects;
CREATE POLICY "Admins can update news images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'news-images' AND public.is_admin())
WITH CHECK (bucket_id = 'news-images' AND public.is_admin());
