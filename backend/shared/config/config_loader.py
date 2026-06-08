"""
Configuration Loader - Phase 1
Wrapper untuk EnvLoader yang menyediakan konfigurasi terstruktur per service.
Setiap service dapat menggunakannya untuk membaca environment variables dengan namespace.
"""

from .env_loader import env


class ConfigLoader:
    """
    Membaca konfigurasi dengan prefix namespace tertentu.
    Contoh: prefix="MEMORY_SYSTEM" akan membaca MEMORY_SYSTEM_PORT, MEMORY_SYSTEM_DATABASE_URL, dll.
    """

    def __init__(self, prefix: str = ""):
        """
        Args:
            prefix: Namespace prefix untuk environment variables (contoh: "API_GATEWAY").
                    Jika kosong, membaca tanpa prefix (global).
        """
        self.prefix = prefix.upper() + "_" if prefix else ""

    def _key(self, key: str) -> str:
        return f"{self.prefix}{key.upper()}"

    def get_str(self, key: str, default: str = None) -> str:
        return env.get_str(self._key(key), default)

    def get_int(self, key: str, default: int = None) -> int:
        return env.get_int(self._key(key), default)

    def get_bool(self, key: str, default: bool = None) -> bool:
        return env.get_bool(self._key(key), default)

    def get_float(self, key: str, default: float = None) -> float:
        return env.get_float(self._key(key), default)

    def load_service_config(self) -> dict:
        """
        Memuat konfigurasi umum untuk semua service.
        Returns:
            Dictionary dengan key: port, host, debug, database_url, log_level.
        """
        return {
            "host": self.get_str("HOST", "0.0.0.0"),
            "port": self.get_int("PORT", 8000),
            "debug": self.get_bool("DEBUG", False),
            "database_url": self.get_str("DATABASE_URL", "sqlite:///./hydra.db"),
            "log_level": self.get_str("LOG_LEVEL", "INFO"),
        }
