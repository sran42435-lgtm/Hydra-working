"""
Database Client - Phase 1
Client database utama yang menginisialisasi koneksi dan tabel.
Digunakan oleh setiap service yang membutuhkan akses database.
"""

import sqlite3
from .connection_pool_manager import get_pool


class DatabaseClient:
    """
    Client database untuk inisialisasi dan migrasi.
    Phase 1: SQLite dengan pembuatan tabel otomatis.
    """

    def __init__(self, table_definitions: dict):
        """
        Args:
            table_definitions: Dictionary {nama_tabel: SQL CREATE TABLE statement}
        """
        self.table_definitions = table_definitions

    def initialize(self):
        """
        Inisialisasi database: buat semua tabel jika belum ada.
        Dipanggil sekali saat startup service.
        """
        with get_pool().get_connection() as conn:
            cursor = conn.cursor()
            for table_name, create_sql in self.table_definitions.items():
                cursor.execute(create_sql)
            conn.commit()

    def check_connection(self) -> bool:
        """
        Cek apakah koneksi database aktif.
        Returns:
            True jika database dapat diakses, False jika tidak.
        """
        try:
            with get_pool().get_connection() as conn:
                conn.execute("SELECT 1")
            return True
        except Exception:
            return False
