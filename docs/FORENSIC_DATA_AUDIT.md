# Forensic Data Audit & I.D. Expansion Protocol

> **System Analysis Report**  
> **Target System:** SteelTroops Analytics Engine  
> **Classification:** Deep Forensic / Identity Resolution  
> **Status:** AUDIT COMPLETE

---

## 1. Current Intelligence Inventory

_Data currently being harvested by the `AnalyticsTracker` and `forensics.js` subsystems._

### A. Network & Location Intelligence

| Data Point          | Source                     | Resolution           | Purpose                                            |
| ------------------- | -------------------------- | -------------------- | -------------------------------------------------- |
| **IP Address**      | `x-forwarded-for` / Socket | Household/Corporate  | Geolocation & ISP tracking.                        |
| **ISP / Carrier**   | `ip-api.com`               | Organization         | Detecting corporate proxies vs. residential lines. |
| **Organization**    | `ip-api.com`               | Entity Name          | Identifying specific companies visiting the site.  |
| **Geo-Coordinates** | `ip-api.com`               | Lat/Lon (City Level) | Physical mapping of threat actors.                 |
| **Network Type**    | `navigator.connection`     | 4G/WiFi/Unknown      | Context on connection stability and speed.         |

### B. Device DNA (Fingerprinting)

| Data Point       | Method               | Uniqueness   | Purpose                                                            |
| ---------------- | -------------------- | ------------ | ------------------------------------------------------------------ |
| **GPU Vendor**   | WebGL Unmasked       | High         | Distinguishes similar phone models (e.g., Apple GPU vs Adreno).    |
| **GPU Renderer** | WebGL Unmasked       | High         | Identifies specific chipsets & drivers.                            |
| **CPU Cores**    | Hardware Concurrency | Low          | Broad categorization of device power.                              |
| **Memory**       | Device Memory API    | Low          | RAM estimation (e.g., 8GB, 16GB).                                  |
| **Screen Res**   | `window.screen`      | Medium       | Display fingerprinting.                                            |
| **Canvas Hash**  | 2D Context Render    | **Critical** | Unique render signature based on browser/OS font rendering engine. |
| **Device Model** | Heuristics + UA      | High         | Identifying specific "iPhone 15 Pro Max" vs generic "iOS".         |

### C. Behavioral Telemetry

| Data Point       | Source                 | Purpose                                          |
| ---------------- | ---------------------- | ------------------------------------------------ |
| **Visitor ID**   | LocalStorage (Persist) | Long-term user tracking across sessions.         |
| **Session ID**   | SessionStorage (Temp)  | Single visit context tracking.                   |
| **Referrer**     | `document.referrer`    | Origin tracking (Where did they come from?).     |
| **UTM Tags**     | URL Parameters         | Campaign marketing attribution.                  |
| **Path History** | Router Events          | Full navigation breadcrumbs.                     |
| **Heartbeats**   | Interval Ping          | Accurate "Time on Site" & "Tabs Open" detection. |

---

## 2. Advanced Identity Expansion (Missing Capabilities)

_To achieve "God-View" over user identity, we must expand deeply into browser APIs and side-channel analysis._

### A. Hardware Audio Fingerprinting

- **Technique:** Create an `OfflineAudioContext`, generate an oscillator tone, and accept the compressed audio data.
- **Why:** Browser audio stacks process floating point math differently. This is **highly unique** to the machine's hardware + browser version, often more stable than Canvas fingerprinting.
- **Implementation:** Add `audio.js` to forensics module.

### B. WebRTC Local IP Leak

- **Technique:** Open a WebRTC data channel and parse the ICE candidates.
- **Why:** Can sometimes leak the **Local LAN IP** (e.g., `192.168.1.105`) or even a real IP behind a VPN/Proxy if the VPN is poorly configured.
- **Value:** Detects if multiple "different" users are actually on the same local physical network.

### C. Battery API Telemetry

- **Technique:** `navigator.getBattery()`
- **Data:** Charging Status, Charging Time, Discharging Time, Level (0.0 - 1.0).
- **Why:** High entropy when combined. If two "different" visitors both have exactly `0.56` battery and are `charging` at the same second, they are the same device.

### D. Font Enumeration

- **Technique:** Measure width of text strings using fallback fonts.
- **Why:** Detecting installed fonts (like Adobe Suite fonts, Developer fonts like 'Fira Code', or specific Language Packs) creates a near-unique signature for developer/designer identification.

### E. Social / Login Presence (Side-channel)

