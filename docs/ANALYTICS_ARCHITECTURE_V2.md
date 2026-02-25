# Analytics Architecture: Forensic Intelligence V2

## 1. System Overview

The **Forensic Intelligence Engine** (System V2) replaces standard session counting with deep-layer identity synthesis. It ingests high-entropy hardware signals to de-anonymize traffic, correlating disparate sessions into unified **Entity Dossiers**.

### Primary Objectives

- **De-anonymization**: Resolve anonymous sessions to real-world identities via forensic triangulation.
- **Bot Elimination**: Filter automated traffic using behavioral entropy and hardware verification.
- **Persistent Tracking**: Maintain strict identity continuity across browser restarts, incognito modes, and IP changes.

---

## 2. Intelligence Architecture

The system operates on a unidirectional data flow from client-side extracting to server-side resolution.

```mermaid
graph TD
    subgraph "Client Layer (The Probe)"
        User[Visitor Client]
        Forensics[forensics.js]
        Biometrics[Entropy Sensors]
    end

    subgraph "Ingestion Layer"
        API[Next.js API Routes]
        Socket[WebSocket Hub]
    end

    subgraph "Resolution Engine (The Brain)"
        HardwareHash[Hardware Fingerprinter]
        threat[Threat Matrix]
        Resolver[Entity Resolver]
    end

    subgraph "Persistence Layer"
        DB[(Neon PostgreSQL)]
        Cache[(Redis/Cache)]
    end

    User -->|Load| Forensics
    Forensics -->|Extract| HardwareHash
    User -->|Interact| Biometrics
    Biometrics -->|Stream| Socket

    HardwareHash -->|Secure Payload| API
    API -->|Validation| threat
    threat -- Verified --> Resolver
    threat -- Bot Detected --> Blackhole[Reject]

    Resolver -->|Query| DB
    Resolver -->|Update| Cache

    DB -->|Visual Feed| Dashboard[Admin Entity Dossier]
```

---

## 3. Forensic Data Ingestion

The `forensics.js` module extracts immutable hardware characteristics and network telemetry to generate a unique **Device Hash**.

### 3.1 Hardware DNA Signals

High-entropy signals used for generating the **Euclidean Identity (EU ID)**.

| Signal Class  | Metric                | Entropy      | Technical Purpose                                                                              |
| :------------ | :-------------------- | :----------- | :--------------------------------------------------------------------------------------------- |
| **Graphics**  | `UNMASKED_RENDERER`   | High         | Identifies specific GPU silicon (e.g., "Apple M2 Pro", "NVIDIA RTX 4090").                     |
| **Rendering** | Canvas Hash           | **Critical** | Renders hidden 2D primitives. Differences in anti-aliasing engines create a unique hash.       |
| **Audio**     | Audio Context         | High         | Oscillator tone generation. Floating-point math variations create a unique acoustic signature. |
| **Compute**   | `hardwareConcurrency` | Low          | CPU Core count. Used for broad categorization.                                                 |
| **Memory**    | `deviceMemory`        | Low          | RAM estimate (e.g., 8GB).                                                                      |

### 3.2 Silent Location Intelligence

Non-invasive triangulation of physical location without permission popups.

| Metric       | Source                | Logic                                                                                     |
| :----------- | :-------------------- | :---------------------------------------------------------------------------------------- |
| **Timezone** | `Intl.DateTimeFormat` | System timezone (e.g., `America/New_York`). Cross-referenced with IP for VPN detection.   |
| **Locale**   | `navigator.languages` | Preferred language stack (e.g., `en-US, ja-JP`). Reveals user origin.                     |
| **Platform** | `navigator.platform`  | OS Kernel ID (e.g., `Win32`, `MacIntel`).                                                 |
| **Network**  | `connection.downlink` | Bandwidth estimation. Distinguishes Fiber (High stability) from Cellular (High varience). |

---

## 4. Identity Resolution Logic ("God Mode")

The system uses a **Retroactive Linkage Strategy** to bind anonymous hardware hashes to known identities.

### 4.1 The Resolution Workflow

