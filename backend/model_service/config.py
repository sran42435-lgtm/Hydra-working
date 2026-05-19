"""
Model Service Configuration - Phase 1
Konfigurasi untuk Model Service yang menangani inferensi LLM.
Menggunakan ConfigLoader dengan prefix "MODEL_SERVICE".
"""

from shared.config.config_loader import ConfigLoader

loader = ConfigLoader("MODEL_SERVICE")

# Konfigurasi service
HOST = loader.get_str("HOST", "0.0.0.0")
PORT = loader.get_int("PORT", 8004)
DEBUG = loader.get_bool("DEBUG", False)

# Model configuration
MODEL_ID = loader.get_str("MODEL_ID", "hydra-base")
MAX_TOKENS = loader.get_int("MAX_TOKENS", 1024)
TEMPERATURE = loader.get_float("TEMPERATURE", 0.7)
INFERENCE_TIMEOUT = loader.get_int("INFERENCE_TIMEOUT", 30)  # detik

# API endpoint untuk model eksternal (jika tidak menggunakan local model)
EXTERNAL_MODEL_URL = loader.get_str("EXTERNAL_MODEL_URL", "")
