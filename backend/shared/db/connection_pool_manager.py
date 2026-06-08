"""
Connection Pool Manager - Phase 1
Mengelola koneksi database dengan pool sederhana.
Di Phase 1 menggunakan SQLite (single connection), siap di-upgrade ke PostgreSQL di phase berikutnya.
"""

import sqlite3
import threading
from typing import Optional
from contextlib import contextmanager


class ConnectionPoolManager:
    """
    Manajer koneksi database thread-safe.
    Phase 1: SQLite dengan satu koneksi.
    Phase 2+: Dapat di-upgrade ke connection pool PostgreSQL.
    """

    def __init__(self, database_url: str):
        """
        Args:
            database_url: URL database (sqlite:///path/to/file.db atau postgresql://...)
        """
        self.database_url = database_url
        self._local = threading.local()
        self._lock = threading.Lock()

    def _create_connection(self):
        """Membuat koneksi baru berdasarkan database_url."""
        if self.database_url.startswith("sqlite"):
            # Format: sqlite:///path/to/file.db
            db_path = self.database_url.replace("sqlite:///", "")
            return sqlite3.connect(db_path, check_same_thread=False)
        else:
            # Placeholder untuk PostgreSQL (Phase 2+)
            raise NotImplementedError(
                "PostgreSQL belum didukung di Phase 1. Gunakan SQLite."
            )

    @contextmanager
    def get_connection(self):
        """
        Mendapatkan koneksi database (context manager).
        Gunakan dengan `with pool.get_connection() as conn:`.

        Yields:
            sqlite3.Connection: Koneksi database.
        """
        if not hasattr(self._local, "connection"):
            with self._lock:
                if not hasattr(self._local, "connection"):
                    self._local.connection = self._create_connection()
                    # Enable WAL mode untuk performa lebih baik
                    self._local.connection.execute("PRAGMA journal_mode=WAL")
        try:
            yield self._local.connection
        except Exception:
            self._local.connection.rollback()
            raise

    def close_all(self):
        """Menutup semua koneksi (dipanggil saat shutdown)."""
        if hasattr(self._local, "connection"):
            self._local.connection.close()
            del self._local.connection


# Singleton pool untuk digunakan di seluruh aplikasi
_pool: Optional[ConnectionPoolManager] = None


def init_connection_pool(database_url: str) -> ConnectionPoolManager:
    """
    Inisialisasi connection pool global.
    Dipanggil sekali saat startup service.
    """
    global _pool
    _pool = ConnectionPoolManager(database_url)
    return _pool


def get_pool() -> ConnectionPoolManager:
    """
    Mendapatkan instance connection pool global.
    Raise error jika belum diinisialisasi.
    """
    if _pool is None:
        raise RuntimeError(
            "Connection pool belum diinisialisasi. Panggil init_connection_pool() terlebih dahulu."
        )
    return _pool
