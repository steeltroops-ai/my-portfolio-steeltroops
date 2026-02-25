# Engineering Log & Master Tactical Roadmap

This document serves as the absolute source of truth for all engineering techniques, architectural decisions, and performance optimizations. It is categorized strictly by domain surface area.

---

## 1. Portfolio Surface (Client Layer)

The public-facing portal is unconditionally optimized for First Contentful Paint (FCP), Search Engine Optimization (SEO), and fluid layout experiences (locked to 60fps targets).

### 1.1 Execution Matrix

| Sub-System                    | Execution Logic                                                                                                                                                          | Status                                             |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| **Viewport Prefetching**      | Employs `IntersectionObserver` to trigger lazy loading and data fetching for heavy components (Project Cards, Experience Timelines) strictly upon viewport intersection. | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Eager Paint Allocation**    | Synchronously mounts above-the-fold assets (Hero Section, Main Navbar) in the root layout to eliminate Cumulative Layout Shift (CLS) and visual pop-in.                  | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Progressive Disclosure**    | Implements `React.lazy` and `Suspense` for all below-the-fold content areas (About, Contact, complex animations), delaying JS payload extraction.                        | <span style="color:green">**[IMPLEMENTED]**</span> |
| **GPU Offloading**            | Offloads all critical layout animations to the GPU via Framer Motion, restricting mutations exclusively to `transform` and `opacity` properties.                         | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Binary Compression**        | Utilizes `vite-plugin-compression` to generate binary `.br` (Brotli) and `.gz` (Gzip) payloads at build time, significantly reducing network transit time.               | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Theme Engine**              | Persists global UI state via local storage, injecting dynamic `data-theme` attributes on the root DOM node for instantaneous Liquid Glass CSS transitions (Dark/Light).  | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Dynamic SEO Metadata**      | Intercepts route changes to inject customized OpenGraph tags, title schemas, and canonical URLs utilizing `react-helmet-async` for high-fidelity social link previews.   | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Bot Deflection (Honeypot)** | Embeds structurally hidden fields inside public Contact forms. Submissions attempting to populate these vectors are silently dropped at the serverless edge.             | <span style="color:green">**[IMPLEMENTED]**</span> |

### 1.2 Pipeline Roadmap

- **Blur-Up Asset Placeholders**: Integrate `vite-imagetools` to generate Base64 micro-thumbnails during the Vite build step. Mount Base64 string instantly on render and execute a CSS fade-transition into high-resolution `WebP` variants upon network resolution. <span style="color:orange">**[PLANNED]**</span>
- **Reduced Motion Queries**: Implement `(prefers-reduced-motion)` media query wrappers across the Framer Motion configuration to support system-level accessibility standards. <span style="color:orange">**[PLANNED]**</span>
- **WebGL Background Distortion**: Implement experimental Three.js/React-Three-Fiber fluid geometries that actively respond to cursor coordinates. <span style="color:orange">**[PLANNED]**</span>

---

## 2. Content Layer (Blog Architecture)

The content consumption layer is optimized for high-security, low-latency text delivery, and indexing algorithms.

### 2.1 Execution Matrix

| Sub-System                    | Execution Logic                                                                                                                                                                                                  | Status                                             |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| **Hybrid Memory Persistence** | Overrides standard browser caching natively with `cacheManager.js`. Stores full JSON payloads of blog posts in LocalStorage with strict TTL restrictions for zero-latency hydration.                             | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Dynamic AST Pipeline**      | Custom Abstract Syntax Tree (AST) parsing (`react-markdown`, `remark-gfm`, `rehype-highlight`) dynamically transforms static Markdown blocks into interactive React components (`GlassTable`, `CodeBlock`, etc). | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Vector Full-Text Search**   | Leverages PostgreSQL GIN-indexed `tsvector` columns on the Neon database for <50ms full-text fuzzy string matching across large document bodies.                                                                 | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Injection Guarding**        | Automatically sanitizes all dynamically injected markdown outputs via the AST engine, natively mitigating Cross-Site Scripting (XSS) vectors.                                                                    | <span style="color:green">**[IMPLEMENTED]**</span> |
| **CI SEO Orchestration**      | Node script (`scripts/generate-sitemap.js`) deployed via GitHub Actions to scan Database records and write the latest post slugs into public XML format automatically per deployment.                            | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Lexical Metrics**           | Computes absolute reading time metadata per document prior to database insertion based on standard Words-Per-Minute algorithms.                                                                                  | <span style="color:green">**[IMPLEMENTED]**</span> |

