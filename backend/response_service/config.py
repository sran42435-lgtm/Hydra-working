"""
Response Service Configuration - Phase 1
Konfigurasi untuk Response Service yang memformat output AI.
Menggunakan ConfigLoader dengan prefix "RESPONSE_SERVICE".
"""

from shared.config.config_loader import ConfigLoader

loader = ConfigLoader("RESPONSE_SERVICE")

# Konfigurasi service
HOST = loader.get_str("HOST", "0.0.0.0")
PORT = loader.get_int("PORT", 8005)
DEBUG = loader.get_bool("DEBUG", False)

# Format default
DEFAULT_FORMAT = loader.get_str("DEFAULT_FORMAT", "json")  # json atau markdown
