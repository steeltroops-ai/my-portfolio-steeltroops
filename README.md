# Portfolio & AI Blog Platform

High-performance portfolio engine with a custom Llama 3.3 powered technical blog generation pipeline.

## Backend Architecture

Built on **Vercel Serverless Functions** (Node.js) for zero-cold-start edge compatibility.

- **API Layer**: RESTful endpoints with strict method validation.
- **Database**: Neon (Serverless PostgreSQL) using `@neondatabase/serverless`.
- **Optimization**: raw SQL queries for minimal overhead and maximum throughput.

## Security Implementation

Custom authentication system designed for minimal dependency surface area.

- **Authentication**: Bearer token session management.
- **Hashing**: PBKDF2 (SHA-512) password hashing with unique per-user salts.
- **Session Control**: Database-backed sessions with explicit expiration policies.
- **Access Control**: Role-based middleware (`verifyAuth`) protecting administrative routes.

## AI Generation Pipeline

Integrated autonomous content engine using **Cerebras Llama 3.3 70B**.

1.  **Phase 1: Architecting**
    - Analyzes topic and requested persona (Professional Engineer vs. Tech Writer).
    - Generates a structural master plan with distinct functional sections.
2.  **Phase 2: Drafting**
    - Iteratively generates content section-by-section.
    - Maintains context awareness using the master plan anchor.
    - Enforces strict constraints on code block inclusion and technical depth.

## Project Structure

```
├── api/                  # Serverless Functions
│   ├── ai/               # AI Generation Logic
│   │   ├── generate-blog.js
│   │   └── ...
│   ├── auth.js           # Authentication & Session Management
│   ├── posts.js          # Blog CRUD Operations
│   └── ...
├── src/
│   ├── features/
│   │   ├── admin/        # Protected Admin Dashboard
│   │   └── blog/         # Public Blog Components
│   └── lib/
│       └── neon.js       # Database Connection Utility
└── ...
```

## Local Development

```bash
# Install dependencies
bun install

# Configure Environment
# DATABASE_URL=postgres://...
# CEREBRAS_API_KEY=...
# VITE_ADMIN_PASSWORD_HASH=...

# Start Development Server
bun run dev
```
