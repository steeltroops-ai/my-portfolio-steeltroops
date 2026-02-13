# Portfolio Platform: Technical Architecture

This document provides the definitive architectural blueprint for the Portfolio Platform, detailing the integration of **Autonomous AI Intelligence**, **Cloud Infrastructure**, and **DevOps Automation**.

---

## 1. High-Performance Tech Stack (Free-Tier Optimized)

The platform is engineered to deliver a premium, high-speed experience while operating entirely within the boundaries of a free-tier ecosystem.

| Component            | Technology               | Service        | Key Metric                               |
| :------------------- | :----------------------- | :------------- | :--------------------------------------- |
| **Logic (UI)**       | React 19 + Framer Motion | Vercel         | < 400ms First Contentful Paint           |
| **Intelligence**     | Llama 3.3 70B (AI)       | Cerebras SDK   | 300+ tokens/sec inference                |
| **Inference (Fall)** | Gemini 2.5 Flash         | Google AI      | 1M free tokens/mo                        |
| **Database**         | PostgreSQL               | Neon           | Serverless Autoscaling (Cold start < 2s) |
| **Deployment**       | CI/CD Quality Gates      | GitHub Actions | Content-Aware Ghost Merges               |
| **Asset Pipeline**   | vite-imagetools          | Build-time     | Automated AVIF/WebP generation           |

---

## 2. Blueprint: Full Project Structure & Geometry

The codebase is engineered with a **Domain-Driven Architecture**, strictly isolating the high-security Admin Intelligence from the public-facing portfolio assets.

```text
my-portfolio-steeltroops/
├── .github/                      # CI/CD & Operations Infrastructure
│   └── workflows/                # Unified Quality Gates & Auto-Release pipelines
│
├── api/                          # Vercel Serverless Layer (The Intelligence Hub)
│   ├── ai/                       # Cerebras Llama 3.3 & Gemini SSE streaming logic
│   ├── blog/                     # Neon CRUD endpoints & Full-text search logic
│   ├── analytics/                # Visitor heartbeat & aggregate data processing
│   └── auth/                     # Session security & Admin verification
│
├── docs/                         # System Intelligence & Knowledge Repository
│   ├── archive/                  # Historic migration logs & legacy status reports
│   ├── database/                 # Pure SQL Schemas & Entity Relationship definitions
│   ├── AI_SYSTEM_DESIGN.md       # Persona ("May OS") & SSE Pipeline architecture
│   ├── ARCHITECTURE.md           # [THIS DOC] - High-level system blueprints
│   ├── ENGINEERING_LOG.md        # Technical standards, Roadmap & Performance metrics
│   └── SYSTEM_DESIGN.md          # Component hierarchy & Detailed data flows
│
├── scripts/                      # DevOps Automation & Maintenance Matrix
│   ├── version-bump.js           # Content-Aware SemVer logic & metadata updater
│   ├── vercel-ignore.js          # Intelligent Deployment gatekeeper
│   ├── generate-sitemap.js       # Dynamic SEO orchestration (Search Engine visibility)
│   └── init-admin.js             # Initial database provisioning & admin seeding
│
├── server/                       # Specialized Dev-Environment Proxy
│   └── local-api.js              # Express-based mirror of Vercel functions for local dev
│
├── src/                          # Frontend Application Core (React 19)
│   ├── features/                 # Domain-Driven Functional Modules
│   │   ├── admin/                # High-Stake Control Panel (Dashboard, Analytics, AI Gen)
│   │   ├── blog/                 # Content Consumption Layer (Feed, Post Viewer, Search)
│   │   └── portfolio/            # Personal Branding Assets (Hero, About, Projects)
│   │
│   ├── shared/                   # Global Reusability Matrix
│   │   ├── components/           # Core UI Kit (Layouts, Feedback, Glassmorphism elements)
│   │   ├── services/             # Global API Adapters & Data Fetching Wrappers
│   │   ├── analytics/            # Precision tracking & heartbeat logic
│   │   └── hooks/                # Global State (useAuth, useTheme, useNetwork)
│   │
│   ├── lib/                      # Pure Logic & Persistence Adapters
│   │   ├── cacheManager.js       # SWR & LocalStorage TTL engine
│   │   ├── neon.js               # Database connection & pooling logic
│   │   └── markdown.js           # Markdown-to-Component transformation logic
│   │
│   ├── constants/                # Project Constants & Design Tokens
│   └── main.jsx                  # Virtual DOM Entry Point
│
├── public/                       # PWA Engine & Static Browser Assets
│   ├── sw.js                     # Advanced Service Worker (Resilience logic)
│   ├── static/                   # Optimized optimized images & fonts
│   └── site.webmanifest          # PWA metadata & mobile-app configuration
│
└── vercel.json                   # Infrastructure config (CSP Headers, Rewrites, Redirects)
```

