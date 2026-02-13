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

## CI/CD Workflow (Automated)

This project uses an intelligent "Zero-Friction" CI/CD pipeline:

1.  **Develop on a Branch**: Create a feature branch (e.g., `dev/header-fix`).
2.  **Local Protection**: Husky runs `pre-push` build checks. You cannot push broken code.
3.  **Ghost Merge**: When you push to your branch, GitHub Actions validates the build. If successful, it **automatically merges** the branch into `main`.
4.  **Automatic Release**: Once merged, the system bumps version numbers and deploys to Vercel instantly.

## Project Structure

```text
my-portfolio-steeltroops/
├── api/                # Serverless functions
├── docs/               # Documentation
├── public/             # Static assets
├── scripts/            # DB utilities
├── server/             # Local Express server
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Application routes
│   └── styles/         # Global styles
├── .env.example        # Env template
├── package.json        # Manifest
└── vite.config.js      # Vite config
```

---

Designed and developed by Mayank...
