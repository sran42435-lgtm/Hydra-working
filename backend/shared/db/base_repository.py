"""
Base Repository - Phase 1
Menyediakan class dasar untuk operasi database CRUD.
Semua repository di service lain harus mewarisi class ini.
"""

from typing import Optional, Any
from .connection_pool_manager import get_pool


class BaseRepository:
    """
    Repository dasar untuk operasi database.
    Phase 1: Menggunakan SQLite dengan koneksi dari ConnectionPoolManager.
    """

    def __init__(self, table_name: str):
        """
        Args:
            table_name: Nama tabel yang dikelola oleh repository ini.
        """
        self.table_name = table_name

    def _execute(self, query: str, params: tuple = ()) -> Any:
        """Eksekusi query yang tidak mengembalikan hasil (INSERT, UPDATE, DELETE)."""
        with get_pool().get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor

    def _fetch_one(self, query: str, params: tuple = ()) -> Optional[dict]:
        """Eksekusi query dan kembalikan satu baris sebagai dictionary."""
        with get_pool().get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            row = cursor.fetchone()
            if row is None:
                return None
            columns = [col[0] for col in cursor.description]
            return dict(zip(columns, row))

    def _fetch_all(self, query: str, params: tuple = ()) -> list[dict]:
        """Eksekusi query dan kembalikan semua baris sebagai list of dictionary."""
        with get_pool().get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            if not rows:
                return []
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in rows]

    # --- Generic CRUD Operations ---

    def find_by_id(self, id: str) -> Optional[dict]:
        """Cari record berdasarkan ID."""
        return self._fetch_one(
            f"SELECT * FROM {self.table_name} WHERE id = ?",
            (id,)
        )

    def find_all(self, limit: int = 100, offset: int = 0) -> list[dict]:
        """Ambil semua record dengan pagination."""
        return self._fetch_all(
            f"SELECT * FROM {self.table_name} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )

    def insert(self, data: dict) -> str:
        """Insert record baru. Kembalikan ID record yang dibuat."""
        columns = ", ".join(data.keys())
        placeholders = ", ".join(["?" for _ in data])
        self._execute(
            f"INSERT INTO {self.table_name} ({columns}) VALUES ({placeholders})",
            tuple(data.values())
        )
        return data.get("id", "")

    def update(self, id: str, data: dict) -> bool:
        """Update record berdasarkan ID. Kembalikan True jika berhasil."""
        set_clause = ", ".join([f"{key} = ?" for key in data])
        params = tuple(data.values()) + (id,)
        self._execute(
            f"UPDATE {self.table_name} SET {set_clause} WHERE id = ?",
            params
        )
        return True

    def delete(self, id: str) -> bool:
        """Hapus record berdasarkan ID. Kembalikan True jika berhasil."""
        self._execute(
            f"DELETE FROM {self.table_name} WHERE id = ?",
            (id,)
        )
        return True

    def count(self, where_clause: str = "", params: tuple = ()) -> int:
        """Hitung jumlah record, opsional dengan filter."""
        query = f"SELECT COUNT(*) as cnt FROM {self.table_name}"
        if where_clause:
            query += f" WHERE {where_clause}"
        result = self._fetch_one(query, params)
        return result["cnt"] if result else 0
