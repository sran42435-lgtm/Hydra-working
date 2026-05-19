"""
Response Policy Engine - Phase 1
Mengelola kebijakan respons dari Model Service sebelum dikirim ke Orchestrator.
Di Phase 1, melakukan validasi dasar dan fallback.
"""


class ResponsePolicyEngine:
    """
    Memvalidasi dan mengelola kebijakan respons AI.
    """

    def __init__(self):
        # Konstanta untuk validasi
        self.max_response_length = 4000
        self.min_response_length = 1

    def validate(self, generated_text: str) -> dict:
        """
        Validasi respons dari Model Service.

        Args:
            generated_text: Teks yang dihasilkan oleh Model Service.

        Returns:
            Dictionary dengan:
                - valid (bool): Apakah respons valid.
                - text (str): Teks yang sudah divalidasi/diperbaiki.
                - action (str): Tindakan yang diambil ("pass", "trim", "fallback").
        """
        text = generated_text.strip() if generated_text else ""

        # Respons kosong
        if len(text) < self.min_response_length:
            return {
                "valid": False,
                "text": "Maaf, saya tidak dapat menghasilkan respons saat ini.",
                "action": "fallback"
            }

        # Respons terlalu panjang (trim)
        if len(text) > self.max_response_length:
            return {
                "valid": True,
                "text": text[:self.max_response_length].rsplit(" ", 1)[0] + "...",
                "action": "trim"
            }

        # Respons valid
        return {
            "valid": True,
            "text": text,
            "action": "pass"
        }

    def get_fallback_response(self) -> str:
        """Mengembalikan respons fallback standar."""
        return "Maaf, saya tidak dapat memproses permintaan Anda saat ini. Silakan coba lagi nanti."
