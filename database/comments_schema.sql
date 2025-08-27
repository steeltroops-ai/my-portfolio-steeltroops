-- Comments System Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create user_profiles table (if not exists)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for user_profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Public can view approved user profiles (for comment display)
CREATE POLICY "Public can view user profiles" ON user_profiles
  FOR SELECT USING (true);

-- 5. Create RLS Policies for comments
-- Anyone can insert comments (public commenting)
CREATE POLICY "Anyone can submit comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Public can view approved comments
CREATE POLICY "Public can view approved comments" ON comments
  FOR SELECT USING (status = 'approved');

-- Users can view their own comments regardless of status
CREATE POLICY "Users can view own comments" ON comments
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can view all comments
CREATE POLICY "Admin can view all comments" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update comments (moderation)
CREATE POLICY "Admin can update comments" ON comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can delete comments
CREATE POLICY "Admin can delete comments" ON comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_updated_at();

-- 9. Create function to get comment statistics
CREATE OR REPLACE FUNCTION get_comment_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_comments', (SELECT COUNT(*) FROM comments),
    'pending_comments', (SELECT COUNT(*) FROM comments WHERE status = 'pending'),
    'approved_comments', (SELECT COUNT(*) FROM comments WHERE status = 'approved'),
    'rejected_comments', (SELECT COUNT(*) FROM comments WHERE status = 'rejected'),
    'spam_comments', (SELECT COUNT(*) FROM comments WHERE status = 'spam'),
    'comments_today', (SELECT COUNT(*) FROM comments WHERE DATE(created_at) = CURRENT_DATE),
    'comments_this_week', (SELECT COUNT(*) FROM comments WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)),
    'comments_this_month', (SELECT COUNT(*) FROM comments WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
    'top_commented_posts', (
      SELECT json_agg(
        json_build_object(
          'post_id', post_id,
          'post_title', bp.title,
          'comment_count', comment_count
        )
      )
      FROM (
        SELECT 
          c.post_id,
          bp.title,
          COUNT(*) as comment_count
        FROM comments c
        JOIN blog_posts bp ON c.post_id = bp.id
        WHERE c.status = 'approved'
        GROUP BY c.post_id, bp.title
        ORDER BY comment_count DESC
        LIMIT 5
      ) top_posts
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to approve comment
CREATE OR REPLACE FUNCTION approve_comment(comment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE comments 
  SET 
    status = 'approved', 
    approved_at = NOW(),
    approved_by = auth.uid(),
    updated_at = NOW()
  WHERE id = comment_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to reject comment
CREATE OR REPLACE FUNCTION reject_comment(comment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE comments 
  SET 
    status = 'rejected', 
    updated_at = NOW()
  WHERE id = comment_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to mark comment as spam
CREATE OR REPLACE FUNCTION mark_comment_spam(comment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE comments 
  SET 
    status = 'spam', 
    updated_at = NOW()
  WHERE id = comment_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create view for comment moderation (admin use)
CREATE OR REPLACE VIEW comments_moderation AS
SELECT 
  c.id,
  c.post_id,
  bp.title as post_title,
  bp.slug as post_slug,
  c.content,
  c.author_name,
  c.author_email,
  c.status,
  c.created_at,
  c.updated_at,
  c.ip_address,
  up.display_name as user_display_name,
  up.avatar_url as user_avatar
FROM comments c
LEFT JOIN blog_posts bp ON c.post_id = bp.id
LEFT JOIN user_profiles up ON c.user_id = up.id
ORDER BY c.created_at DESC;

-- 14. Create notification function for new comments (optional)
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- This could be extended to send email notifications
  -- For now, just log the new comment
  RAISE NOTICE 'New comment submitted for post: %', NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Create trigger for new comment notifications
CREATE TRIGGER notify_new_comment_trigger
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_new_comment();

-- 16. Insert sample comment statuses for reference
COMMENT ON COLUMN comments.status IS 'Comment moderation status: pending (default), approved, rejected, spam';
COMMENT ON TABLE comments IS 'Blog post comments with moderation system';
COMMENT ON TABLE user_profiles IS 'Extended user profile information for comment authors';

-- 17. Grant necessary permissions
-- These will be handled by RLS policies automatically
