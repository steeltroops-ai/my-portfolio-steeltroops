---
inclusion: always
---

# Tech Stack & Development Guidelines

## Runtime & Build System

- **Primary Runtime**: Bun (use for all package management and script execution)
- **Fallback Runtime**: Node.js v18+ (compatibility maintained)
- **Bundler**: Vite 7.3.1
- **Package Manager**: Bun exclusively (never use npm/yarn)

### Critical Rules
- Always use `bun run` for scripts, never `npm run`
- Use `bun add` for dependencies, `bun add -d` for dev dependencies
- Bun's built-in APIs are preferred over Node.js equivalents when available

## Frontend Stack

### Core Framework
- **React 19.2.4**: Use automatic JSX runtime (no manual React imports needed)
- **React Router v7.13.0**: File-based routing with lazy loading
- **State Management**: @tanstack/react-query v5 (SWR pattern for server state)

### Styling & UI
- **Tailwind CSS 4.1.18**: Utility-first styling with custom glassmorphism tokens
- **Framer Motion 12.34.0**: All animations and transitions
- **Design System**: Custom glassmorphism components with consistent blur/opacity values
- **Icons**: react-icons 5.5.0 (import specific icon sets to reduce bundle size)

### Content Rendering
- **Markdown**: react-markdown with plugins:
  - `rehype-highlight`: Syntax highlighting for code blocks
  - `rehype-raw`: Allow raw HTML in markdown
  - `remark-gfm`: GitHub Flavored Markdown support
- **Rich Text Editor**: Quill 2.0.3 (admin dashboard only, lazy loaded)

### Code Style Conventions
- Use functional components with hooks exclusively
- Prefer named exports over default exports for components
- Always destructure props in function signature
- Use TypeScript-style JSDoc comments for complex functions
- Keep components under 200 lines (extract sub-components if larger)

## Backend Stack

### Dual API Architecture
**CRITICAL**: This project maintains parallel API implementations:
- **Development**: Express 5.2.1 server (`server/api/`)
- **Production**: Vercel Serverless Functions (`api/`)

**Rule**: When modifying any API endpoint, update BOTH locations identically.

### Database
- **Neon PostgreSQL**: Serverless Postgres with connection pooling
- **Client**: @neondatabase/serverless (optimized for edge/serverless)
- **Query Pattern**: Always use parameterized queries to prevent SQL injection
- **Connection Management**: Use connection pooling from `src/lib/neon.js`

### Real-Time & Streaming
- **WebSocket**: Socket.io 4.8.3 for admin analytics updates
- **SSE**: Server-Sent Events for AI content streaming (see `server/api/realtime/`)
- **Pattern**: Use SSE for one-way server→client streams, WebSocket for bidirectional

### AI Integration
- **Primary**: Cerebras Cloud SDK (@cerebras/cerebras_cloud_sdk) - Llama 3.3
- **Fallback**: Gemini API (automatically used if Cerebras fails)
- **Streaming**: Always use streaming endpoints for content generation
- **Error Handling**: Gracefully degrade to manual editor if both AI providers fail

### Security & Validation
- **Authentication**: JWT tokens in httpOnly cookies (single admin user)
- **Password Hashing**: bcrypt with 10 rounds (use `scripts/hash-password.js`)
- **Input Validation**: Zod 4.3.6 schemas for all API inputs
- **Rate Limiting**: Implement on all public endpoints

## Development Workflow

### Available Commands

```bash
# Development (use these most often)
bun run dev              # Start frontend (5173) + API (3001) concurrently
bun run dev:vite         # Frontend only (when API not needed)
bun run dev:api          # API server only (for testing endpoints)

# Build & Preview
bun run build            # Production build (auto version bump + sitemap)
bun run preview          # Test production build locally

# Code Quality
bun run lint             # ESLint check (fix issues before committing)

# Database Operations
bun run init-admin       # First-time setup: create tables + admin user
bun run hash-password    # Generate bcrypt hash for new passwords
bun run update-password  # Change admin password

# Utilities
bun run sitemap          # Regenerate sitemap.xml (auto-runs on build)
bun run version-bump     # Manual version increment (auto-runs on build)
```

### Development Server Ports
- Frontend (Vite): `http://localhost:5173`
- API (Express): `http://localhost:3001`
- WebSocket: Same as API port (3001)

## Path Aliases (Always Use These)

```javascript
// ✅ Correct - use path aliases
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/services/api'

// ❌ Incorrect - avoid relative paths
import { Button } from '../../../components/Button'
```

**Available Aliases**:
- `@` → `./src`
- `@/components` → `./src/shared/components`
- `@/services` → `./src/shared/services`
- `@/hooks` → `./src/shared/hooks`
- `@/lib` → `./src/lib`
- `@/constants` → `./src/constants`

## Environment Configuration

### Required Variables

