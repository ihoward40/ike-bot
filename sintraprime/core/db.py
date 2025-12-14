"""
SintraPrime Core Database
Single-writer SQLite with WAL mode (required for Litestream)
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "jobs.db"

def connect():
    """Get database connection with WAL mode enabled"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL;")      # Required for safe streaming + concurrency
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def init_db():
    """Initialize database schema"""
    conn = connect()
    cur = conn.cursor()

    # Jobs table: Chain of custody for all work
    cur.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL,
        priority INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        claimed_at TEXT,
        completed_at TEXT,
        result TEXT,
        worker_id TEXT,
        retries INTEGER DEFAULT 0
    );
    """)

    # Timelines table: Single source of truth for legal chronology
    cur.execute("""
    CREATE TABLE IF NOT EXISTS timelines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL,
        event TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT
    );
    """)

    # Evidence table: Immutable audit trail
    cur.execute("""
    CREATE TABLE IF NOT EXISTS evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        ref TEXT NOT NULL,
        created_at TEXT NOT NULL,
        hash TEXT
    );
    """)

    # Certified mail tracking
    cur.execute("""
    CREATE TABLE IF NOT EXISTS certified_mail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL,
        tracking_number TEXT UNIQUE,
        provider TEXT,
        status TEXT,
        mailed_at TEXT,
        delivered_at TEXT,
        recipient TEXT,
        metadata TEXT
    );
    """)

    # Create indexes for performance + atomic claiming
    cur.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status_priority ON jobs(status, priority, created_at);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_jobs_event_type ON jobs(event_type);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_timelines_case ON timelines(case_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_timelines_event ON timelines(event, timestamp);")

    conn.commit()
    conn.close()
    
    print(f"✅ Database initialized: {DB_PATH}")
    print(f"✅ Indexes created for atomic job claiming")

if __name__ == "__main__":
    init_db()
