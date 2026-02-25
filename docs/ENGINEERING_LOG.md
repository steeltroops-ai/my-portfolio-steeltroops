# Comprehensive Engineering Log & Master Roadmap

This document serves as the absolute source of truth for all engineering techniques, architectural decisions, and performance optimizations implemented across the portfolio platform. It is categorized strictly by domain surface area.

## Status Classifications
- **[IMPLEMENTED]**: Currently active and functioning in production.
- **[PLANNED] / [HIGH PRIORITY] / [MEDIUM PRIORITY]**: Scheduled for future integration.

---

## 1. Domain: Home Page / Portfolio Surface

The public-facing portfolio is strictly optimized for First Contentful Paint (FCP), SEO, and fluid aesthetic experiences (60fps targets).

### 1.1 Implemented Techniques

- **Viewport-Based Prefetching (Intersection Observer)** **[IMPLEMENTED]**
  - **Technique**: Utilizing `IntersectionObserver` to monitor when heavy sections (like detailed Project Cards or Experience Timelines) enter the viewport, triggering lazy loading and data fetching only at the exact moment of need.
  - **Impact**: drastically reduces the initial JavaScript payload.

- **Eager Loading Critical Components** **[IMPLEMENTED]**
  - **Technique**: Direct synchronous inclusion of above-the-fold assets (Hero Section, Main Navbar, Global Controls) in the root layout.
  - **Impact**: Prevents cumulative layout shift (CLS) and visual "pop-in" anomalies.

- **Lazy Loading Non-Critical Sections** **[IMPLEMENTED]**
  - **Technique**: Utilizing `React.lazy` and `Suspense` for secondary features like About, Contact, and below-the-fold heavy animations.

- **Hardware-Accelerated Fluid Animations** **[IMPLEMENTED]**
  - **Technique**: Offloading layout animations to the GPU via Framer Motion, specifically targeting `transform` and `opacity` properties.

- **Brotli & Gzip Payload Compression** **[IMPLEMENTED]**
  - **Technique**: Usage of `vite-plugin-compression` to create `.br` and `.gz` binary compressed formats of JS/CSS chunks at build time.

### 1.2 Planned Enhancements

- **Blur-Up Asset Placeholders** **[PLANNED - MEDIUM]**
  - **Technique**: Leveraging `vite-imagetools` to generate Base64 microscopic thumbnails that load instantly and CSS-transition smoothly into the full high-res `WebP` variants.
  - **Goal**: Perfect visual continuity even on cellular connections.

---

## 2. Domain: Blogs / Content Layer

The content consumption layer is optimized for high-security, lightning-fast text delivery, and indexability.

### 2.1 Implemented Techniques

- **Hybrid Persistence Strategy with LocalStorage TTL** **[IMPLEMENTED]**
  - **Technique**: Complex `cacheManager.js` logic overriding browser defaults to store full JSON payloads of blog posts directly in LocalStorage with time-to-live restrictions.
  - **Impact**: Zero-latency reads for returning visitors (cache-first hydration), gracefully failing back to network requests and `React Query`.

- **Markdown-to-Component Rendering Pipeline** **[IMPLEMENTED]**
  - **Technique**: Custom AST parsing using `react-markdown`, `remark-gfm`, and `rehype-highlight` that dynamically transforms arbitrary AI/Admin markdown code blocks into interactive React components (`GlassTable`, `CodeBlock`, `SmartBlockquote`).

- **Secure Content Delivery (Injection Guarding)** **[IMPLEMENTED]**
  - **Technique**: All dynamically injected blog outputs are strictly sanitized by the markdown AST engine, natively mitigating Cross-Site Scripting (XSS).

- **Automated Sitemap Generation** **[IMPLEMENTED]**
  - **Technique**: A Node script (`scripts/generate-sitemap.js`) deployed via GitHub Actions to scan Neon DB and write the absolute latest post slugs into the public XML format.

### 2.2 Planned Enhancements

- **Smart Table of Contents Extraction** **[PLANNED]**
  - **Technique**: Dynamic heading extraction at runtime mapped to an interactive sticky scroll-spy navigation.

---

## 3. Domain: Admin Control Center

The admin panel is treated as a highly secure, real-time command node separated topologically and logically from the public endpoints.

### 3.1 Implemented Techniques

- **Progressive Web App (PWA) Standalone Mode** **[IMPLEMENTED]**
  - **Technique**: Injection of `vite-plugin-pwa` combined with a specialized `site.webmanifest`. The Admin Sidebar includes an event listener for `beforeinstallprompt` to trigger native OS installations.
  - **Impact**: Delivers a mobile app-like, chromeless desktop/mobile experience reserved for the site owner.

- **Forensic Behavioral Telemetry (V2 Analytics)** **[IMPLEMENTED]**
  - **Technique**: Triangulating deeply anonymized data via WebGL Unmasked Renderers, Hardware Concurrency, and Locale Timezones. Cross-referencing it via Postgres (`server/api/analytics/track.js`).
  - **Impact**: Bot filtering without CAPTCHAs and highly accurate threat-heatmaps in the admin dashboard.

- **AI Content Engine with SSE Streaming** **[IMPLEMENTED]**
  - **Technique**: Execution of Server-Sent Events (SSE) interfacing with Cerebras hardware (`llama3.1-8b`). Bypasses stateless lambda timeouts by holding a persistent connection during multi-stage JSON outline + Markdown generation.

- **WebSocket Pulse Synchronization** **[IMPLEMENTED]**
  - **Technique**: Integration of an external Node WebSocket hub (`server/socket-hub.js`) for pushing system events (`MESSAGES:NEW`, `ANALYTICS:LOG`) down to the admin dashboard instantly.
  - **Impact**: Live, reactive user interfaces without the extreme overhead of HTTP short-polling.

- **Hybrid Authentication** **[IMPLEMENTED]**
  - **Technique**: Replacing Supabase with Neon PostgreSQL using secure `HttpOnly` cookie-based JWT verification (`server/api/utils.js`).

### 3.2 Planned Enhancements

- **Identity De-Anonymization (God Mode)** **[PLANNED - HIGH]**
  - **Technique**: Linking disparate WebGL hashes to known real names if they ever submit the Contact Form, recursively updating the analytics DB to map past "shadow" sessions to the new entity.

- **Advanced WebSocket Security Constraints** **[PLANNED]**
  - **Technique**: Implementing strict room-based routing attached directly to the JWT token handshake.

---

## 4. Documentation Ecosystem Audit

The repository documentation has been strictly pruned and categorized:

**Active Technical Specs (Keep & Sync with Git):**
- `ARCHITECTURE.md` - System blueprint, structural architecture.
- `AI_SYSTEM_DESIGN.md` - The persona specification and CoT implementation flow.
- `ANALYTICS_ARCHITECTURE_V2.md` - Forensic ingestion and biometrics logic.
- `FORENSIC_DATA_AUDIT.md` - Exhaustive audit of hardware footprint capabilities.
- `SYSTEM_DESIGN.md` - Diagrammatic data-flow components.
- `CACHING.md` - Vercel CDN -> Browser SW TTL flow documentation.
- `WEBSOCKET_STRATEGY.md` - Nerve center socket topologies.

**Deprecated / Archival Specs:**
- `docs/archive/NEON_MIGRATION.md` - Maintained purely for historical log reference.
- `docs/database/migration_001_align_schema.sql` - Legacy raw operational SQL.

Every currently exposed `.md` file in `docs/` is active, verified, and represents the Production reality.