---

---

## 3. Intelligence Engine: AI Content Generation

The system utilizes a specialized **May OS** persona, optimizing for deep insight and systems-thinking rather than generic SEO.

### 3.1 Streaming API Interface

**Endpoint**: `POST /api/ai/generate-blog-stream`  
**Description**: Initiates a multi-stage SSE (Server-Sent Events) pipeline that streams the blog structure and content word-by-word.

**Request Payload:**

```json
{
  "topic": "The Architecture of Fault-Tolerant Robotics",
  "style": "technical",
  "length": "comprehensive",
  "audience": "Systems Engineers",
  "blueprint": {
    "totalSections": 6,
    "includeElements": ["code_block", "comparison_table", "callout_note"]
  }
}
```

**Stream Response (SSE Events):**

- `event: outline_complete`: Returns the JSON structure of the post.
- `event: section_chunk`: Word-by-word content fragments for real-time rendering.
- `event: generation_complete`: Final metadata, tags, and DB persistence status.

---

## 4. Smart Pulse CI/CD Filtering

The platform implements **Intelligent Deployment Filtering** to protect build minutes and maintain release integrity.

### 4.1 Implementation Logic

1. **Local Protection**: Husky runs `pre-push` build checks. Code cannot be pushed to GitHub if it breaks the build.
2. **Ghost Merge**: `quality-checks.yml` validates feature branches. If successful, it performs an atomic merge into `main`.
3. **Content-Aware Versioning**: `deploy.yml` analyzes the file delta. If only documentation (e.g., `docs/`) was changed, it skips version bumping.
4. **Vercel Gatekeeper**: `vercel-ignore.js` acts as the final shield. If a commit consists solely of documentation or metadata, it aborts the Vercel build before it consumes minutes.

---

## 5. PWA & Offline Strategy

A custom Service Worker (`sw.js`) provides a resilient offline strategy:

- **Functional Cache**: Any page visited while online is saved for offline browsing.
- **Liquid Glass Fallback**: If a page isn't in cache and offline, a premium `offline.html` UI appears.
- **Auto-Uplink**: The system automatically detects restored connectivity and reloads.

---

## Free Services Summary

| Service            | Use For        | Free Tier        |
| ------------------ | -------------- | ---------------- |
| **Vercel**         | Frontend + API | 100GB bandwidth  |
| **Neon**           | PostgreSQL DB  | 0.5GB storage    |
| **Google Gemini**  | AI Generation  | 1M tokens/month  |
| **Supabase**       | File Storage   | 1GB storage      |
| **Cloudinary**     | Image CDN      | 25 credits/month |
| **Hugging Face**   | ML Models      | 2vCPU, 16GB RAM  |
| **GitHub Actions** | CI/CD          | 2000 min/month   |

---

## Technical Functional Architecture (End-to-End)

This diagram details how the application's features interact from the client to the database and AI providers.