- **Technique:** Requesting hidden images/resources from common authenticated services (Gmail, FB, GitHub) and timing the response.
- **Why:** "Is this user logged into GitHub?" -> Yes = Likely Developer. "Is logged into Facebook?" -> Yes = Likely Consumer.
- **Risk:** Aggressive; browser security policies fight this actively.

---

## 3. Codebase Vulnerabilities & Socket Flaws

_Critical areas requiring immediate hardening._

### A. Socket Connection Instability

- **Issue:** The `SocketContext.jsx` initializes connection on mount. In React Strict Mode (Dev), this double-mounts, causing `disconnect` to fire immediately on the first instance while the second connects, leading to "WebSocket closed before connection established" errors.
- **Fix:** Use a `useRef` to track the strict-mode initialization and ensure we only connect _once_ or properly clean up without race conditions.
- **Status:** **[PATCHED]** (As of latest session).

### B. Database Input Validation (Security Risk)

- **File:** `server/api/analytics/track.js` / SQL Queries.
- **Issue:** Inputs like `userAgent`, `gpu_renderer`, or `fingerprint` are passed directly into SQL templates. While `postgres` libraries often parameterize, `localStorage` can be manipulated by the user.
- **Exploit:** A user could manually edit their LocalStorage `visitor_id` to `some-malicious-string` or simply delete it constantly to generate infinite "new" profiles (Database DDoS).
- **Fix:** Implement `zod` schema validation on the server-side before `INSERT`.

### C. Serverless vs. WebSocket Hub

- **File:** `server/api/analytics/track.js` -> `import("../../socket-hub.js")`
- **Issue:** The tracking endpoint tries to dynamically import a socket hub. In a serverless environment (Vercel/Netlify), the WebSocket server process **does not exist** in the same runtime. This emit will fail silently or throw errors in production logs.
- **Fix:** Decouple the "Real-time" broadcast. The track endpoint should write to DB. The Dashboard should listen to DB changes (via Supabase Realtime or Polling) OR use a dedicated external Socket server (Ping/Pong) rather than trying to import strict server files into a serverless function.

---

## 4. Proposed "Identity Matrix" Tables

_New database structures to correlate and expose hidden relationships._

### A. Table: `identity_clusters`

_Map relations between different Visitor IDs that share fingerprints._

```sql
CREATE TABLE identity_clusters (
    cluster_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fingerprint_hash VARCHAR(255),
    ip_subnet VARCHAR(50),
    confidence_score FLOAT, -- 0.0 to 1.0
    detected_at TIMESTAMP DEFAULT NOW()
);
-- If Visitor A and Visitor B have same Fingerprint but different IDs, link them to the same Cluster.
```

### B. Table: `behavioral_biometrics`

_Store physical movement data._

```sql
CREATE TABLE behavioral_biometrics (
    session_id VARCHAR(255),
    avg_mouse_velocity FLOAT,
    click_dead_zones BOOLEAN, -- Machine-perfect center clicks?
    scroll_linearity FLOAT, -- Human scroll is non-linear
    typing_cadence FLOAT, -- ms between keystrokes
    is_human_verified BOOLEAN
);
```

### C. Table: `network_reputation`

_History of IP addresses._

```sql
CREATE TABLE network_reputation (
    ip_address INET PRIMARY KEY,
    hosting_provider VARCHAR(255),
    vpn_detected BOOLEAN,
    threat_score INT,
    first_seen TIMESTAMP,
    associated_users INT
);
```

### D. Table: `known_entities` (Real Life Mapping)

_The "God Mode" table._

```sql
CREATE TABLE known_entities (
    entity_id UUID PRIMARY KEY,
    real_name VARCHAR(255),
    linkedin_url VARCHAR(255),
    associated_fingerprints TEXT[], -- Array of hardware hashes linked to this person
    associated_ips INET[], -- Array of Home/Work IPs
    notes TEXT
);
```

---

## 5. UI/Component Analysis & Critique

_Critical review of current `Analytics.jsx` components vs. Intelligence Value._

### A. The "Behavioral Stream" (City Ticker)

- **Current State:** Displays a raw feed of `City` + `Event Type` (e.g., "New York / page_view").
- **Verdict:** **Low Intelligibility.** Knowing "Someone in New York clicked" 50 times in a row creates noise, not intel. It fails to tell a story or link actions to a specific actor.
- **Fix:** **Convert to "Active Session Columns".**
  - Instead of a single vertical stream, show active users as horizontal "swimlanes".
  - **Column 1:** User Entity (e.g., "iPhone 15, Verizon ISP, Boston").
  - **Column 2:** Real-time Action Breadcrumbs (Home -> Blog -> Contact).
  - _Why?_ You see the **journey**, not just the noise.

