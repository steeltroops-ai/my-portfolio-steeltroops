# Neon Database Migration Guide

This document describes the migration from Supabase to Neon PostgreSQL with Vercel serverless functions.

## Architecture Overview

### Before (Supabase)
```
Frontend (React) -> Supabase Client -> Supabase BaaS
                                       - Database
                                       - Auth
                                       - Storage
```

### After (Neon + Vercel)
```
Frontend (React) -> API Client -> Vercel Functions -> Neon PostgreSQL
                                                      |
                                                      +-> Database
                                                      +-> Custom Auth (sessions table)
```

## API Endpoints

All API routes are located in `/api/` folder:

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth?action=login` | POST | User login | No |
| `/api/auth?action=logout` | POST | User logout | Yes |
| `/api/auth?action=verify` | GET | Verify token | No |
| `/api/auth?action=me` | GET | Get current user | Yes |
| `/api/posts` | GET | Get published posts | No |
| `/api/posts?all=true` | GET | Get all posts | Admin |
| `/api/posts?slug=xxx` | GET | Get post by slug | No |
| `/api/posts?id=xxx` | GET | Get post by ID | Admin |
| `/api/posts` | POST | Create post | Admin |
| `/api/posts?id=xxx` | PUT | Update post | Admin |
| `/api/posts?id=xxx` | DELETE | Delete post | Admin |
| `/api/comments?post_id=xxx` | GET | Get post comments | No |
| `/api/comments?all=true` | GET | Get all comments | Admin |
| `/api/comments` | POST | Submit comment | No |
| `/api/comments?id=xxx&action=approve` | PUT | Approve comment | Admin |
| `/api/comments?id=xxx` | DELETE | Delete comment | Admin |
| `/api/contact` | POST | Submit contact message | No |
| `/api/contact` | GET | Get messages | Admin |
| `/api/contact?id=xxx&action=read` | PUT | Mark as read | Admin |
| `/api/contact?id=xxx` | DELETE | Delete message | Admin |
| `/api/tags` | GET | Get all tags | No |
| `/api/categories` | GET | Get all categories | No |

## Database Schema

The following tables exist in Neon:

### admin_profiles
- `id` - UUID primary key
- `user_id` - UUID (nullable)
- `email` - Unique email
- `password_hash` - Bcrypt hash
- `role` - 'admin' or 'user'
- `display_name` - Display name
- `created_at` - Timestamp
- `updated_at` - Timestamp

### sessions
- `id` - UUID primary key
- `user_id` - UUID (references admin_profiles)
- `token` - Session token
- `expires_at` - Expiry timestamp
- `created_at` - Timestamp

### blog_posts
- `id` - UUID primary key
- `title` - Post title
- `slug` - URL slug (unique)
- `content` - Post content (markdown)
- `excerpt` - Short excerpt
- `tags` - Text array
- `featured_image_url` - Image URL
- `meta_description` - SEO description
- `published` - Boolean
- `author` - Author name
- `read_time` - Minutes to read
- `created_at` - Timestamp
- `updated_at` - Timestamp

### blog_categories
- `id` - UUID primary key
- `name` - Category name
- `slug` - URL slug
- `description` - Description
- `color` - Hex color
- `created_at` - Timestamp

### comments
- `id` - UUID primary key
- `post_id` - UUID (references blog_posts)
- `content` - Comment content
- `author_name` - Author name
- `author_email` - Author email
- `parent_id` - UUID (for replies)
- `status` - 'pending', 'approved', 'rejected', 'spam'
- `created_at` - Timestamp
- `updated_at` - Timestamp

### contact_messages
- `id` - UUID primary key
- `name` - Sender name
- `email` - Sender email
- `subject` - Message subject
- `message` - Message content
- `status` - 'unread', 'read', 'replied', 'archived'
- `admin_notes` - Admin notes
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Environment Variables

### Required for Vercel

Set these in Vercel Dashboard > Project Settings > Environment Variables:

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### Local Development

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

## Local Development

### Run Frontend Only
```bash
bun run dev
```

### Run with API Routes (requires Vercel CLI)
```bash
bunx vercel dev
```

## Deployment

The project auto-deploys to Vercel when you push to your repository.

### Manual Deploy
```bash
bunx vercel --prod
```

## Frontend Services

### Service Files
- `src/lib/neon.js` - API client with auth, posts, comments, contact, tags, categories APIs
- `src/services/NeonBlogService.js` - Blog service using neon.js
- `src/services/NeonAuthService.js` - Auth service using neon.js
- `src/services/NeonContactService.js` - Contact service using neon.js
- `src/services/NeonCommentsService.js` - Comments service using neon.js
- `src/services/HybridBlogService.js` - Tries Neon, falls back to static
- `src/services/HybridAuthService.js` - Auth wrapper

### Fallback Behavior
When the Neon API is unavailable:
- Blog posts fall back to `src/data/staticBlogPosts.json`
- Auth shows "offline" status
- Contact form shows error message

## Admin Access

Default admin credentials:
- Email: `admin@portfolio.com`
- Password: `admin123`

**Change this immediately after first login!**

## Neon Project Details

- Project ID: `calm-bird-64097931`
- Database: `neondb`
- Region: Auto-selected

Access the database console at: https://console.neon.tech/
