"""
API Gateway Configuration - Phase 1
Konfigurasi untuk API Gateway yang menjadi entry point sistem.
Menggunakan ConfigLoader dengan prefix "API_GATEWAY".
"""

from shared.config.config_loader import ConfigLoader

loader = ConfigLoader("API_GATEWAY")

# Konfigurasi service
HOST = loader.get_str("HOST", "0.0.0.0")
PORT = loader.get_int("PORT", 8000)
DEBUG = loader.get_bool("DEBUG", False)

# Service dependencies
SAFETY_PIPELINE_URL = loader.get_str("SAFETY_PIPELINE_URL", "http://safety-pipeline:8002")
ORCHESTRATOR_URL = loader.get_str("ORCHESTRATOR_URL", "http://orchestrator:8001")

# Rate limiting
RATE_LIMIT_REQUESTS = loader.get_int("RATE_LIMIT_REQUESTS", 60)    # Jumlah request
RATE_LIMIT_WINDOW = loader.get_int("RATE_LIMIT_WINDOW", 60)        # Dalam detik

# Auth settings
API_KEY_HEADER = loader.get_str("API_KEY_HEADER", "X-API-Key")
SESSION_HEADER = loader.get_str("SESSION_HEADER", "X-Session-Id")
REQUIRE_AUTH = loader.get_bool("REQUIRE_AUTH", False)              # Phase 1: optional