### B. The "World Map" (Visuals vs. Data)

- **Current State:** Beautiful 3D globe.
- **Issue:** It's "Eye Candy". It shows _where_, but not _who_ or _threat level_.
- **Fix:** **Threat Heatmap Layer.**
  - Color-code points by **Risk Score**.
  - **Red:** Python Script / Data Center IP.
  - **Green:** Local residential ISP (Comcast/Verizon) + Verified Canvas Hash.
  - **Blue:** Known Recruiter / Company IP.

### C. "Forensic Identity Matrix" (The Table)

- **Current State:** Good data, but disjointed.
- **Issue:** You have to click to see deep details. "Entity Signature" is often just a Country/City.
- **Fix:** **"One-Glance" Fingerprint Row.**
  - Merge `OS` + `Browser` + `GPU` into a **"Device Class"** icon (e.g., "High-End Gaming PC" vs "Budget Android").
  - Show **"Return Rate"**: "5th visit this month".
  - Show **"Identity Probability"**: "90% match to [LinkedIn Profile X]".

### D. "Metric Cards" (Active Nodes)

- **Current State:** Generic counters.
- **Fix:** **Intelligence Ratios.**
  - Replace "Active Nodes" with **"Human:Bot Ratio"**.
  - Add "Recruiter Watch": Count of visits from Corporate Networks.

---

## 6. Bot Detection & Intelligence Strategy

_Current logic is `Regex`-based (weak). We need `Behavioral` (strong)._

### A. Current Flaw: Static User-Agent Parsing

- **Code:** `server/api/analytics/track.js` uses a list (`['bot', 'crawler', 'headless', ...]`).
- **Exploit:** Any Python script can set `User-Agent: Mozilla/5.0 (Windows NT 10.0...)` and bypass this instantly. 90% of modern scrapers do this.
- **Reality:** You are currently marking "Smart Bots" as Humans.

### B. Strategy 1: The "Honeypot" Field (Frontend)

- **Implementation:** Add a hidden input field (`<input name="website_url" style={{display:'none'}} />`) to every form.
- **Logic:**
  - Real users **never** see or fill this.
  - Bots (looking for input fields) **always** fill this.
  - **Action:** If filled -> Immediate **Permanent Ban** (IP Blacklist).

### C. Strategy 2: Mouse/Touch Entropy (Biometrics)

- **Logic:**
  - **Bots:** Zero mouse movement, or perfect straight lines (Box A to Box B), or instantaneous clicks (0ms delay).
  - **Humans:** Micro-jitters, curved paths, variable click duration (50ms - 200ms).
- **Library:** Implement `fingerprintjs` (Pro version concepts) or custom entropy calculator.
- **Metric:** `entropy_score`. If active < 0.1 -> **Bot**.

### D. Strategy 3: "Time-to-Interaction"

- **Logic:**
  - A user cannot load a page and click "Contact" in 10ms.
  - **Rule:** If `(Event Timestamp - Page Load Timestamp) < 500ms` -> **Script**.

### E. Strategy 4: Network Type + IP Reputation

- **Logic:**
  - Real users are on `wifi` or `cellular`.
  - Bots are on `unknown` or Data Center ranges (AWS, DigitalOcean).
- **API:** Use `AbuseIPDB` or `IPQualityScore` free tiers to check generic IP reputation on first visit.

---

## 7. Unified "God Mode" UI Concept

_How to show "All Info in One Go"._

**The "Entity Dossier" View:**

> _Replace the current generic list with a "Card Stack" layout._

1. **Header:** **"The Suspect"** (Auto-generated Alias: "Crimson-MacBook-Boston")
2. **Top Row (The Fingerprint):**
   - `iPhone 15 Pro` | `iOS 17.4` | `Verizon Wireless` | `Battery: 64% (Charging)`
3. **Middle Row (The Behavior):**
   - "Scrolled 40% of Blog Post 'AI-Arch'"
   - "Highlights text often (Researcher pattern)"
   - "Copied email address to clipboard"
4. **Bottom Row (The History):**
   - "First seen: 3 days ago via [Google Search]"
   - "Total Time: 45m"
   - "Risk: LOW (Verified Human)"

**Action:**

- Refactor `Analytics.jsx` to select an entity and expand this **Dossier Panel** covering 50% of the screen, pulling live updates via Socket.
