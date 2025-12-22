-- =============================================
-- SOCIAL FEATURE TABLES UPDATE
-- Run this in Supabase SQL Editor
-- IMPORTANT: Run this AFTER the initial social_setup.sql
-- =============================================

-- Add author_name column to social_comments
ALTER TABLE social_comments ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE social_comments ADD COLUMN IF NOT EXISTS author_email TEXT;

-- Add author_name column to chat_messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS author_email TEXT;
