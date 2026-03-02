---
inclusion: always
---

# Product Overview

Modern personal portfolio website with integrated blog platform and AI-powered content generation. This is a production application serving real users with strict performance and security requirements.

## Core Features

### Portfolio (Public)
- Hero section with animated introduction
- Projects showcase with filtering and search
- Experience timeline with company details
- Contact form with validation and spam protection
- Responsive design with glassmorphism aesthetic

### Blog Platform (Public)
- Blog listing with pagination and category filtering
- Individual post viewer with markdown rendering
- Full-text search across posts
- Syntax highlighting for code blocks (rehype-highlight)
- Social sharing and SEO optimization

### Admin Dashboard (Protected)
- JWT-based authentication (single admin user)
- Analytics dashboard with real-time visitor tracking
- Message center for contact form submissions
- Manual blog editor with Quill rich text editor
- Post management (create, edit, publish, draft, delete)

### AI Blog Generator (Admin)
- Multi-stage content creation workflow:
  1. Topic input and outline generation
  2. Section-by-section content generation
  3. Real-time streaming preview with SSE
  4. Manual editing before publishing
- Powered by Cerebras Llama 3.3 (primary) with Gemini fallback
- Streaming responses for immediate feedback

### Real-Time Features
- WebSocket notifications for analytics updates
- SSE for AI content streaming
- Live visitor count and activity feed

## User Roles and Access Control

### Public Visitors
- Browse portfolio and blog content
- Submit contact inquiries
- No authentication required
- Rate-limited API access

### Admin (Single User)
- Full CRUD operations on posts, categories, tags
- Access to analytics and message center
- AI content generation capabilities
- Protected routes require JWT token
- Session management with secure cookies

## Product Conventions

### Content Management
- Posts have three states: draft, published, archived
- Published posts appear in public blog listing
- Drafts are only visible in admin dashboard
- All posts support markdown with frontmatter metadata
- Categories and tags are managed separately

### AI Generation Workflow
- Always generate outline before content
- Content generated section-by-section for control
- Admin reviews and edits before publishing
- Streaming responses show progress in real-time
- Fallback to manual editor if AI fails

### Analytics and Tracking
- Track page views, unique visitors, session duration
- Fingerprint-based visitor identification (no cookies for public)
- Real-time updates via WebSocket for admin
- Privacy-focused (no third-party trackers)

### Performance Requirements
- First Contentful Paint (FCP) < 400ms
- Time to Interactive (TTI) < 2s
- Lighthouse score > 95
- Image optimization (WebP/AVIF with fallbacks)
- Code splitting for optimal bundle sizes

### Security Practices
- JWT tokens for admin authentication
- Password hashing with bcrypt (10 rounds)
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries
- CSP headers in production
- Rate limiting on API endpoints

## Architecture Patterns

### Data Flow
- React Query for server state caching (SWR pattern)
- Optimistic updates for better UX
- Stale-while-revalidate with 5-minute TTL
- Error boundaries for graceful degradation

### Component Organization
- Feature-based structure (admin, blog, portfolio)
- Shared components for reusable UI elements
- Glassmorphism design system with consistent tokens
- Framer Motion for page transitions and micro-interactions

### API Design
- RESTful endpoints with consistent naming
- JSON responses with standard error format
- Streaming endpoints for AI generation (SSE)
- WebSocket for real-time notifications

### Deployment Strategy
- Vercel serverless functions for production API
- Local Express server mirrors production for development
- Content-aware versioning (SemVer automation)
- Deployment gatekeeper skips docs-only changes
- Zero-downtime deployments with preview URLs

## Key Differentiators

- Streaming AI content generation with live preview
- Glassmorphism UI with smooth animations
- Serverless architecture optimized for edge performance
- Intelligent deployment pipeline with automated versioning
- Privacy-focused analytics without third-party trackers
- PWA support with offline fallback

## Development Principles

- Performance first: optimize for FCP and TTI
- Progressive enhancement: core features work without JS
- Accessibility: semantic HTML and ARIA labels
- Mobile-first responsive design
- Error handling: graceful degradation and user feedback
- Security by default: validate all inputs, sanitize outputs
