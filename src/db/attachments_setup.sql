-- ============================================
-- Attachments Setup for Supabase
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('budget', 'transaction')),
    entity_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attachments_entity 
    ON public.attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user 
    ON public.attachments(user_id);

-- 3. Enable RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - Drop existing and recreate
DROP POLICY IF EXISTS "Users can view own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can create own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can delete own attachments" ON public.attachments;

-- Use explicit casting to ensure UUID comparison works
CREATE POLICY "Users can view own attachments"
    ON public.attachments FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own attachments"
    ON public.attachments FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own attachments"
    ON public.attachments FOR DELETE
    USING (user_id = auth.uid());

-- 5. Grant table access to authenticated users (required alongside RLS)
GRANT SELECT, INSERT, DELETE ON public.attachments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- Storage Bucket Policies (Run these SQL commands)
-- ============================================

-- First, create the bucket if it doesn't exist (do this in Dashboard > Storage > New Bucket)
-- Bucket name: attachments (private)

-- Then run these policies:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the attachments bucket
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'attachments' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'attachments' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'attachments' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
