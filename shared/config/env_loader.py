"""
Environment Variables Loader - Phase 1
Memuat konfigurasi dari environment variables dengan fallback default.
Digunakan oleh semua service untuk mendapatkan konfigurasi runtime.
"""

import os
from typing import Optional


class EnvLoader:
    """Utility class untuk membaca environment variables dengan type casting."""

    @staticmethod
    def get_str(key: str, default: Optional[str] = None) -> str:
        """Mengambil string dari environment variable."""
        value = os.environ.get(key, default)
        if value is None:
            raise ValueError(f"Environment variable {key} tidak disetel dan tidak ada default.")
        return value

    @staticmethod
    def get_int(key: str, default: Optional[int] = None) -> int:
        """Mengambil integer dari environment variable."""
        value = os.environ.get(key)
        if value is None:
            if default is None:
                raise ValueError(f"Environment variable {key} tidak disetel dan tidak ada default.")
            return default
        try:
            return int(value)
        except ValueError:
            raise ValueError(f"Environment variable {key} harus berupa integer, tetapi mendapat '{value}'.")

    @staticmethod
    def get_bool(key: str, default: Optional[bool] = None) -> bool:
        """Mengambil boolean dari environment variable (true/false, 1/0)."""
        value = os.environ.get(key)
        if value is None:
            if default is None:
                raise ValueError(f"Environment variable {key} tidak disetel dan tidak ada default.")
            return default
        return value.lower() in ("true", "1", "yes", "on")

    @staticmethod
    def get_float(key: str, default: Optional[float] = None) -> float:
        """Mengambil float dari environment variable."""
        value = os.environ.get(key)
        if value is None:
            if default is None:
                raise ValueError(f"Environment variable {key} tidak disetel dan tidak ada default.")
            return default
        try:
            return float(value)
        except ValueError:
            raise ValueError(f"Environment variable {key} harus berupa float, tetapi mendapat '{value}'.")


# Singleton instance untuk digunakan di seluruh aplikasi
env = EnvLoader()
