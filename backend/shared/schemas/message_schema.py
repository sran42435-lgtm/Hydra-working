"""
Message Schema - Phase 1 (Tanpa Pydantic)
Mendefinisikan struktur data pesan chat yang digunakan di seluruh sistem.
Menggunakan fungsi validasi manual sebagai pengganti Pydantic BaseModel.
"""

import re
import uuid
from datetime import datetime
from typing import Optional


# ---------------------------------------------------------------------------
# Validasi Helper
# ---------------------------------------------------------------------------

def validate_message_id(value: str) -> str:
    """Validasi ID pesan harus UUID v4."""
    uuid_pattern = re.compile(
        r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        re.IGNORECASE
    )
    if not uuid_pattern.match(value):
        raise ValueError(f"'{value}' bukan UUID v4 yang valid")
    return value


def validate_role(value: str) -> str:
    """Validasi role harus 'user' atau 'assistant'."""
    if value not in ("user", "assistant"):
        raise ValueError(f"role harus 'user' atau 'assistant', bukan '{value}'")
    return value


def validate_content(value: str, min_len: int = 1, max_len: int = 10000) -> str:
    """Validasi konten pesan."""
    if not isinstance(value, str):
        raise ValueError("content harus berupa string")
    if len(value) < min_len:
        raise ValueError(f"content tidak boleh kosong")
    if len(value) > max_len:
        raise ValueError(f"content maksimal {max_len} karakter")
    return value


def validate_session_id(value: str) -> str:
    """Validasi session_id tidak boleh kosong."""
    if not value or not isinstance(value, str):
        raise ValueError("session_id tidak boleh kosong")
    return value


def generate_uuid() -> str:
    """Generate UUID v4 string."""
    return str(uuid.uuid4())


def generate_timestamp() -> str:
    """Generate timestamp ISO 8601 UTC."""
    return datetime.utcnow().isoformat() + "Z"


# ---------------------------------------------------------------------------
# Message Schema (Pengganti MessageSchema BaseModel)
# ---------------------------------------------------------------------------

def create_message(
    session_id: str,
    role: str,
    content: str,
    message_id: str = None,
    timestamp: str = None,
    metadata: dict = None
) -> dict:
    """
    Membuat dictionary pesan baru dengan validasi.
    Setara dengan MessageSchema di versi Pydantic.

    Args:
        session_id: ID sesi chat (wajib).
        role: "user" atau "assistant" (wajib).
        content: Isi pesan (wajib).
        message_id: ID unik (auto-generated jika tidak diberikan).
        timestamp: Waktu (auto-generated jika tidak diberikan).
        metadata: Data tambahan opsional.

    Returns:
        Dictionary dengan struktur pesan lengkap.
    """
    return {
        "id": validate_message_id(message_id) if message_id else generate_uuid(),
        "session_id": validate_session_id(session_id),
        "role": validate_role(role),
        "content": validate_content(content),
        "timestamp": timestamp or generate_timestamp(),
        "metadata": metadata or {}
    }


def create_message_from_request(request_data: dict) -> dict:
    """
    Membuat pesan dari request dictionary (POST /v1/memory).
    Setara dengan MessageCreateRequest di versi Pydantic.

    Args:
        request_data: Dictionary dengan key 'session_id', 'role', 'content'.

    Returns:
        Dictionary pesan yang sudah tervalidasi.

    Raises:
        ValueError: Jika validasi gagal.
    """
    session_id = request_data.get("session_id")
    role = request_data.get("role")
    content = request_data.get("content")

    if not session_id:
        raise ValueError("session_id wajib diisi")
    if not role:
        raise ValueError("role wajib diisi")
    if not content:
        raise ValueError("content wajib diisi")

    return create_message(
        session_id=validate_session_id(session_id),
        role=validate_role(role),
        content=validate_content(content)
    )


def build_message_list_response(messages: list[dict]) -> dict:
    """
    Membangun response untuk daftar pesan.
    Setara dengan MessageListResponse di versi Pydantic.

    Args:
        messages: List dictionary pesan.

    Returns:
        Dictionary dengan key 'memories' dan 'count'.
    """
    return {
        "memories": messages,
        "count": len(messages)
    }
