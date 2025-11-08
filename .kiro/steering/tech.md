# Technology Stack

## Core Technologies

- **Runtime**: Bun (preferred over npm/yarn/pnpm)
- **Build Tool**: Vite 4.4.9
- **Framework**: React 18.3.1
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS 3.4.17
- **Backend**: Supabase (PostgreSQL, Auth, Storage)

## Key Libraries

- **State Management**: @tanstack/react-query for server state
- **Animations**: Framer Motion
- **Rich Text**: React Quill, React Markdown with remark-gfm, rehype-highlight
- **SEO**: React Helmet Async
- **Icons**: React Icons
- **Sanitization**: DOMPurify
- **Testing**: Vitest with jsdom

## Development Tools

- **Linting**: ESLint with React plugins
- **Code Formatting**: Prettier
- **Type Checking**: JSDoc comments (TypeScript-ready but using JSX)

## Common Commands

```bash
# Development
bun run dev              # Start dev server on port 5173
bun run dev:no-lint      # Start dev without linting

# Building
bun run build            # Production build
bun run build:analyze    # Build with bundle analyzer
bun run preview          # Preview production build

# Testing
bun run test             # Run tests in watch mode
bun run test:run         # Run tests once
bun run test:ui          # Run tests with UI
bun run test:coverage    # Run tests with coverage

# Code Quality
bun run lint             # Run ESLint
bun run bundle-size      # Check bundle sizes

# Package Management
bun add <package>        # Add dependency
bun remove <package>     # Remove dependency
bun update               # Update dependencies
```

## Build Configuration

- **Path Aliases**: Configured in vite.config.js using `@/` prefix
  - `@/components`, `@/services`, `@/utils`, `@/hooks`, `@/lib`, `@/data`, `@/constants`
- **Code Splitting**: Manual chunks for vendor, router, markdown, editor, etc.
- **Target**: ES2020
- **Minification**: esbuild

## Environment Variables

Required variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=secure_password
```

All environment variables must be prefixed with `VITE_` to be accessible in the application.
