"""
Response Stream Manager - Phase 1
Mengelola format respons dari AI Service sebelum dikirim ke user.
Di Phase 1, mendukung format JSON dan Markdown dasar.
"""

from .config import DEFAULT_FORMAT


class ResponseStreamManager:
    """
    Memformat output mentah AI menjadi respons yang siap dikirim ke client.
    """

    def __init__(self):
        self.default_format = DEFAULT_FORMAT

    def format_response(self, raw_text: str, format_type: str = None) -> dict:
        """
        Format teks mentah menjadi struktur respons.

        Args:
            raw_text: Teks mentah dari AI Service.
            format_type: "json" atau "markdown". Default dari config.

        Returns:
            Dictionary dengan:
                - formatted: Dictionary berisi text dan markdown.
        """
        fmt = format_type or self.default_format

        # Untuk Phase 1, text dan markdown sama (belum ada parsing markdown khusus)
        formatted = {
            "text": raw_text.strip(),
            "markdown": raw_text.strip()
        }

        return {"formatted": formatted}

    def format_error_response(self, error_message: str) -> dict:
        """
        Format pesan error untuk dikirim ke client.

        Args:
            error_message: Pesan error.

        Returns:
            Dictionary dengan formatted error.
        """
        return {
            "formatted": {
                "text": f"Maaf, terjadi kesalahan: {error_message}",
                "markdown": f"*Maaf, terjadi kesalahan:* {error_message}"
            }
        }