### 2.2 Pipeline Roadmap

- **Procedural Document Navigation**: Extract heading nodes (H1, H2, H3) automatically at runtime via the AST parser and map them to a dynamic, sticky scroll-spy navigation sidebar. <span style="color:orange">**[PLANNED]**</span>
- **Reading Position Memory**: Track `window.scrollY` on unloading post components and save it to LocalStorage. Restore user to exact scroll depth upon backward navigation. <span style="color:orange">**[PLANNED]**</span>
- **Code Block Execution Sandbox**: Integrate WebAssembly runtime modules to allow users to execute injected code blocks (JS, Rust) directly inside the browser viewport. <span style="color:orange">**[PLANNED]**</span>

---

## 3. Command Center (Admin Interface)

A highly secure, real-time command node separated topologically and logically from public endpoints.

### 3.1 Execution Matrix

| Sub-System                  | Execution Logic                                                                                                                                                                                          | Status                                             |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| **System Identity (PWA)**   | Injects `vite-plugin-pwa` combined with `site.webmanifest` to trigger native OS (desktop/mobile) standalone installations for a dedicated, chromeless administration UI.                                 | <span style="color:green">**[IMPLEMENTED]**</span> |
| **V2 Forensic Telemetry**   | Triangulates high-entropy, anonymized data arrays (WebGL Unmasked Renderers, Hardware Concurrency, Audio Hashes) via Serverless tracking endpoints for complex bot filtering and threat heatmaps.        | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Hardware Streaming**      | Executes Server-Sent Events (SSE) interfacing directly with Cerebras Inference endpoints (`llama3.1-8b`). Bypasses stateless lambda timeouts by holding persistent pipelines during Markdown generation. | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Real-Time WebSockets**    | Integrates an external Node WebSocket proxy (`server/socket-hub.js`) for firing core system events (`MESSAGES:NEW`, `ANALYTICS:LOG`) to the dashboard, functionally eliminating HTTP polling.            | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Zero-Trust Auth**         | Replaces third-party providers with direct Neon PostgreSQL checks utilizing pure `HttpOnly` cookie-based JWT verification logic at the edge router.                                                      | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Active Dashboard Sync**   | Binds `React Query` caches directly to WebSocket listeners. `queryClient.invalidateQueries` executes universally upon server signals (`ADMIN:POSTS_CHANGED`).                                            | <span style="color:green">**[IMPLEMENTED]**</span> |
| **Markdown Preview Engine** | Split-pane manual composition editor with live bi-directional rendering of the `.md` string into standard UI components.                                                                                 | <span style="color:green">**[IMPLEMENTED]**</span> |

### 3.2 Pipeline Roadmap

- **Retroactive Entity Fusion**: Resolve distinct WebGL hardware hashes to known real-world names upon any Contact Form submission, recursively retroactively updating all past "shadow" sessions mathematically. <span style="color:orange">**[PLANNED - HIGH]**</span>
- **Authorized Socket Handshakes**: Block unauthorized connections at the WebSocket middleware layer by injecting JWT validation routines directly into the socket upgrade parameters. <span style="color:orange">**[PLANNED]**</span>
- **Database Backup Scheduler**: Implement a Vercel Cron function that triggers `pg_dump` on the Neon database and saves the snapshot directly into an encrypted S3 bucket locally. <span style="color:orange">**[PLANNED]**</span>
- **Network Bandwidth Throttling UI**: Admin toggle that globally downgrades image loading logic (forcing WebP low-res limits everywhere) for rigorous remote 3G environmental testing. <span style="color:orange">**[PLANNED]**</span>

---

## 4. Documentation Ecosystem

Repository architectural specifications are consolidated into four root master files.

- `ARCHITECTURE.md`: Subsystems topology and cloud infrastructure.
- `PERFORMANCE.md`: FCP optimizations, Caching TTLS, and Service Worker configurations.
- `SECURITY_AND_INTELLIGENCE.md`: Analytics triangulation, SSE AI Pipelines, and WebSockets logic.
- `ENGINEERING_LOG.md`: Status indices and execution roadmaps.
