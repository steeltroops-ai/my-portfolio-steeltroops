-- Contact Messages Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow anyone to insert contact messages (public contact form)
CREATE POLICY "Anyone can submit contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Only admin can view contact messages
CREATE POLICY "Admin can view all contact messages" ON contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admin can update contact messages (mark as read, add notes, etc.)
CREATE POLICY "Admin can update contact messages" ON contact_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admin can delete contact messages
CREATE POLICY "Admin can delete contact messages" ON contact_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_contact_messages_updated_at();

-- 7. Create function to get contact message statistics
CREATE OR REPLACE FUNCTION get_contact_message_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_messages', (SELECT COUNT(*) FROM contact_messages),
    'unread_messages', (SELECT COUNT(*) FROM contact_messages WHERE status = 'unread'),
    'read_messages', (SELECT COUNT(*) FROM contact_messages WHERE status = 'read'),
    'replied_messages', (SELECT COUNT(*) FROM contact_messages WHERE status = 'replied'),
    'messages_today', (SELECT COUNT(*) FROM contact_messages WHERE DATE(created_at) = CURRENT_DATE),
    'messages_this_week', (SELECT COUNT(*) FROM contact_messages WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)),
    'messages_this_month', (SELECT COUNT(*) FROM contact_messages WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE contact_messages 
  SET status = 'read', updated_at = NOW()
  WHERE id = message_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to mark message as replied
CREATE OR REPLACE FUNCTION mark_message_as_replied(message_id UUID, notes TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE contact_messages 
  SET 
    status = 'replied', 
    replied_at = NOW(),
    updated_at = NOW(),
    admin_notes = COALESCE(notes, admin_notes)
  WHERE id = message_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Insert some sample statuses for reference
-- These are just for documentation, the actual values are enforced by the application
COMMENT ON COLUMN contact_messages.status IS 'Possible values: unread, read, replied, archived';

-- 11. Create view for admin dashboard (optional)
CREATE OR REPLACE VIEW contact_messages_summary AS
SELECT 
  id,
  name,
  email,
  subject,
  LEFT(message, 100) || CASE WHEN LENGTH(message) > 100 THEN '...' ELSE '' END as message_preview,
  status,
  created_at,
  updated_at,
  replied_at
FROM contact_messages
ORDER BY created_at DESC;

-- Grant access to the view for admin users
-- This will be handled by RLS policies automatically
