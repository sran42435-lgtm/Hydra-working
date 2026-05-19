"""
Relational Store Adapter - Phase 1
Adapter untuk penyimpanan short-term memory menggunakan SQLite via BaseRepository.
"""

import uuid
from datetime import datetime, timedelta
from shared.db.base_repository import BaseRepository


class RelationalStoreAdapter:
    """Mengelola penyimpanan dan pengambilan pesan chat."""

    def __init__(self):
        self.message_repo = BaseRepository("messages")
        self.session_repo = BaseRepository("sessions")

    # --- Message Operations ---

    def save_message(self, session_id: str, role: str, content: str) -> dict:
        """Simpan pesan baru ke database."""
        message_data = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "metadata": "{}"
        }
        self.message_repo.insert(message_data)
        return message_data

    def get_messages(self, session_id: str, limit: int = 50) -> list[dict]:
        """Ambil riwayat pesan untuk sesi tertentu."""
        return self.message_repo._fetch_all(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC LIMIT ?",
            (session_id, limit)
        )

    def delete_old_messages(self, hours: int = 24) -> int:
        """Hapus pesan yang lebih lama dari batas TTL (dalam jam)."""
        cutoff = (datetime.utcnow() - timedelta(hours=hours)).isoformat() + "Z"
        return self.message_repo._execute(
            "DELETE FROM messages WHERE timestamp < ?",
            (cutoff,)
        ).rowcount

    # --- Session Operations ---

    def create_session(self, session_id: str) -> dict:
        """Buat sesi baru atau update last_active jika sudah ada."""
        existing = self.session_repo.find_by_id(session_id)
        if existing:
            self.session_repo.update(session_id, {"last_active": datetime.utcnow().isoformat() + "Z"})
            return existing
        session_data = {
            "id": session_id,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "last_active": datetime.utcnow().isoformat() + "Z"
        }
        self.session_repo.insert(session_data)
        return session_data

    def session_exists(self, session_id: str) -> bool:
        """Cek apakah sesi ada."""
        return self.session_repo.find_by_id(session_id) is not None
