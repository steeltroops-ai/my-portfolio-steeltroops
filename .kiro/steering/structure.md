---
inclusion: always
---

# Project Structure & Organization

## Directory Architecture

### Root Structure
```
my-portfolio-steeltroops/
├── api/                    # Vercel serverless functions (production only)
├── server/                 # Local Express API (dev mirror of api/)
├── src/                    # React application source
├── public/                 # Static assets, PWA manifests
├── scripts/                # Build automation and utilities
├── docs/                   # Architecture documentation
└── dist/                   # Production build output (gitignored)
```

### Source Organization (`src/`)

Feature-based architecture with clear separation of concerns:

```
src/
├── features/               # Domain-specific modules (feature slices)
│   ├── admin/              # Admin dashboard, analytics, AI generator, messages
│   ├── blog/               # Blog listing, post viewer, search
│   └── portfolio/          # Hero, about, projects, experience, contact
│
├── shared/                 # Cross-cutting reusable code
│   ├── components/         # UI components (layouts, feedback, glassmorphism)
│   ├── services/           # API clients and data fetching
│   ├── hooks/              # Global hooks (useAuth, useTheme, useNetwork)
│   └── analytics/          # Tracking and telemetry
│
├── lib/                    # Framework-agnostic utilities
│   ├── cacheManager.js     # SWR and localStorage TTL management
│   ├── neon.js             # Database connection pooling
│   └── markdown.js         # Markdown-to-React transformation
│
├── constants/              # Configuration and design tokens
├── App.jsx                 # Root component with router setup
└── main.jsx                # Application entry point
```

## File Placement Rules

### When Creating New Files

1. **Feature-specific components** → `src/features/{domain}/components/`
   - Example: Blog post card → `src/features/blog/components/PostCard.jsx`

2. **Reusable UI components** → `src/shared/components/`
   - Example: Generic button → `src/shared/components/Button.jsx`

3. **API endpoints (production)** → `api/{resource}.js`
   - Example: Posts API → `api/posts.js`

4. **API endpoints (development)** → `server/api/{resource}.js`
   - Must mirror production structure exactly

5. **Business logic utilities** → `src/lib/`
   - Example: Date formatter → `src/lib/dateUtils.js`

6. **Feature-specific hooks** → `src/features/{domain}/hooks/`
   - Example: Blog search hook → `src/features/blog/hooks/usePostSearch.js`

7. **Global hooks** → `src/shared/hooks/`
   - Example: Auth hook → `src/shared/hooks/useAuth.js`

### Naming Conventions

- **React Components**: PascalCase with `.jsx` extension
  - `BlogPost.jsx`, `AdminDashboard.jsx`, `ContactForm.jsx`

- **Utilities/Services**: camelCase with `.js` extension
  - `cacheManager.js`, `apiClient.js`, `formatDate.js`

- **Hooks**: camelCase starting with `use`
  - `useAuth.js`, `useTheme.js`, `usePostQuery.js`

- **Constants**: UPPER_SNAKE_CASE or camelCase config objects
  - `API_ENDPOINTS.js`, `themeConfig.js`

- **Test files**: Same name as source with `.test.js` suffix
  - `BlogPost.test.jsx`, `cacheManager.test.js`

## Import Path Aliases

Always use path aliases for cleaner imports:

```javascript
// ✅ Correct
import { Button } from '@/shared/components'
import { useAuth } from '@/shared/hooks'
import { api } from '@/shared/services'
import { THEME_COLORS } from '@/constants'

// ❌ Avoid
import { Button } from '../../../shared/components'
import { useAuth } from '../../hooks/useAuth'
```

Available aliases:
- `@` → `./src`
- `@/components` → `./src/shared/components`
- `@/services` → `./src/shared/services`
- `@/hooks` → `./src/shared/hooks`
- `@/lib` → `./src/lib`
- `@/constants` → `./src/constants`

## API Layer Architecture

### Dual API Structure

This project maintains two parallel API implementations:

1. **Production API** (`api/`) - Vercel serverless functions
2. **Development API** (`server/api/`) - Local Express server

**Critical Rule**: When modifying API endpoints, update BOTH locations to maintain parity.

### API Endpoint Organization

