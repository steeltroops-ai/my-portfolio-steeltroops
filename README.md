# Portfolio & AI Blog Platform

A high-performance personal portfolio and blog platform engineering with a custom AI generation engine. Built for speed, seo, and deep technical content creation.

## System Architecture

### Frontend

- **Framework**: React 18 (Vite)
- **Styling**: TailwindCSS
- **Animation**: Framer Motion
- **State Granularity**: Local component state + React Query for server state

### Backend & Database

- **Runtime**: Vercel Serverless Functions (Node.js)
- **Database**: Neon (Serverless PostgreSQL)
- **ORM**: Raw SQL via `@neondatabase/serverless` for maximum performance

### AI Engine (Mayank OS)

The platform features a custom AI blog generation pipeline powered by **Cerebras Llama 3.3 70B**.

**Core Capabilities:**

- **Two-Phase Generation**:
  1.  **Architecting**: Creates a detailed content strategy and outline.
  2.  **Drafting**: Writes section-by-section using context-aware prompts.
- **Dynamic Personas**:
  - **Professional Mode**: Acts as a Senior Systems Engineer. Focuses on architecture, constraints, and high-signal technical depth.
  - **Casual Mode**: Acts as a Thoughtful Tech Writer. Focuses on narrative, accessibility, and human-centric storytelling.
- **Strict Code Control**: Enforces code inclusion/exclusion based on user intent.
- **Automatic Tagging**: Generates taxonomy-aligned tags.

## Key Features

- **Admin Dashboard**: Secure interface for managing content and AI generation.
- **Markdown Support**: Full GFM support with syntax highlighting.
- **Responsive Design**: Fluid layouts optimized for all devices.
- **SEO Optimized**: Dynamic meta tags and semantic HTML structure.
- **Performance**: Sub-second page loads via static generation and efficient caching.

## Local Development

### Prerequisites

- Node.js 18+
- Bun (Package Manager)

### Setup

1.  **Clone Repository**

    ```bash
    git clone <repository-url>
    cd my-portfolio-steeltroops
    ```

2.  **Install Dependencies**

    ```bash
    bun install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory:

    ```env
    DATABASE_URL="postgres://user:pass@host/db?sslmode=require"
    CEREBRAS_API_KEY="your-cerebras-key"
    VITE_ADMIN_PASSWORD_HASH="your-password-hash"
    ```

4.  **Start Development Server**
    ```bash
    bun run dev
    ```

## Deployment

This project is optimized for **Vercel**.

1.  Connect your GitHub repository to Vercel.
2.  Configure the Environment Variables in the Vercel dashboard.
3.  Deploy.

## API Reference

**Content**

- `GET /api/posts`: Retrieve published posts.
- `GET /api/posts?slug=xyz`: Retrieve single post.

**AI Generation (Protected)**

- `POST /api/ai/generate-blog`: Triggers the Mayank OS generation pipeline.
  - Payload: `{ topic, style, length, tags }`

**Administration**

- `POST /api/auth`: Session management.
- `POST /api/posts`: Create/Update posts.
