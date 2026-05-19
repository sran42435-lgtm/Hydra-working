"""
Safety Pipeline Configuration - Phase 1
Konfigurasi khusus untuk Safety Pipeline service.
Menggunakan ConfigLoader dengan prefix "SAFETY_PIPELINE".
"""

from shared.config.config_loader import ConfigLoader

loader = ConfigLoader("SAFETY_PIPELINE")

# Konfigurasi service
HOST = loader.get_str("HOST", "0.0.0.0")
PORT = loader.get_int("PORT", 8002)
DEBUG = loader.get_bool("DEBUG", False)

# Thresholds
TOXICITY_THRESHOLD = loader.get_float("TOXICITY_THRESHOLD", 0.7)
BLOCKED_WORDS = [
    "spam_word_1",
    "spam_word_2",
    "hate_speech_example",
]
