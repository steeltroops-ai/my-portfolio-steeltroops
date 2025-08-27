-- Complete Blog System Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author VARCHAR(100) DEFAULT 'Mayank',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  featured_image_url TEXT,
  meta_description TEXT,
  read_time INTEGER DEFAULT 5,
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0
);

-- 2. Create blog_categories table (for future enhancement)
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color for category
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create blog_post_categories junction table
CREATE TABLE IF NOT EXISTS blog_post_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
  UNIQUE(post_id, category_id)
);

-- 4. Create blog_comments table (for future enhancement)
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE -- For nested comments
);

-- 5. Create blog_views table (for analytics)
CREATE TABLE IF NOT EXISTS blog_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_views ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies for blog_posts
CREATE POLICY "Published posts are viewable by everyone" ON blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "All posts are viewable by admin" ON blog_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Posts are insertable by admin" ON blog_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Posts are updatable by admin" ON blog_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Posts are deletable by admin" ON blog_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Create RLS Policies for blog_categories
CREATE POLICY "Categories are viewable by everyone" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Categories are manageable by admin" ON blog_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 9. Create RLS Policies for blog_comments
CREATE POLICY "Approved comments are viewable by everyone" ON blog_comments
  FOR SELECT USING (approved = true);

CREATE POLICY "All comments are viewable by admin" ON blog_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Comments are insertable by everyone" ON blog_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Comments are manageable by admin" ON blog_comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON blog_comments(approved);
CREATE INDEX IF NOT EXISTS idx_blog_views_post_id ON blog_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_created_at ON blog_views(created_at);

-- 11. Create functions for blog functionality
CREATE OR REPLACE FUNCTION increment_post_views(post_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts 
  SET view_count = view_count + 1 
  WHERE slug = post_slug AND published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Insert default categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
  ('Technology', 'technology', 'Posts about web development, programming, and tech trends', '#3b82f6'),
  ('AI & Machine Learning', 'ai-ml', 'Articles about artificial intelligence and machine learning', '#8b5cf6'),
  ('Robotics', 'robotics', 'Posts about robotics projects and automation', '#ef4444'),
  ('Tutorials', 'tutorials', 'Step-by-step guides and how-to articles', '#10b981'),
  ('Personal', 'personal', 'Personal thoughts and experiences', '#f59e0b')
ON CONFLICT (slug) DO NOTHING;

-- 15. Create storage bucket for blog images (run this separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

-- 16. Create storage policies for blog images
-- CREATE POLICY "Blog images are publicly accessible" ON storage.objects
--   FOR SELECT USING (bucket_id = 'blog-images');

-- CREATE POLICY "Admin can upload blog images" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'blog-images' AND
--     EXISTS (
--       SELECT 1 FROM admin_profiles 
--       WHERE user_id = auth.uid() AND role = 'admin'
--     )
--   );
