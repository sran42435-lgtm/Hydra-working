"""
Memory System Configuration - Phase 1
Konfigurasi khusus untuk Memory System service.
Menggunakan ConfigLoader dengan prefix "MEMORY_SYSTEM".
"""

from shared.config.config_loader import ConfigLoader


loader = ConfigLoader("MEMORY_SYSTEM")

# Konfigurasi service
HOST = loader.get_str("HOST", "0.0.0.0")
PORT = loader.get_int("PORT", 8006)
DEBUG = loader.get_bool("DEBUG", False)

# Database
DATABASE_URL = loader.get_str("DATABASE_URL", "sqlite:///./memory.db")

# Short-term memory settings
MEMORY_TTL_HOURS = loader.get_int("MEMORY_TTL_HOURS", 24)  # 24 jam
SHORT_TERM_LIMIT = loader.get_int("SHORT_TERM_LIMIT", 50)   # Maksimal 50 pesan

# Table definitions
TABLE_DEFINITIONS = {
    "messages": """
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            metadata TEXT DEFAULT '{}'
        )
    """,
    "sessions": """
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            last_active TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """
}

# Indexes for performance
INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)",
    "CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)",
    "CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active)",
]
