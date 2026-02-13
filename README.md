# Mayank's Portfolio

[![Status](https://img.shields.io/badge/Status-Active-brightgreen)](https://github.com/steeltroops-ai/my-portfolio-steeltroops)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://vercel.com)
[![Version](https://img.shields.io/badge/Version-2.0.3-blue)](https://github.com/steeltroops-ai/my-portfolio-steeltroops)
[![Build](https://img.shields.io/github/actions/workflow/status/steeltroops-ai/my-portfolio-steeltroops/quality-checks.yml?label=Build)](https://github.com/steeltroops-ai/my-portfolio-steeltroops/actions)
[![License](https://img.shields.io/badge/License-Private-red)](./LICENSE)

A modern, dynamic personal portfolio website featuring a blog, admin dashboard, and AI integration.

## Features

- **Responsive Design**: Glassmorphism UI with Framer Motion.
- **Admin Dashboard**: Secure content management.
- **AI Blog Generator**: Powered by Cerebras Cloud SDK.
- **Content Management**: Rich text editor (Quill).
- **Serverless Backend**: Vercel functions with Neon (PostgreSQL).

## Tech Stack

![React](https://img.shields.io/badge/React-20232A.svg?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF.svg?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4.svg?style=flat-square&logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000.svg?style=flat-square&logo=bun&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-339933.svg?style=flat-square&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1.svg?style=flat-square&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000.svg?style=flat-square&logo=vercel&logoColor=white)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest)
- Node.js (v18+)

### Installation

1. **Clone repository**

   ```bash
   git clone https://github.com/steeltroops-ai/my-portfolio-steeltroops.git
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

## Documentation

Refer to the following documents for technical details and architectural decisions:

- **[Architecture](docs/ARCHITECTURE.md)**: Technical flows and system mapping.
- **[System Design](docs/SYSTEM_DESIGN.md)**: Component hierarchy and database schema.
- **[AI Systems](docs/AI_SYSTEM_DESIGN.md)**: Persona logic and streaming implementation.
- **[Standards](docs/ENGINEERING_LOG.md)**: Performance rules and engineering logs.

## CI/CD Workflow

The project uses an automated pipeline for quality assurance and deployment:

1. **Branching**: Development occurs on feature branches.
2. **Validation**: Local pre-push checks via Husky.
3. **Automation**: Automated branch merging upon successful CI validation.
4. **Deployment**: Versioning and production deployment via Vercel.

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
