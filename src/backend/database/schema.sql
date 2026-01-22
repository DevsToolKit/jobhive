-- Sessions table: stores scraping session metadata
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    search_term TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending', --pending, running, completed, failed, cancelled
    total_jobs INTEGER DEFAULT 0,
    config JSON, -- stores full scrape configuration
    error_message TEXT
);

-- Jobs table: stores individual job postings
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    site TEXT NOT NULL, -- linkedin, indeed, glassdoor, etc.
    title TEXT NOT NULL,
    company TEXT,
    company_url TEXT,
    job_url TEXT,
    location_country TEXT,
    location_city TEXT,
    location_state TEXT,
    is_remote BOOLEAN DEFAULT 0,
    description TEXT,
    job_type TEXT, -- fulltime, parttime, internship, contract
    interval TEXT, -- yearly, monthly, weekly, daily, hourly
    min_amount REAL,
    max_amount REAL,
    currency TEXT,
    date_posted TIMESTAMP,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional fields
    emails TEXT,
    job_level TEXT,
    company_industry TEXT,
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Presets table: stores saved search configurations
CREATE TABLE IF NOT EXISTS presets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    search_term TEXT NOT NULL,
    location TEXT,
    config JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    use_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_session_id ON jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_jobs_site ON jobs(site);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_presets_name ON presets(name);
CREATE INDEX IF NOT EXISTS idx_presets_last_used ON presets(last_used);