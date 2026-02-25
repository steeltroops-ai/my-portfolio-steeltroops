-- Analytics V2 "God Mode" Schema Migration
-- Adds tables for deeper identity resolution, hardware fingerprinting, and behavioral biometrics
-- PRESERVES existing visitor_profiles and visitor_sessions tables

-- 1. Known Entities (The "Real Person" Link)
CREATE TABLE IF NOT EXISTS known_entities (
    entity_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    real_name VARCHAR(255),
    email VARCHAR(255) UNIQUE, 
    linkedin_url VARCHAR(255),
    role VARCHAR(100), -- e.g., "Recruiter", "Developer", "Threat Actor"
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Hardware Fingerprint DNA (Immutable Device Signatures)
CREATE TABLE IF NOT EXISTS fingerprint_dna (
    hash_id VARCHAR(255) PRIMARY KEY, -- GPU + Canvas + Audio Hash
    gpu_vendor VARCHAR(255),
    gpu_renderer VARCHAR(255),
    screen_resolution VARCHAR(50),
    audio_context_hash VARCHAR(255),
    cpu_cores INT,
    memory_gb INT,
    is_vpn_suspect BOOLEAN DEFAULT FALSE,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW()
);

-- 3. Identity Clusters (Linking multiple Profiling IDs to one Fingerprint)
CREATE TABLE IF NOT EXISTS identity_clusters (
    cluster_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fingerprint_hash VARCHAR(255) REFERENCES fingerprint_dna(hash_id),
    primary_entity_id UUID REFERENCES known_entities(entity_id), -- Optional link to real person
    confidence_score FLOAT DEFAULT 0.0, -- 0.0 to 1.0 likelihood of successful ID
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Behavioral Biometrics (Mouse/Keyboard Patterns for Bot Detection)
CREATE TABLE IF NOT EXISTS behavioral_biometrics (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255), -- Links to existing visitor_sessions
    avg_mouse_velocity FLOAT,
    click_dead_zones BOOLEAN, -- Machine-perfect center clicks?
    scroll_linearity FLOAT, -- Human scroll is non-linear (0.0 = perfect linear bot)
    typing_cadence_ms FLOAT, -- Average ms between keystrokes
    entropy_score FLOAT, -- Randomness of movement (Low = Bot)
    is_bot_verified BOOLEAN DEFAULT FALSE,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- 5. Network Reputation (IP Intelligence)
CREATE TABLE IF NOT EXISTS network_reputation (
    ip_address INET PRIMARY KEY,
    isp_name VARCHAR(255),
    is_hosting_provider BOOLEAN DEFAULT FALSE, -- AWS, DigitalOcean, etc.
    is_corporate_proxy BOOLEAN DEFAULT FALSE,
    threat_score INT DEFAULT 0,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_checked TIMESTAMP DEFAULT NOW()
);

-- 6. Add Foreign Keys to existing tables (Non-breaking)
-- We add columns but make them nullable to avoid breaking existing data
ALTER TABLE visitor_profiles 
ADD COLUMN IF NOT EXISTS likely_entity_id UUID REFERENCES known_entities(entity_id),
ADD COLUMN IF NOT EXISTS hardware_hash VARCHAR(255) REFERENCES fingerprint_dna(hash_id),
ADD COLUMN IF NOT EXISTS timezone_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS languages TEXT,
ADD COLUMN IF NOT EXISTS platform VARCHAR(100),
ADD COLUMN IF NOT EXISTS network_downlink FLOAT;

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_fingerprint_hash ON fingerprint_dna(hash_id);
CREATE INDEX IF NOT EXISTS idx_cluster_fingerprint ON identity_clusters(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_bio_session ON behavioral_biometrics(session_id);