```mermaid
graph TB
    %% Definitions & Styling
    classDef client fill:#f96,stroke:#333,stroke-width:2px;
    classDef public fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef admin fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef background fill:#f5f5f5,stroke:#616161,stroke-width:2px;
    classDef storage fill:#e8eaf6,stroke:#283593,stroke-width:2px;
    classDef logic fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;

    %% Entry & Routing
    Client((User Browser)):::client -- HTTPS --> Router{React Router}:::logic

    %% Public Face
    subgraph "Public Face"
        Portfolio[Portfolio Home]:::public
        BlogList[Blog Listing]:::public
        BlogPost[Blog Post View]:::public

        Router -- "/" --> Portfolio
        Portfolio -- IntersectionObserver --> LazyLoad[Lazy Sections: About, Experience, Projects]:::public
        Portfolio -- ContactForm --> ContactAPI[api/contact.js]:::logic

        Router -- "/blogs" --> BlogList
        Router -- "/blogs/:slug" --> BlogPost

        BlogList & BlogPost -- Services --> HybridSvc[HybridBlogService]:::logic
    end

    %% Admin Engine Flow
    subgraph "Admin Intelligence Engine"
        Guard{Protected Route}:::logic
        AdminLogin[Admin Login]:::admin
        AdminLayout[Admin Sidebar Layout]:::admin
        Dashboard[Admin Dashboard]:::admin
        Analytics[Analytics Data]:::admin
        AI_Generator[AI Blog Creator]:::admin
        MessageCenter[Message Center]:::admin
        Editor[Manual Blog Editor]:::admin

        Router -- "/admin" --> Guard
        Guard -- JWT Check --> AdminLogin
        Guard -- Authorized --> AdminLayout

        AdminLayout --> Dashboard
        AdminLayout --> Analytics
        Analytics -- Fetch --> AnalyticsFetch[api/analytics/stats]:::logic

        Dashboard -- Sync Stats --> AnalyticsFetch
        Dashboard -- Unread Badge --> MsgFetch:::logic

        AdminLayout --> AI_Generator
        AI_Generator -- "Step 1: Planning" --> Blueprint[BlueprintBuilder]:::admin
        Blueprint -- "Step 2: Scaffolding" --> SecConfig[SectionConfigurator]:::admin
        SecConfig -- Trigger --> AIGenHook[useAIGenerator Hook]:::logic
        AIGenHook -- STREAM --> CerebrasAPI[api/ai/generate-blog-stream]:::logic
        CerebrasAPI -- Logic --> AI_Provider[Cerebras Llama 3.3]:::storage

        AI_Generator -- Save --> SaveMutation[useCreatePost Mutation]:::logic
        SaveMutation --> NeonWrite[api/blog/create]:::logic

        AdminLayout --> MessageCenter
        MessageCenter -- "GET /api/contact" --> MsgFetch[api/contact.js]:::logic
        MessageCenter -- "POST /api/contact/reply" --> ReplyAPI[api/contact_reply.js]:::logic

        AdminLayout --> Editor
        Editor -- MarkdownParsing --> MD_Lib[src/lib/markdown.js]:::logic
    end

    %% Storage & Infrastructure
    subgraph "Infrastructure & Persistence"
        NeonDB[(Neon PostgreSQL)]:::storage
        Cache[(PWA Cache Storage)]:::storage

        HybridSvc -- Primary --> NeonFetch[api/blog/fetch]:::logic
        HybridSvc -- Fallback --> StaticData[Local JSON Data]:::storage

        NeonFetch <--> NeonDB
        NeonWrite --> NeonDB
        ContactAPI -- Persist Inquiry --> NeonDB
        MsgFetch <--> NeonDB
        ReplyAPI -- Store Thread --> NeonDB
    end

    %% Background Systems
    subgraph "Background Systems"
        SW[Service Worker]:::background
        Tracker[AnalyticsTracker]:::background

        Client -- Registers --> SW
        SW -- Intercepts --> Cache
        Cache -- Fallback --> OfflineUI[offline.html]:::background

        Client -- Tracking --> Tracker
        Tracker --> AnalyticsAPI[api/analytics/log]:::logic
        AnalyticsAPI --> NeonDB
    end

    %% State Management
    ReactQuery{{React Query Cache}}:::logic <--> HybridSvc
    ReactQuery <--> SaveMutation
    ReactQuery <--> AnalyticsFetch
    ReactQuery <--> MsgFetch
```

### Architectural Color

| Color              | Layer / Type        | Description                                                |
| :----------------- | :------------------ | :--------------------------------------------------------- |
| **Orange (Round)** | **Client**          | The User's browser and interaction point.                  |
| **Light Blue**     | **Public Face**     | Components and views visible to all visitors.              |
| **Purple**         | **Admin Dashboard** | Protected features for content management and AI control.  |
| **Yellow**         | **Logic & API**     | Hooks, Services, and Serverless API endpoints.             |
| **Dark Blue**      | **Persistence**     | Databases, Cache systems, and fallback JSON sources.       |
| **Grey**           | **Operations**      | Service workers, tracking, and offline resilience systems. |

---

## 6. Environment & Prerequisites

### 6.1 Configuration (.env)

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Intelligence (Cerebras Llama 3.3)
CEREBRAS_API_KEY=your_key_here

# Intelligence (Gemini fallback)
GEMINI_API_KEY=your_key_here

# Security
JWT_SECRET=your_ultra_secure_secret
```

### 6.2 Setup

1. **Provision Neon**: Create a project and run SQL schemas found in `docs/database/`.
2. **Install**: Run `bun install`.
3. **Environment**: Sync `.env` with the keys above.
4. **Dev Mode**: Run `bun run dev` to start the frontend and local API concurrently.

## 7. Performance Standards

- **LCP Optimization**: `vite-imagetools` generates multi-resolution, modern `.webp` formats at build time.
- **State Efficiency**: React Query provides Stale-While-Revalidate (SWR) caching with 0ms perceived latency for returning users.
- **Rendering**: Critical components utilize `content-visibility: auto` to bypass off-screen rendering cycles.

---

Designed with Precision. Optimized for Intelligence.