```mermaid
sequenceDiagram
    participant Anon as Anonymous User
    participant System as Resolution Engine
    participant DB as Database
    participant Admin as Admin Dashboard

    Note over Anon: Step 1: The Shadow
    Anon->>System: Session Start (IP: 192.168.1.1)
    System->>System: Generate Fingerprint (Hash: X9Y2Z)
    System->>DB: Log Session (Visitor_ID: V-123)

    Note over Anon: Step 2: The Action
    Anon->>System: Submit Contact Form ("Alice Smith")

    Note over System: Step 3: The Binding
    System->>DB: CREATE Known_Entity ("Alice Smith")
    System->>DB: LINK Hash X9Y2Z to "Alice Smith"

    Note over System: Step 4: Retroactive Fusion
    System->>DB: UPDATE all sessions WHERE Hash=X9Y2Z
    DB-->>System: 4 Past Sessions Found
    System->>DB: SET Entity = "Alice Smith"

    System->>Admin: Push Update (Alice Smith: VIP)
```

### 4.2 Entity States

1.  **Shadow (Anonymous)**: Tracked via Hardware Hash. No name.
2.  **Suspect**: High return rate, developer-like behavior, no name.
3.  **Known Entity**: Linked to real-world identity via Contact Form, Email Click, or Login.

---

## 5. Automated Defense Matrix

Traffic is filtered through a hierarchical bot defense system before analytics are recorded.

### 5.1 Defense Layers

1.  **Honeypot (`_hp`)**: Hidden form field. If populated -> **Immediate Rejection**.
2.  **Velocity Check**: Time-to-Interaction analysis. Submissions < 500ms -> **Blocked**.
3.  **Entropy Analysis**:
    - **Bot**: Linear mouse movement, constant scroll speed, instant clicks.
    - **Human**: Curvilinear movement, variable acceleration, micro-jitters.

---

## 6. Data Persistence Schema

The database schema supports the storage of complex entity relationships.

```mermaid
erDiagram
    KNOWN_ENTITY ||--o{ IDENTITY_CLUSTER : "is identified in"
    KNOWN_ENTITY {
        uuid entity_id PK
        string real_name
        string role
        string linkedin_url
    }

    IDENTITY_CLUSTER ||--|{ FINGERPRINT_DNA : "contains"
    IDENTITY_CLUSTER {
        uuid cluster_id PK
        float confidence_score
    }

    FINGERPRINT_DNA ||--o{ VISITOR_PROFILE : "generates"
    FINGERPRINT_DNA {
        string hash_id PK
        string gpu_renderer
        string canvas_hash
        string audio_hash
    }

    VISITOR_PROFILE ||--|{ VISITOR_SESSION : "initiates"
    VISITOR_PROFILE {
        uuid visitor_id PK
        string ip_address
        string timezone_name
        string languages
        float network_downlink
    }

    VISITOR_SESSION ||--o{ BEHAVIORAL_METRICS : "analyzed by"
    BEHAVIORAL_METRICS {
        bigint id PK
        float mouse_velocity
        float scroll_entropy
        bool is_bot
    }
```

---

## 7. Visualization Interface

The **Admin Dashboard** exposes this data via specific "God Mode" components.

### 7.1 Entity Dossier (`EntityDossier.jsx`)

A forensic detail panel.

- **Location Intelligence**: Displays IP City vs. System Timezone.
- **Hardware DNA**: Raw GPU and Renderer strings.
- **Visual Timeline**: Vertical stream of user interactions (Clicks, Views).

### 7.2 Active Swimlanes (`ActiveSwimlane.jsx`)

Real-time session monitor.

- **Live Progress**: Visual progress bar based on session duration.
- **Status Indicators**: `LIVE` vs `IDLE` based on heartbeat telemetry.
- **Journey Breadcrumbs**: Displays `last_path` and `action_count`.

---

## 8. Implementation Reference

### Key Files

- **Ingestion**: `src/shared/analytics/forensics.js`
- **API Handler**: `server/api/analytics/track.js`
- **Resolution**: `server/api/contact.js`
- **Visualization**: `src/features/admin/components/EntityDossier.jsx`

### Configuration

- **Socket Hub**: `server/socket-hub.js` (Handles real-time telemetry).
- **Rate Limits**: `50 req/min` for tracking endpoints.
