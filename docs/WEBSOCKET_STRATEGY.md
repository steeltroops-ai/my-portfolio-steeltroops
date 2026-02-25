# Real-Time Event-Driven Architecture (EDA) Strategy

## Intelligence Hub: WebSocket Implementation Plan (v2.0 - Production Architecture)

This document outlines the robust, end-to-end implementation to transform the Portfolio Admin suite from a polling-based system into a reactive, real-time command center.

---

## 1. Executive Summary

To achieve sub-100ms updates and eliminate the overhead of HTTP polling, we are implementing a **Nerve Center** (Persistent WebSocket Server). This system bridge's our stateless Vercel environment with the active Admin Client, enabling a bi-directional "live pulse."

| Feature                | Current Method            | Future (Real-Time)  | Protocol          |
| :--------------------- | :------------------------ | :------------------ | :---------------- |
| **Forensic Analytics** | Tanstack Query (30s)      | `TELEMETRY_SIGNAL`  | WS Push           |
| **Message Center**     | Manual Refresh            | `NEW_INQUIRY` Toast | WS Push           |
| **AI Post Gen**        | SSE (Blocking Connection) | `AI:STAGE_UPDATE`   | Bi-directional WS |
| **System Status**      | Static Loading            | `SERVER_METRICS`    | WS Stream         |

---

## 2. Technical Architecture & Security

### 2.1 The "Nexus Bridge" Pattern

Since Vercel Serverless functions (stateless) cannot maintain persistent WS connections, we use a dedicated **Socket Hub** (Node/Express/Socket.io) acting as a message broker.

1.  **Emitter**: Vercel API functions trigger events via an internal `EMIT_WEBHOOK` or Shared Redis/DB Bus.
2.  **Broker**: `server/socket-hub.js` (The Nerve Center) running on a persistent VPS/Container.
3.  **Subscriber**: `SocketContext.jsx` in the React frontend.

### 2.2 Security Shield (Handshake Level)

**Zero-Trust Implementation**: No socket connection is established without server-side validation.

- **Auth**: The Socket Hub MUST parse the `auth_token` from the HttpOnly cookie.
- **Validation**: Check token against the Neon Database `sessions` table during the `io.use` middleware handshake.
- **Scoping**: Use `Rooms`. Authenticated admins are joined to the `admin_vault` room; public telemetry is restricted.

---

## 3. Implementation Roadmap (The "Zero-Error" Path)

### Phase 1: The Nerve Center (Backend)

**Location**: `server/socket-hub.js`

- [ ] **Middleware**: Parse `req.headers.cookie` to find `auth_token`.
- [ ] **Database Verification**: Call `sql` (Neon) to verify session validity.
- [ ] **CORS**: Strictly allow your production domains + `localhost:5173`.
- [ ] **Initialization**: Bind to the existing HTTP server in `local-api.js`.

### Phase 2: React Infrastructure (Frontend)

**Location**: `src/shared/context/SocketContext.jsx`

- [ ] **Handshake**: Set `withCredentials: true` in the `io()` options to send browser cookies.
- [ ] **Reconnect Logic**: Exponential backoff (1s, 2s, 5s, 10s) with UI status indicator.
- [ ] **Global Listener**: `AdminLayout.jsx` should handle broad toast notifications.

### Phase 3: Proxy & Environment (Infrastructure)

**Location**: `vite.config.js`

- [ ] **Socket Proxy**: Ensure `/socket.io/` is proxied to `http://localhost:3001` with `ws: true`.
- [ ] **ENV Variables**: `VITE_SOCKET_URL` should point to the Hub endpoint.

---

## 4. Feature Implementation Blueprints

### 4.1 Live Analytics Pulse

- **Event**: `ANALYTICS:SIGNAL_EMIT`
- **Data**: `{ ip, city, action, timestamp }`
- **Logic**: In `Analytics.jsx`, use `queryClient.setQueryData(['analytics-stats'], (old) => merge(old, data))`.
- **Aesthetic**: Pulse animation on the "Live Visitors" counter.

### 4.2 AI "Non-Blocking" Generation

- **Event**: `AI:CHUNK_READY` / `AI:STAGE_COMPLETE`
- **Logic**:
  1. Admin clicks "Generate" -> API returns `202 Accepted`.
  2. Admin can navigate away; the socket pushes updates.
  3. UI shows a persistent "AI Generating..." float in the bottom corner of the dashboard.

---

## 5. Preventative Troubleshooting (The "Anti-Error" Guard)

| Potential Issue        | Prevention Mechanism                                                                        |
| :--------------------- | :------------------------------------------------------------------------------------------ |
| **Ghost Connections**  | Server-side `socket.on('disconnect')` triggers immediate session cleanup.                   |
| **Auth Expiry**        | Check token on every socket event; disconnect if session record is deleted in DB.           |
| **Proxy Mismatch**     | `vite.config.js` must handle `ws: true` for the socket upgrade to work locally.             |
| **Production Latency** | Use `transports: ['websocket']` primarily, with `polling` fallback for restricted networks. |

---

## 6. Real-Time UI/UX Vocabulary

To maintain the "May-OS" aesthetic, use these visual cues for real-time events:

- **Telemetry Signals**: Cyan binary pulse (subtle bg-flash).
- **Messages**: Purple glassmorphic slide-in from top-right.
- **System Health**: A tiny "pulsing dot" in the footer (Green=Uplinked, Red=Down).

---

Document Managed by Antigravity AI | Security Level: ALPHA
