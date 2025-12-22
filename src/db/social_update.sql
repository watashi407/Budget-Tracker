-- =============================================
-- SOCIAL FEATURE TABLES UPDATE
-- Run this in Supabase SQL Editor
-- IMPORTANT: Run this AFTER the initial social_setup.sql
-- =============================================

-- Add author columns to social_comments
ALTER TABLE social_comments ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE social_comments ADD COLUMN IF NOT EXISTS author_email TEXT;
ALTER TABLE social_comments ADD COLUMN IF NOT EXISTS author_verified BOOLEAN DEFAULT FALSE;

-- Add author columns to chat_messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS author_email TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS author_verified BOOLEAN DEFAULT FALSE;
