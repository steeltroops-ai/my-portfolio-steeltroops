-- =====================================================
-- MIGRATION: Align Schema with Design Document v2
-- Run this in Neon SQL Editor after the base schema
-- =====================================================

-- 1. Add Full-Text Search to blog_posts
-- This creates a generated column for efficient search
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, ''))
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING GIN(search_vector);

-- 2. Add generation_status for AI pipeline tracking
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS generation_status VARCHAR(20) DEFAULT 'idle';

-- Add constraint for valid generation statuses
-- Note: Use DO block to avoid error if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_generation_status'
  ) THEN
    ALTER TABLE blog_posts 
    ADD CONSTRAINT chk_generation_status 
    CHECK (generation_status IN ('idle', 'planning', 'writing', 'review', 'complete', 'error'));
  END IF;
END $$;

-- 3. Ensure contact_messages has correct status values
-- Update any 'new' status to 'unread' for consistency
UPDATE contact_messages SET status = 'unread' WHERE status = 'new';

-- 4. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_created 
ON blog_posts(created_at DESC) 
WHERE published = true;

-- 5. Add index for generation status (useful for admin filtering)
CREATE INDEX IF NOT EXISTS idx_blog_posts_generation_status 
ON blog_posts(generation_status) 
WHERE generation_status != 'idle';

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the migration worked
-- =====================================================

-- Check search_vector column exists
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'blog_posts' AND column_name = 'search_vector';

-- Test full-text search
-- SELECT title, ts_rank(search_vector, to_tsquery('english', 'your_search_term')) as rank
-- FROM blog_posts
-- WHERE search_vector @@ to_tsquery('english', 'your_search_term')
-- ORDER BY rank DESC;

-- =====================================================
-- DONE! Schema is now aligned with design document.
-- =====================================================
