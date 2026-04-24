"""
Output Guard - Phase 1
Memeriksa konten output dari AI Service sebelum dikirim ke user.
Mendeteksi konten berbahaya dan melakukan penyaringan.
"""

from .config import BLOCKED_WORDS


class OutputGuard:
    """
    Penjaga output untuk Safety Pipeline.
    Di Phase 1, menggunakan pendekatan berbasis aturan (rule-based).
    """

    def check(self, content: str) -> dict:
        """
        Periksa konten output dari AI.
        
        Args:
            content: Teks output dari AI Service.
            
        Returns:
            Dictionary dengan:
                - safe (bool): True jika konten aman.
                - risk_score (float): Skor risiko (0.0 - 1.0).
                - filtered_content (str): Konten yang sudah dibersihkan.
        """
        content_lower = content.lower()
        risk_score = 0.0

        for word in BLOCKED_WORDS:
            if word in content_lower:
                risk_score = 1.0
                break

        safe = risk_score < 0.7

        # Untuk Phase 1, tidak ada redaksi output, hanya deteksi
        filtered_content = content

        return {
            "safe": safe,
            "risk_score": risk_score,
            "filtered_content": filtered_content
        }
