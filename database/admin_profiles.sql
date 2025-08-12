-- Create admin_profiles table for secure admin authentication
-- This should be run in your Supabase SQL editor

-- Create admin_profiles table
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin profiles are viewable by authenticated users" ON admin_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin profiles are insertable by authenticated users" ON admin_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin profiles are updatable by owner" ON admin_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically create admin profile
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_profiles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create admin profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_admin_user();

-- Insert admin user (replace with your actual admin email)
-- You should run this manually with your admin credentials
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES ('admin@portfolio.com', crypt('your_secure_password', gen_salt('bf')), NOW(), NOW(), NOW());

-- Then manually set admin role:
-- UPDATE admin_profiles SET role = 'admin' WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@portfolio.com');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON admin_profiles(role);
