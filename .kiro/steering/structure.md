# Project Structure

## Directory Organization

```
src/
├── components/          # React components
│   ├── Comments/       # Comment system components
│   ├── About.jsx       # Portfolio sections
│   ├── Hero.jsx
│   ├── Technologies.jsx
│   ├── Experience.jsx
│   ├── Projects.jsx
│   ├── Contact.jsx
│   ├── Blog.jsx        # Blog listing page
│   ├── BlogPost.jsx    # Individual post view
│   ├── BlogEditor.jsx  # Post editor
│   ├── AdminDashboard.jsx
│   ├── AdminLogin.jsx
│   └── ...
├── services/           # Backend integration
│   ├── SupabaseBlogService.js
│   ├── SupabaseAuthService.js
│   ├── SupabaseStorageService.js
│   ├── HybridBlogService.js
│   ├── HybridAuthService.js
│   ├── LocalAuthService.js
│   ├── CommentService.js
│   └── ContactService.js
├── lib/                # Shared libraries
│   └── supabase.js     # Supabase client config
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── data/               # Static data
├── constants/          # Constants and config
├── models/             # Data models
├── styles/             # Additional styles
├── test/               # Test setup and utilities
├── App.jsx             # Main portfolio app
├── main.jsx            # App entry point with routing
└── index.css           # Global styles
```

## Architectural Patterns

**Component Organization**
- Portfolio components are standalone sections (Hero, About, etc.)
- Blog components handle content management and display
- Shared components (ErrorBoundary, SEOHead, etc.) provide common functionality
- Admin components are lazy-loaded for code splitting

**Service Layer**
- Services abstract backend operations (Supabase, local storage)
- Hybrid services provide fallback mechanisms
- Each service handles a specific domain (blog, auth, storage, comments)

**Routing Structure**
- `/` - Main portfolio page
- `/blog` - Blog listing
- `/blog/:slug` - Individual blog post
- `/admin/login` - Admin authentication
- `/admin/dashboard` - Admin dashboard
- `/admin/post/new` - Create new post
- `/admin/post/edit/:id` - Edit existing post

**State Management**
- React Query for server state and caching
- Local component state with useState/useReducer
- Context API for auth state (via ProtectedRoute)

## Code Conventions

**React Patterns**
- Functional components with hooks
- Automatic JSX runtime (no React import needed)
- PropTypes for runtime type checking
- Error boundaries for error handling
- Lazy loading for route-based code splitting

**Styling**
- Tailwind utility classes
- Dark theme by default
- Custom animations defined in tailwind.config.js
- Responsive design with mobile-first approach

**File Naming**
- Components: PascalCase (e.g., `BlogPost.jsx`)
- Services: PascalCase with Service suffix (e.g., `SupabaseBlogService.js`)
- Utilities: camelCase (e.g., `errorTracking.js`)
- Constants: camelCase or UPPER_SNAKE_CASE

**Import Order**
1. React and third-party libraries
2. Components
3. Services and utilities
4. Styles

## Database Schema

**blog_posts table**
- id (UUID, primary key)
- title, slug, content, excerpt
- author, created_at, updated_at
- published (boolean)
- tags (text array)
- featured_image_url
- meta_description, read_time

**Indexes**: slug, published, created_at, tags (GIN)

**Storage**: `blog-images` bucket for post images
