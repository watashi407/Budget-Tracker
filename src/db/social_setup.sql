-- =============================================
-- SOCIAL FEATURE TABLES
-- Run this in Supabase SQL Editor
-- =============================================

-- Social Comments Table
CREATE TABLE IF NOT EXISTS social_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('suggestion', 'feedback')),
    parent_id UUID REFERENCES social_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    is_upcoming_feature BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Likes Table (for like/dislike votes)
CREATE TABLE IF NOT EXISTS social_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES social_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Chat Messages Table (for live chat)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Social Comments Policies
CREATE POLICY "Anyone can read comments" ON social_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON social_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON social_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON social_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Social Likes Policies
CREATE POLICY "Anyone can read likes" ON social_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create likes" ON social_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON social_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages Policies
CREATE POLICY "Anyone can read chat messages" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update likes_count on social_comments
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'like' THEN
            UPDATE social_comments 
            SET likes_count = likes_count + 1,
                is_upcoming_feature = CASE 
                    WHEN likes_count + 1 >= 10 AND type = 'suggestion' THEN TRUE 
                    ELSE is_upcoming_feature 
                END
            WHERE id = NEW.comment_id;
        ELSE
            UPDATE social_comments SET dislikes_count = dislikes_count + 1 WHERE id = NEW.comment_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'like' THEN
            UPDATE social_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
        ELSE
            UPDATE social_comments SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.comment_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

-- Trigger for like count updates
DROP TRIGGER IF EXISTS on_like_change ON social_likes;
CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON social_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_comments_parent ON social_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_type ON social_comments(type);
CREATE INDEX IF NOT EXISTS idx_comments_upcoming ON social_comments(is_upcoming_feature) WHERE is_upcoming_feature = TRUE;
CREATE INDEX IF NOT EXISTS idx_likes_comment ON social_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);

-- Enable Realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE social_comments;