Create `.env` file with these keys (see `.env.example` for template):

```bash
# Database (required)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# AI Services (required for content generation)
CEREBRAS_API_KEY=your_cerebras_key
GEMINI_API_KEY=your_gemini_key

# Authentication (required for admin)
JWT_SECRET=your_secure_random_string

# Frontend Config (VITE_ prefix required for client access)
VITE_API_URL=http://localhost:3001
```

### Environment Rules
- Never commit `.env` files (gitignored)
- Frontend can only access `VITE_*` prefixed variables
- Backend has access to all environment variables
- Use `.env.production` for production overrides

## Build Optimization

### Code Splitting Strategy
Configured in `vite.config.js` with manual chunks:
- `vendor`: React, React DOM, React Router (core framework)
- `motion`: Framer Motion (animations)
- `query`: React Query (data fetching)
- `icons`: React Icons (icon library)
- `blog-libs`: Markdown rendering (react-markdown + plugins)
- `editor-libs`: Quill editor (admin only, lazy loaded)

### Image Optimization
- **Tools**: vite-imagetools generates AVIF/WebP with fallbacks
- **Pattern**: Always provide multiple formats for browser compatibility
- **Lazy Loading**: Use `loading="lazy"` on all images below fold

### Performance Targets
- First Contentful Paint (FCP): < 400ms
- Time to Interactive (TTI): < 2s
- Lighthouse Score: > 95
- Bundle Size: Main chunk < 150KB gzipped

### Production Optimizations
- Terser minification with `drop_console: true`
- Brotli + Gzip compression via vite-plugin-compression
- PWA with offline support (vite-plugin-pwa + workbox)
- Automatic sitemap generation on build

## Deployment

### Platform & CI/CD
- **Hosting**: Vercel (serverless functions + edge network)
- **CI/CD**: GitHub Actions (`.github/workflows/`)
- **Build Gatekeeper**: `scripts/vercel-ignore.js` skips deploys for docs-only changes

### Versioning Strategy
- **Automated SemVer**: `scripts/version-bump.js` runs on every build
- **Version Logic**: Content-aware (patch for content, minor for features, major for breaking)
- **Version Storage**: `public/build-meta.json` (accessible to frontend)

### Deployment Checklist
1. Run `bun run lint` (must pass)
2. Test locally with `bun run build && bun run preview`
3. Verify environment variables in Vercel dashboard
4. Push to main branch (auto-deploys)
5. Check deployment logs for errors
6. Test production URL for functionality

## Common Patterns & Best Practices

### API Calls
```javascript
// ✅ Use React Query for all server data
import { useQuery, useMutation } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['posts', postId],
  queryFn: () => api.getPost(postId),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

### Error Handling
```javascript
// ✅ Always handle errors gracefully
try {
  const result = await api.createPost(data)
  return result
} catch (error) {
  console.error('Failed to create post:', error)
  // Show user-friendly error message
  toast.error('Failed to create post. Please try again.')
  throw error // Re-throw for React Query error handling
}
```

### Component Structure
```javascript
// ✅ Consistent component structure
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'

export function MyComponent({ title, onAction }) {
  // 1. Hooks (state, effects, queries)
  const [isOpen, setIsOpen] = useState(false)
  const { data } = useQuery({ ... })
  
  // 2. Event handlers
  const handleClick = () => { ... }
  
  // 3. Render logic
  return (
    <motion.div>
      {/* JSX */}
    </motion.div>
  )
}
```

### Database Queries
```javascript
// ✅ Always use parameterized queries
const result = await sql`
  SELECT * FROM posts 
  WHERE id = ${postId} AND status = ${status}
`

// ❌ Never use string concatenation (SQL injection risk)
const result = await sql`SELECT * FROM posts WHERE id = ${postId}`
```

## Troubleshooting

### Common Issues

**Build fails with "Cannot find module"**
- Run `bun install` to ensure all dependencies are installed
- Check that path aliases are configured in `vite.config.js`

**API endpoints return 404 in production**
- Verify `api/` folder structure matches `server/api/` exactly
- Check Vercel function logs for deployment errors

**Database connection fails**
- Verify `DATABASE_URL` in environment variables
- Check Neon dashboard for connection string format
- Ensure `?sslmode=require` is appended to connection string

**AI generation not working**
- Check `CEREBRAS_API_KEY` and `GEMINI_API_KEY` are set
- Verify API keys are valid in respective dashboards
- Check browser console for streaming errors

## Additional Resources

- **Vite Config**: `vite.config.js` (build optimization settings)
- **Tailwind Config**: `tailwind.config.js` (custom theme tokens)
- **ESLint Config**: `.eslintrc.cjs` (linting rules)
- **Architecture Docs**: `docs/ARCHITECTURE.md` (system design)
- **Database Schema**: `docs/database/neon_schema.sql` (table definitions)
