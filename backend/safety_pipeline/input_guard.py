"""
Input Guard - Phase 1
Memeriksa konten input sebelum diteruskan ke AI Service.
Mendeteksi kata-kata berbahaya berdasarkan daftar terlarang (hardcoded untuk Phase 1).
"""

import re
from .config import BLOCKED_WORDS


class InputGuard:
    """
    Penjaga input untuk Safety Pipeline.
    Di Phase 1, menggunakan pendekatan berbasis aturan (rule-based).
    """

    def check(self, content: str) -> dict:
        """
        Periksa konten input.
        
        Args:
            content: Teks input dari user.
            
        Returns:
            Dictionary dengan:
                - safe (bool): True jika konten aman.
                - risk_score (float): Skor risiko (0.0 - 1.0).
                - filtered_content (str): Konten yang sudah dibersihkan.
        """
        content_lower = content.lower()
        risk_score = 0.0

        # Periksa setiap kata terlarang
        for word in BLOCKED_WORDS:
            if word in content_lower:
                risk_score = 1.0
                break

        # Jika tidak ditemukan kata terlarang, cek pola mencurigakan sederhana
        if risk_score == 0.0:
            # Cek terlalu banyak karakter spesial berturut-turut (mungkin spam)
            if re.search(r'[!?]{5,}', content):
                risk_score = 0.5

        # Tentukan apakah aman
        safe = risk_score < 0.7

        # Untuk Phase 1, filtered_content sama dengan content
        # Di phase berikutnya bisa ditambahkan redaksi PII
        filtered_content = content

        return {
            "safe": safe,
            "risk_score": risk_score,
            "filtered_content": filtered_content
        }
