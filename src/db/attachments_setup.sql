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

-- 4. RLS Policies - Users can only access their own attachments
CREATE POLICY "Users can view own attachments"
    ON public.attachments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attachments"
    ON public.attachments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments"
    ON public.attachments FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Storage Bucket Setup (Run in Dashboard or CLI)
-- ============================================
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named "attachments"
-- 3. Set it to PRIVATE (not public)
-- 4. Add these policies:
--
-- Policy 1: Allow authenticated users to upload to their folder
-- Name: "Users can upload to own folder"
-- Allowed operation: INSERT
-- Policy: (bucket_id = 'attachments') AND (auth.uid()::text = (storage.foldername(name))[1])
--
-- Policy 2: Allow users to read their own files
-- Name: "Users can read own files"
-- Allowed operation: SELECT
-- Policy: (bucket_id = 'attachments') AND (auth.uid()::text = (storage.foldername(name))[1])
--
-- Policy 3: Allow users to delete their own files
-- Name: "Users can delete own files"
-- Allowed operation: DELETE
-- Policy: (bucket_id = 'attachments') AND (auth.uid()::text = (storage.foldername(name))[1])
--
-- ============================================
