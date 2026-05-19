"""
BFF Layer Configuration - Phase 1
Konfigurasi untuk Backend-for-Frontend (BFF) Layer.
Menggunakan ConfigLoader dengan prefix "BFF_LAYER".
"""

from shared.config.config_loader import ConfigLoader

loader = ConfigLoader("BFF_LAYER")

# Konfigurasi service
HOST = loader.get_str("HOST", "0.0.0.0")
PORT = loader.get_int("PORT", 3000)
DEBUG = loader.get_bool("DEBUG", False)

# Service dependencies
API_GATEWAY_URL = loader.get_str("API_GATEWAY_URL", "http://api-gateway:8000")
