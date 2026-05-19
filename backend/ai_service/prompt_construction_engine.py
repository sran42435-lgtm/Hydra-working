"""
Prompt Construction Engine - Phase 1
Membangun prompt untuk dikirim ke Model Service.
Menggabungkan system prompt, context (riwayat chat), dan message user.
"""


class PromptConstructionEngine:
    """
    Membangun prompt terstruktur dari riwayat percakapan dan pesan user.
    """

    def __init__(self):
        self.system_prompt = (
            "Kamu adalah Hydra, asisten AI yang membantu, ramah, dan informatif. "
            "Jawablah pertanyaan user dengan jelas dan akurat. "
            "Jika kamu tidak tahu jawabannya, katakan dengan jujur."
        )

    def build_prompt(self, prompt: str, context: list[dict] = None) -> dict:
        """
        Membangun prompt lengkap untuk Model Service.

        Args:
            prompt: Pesan terbaru dari user.
            context: List riwayat percakapan sebelumnya.
                     Setiap item memiliki 'role' dan 'content'.

        Returns:
            Dictionary dengan:
                - full_prompt (str): Prompt lengkap siap dikirim ke model.
                - input_tokens (int): Estimasi jumlah token input.
        """
        parts = []

        # 1. System prompt
        parts.append(f"[System]\n{self.system_prompt}")

        # 2. Context (riwayat percakapan)
        if context:
            parts.append("\n[Conversation History]")
            for msg in context:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                prefix = "User" if role == "user" else "Assistant"
                parts.append(f"{prefix}: {content}")

        # 3. Current message
        parts.append(f"\n[Current Message]\nUser: {prompt}")
        parts.append("Assistant: ")

        full_prompt = "\n".join(parts)

        # Estimasi token sederhana (1 token ≈ 4 karakter)
        input_tokens = len(full_prompt) // 4

        return {
            "full_prompt": full_prompt,
            "input_tokens": input_tokens
        }
