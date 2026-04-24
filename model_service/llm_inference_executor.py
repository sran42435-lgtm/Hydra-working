"""
LLM Inference Executor - Phase 1
Executor untuk model LLM. Di Phase 1 menggunakan mock response.
Di phase berikutnya akan diintegrasikan dengan model sebenarnya (OpenAI API, vLLM, dll).
"""

import asyncio
import random
from .config import MODEL_ID, MAX_TOKENS, TEMPERATURE


class LLMInferenceExecutor:
    """
    Menjalankan inferensi model LLM.
    Phase 1: Mock dengan respons acak.
    """

    def __init__(self):
        self.model_id = MODEL_ID
        self.max_tokens = MAX_TOKENS
        self.temperature = TEMPERATURE
        self._mock_responses = [
            "Halo! Ada yang bisa saya bantu hari ini?",
            "Tentu, saya akan bantu. Bisa dijelaskan lebih detail?",
            "Maaf, saya belum mengerti. Bisa diulangi?",
            "Itu pertanyaan yang bagus! Menurut saya...",
            "Saya mengerti. Mari kita cari solusinya bersama.",
            "Terima kasih sudah bertanya! Berikut penjelasannya.",
            "Saya akan mencoba membantu semaksimal mungkin.",
            "Apakah ada hal lain yang ingin Anda tanyakan?",
        ]

    async def generate(self, prompt: str, max_tokens: int = None, temperature: float = None) -> dict:
        """
        Menghasilkan respons dari model LLM.
        
        Args:
            prompt: Prompt yang akan diproses.
            max_tokens: Maksimal token output (override dari config).
            temperature: Temperature untuk sampling (override dari config).
            
        Returns:
            Dictionary dengan:
                - text (str): Teks respons.
                - usage (dict): Informasi penggunaan token.
        """
        # Gunakan parameter dari fungsi atau fallback ke config
        _max_tokens = max_tokens if max_tokens is not None else self.max_tokens
        _temperature = temperature if temperature is not None else self.temperature

        # Simulasi latency inference (0.3 - 1.0 detik)
        await asyncio.sleep(random.uniform(0.3, 1.0))

        # Pilih respons acak dari daftar mock
        response_text = random.choice(self._mock_responses)

        # Hitung token usage palsu
        input_tokens = len(prompt.split())
        output_tokens = len(response_text.split())

        return {
            "text": response_text,
            "usage": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens
            }
        }