```
api/ (and server/api/)
├── ai/
│   ├── generate-blog.js        # Full blog generation
│   ├── generate-blog-stream.js # Streaming generation (SSE)
│   ├── generate-outline.js     # Outline generation
│   └── generate-section.js     # Section-by-section generation
├── analytics/
│   ├── track.js                # Event tracking
│   └── stats.js                # Analytics retrieval
├── auth.js                     # JWT authentication
├── posts.js                    # Blog CRUD operations
├── categories.js               # Category management
├── tags.js                     # Tag management
├── comments.js                 # Comment system
└── contact.js                  # Contact form handling
```

### Real-Time Services

Located in `server/services/realtime/`:
- `broadcaster.js` - WebSocket event broadcasting
- `sseTransport.js` - Server-Sent Events for AI streaming
- `streamRegistry.js` - Active stream management

## State Management Patterns

### Server State (API Data)
Use React Query (`@tanstack/react-query`) for all server data:

```javascript
// ✅ Correct pattern
import { useQuery, useMutation } from '@tanstack/react-query'

const { data, isLoading } = useQuery({
  queryKey: ['posts', postId],
  queryFn: () => api.getPost(postId),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

### Global UI State
Use Context API for theme, auth, and global UI state:

```javascript
// ✅ Correct pattern
import { useAuth } from '@/shared/hooks'

const { user, isAuthenticated, login, logout } = useAuth()
```

### Local Component State
Use `useState` for component-specific data that doesn't need sharing:

```javascript
// ✅ Correct pattern
const [isOpen, setIsOpen] = useState(false)
const [formData, setFormData] = useState({})
```

## Component Architecture Patterns

### Feature Slice Structure

Each feature should be self-contained:

```
features/blog/
├── components/          # Feature-specific components
├── hooks/              # Feature-specific hooks
├── services/           # Feature-specific API calls
├── utils/              # Feature-specific utilities
└── index.js            # Public API exports
```

### Component Composition

Follow this hierarchy:
1. **Page Components** - Route-level components in `features/{domain}/pages/`
2. **Container Components** - Business logic and data fetching
3. **Presentational Components** - Pure UI components in `shared/components/`

## Scripts and Automation

### Available Utility Scripts

Located in `scripts/`:

- `init-admin.js` - Initialize database and create admin user
- `hash-password.js` - Generate bcrypt password hashes
- `update-admin-password.js` - Update admin credentials
- `version-bump.js` - Automated semantic versioning
- `generate-sitemap.js` - SEO sitemap generation
- `vercel-ignore.js` - Deployment gatekeeper logic
- `check-db.js` - Database connection verification
- `debug-posts.js` - Post data debugging utility

### Database Migration Scripts

Located in `server/scripts/`:

- Follow naming pattern: `migration-{number}-{description}.js`
- Always include rollback logic
- Test locally before deploying

## Protected Routes and Authentication

### Route Access Control

- **Public Routes**: `/`, `/blogs`, `/blogs/:slug`, `/contact`
- **Protected Routes**: `/admin/*` (requires JWT authentication)

### Authentication Flow

1. Login via `/api/auth` with credentials
2. Receive JWT token stored in httpOnly cookie
3. Token validated on all `/admin/*` route access
4. Token refresh handled automatically by React Query

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# AI Services
CEREBRAS_API_KEY=...
GEMINI_API_KEY=...

# Authentication
JWT_SECRET=...

# Frontend (VITE_ prefix required)
VITE_API_URL=http://localhost:3001
```

### Environment Files

- `.env` - Local development (gitignored)
- `.env.example` - Template with all required keys
- `.env.production` - Production overrides (gitignored)

## Build and Deployment

### Build Output Structure

```
dist/
├── assets/
│   ├── index-{hash}.js      # Main bundle
│   ├── vendor-{hash}.js     # Third-party libraries
│   ├── motion-{hash}.js     # Framer Motion chunk
│   └── *.webp, *.avif       # Optimized images
├── index.html
└── sw.js                    # Service worker
```

### Code Splitting Strategy

Configured in `vite.config.js`:
- `vendor` - React, React DOM, React Router
- `motion` - Framer Motion animations
- `query` - React Query
- `icons` - React Icons
- `blog-libs` - Markdown rendering libraries
- `editor-libs` - Quill editor (admin only)

## Documentation Standards

### When to Update Documentation

Update `docs/ARCHITECTURE.md` when:
- Adding new features or major components
- Changing data flow patterns
- Modifying API contracts

Update `docs/ENGINEERING_LOG.md` when:
- Making performance optimizations
- Changing build configuration
- Adding new dependencies

### Code Comments

- Use JSDoc for public functions and components
- Explain "why" not "what" in inline comments
- Document complex algorithms and business logic
- Add TODO comments with context for future work
