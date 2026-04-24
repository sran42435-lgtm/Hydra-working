"""
Request Flow Controller - Phase 1
Mengatur alur utama chat: ambil memori → panggil AI → simpan memori → format respons.
Setiap langkah memiliki error handling sendiri agar kegagalan satu komponen
tidak menghentikan seluruh pipeline.
"""

import httpx
from .config import AI_SERVICE_URL, MEMORY_SYSTEM_URL, RESPONSE_SERVICE_URL, DEFAULT_TIMEOUT


class RequestFlowController:
    """
    Orkestrasi alur chat.
    """

    async def process(self, session_id: str, message: str, trace_id: str) -> dict:
        """
        Memproses satu request chat dari user.

        Args:
            session_id: ID sesi chat.
            message: Pesan user yang sudah difilter safety.
            trace_id: ID tracing.

        Returns:
            Dictionary dengan:
                - response_text (str): Respons yang sudah diformat.
        """
        timeout = DEFAULT_TIMEOUT

        async with httpx.AsyncClient(timeout=timeout) as client:
            # 1. Ambil short-term memory
            context = await self._get_memory(client, session_id)

            # 2. Panggil AI Service untuk generate respons
            generated_text = await self._call_ai(client, session_id, message, context, trace_id)

            # 3. Simpan memory (user + assistant)
            await self._save_memory(client, session_id, "user", message)
            await self._save_memory(client, session_id, "assistant", generated_text)

            # 4. Format respons
            formatted_text = await self._format_response(client, generated_text)

        return {"response_text": formatted_text}

    async def _get_memory(self, client: httpx.AsyncClient, session_id: str) -> list[dict]:
        """Ambil short-term memory; kembalikan list kosong jika gagal."""
        try:
            resp = await client.get(
                f"{MEMORY_SYSTEM_URL}/v1/memory/short-term",
                params={"session_id": session_id, "limit": 10}
            )
            if resp.status_code == 200:
                return resp.json().get("memories", [])
        except Exception:
            pass  # Degraded mode: lanjut tanpa history
        return []

    async def _call_ai(
        self, client: httpx.AsyncClient, session_id: str, message: str,
        context: list[dict], trace_id: str
    ) -> str:
        """Panggil AI Service; kembalikan fallback jika gagal."""
        try:
            resp = await client.post(
                f"{AI_SERVICE_URL}/v1/ai/generate",
                json={
                    "session_id": session_id,
                    "prompt": message,
                    "context": context,
                    "trace_id": trace_id
                }
            )
            if resp.status_code == 200:
                return resp.json().get("generated_text", "")
        except Exception:
            pass  # Degraded mode: fallback response
        return "Maaf, layanan AI sedang sibuk. Silakan coba lagi nanti."

    async def _save_memory(self, client: httpx.AsyncClient, session_id: str, role: str, content: str) -> None:
        """Simpan pesan ke memory system; abaikan jika gagal."""
        try:
            await client.post(
                f"{MEMORY_SYSTEM_URL}/v1/memory",
                json={"session_id": session_id, "role": role, "content": content}
            )
        except Exception:
            pass  # Degraded mode: lanjut tanpa menyimpan

    async def _format_response(self, client: httpx.AsyncClient, raw_text: str) -> str:
        """Format respons; kembalikan raw_text jika gagal."""
        try:
            resp = await client.post(
                f"{RESPONSE_SERVICE_URL}/v1/response/format",
                json={"raw_text": raw_text, "format": "json"}
            )
            if resp.status_code == 200:
                return resp.json().get("formatted", {}).get("text", raw_text)
        except Exception:
            pass  # Degraded mode: kembalikan raw_text tanpa formatting
        return raw_text
