# Product Overview

This is a modern portfolio website with an integrated blog management system. The portfolio showcases personal information, skills, experience, and projects, while the blog system provides a full-featured content management platform.

## Core Features

**Portfolio Section**
- Single-page application with sections: Hero, About, Technologies, Experience, Projects, Contact
- Dark theme with animated background gradients
- Responsive design optimized for all devices
- Contact form with validation

**Blog System**
- Public blog with SEO-optimized posts
- Rich markdown editor with syntax highlighting
- Image upload and management
- Tag-based categorization and filtering
- Search functionality
- Social sharing capabilities
- Draft and publish workflow

**Admin Panel**
- Secure authentication for content management
- Dashboard for managing blog posts
- WYSIWYG markdown editor
- Image upload with drag-and-drop

## Backend

Uses Supabase for:
- PostgreSQL database with Row Level Security
- Authentication
- File storage for blog images
- Real-time capabilities

The application includes fallback mechanisms to handle missing Supabase configuration gracefully.
