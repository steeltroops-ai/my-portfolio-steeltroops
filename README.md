# Mayank's Portfolio

Personal portfolio website with an integrated blog system.

**Live:** [steeltroops.vercel.app](https://steeltroops.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Vercel Serverless Functions |
| Database | Neon PostgreSQL |
| AI | Google Gemini (blog generation) |

---

## Project Structure

```
my-portfolio-steeltroops/
├── api/                    # Vercel Serverless Functions (backend)
│   ├── auth.js             # Authentication
│   ├── posts.js            # Blog CRUD
│   ├── comments.js         # Comment system
│   ├── contact.js          # Contact form
│   └── ai/
│       └── generate-blog.js  # AI blog generation
│
├── public/                 # Static assets
├── src/                    # Frontend React app
│   ├── features/           # Feature modules
│   ├── shared/             # Shared components
│   └── constants/          # App constants
│
├── docs/                   # Documentation & SQL schemas
├── vercel.json             # Vercel configuration
└── package.json
```

---

## How It Works

### Architecture

```
                    ┌─────────────────────────────────────┐
                    │           VERCEL                    │
                    │  ┌─────────────┐ ┌───────────────┐  │
   Browser ────────►│  │  Frontend   │ │  Serverless   │  │
                    │  │  (React)    │ │  Functions    │  │
                    │  │  /dist      │ │  /api/*       │  │
                    │  └─────────────┘ └───────┬───────┘  │
                    └──────────────────────────│──────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │  Neon PostgreSQL    │
                                    │  (Database)         │
                                    └─────────────────────┘
```

### API Routes

When deployed to Vercel:
- Frontend calls `/api/posts` → Vercel routes to `api/posts.js`
- No separate backend deployment needed
- Same domain, no CORS issues

---

## Deployment (via GitHub + Vercel)

### Step 1: Prepare Database

1. Create account at [Neon](https://console.neon.tech)
2. Create a new project
3. Run SQL schemas from `docs/*.sql` in Neon SQL Editor
4. Copy connection string

### Step 2: Set up Gemini API (optional)

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Step 3: Deploy to Vercel

1. **Push code to GitHub**

2. **Go to [Vercel](https://vercel.com)**
   - Sign in with GitHub
   - Click "Add New" → "Project"
   - Import your repository

3. **Add Environment Variables in Vercel Dashboard:**

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` |
   | `GEMINI_API_KEY` | `your-gemini-api-key` |
   | `VITE_ADMIN_EMAIL` | `admin@yourdomain.com` |

4. **Click Deploy**

That's it! Vercel automatically:
- Builds frontend from `src/`
- Deploys API from `api/`
- Routes `/api/*` to serverless functions

---

## Local Development

```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Build for production
bun run build
```

### Environment Variables

Create `.env` file:

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
GEMINI_API_KEY=your-gemini-api-key
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

---

## Admin Panel

- Login: `/admin/login`
- Dashboard: `/admin/dashboard`
- Create posts: `/admin/post/new`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get all posts |
| POST | `/api/posts` | Create post |
| GET | `/api/posts?slug=xxx` | Get post by slug |
| PUT | `/api/posts` | Update post |
| DELETE | `/api/posts` | Delete post |
| POST | `/api/ai/generate-blog` | Generate blog with AI |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/auth` | Admin authentication |

---

## Free Services Used

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Vercel | Frontend + API hosting | 100GB bandwidth |
| Neon | PostgreSQL database | 0.5GB storage |
| Gemini | AI blog generation | 1M tokens/month |

---

## License

MIT

---

Built by [@steeltroops](https://github.com/steeltroops-ai)
