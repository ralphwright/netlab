-- NetLab: Network Engineering Interactive Labs
-- PostgreSQL Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE device_type AS ENUM (
    'router', 'switch', 'l3_switch', 'firewall', 'server',
    'workstation', 'wireless_ap', 'wireless_controller',
    'cloud', 'internet', 'dns_server', 'dhcp_server'
);
CREATE TYPE link_type AS ENUM ('ethernet', 'serial', 'fiber', 'wireless', 'tunnel', 'virtual');
CREATE TYPE lab_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE step_status AS ENUM ('locked', 'available', 'completed', 'skipped');

-- ============================================================
-- TOPICS
-- ============================================================

CREATE TABLE topics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(64) UNIQUE NOT NULL,
    name            VARCHAR(128) NOT NULL,
    description     TEXT,
    icon            VARCHAR(64),
    color           VARCHAR(7),          -- hex color
    sort_order      INTEGER DEFAULT 0,
    parent_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_slug ON topics(slug);

-- ============================================================
-- LABS
-- ============================================================

CREATE TABLE labs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(128) UNIQUE NOT NULL,
    title           VARCHAR(256) NOT NULL,
    subtitle        VARCHAR(512),
    description     TEXT,
    difficulty      difficulty_level DEFAULT 'beginner',
    estimated_minutes INTEGER DEFAULT 30,
    is_integration  BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_labs_slug ON labs(slug);
CREATE INDEX idx_labs_difficulty ON labs(difficulty);

-- Many-to-many: labs <-> topics
CREATE TABLE lab_topics (
    lab_id   UUID REFERENCES labs(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (lab_id, topic_id)
);

-- Prerequisites between labs
CREATE TABLE lab_prerequisites (
    lab_id          UUID REFERENCES labs(id) ON DELETE CASCADE,
    prerequisite_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    PRIMARY KEY (lab_id, prerequisite_id)
);

-- ============================================================
-- TOPOLOGY: Devices, Interfaces, Links
-- ============================================================

CREATE TABLE devices (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_id      UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    name        VARCHAR(64) NOT NULL,
    device_type device_type NOT NULL,
    model       VARCHAR(128),
    x_pos       REAL DEFAULT 0,
    y_pos       REAL DEFAULT 0,
    icon_url    VARCHAR(512),
    properties  JSONB DEFAULT '{}',       -- OS version, capabilities, etc.
    initial_config TEXT DEFAULT '',        -- startup config
    UNIQUE(lab_id, name)
);

CREATE INDEX idx_devices_lab ON devices(lab_id);

CREATE TABLE interfaces (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id   UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    name        VARCHAR(64) NOT NULL,     -- e.g. GigabitEthernet0/1
    short_name  VARCHAR(32),              -- e.g. Gi0/1
    ip_address  VARCHAR(64),
    subnet_mask VARCHAR(64),
    mac_address VARCHAR(17),
    vlan_id     INTEGER,
    is_trunk    BOOLEAN DEFAULT FALSE,
    speed       VARCHAR(16),
    duplex      VARCHAR(8),
    status      VARCHAR(16) DEFAULT 'up',
    properties  JSONB DEFAULT '{}',
    UNIQUE(device_id, name)
);

CREATE INDEX idx_interfaces_device ON interfaces(device_id);

CREATE TABLE links (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_id          UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    source_if_id    UUID NOT NULL REFERENCES interfaces(id) ON DELETE CASCADE,
    target_if_id    UUID NOT NULL REFERENCES interfaces(id) ON DELETE CASCADE,
    link_type       link_type DEFAULT 'ethernet',
    bandwidth       VARCHAR(16),
    label           VARCHAR(128),
    properties      JSONB DEFAULT '{}'
);

CREATE INDEX idx_links_lab ON links(lab_id);

-- ============================================================
-- LAB STEPS & VALIDATION
-- ============================================================

CREATE TABLE lab_steps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_id          UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    step_number     INTEGER NOT NULL,
    title           VARCHAR(256) NOT NULL,
    instruction     TEXT NOT NULL,         -- Markdown supported
    hint            TEXT,
    explanation     TEXT,                  -- Shown after completion
    target_device   VARCHAR(64),          -- device name to configure
    expected_commands TEXT[],              -- array of valid CLI commands
    validation_type VARCHAR(32) DEFAULT 'command',  -- command, ping, traceroute, output
    validation_rule JSONB DEFAULT '{}',   -- flexible validation config
    points          INTEGER DEFAULT 10,
    UNIQUE(lab_id, step_number)
);

CREATE INDEX idx_lab_steps_lab ON lab_steps(lab_id);

-- ============================================================
-- USER PROGRESS
-- ============================================================

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username    VARCHAR(64) UNIQUE NOT NULL,
    display_name VARCHAR(128),
    email       VARCHAR(256),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_lab_progress (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id          UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    status          lab_status DEFAULT 'not_started',
    current_step    INTEGER DEFAULT 1,
    total_points    INTEGER DEFAULT 0,
    max_points      INTEGER DEFAULT 0,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    device_configs  JSONB DEFAULT '{}',   -- current state of all device configs
    UNIQUE(user_id, lab_id)
);

CREATE INDEX idx_user_lab_progress ON user_lab_progress(user_id, lab_id);

CREATE TABLE user_step_progress (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id          UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    step_id         UUID NOT NULL REFERENCES lab_steps(id) ON DELETE CASCADE,
    status          step_status DEFAULT 'locked',
    commands_entered TEXT[],
    attempts        INTEGER DEFAULT 0,
    completed_at    TIMESTAMPTZ,
    UNIQUE(user_id, step_id)
);

CREATE INDEX idx_user_step_progress ON user_step_progress(user_id, lab_id);

-- ============================================================
-- CLI COMMAND HISTORY (for replay / review)
-- ============================================================

CREATE TABLE command_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id      UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    device_name VARCHAR(64) NOT NULL,
    command     TEXT NOT NULL,
    output      TEXT,
    is_valid    BOOLEAN,
    entered_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_command_history_user_lab ON command_history(user_id, lab_id);

-- ============================================================
-- ACHIEVEMENTS & BADGES
-- ============================================================

CREATE TABLE achievements (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        VARCHAR(64) UNIQUE NOT NULL,
    name        VARCHAR(128) NOT NULL,
    description TEXT,
    icon        VARCHAR(64),
    criteria    JSONB DEFAULT '{}'
);

CREATE TABLE user_achievements (
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id  UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at       TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW lab_overview AS
SELECT
    l.id, l.slug, l.title, l.subtitle, l.difficulty,
    l.estimated_minutes, l.is_integration,
    array_agg(DISTINCT t.slug) FILTER (WHERE t.slug IS NOT NULL) AS topic_slugs,
    array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS topic_names,
    count(DISTINCT ls.id) AS step_count,
    coalesce(sum(ls.points), 0) AS total_points
FROM labs l
LEFT JOIN lab_topics lt ON lt.lab_id = l.id
LEFT JOIN topics t ON t.id = lt.topic_id
LEFT JOIN lab_steps ls ON ls.lab_id = l.id
GROUP BY l.id;
