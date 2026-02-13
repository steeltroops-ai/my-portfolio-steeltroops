# Mayank's Portfolio

A modern, dynamic personal portfolio website featuring a blog, admin dashboard, and AI integration.

## Features

- **Responsive Design**: Glassmorphism UI with Framer Motion.
- **Admin Dashboard**: Secure content management.
- **AI Blog Generator**: Powered by Cerebras Cloud SDK.
- **Content Management**: Rich text editor (Quill).
- **Serverless Backend**: Vercel functions with Neon (PostgreSQL).

## Tech Stack

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-5FA04E.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest)
- Node.js (v18+)

### Installation

1. **Clone repository**

   ```bash
   git clone https://github.com/steeltroops/my-portfolio-steeltroops.git
   cd my-portfolio-steeltroops
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Environment Setup**

   Create `.env` using `.env.example`.

   ```bash
   cp .env.example .env
   ```

4. **Initialize Admin**

   ```bash
   bun run init-admin
   ```

### Running

Start frontend and local API:

```bash
bun run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`

## Scripts

- `bun run dev`: Start dev servers.
- `bun run build`: Build production.
- `bun run lint`: Lint code.
- `bun run init-admin`: Init database admin.

## System Intelligence & Documentation

For a deep-dive into the technical foundations and architectural decisions powering this platform, refer to our specialized documentation:

- **[Technical Architecture](docs/ARCHITECTURE.md)**: End-to-end functional flows, message lifecycles, and color-coded system mappings.
- **[Full-Stack System Design](docs/SYSTEM_DESIGN.md)**: Component hierarchy, database entity relationships, and infrastructure orchestration.
- **[AI Intelligence Engine](docs/AI_SYSTEM_DESIGN.md)**: Philosophical design of "May OS", SSE streaming implementation, and persona-driven content generation.
- **[Engineering Log & Standards](docs/ENGINEERING_LOG.md)**: Performance optimization strategies (SWR, Prefetching, Image pipeline) and current technical roadmap.

## CI/CD Workflow (Automated)

This project uses an intelligent "Zero-Friction" CI/CD pipeline:

1. **Develop on a Branch**: Create a feature branch (e.g., `dev/header-fix`).
2. **Local Protection**: Husky runs `pre-push` build checks. You cannot push broken code.
3. **Ghost Merge**: When you push to your branch, GitHub Actions validates the build. If successful, it **automatically merges** the branch into `main`.
4. **Automatic Release**: Once merged, the system bumps version numbers and deploys to Vercel instantly.

## Project Structure

```text
my-portfolio-steeltroops/
├── api/                # Vercel Serverless (Intelligence & Logic)
├── docs/               # System Intelligence & Blueprint Repository
│   ├── archive/        # Historical migrations & logs
│   └── database/       # SQL Schemas & Database definitions
├── scripts/            # Automation (Versioning, Sitemaps, Gatekeepers)
├── server/             # Local API Development Environment
├── src/                # Frontend Application (React 19)
│   ├── features/       # Domain-driven modules (Admin, Blog, Portfolio)
│   ├── shared/         # Global Layouts, UI Kits, and Contexts
│   └── lib/            # Business Logic, Cache Managers, and Adapters
├── public/             # PWA Assets, Webmanifests & Build Metadata
├── .github/            # GitHub Actions (CI/CD Quality Gates)
└── vercel.json         # Security Headers, Rewrites & Gatekeepers
```

---

Designed and developed by Mayank...
