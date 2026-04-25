"""
Chat Aggregation Service - Phase 1
Service untuk agregasi data chat di BFF Layer.
Di Phase 1, berfungsi sebagai pass-through sederhana ke API Gateway.
Di phase berikutnya dapat menambahkan caching, transformasi data, dll.
"""

import httpx
from .config import API_GATEWAY_URL


class ChatAggregationService:
    """
    Mengelola komunikasi chat antara Frontend dan API Gateway.
    """

    def __init__(self):
        self.gateway_url = API_GATEWAY_URL

    async def send_message(self, message: str, session_id: str = None) -> dict:
        """
        Kirim pesan user ke API Gateway dan kembalikan respons.

        Args:
            message: Pesan dari user.
            session_id: ID sesi chat (opsional).

        Returns:
            Dictionary dengan:
                - session_id: ID sesi.
                - response: Teks respons dari AI.
                - trace_id: ID tracing.
        """
        headers = {}
        if session_id:
            headers["X-Session-Id"] = session_id

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.gateway_url}/v1/chat",
                json={"message": message},
                headers=headers
            )
            resp.raise_for_status()
            return resp.json()

    async def health_check(self) -> dict:
        """Cek kesehatan API Gateway."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.gateway_url}/health")
                return {"gateway": resp.json(), "bff": "ok"}
        except Exception:
            return {"gateway": "unavailable", "bff": "ok"}
