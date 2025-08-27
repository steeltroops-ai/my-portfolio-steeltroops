# 🚀 Supabase Setup Guide for Portfolio Blog

## 🚨 Current Issue
Your blog is failing to connect to Supabase with error: `ERR_NAME_NOT_RESOLVED`

This means the Supabase project URL in your `.env` file either:
- Points to a non-existent project
- Points to a paused/inactive project
- Has a typo in the URL

## 📋 Step-by-Step Fix

### **Step 1: Verify Your Supabase Project**

1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Check if you see a project with ID `hyzakrcwukhlpixduynn`
4. If the project exists, check its status (Active/Paused)

### **Step 2A: If Project Exists but is Paused**

1. Click on your project
2. Look for any "Resume Project" or "Unpause" button
3. Click to reactivate the project
4. Wait for it to become active

### **Step 2B: If Project Doesn't Exist - Create New Project**

1. Click "New Project" in Supabase dashboard
2. Choose your organization
3. Enter project details:
   - **Name**: `portfolio-blog` (or any name you prefer)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
4. Click "Create new project"
5. Wait for project creation (2-3 minutes)

### **Step 3: Get Correct Credentials**

Once your project is active:

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://abcdefghijk.supabase.co`)
   - **Anon/Public Key** (long JWT token)

### **Step 4: Update Your .env File**

Replace the values in your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here

# Admin Credentials (change these for production!)
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=admin123

# Optional: Admin email for Supabase auth
VITE_ADMIN_EMAIL=admin@portfolio.com
```

### **Step 5: Set Up Database Schema**

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `database/admin_profiles.sql`
4. Click "Run" to execute
5. Create another new query
6. Copy and paste the contents of `database/complete_blog_schema.sql`
7. Click "Run" to execute

### **Step 6: Create Admin User**

#### Option A: Using Supabase Auth (Recommended)

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click "Add User"
3. Enter:
   - **Email**: `admin@portfolio.com` (or your preferred admin email)
   - **Password**: Create a strong password
   - **Email Confirm**: Check this box
4. Click "Create User"
5. Go to **SQL Editor** and run this query (replace email with your admin email):

```sql
UPDATE admin_profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@portfolio.com'
);
```

#### Option B: Using Environment Variables (Simple)

Keep using the current system with:
- `VITE_ADMIN_USERNAME=admin`
- `VITE_ADMIN_PASSWORD=your_secure_password`

### **Step 7: Test the Connection**

1. Save all files
2. Restart your development server:
   ```bash
   # Stop current server (Ctrl+C)
   bun dev
   ```
3. Go to http://localhost:5173/blog
4. You should now see the blog page without errors

### **Step 8: Create Your First Blog Post**

1. Go to http://localhost:5173/admin/login
2. Log in with your admin credentials
3. Click "New Post"
4. Create your first blog post!

## 🔧 Troubleshooting

### **If you still get connection errors:**

1. **Check Network**: Try accessing your Supabase project URL directly in browser
2. **Verify Credentials**: Double-check URL and key have no extra spaces
3. **Restart Dev Server**: Stop and start your development server
4. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R)

### **If database queries fail:**

1. **Check RLS Policies**: Ensure Row Level Security policies are set up correctly
2. **Verify Admin Role**: Make sure your admin user has the 'admin' role in admin_profiles table
3. **Check Table Creation**: Verify all tables were created successfully

### **Common Issues:**

- **"relation does not exist"**: Tables weren't created - re-run the SQL scripts
- **"permission denied"**: RLS policies issue - check admin role assignment
- **"invalid JWT"**: Wrong anon key - double-check from Supabase dashboard

## 📞 Need Help?

If you're still having issues:

1. Check the browser console for specific error messages
2. Check the Supabase logs in your dashboard
3. Verify your project is in the correct region
4. Try creating a completely new Supabase project

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ Blog page loads without "Failed to load" message
- ✅ Admin login works
- ✅ You can create and publish blog posts
- ✅ Blog posts appear on the public blog page
- ✅ No console errors related to Supabase

Once this is working, you can proceed with the enhancement recommendations in `COMPREHENSIVE_ANALYSIS_AND_RECOMMENDATIONS.md`!
