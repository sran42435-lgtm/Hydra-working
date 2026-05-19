"""
AI Service Configuration - Phase 1
Konfigurasi untuk AI Service yang menangani prompt construction dan response policy.
Menggunakan ConfigLoader dengan prefix "AI_SERVICE".
"""

from shared.config.config_loader import ConfigLoader

loader = ConfigLoader("AI_SERVICE")

# Konfigurasi service
HOST = loader.get_str("HOST", "0.0.0.0")
PORT = loader.get_int("PORT", 8003)
DEBUG = loader.get_bool("DEBUG", False)

# Service dependencies
MODEL_SERVICE_URL = loader.get_str("MODEL_SERVICE_URL", "http://model-service:8004")
SAFETY_PIPELINE_URL = loader.get_str("SAFETY_PIPELINE_URL", "http://safety-pipeline:8002")
