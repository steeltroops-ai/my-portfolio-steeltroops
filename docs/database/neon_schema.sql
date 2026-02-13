-- =====================================================
-- NEON DATABASE SETUP FOR PORTFOLIO
-- Run this in Neon SQL Editor: https://console.neon.tech
-- =====================================================

-- =====================================================
-- 1. ADMIN AUTHENTICATION TABLES
-- =====================================================

-- Admin profiles table
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table for JWT-like auth
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES admin_profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_profiles_email ON admin_profiles(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- 2. BLOG POSTS TABLE
-- =====================================================

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
  read_time INTEGER DEFAULT 5
);

-- Indexes for blog posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- =====================================================
-- 3. COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- =====================================================
-- 4. CONTACT MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);

-- =====================================================
-- 5. ADMIN USER SETUP
-- =====================================================
-- 
-- To create an admin user:
-- 
-- 1. Generate a password hash using the helper script:
--    node scripts/hash-password.js YourSecurePassword
-- 
-- 2. Run this SQL with the generated hash:
--    INSERT INTO admin_profiles (email, password_hash, display_name, role)
--    VALUES ('your-email@example.com', '<paste-hash-here>', 'Your Name', 'admin')
--    ON CONFLICT (email) DO NOTHING;
--
-- IMPORTANT: Never store plaintext passwords in SQL files or version control!

-- =====================================================
-- DONE! Your database schema is ready.
-- Run init-admin.js or hash-password.js to create admin user.
-- =====================================================
