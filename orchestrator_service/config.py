"""
Orchestrator Service Configuration - Phase 1
Konfigurasi untuk Orchestrator Service yang mengatur alur chat.
Menggunakan ConfigLoader dengan prefix "ORCHESTRATOR_SERVICE".
"""

from shared.config.config_loader import ConfigLoader

loader = ConfigLoader("ORCHESTRATOR_SERVICE")

# Konfigurasi service
HOST = loader.get_str("HOST", "0.0.0.0")
PORT = loader.get_int("PORT", 8001)
DEBUG = loader.get_bool("DEBUG", False)

# Service dependencies
AI_SERVICE_URL = loader.get_str("AI_SERVICE_URL", "http://ai-service:8003")
MEMORY_SYSTEM_URL = loader.get_str("MEMORY_SYSTEM_URL", "http://memory-system:8006")
RESPONSE_SERVICE_URL = loader.get_str("RESPONSE_SERVICE_URL", "http://response-service:8005")

# Timeout settings
DEFAULT_TIMEOUT = loader.get_int("DEFAULT_TIMEOUT", 30)  # detik
