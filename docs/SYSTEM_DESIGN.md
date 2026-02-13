# Portfolio Platform: System Design & Data Foundations

This document details the architectural patterns, component hierarchies, and data orchestration strategies utilized within the Portfolio Platform.

---

## 1. System Architecture Overview

The platform integrates Client (Browser), Edge Network (Vercel), and Persistence/Intelligence services (Cerebras, Neon).

```mermaid
graph TB
    subgraph Client ["🖥️ Client Layer (Browser)"]
        UI[React 19 / Vite]
        Store[React Query / SWR Cache]
        Router[React Router v7]
    end

    subgraph Edge ["☁️ Edge / Serverless Layer (Vercel)"]
        WAF[Web Application Firewall]
        Gatekeeper[scripts/vercel-ignore.js]
        API_GW[JSON/SSE API Gateway]

        auth_fn["/api/auth"]
        blog_fn["/api/posts"]
        ai_fn["/api/ai/generate-blog-stream"]
        contact_fn["/api/contact"]
    end

    subgraph Data ["🗄️ Intelligence & Persistence"]
        DB[(Neon PostgreSQL)]
        LLM_Primary[Cerebras Llama 3.3]
        LLM_Backup[Google Gemini 1.5]
        Assets[vite-imagetools Assets]
    end

    %% Flows
    UI -->|HTTPS| WAF
    WAF -->|Validated| Gatekeeper
    Gatekeeper --> API_GW
    API_GW --> auth_fn
    API_GW --> blog_fn
    API_GW --> ai_fn

    ai_fn -->|SSE Stream| UI
    ai_fn -->|Inference| LLM_Primary
    ai_fn -.->|Fallback| LLM_Backup

    blog_fn <--> DB
    auth_fn <--> DB
```

---

## 2. Component Hierarchy

The application follows a domain-driven structure to isolate public portfolio assets from administrative control systems.

```mermaid
graph TD
    Root[("root (index.html)")] --> Main[Main.jsx]
    Main --> AppProvider[Helmet + QueryClient]
    AppProvider --> Router[Router Provider]

    Router --> Layout["RootLayout"]

    Layout --> Navbar[Navbar]
    Layout --> Content{Outlet}
    Layout --> Footer[Footer]

    %% Routes
    Content --> RouteHome[Portfolio Home]
    Content --> RouteBlog[Blog Listing]
    Content --> RouteAdmin[Admin Dashboard]

    %% Portfolio Modules
    RouteHome --> Hero[Dynamic Hero]
    RouteHome --> Projects[HD Image Showcase]
    RouteHome --> Section2[Fluid Grid Layout]

    %% Admin Intelligence
    RouteAdmin --> Protected[Protected Route]
    Protected --> AdLayout[Admin Layout]

    AdLayout --> AIGen[AI Intelligence Engine]
    AIGen --> Blueprint[BlueprintBuilder]
    AIGen --> Preview[SSE Streaming Preview]

    AdLayout --> Analytics[Visitor Analytics]
    AdLayout --> Messages[Message Center]
```

---

## 3. Data Flow: AI Generation

The system utilizes a streaming-first architecture to manage long-running inference tasks.

### 3.1 SSE Streaming Pipeline

- **Challenge**: Comprehensive technical content generation often exceeds standard serverless timeout limits (e.g., Vercel's 30-second cap).
- **Solution**: **Server-Sent Events (SSE)**. A persistent connection allows incremental data flushing as the Cerebras engine generates content.

```mermaid
sequenceDiagram
    participant UI as Admin Client
    participant API as Vercel Edge (SSE)
    participant AI as Cerebras Llama 3.3
    participant DB as Neon DB

    UI->>API: POST /api/ai/generate-blog-stream {topic, blueprint}

    Note over API, AI: Stage 1: Structure Resolution
    API->>AI: Generate JSON Blueprint
    AI-->>API: Blueprint Content
    API-->>UI: event: outline_complete

    Note over API, AI: Stage 2: Content Streaming
    loop Parallel/Sequential Writing
        API->>AI: Write Section (Context Injected)
        AI-->>API: Markdown Stream
        API-->>UI: event: section_chunk (incremental)
    end

    Note over API, AI: Stage 3: Finalization
    API->>DB: INSERT into blog_posts (Draft)
    API-->>UI: event: generation_complete
```

---

## 4. Project Structure

```text
my-portfolio-steeltroops/
├── api/                            # Vercel Serverless (JSON/SSE)
├── docs/                           # Knowledge Repository
│   ├── database/                   # SQL & Schema definitions
│   ├── archive/                    # Historical logs
│   └── *.md                        # Architectural Blueprints
├── scripts/                        # CI/CD & DevOps Automation
├── src/                            # React Application Core
│   ├── features/                   # Domain Modules (Admin, Blog, Portfolio)
│   ├── shared/                     # Shared UI/Logic (Components, Hooks, Lib)
│   └── constants/                  # Configuration & Tokens
└── public/                         # PWA Assets & SEO Metadata
```

---

## 5. Persistence Strategy

The database is configured for transactional integrity and optimized full-text search.

### 5.1 Schema Definitions

- **POSTS**: Features `tsvector` columns for high-speed GIN-indexed searching. Includes `generation_status` for tracking AI progress.
- **CONTACT_MESSAGES**: Relational threads for admin-to-user communication.
- **ANALYTICS**: Aggregated visitor data (Device, Duration, Entry Path).

---

## 6. Performance & Security

### 6.1 Build-Time Optimization

We leverage **Vite** and **Terser** to ensure the production bundle is minimal. **`vite-imagetools`** handles the heavy lifting of multi-resolution asset generation during the CI build phase.

### 6.2 Deployment Pipeline

Our `vercel-ignore.js` script enforces a "Code-Only" deployment policy. If a developer only modifies documentation in `docs/**`, the Vercel build will automatically abort, signaling "Success" without consuming build minutes or creating redundant deployment snapshots.

### 6.3 Security Implementation

- **CSP**: Restricted Content Security Policy enforced via `vercel.json`.
- **Injection Protection**: All database interactions use parameterized queries via the Neon serverless driver.
- **State Integrity**: React Query handles all async state, preventing race conditions during rapid navigation.

---

Technical Excellence. Absolute Consistency.
