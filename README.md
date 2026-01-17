# Personal Portfolio with AI Blog

A modern, dark-themed portfolio website with an AI-powered blog system.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Framer Motion, TailwindCSS |
| Backend | Vercel Serverless Functions |
| Database | Neon PostgreSQL |
| AI | Cerebras (Llama 3.3 70B) |

## Features

- Responsive dark theme portfolio
- Blog with Markdown support
- AI-powered blog generation
- Admin dashboard with authentication
- Contact form with database storage

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL=your-neon-connection-string
CEREBRAS_API_KEY=your-cerebras-api-key
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `CEREBRAS_API_KEY`
4. Deploy

## Project Structure

```
.
├── api/                 # Serverless API functions
│   ├── ai/              # AI blog generation
│   ├── posts.js         # Blog CRUD
│   ├── auth.js          # Authentication
│   └── ...
├── src/
│   ├── features/        # Feature modules
│   │   ├── admin/       # Admin dashboard
│   │   └── blog/        # Blog components
│   ├── shared/          # Shared components
│   └── constants/       # App constants
├── docs/                # Documentation
└── scripts/             # Utility scripts
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/posts` | GET | List all posts |
| `/api/posts` | POST | Create post |
| `/api/ai/generate-blog` | POST | Generate with AI |
| `/api/auth` | POST | Login/logout |
| `/api/comments` | GET/POST | Comments |
| `/api/contact` | POST | Contact form |

## Admin Access

Navigate to `/admin/login` after deployment.

## License

MIT
