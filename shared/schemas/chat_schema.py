"""
Chat Schema - Phase 1 (Tanpa Pydantic)
Mendefinisikan struktur data untuk request/response chat.
Menggunakan fungsi validasi manual sebagai pengganti Pydantic BaseModel.
"""

from typing import Optional


# ---------------------------------------------------------------------------
# Validasi Helper
# ---------------------------------------------------------------------------

def validate_message(value: str, max_len: int = 10000) -> str:
    """Validasi pesan tidak boleh kosong dan tidak melebihi max_len."""
    if not isinstance(value, str):
        raise ValueError("message harus berupa string")
    if len(value.strip()) == 0:
        raise ValueError("message tidak boleh kosong")
    if len(value) > max_len:
        raise ValueError(f"message maksimal {max_len} karakter")
    return value


def validate_session_id(value: str) -> str:
    """Validasi session_id tidak boleh kosong."""
    if not value or not isinstance(value, str):
        raise ValueError("session_id tidak boleh kosong")
    return value


def validate_trace_id(value: str) -> str:
    """Validasi trace_id tidak boleh kosong."""
    if not value or not isinstance(value, str):
        raise ValueError("trace_id tidak boleh kosong")
    return value


# ---------------------------------------------------------------------------
# Chat Request (Pengganti ChatRequest BaseModel)
# ---------------------------------------------------------------------------

def parse_chat_request(request_data: dict) -> dict:
    """
    Memparsing dan memvalidasi request chat dari client.

    Args:
        request_data: Dictionary dengan key 'message' (wajib),
                      'session_id' (opsional), 'attachments' (opsional).

    Returns:
        Dictionary yang sudah tervalidasi.

    Raises:
        ValueError: Jika validasi gagal.
    """
    message = request_data.get("message")
    if not message:
        raise ValueError("message wajib diisi")

    return {
        "message": validate_message(message),
        "session_id": request_data.get("session_id"),
        "attachments": request_data.get("attachments", [])
    }


# ---------------------------------------------------------------------------
# Chat Response (Pengganti ChatResponse BaseModel)
# ---------------------------------------------------------------------------

def build_chat_response(session_id: str, response_text: str, trace_id: str) -> dict:
    """
    Membangun response chat untuk client.

    Args:
        session_id: ID sesi chat.
        response_text: Teks respons dari AI.
        trace_id: ID tracing.

    Returns:
        Dictionary dengan key 'session_id', 'response', 'trace_id'.
    """
    return {
        "session_id": session_id,
        "response": response_text,
        "trace_id": trace_id
    }


# ---------------------------------------------------------------------------
# Orchestrator Request (Pengganti OrchestratorRequest BaseModel)
# ---------------------------------------------------------------------------

def parse_orchestrator_request(request_data: dict) -> dict:
    """
    Memparsing dan memvalidasi request dari API Gateway ke Orchestrator.

    Args:
        request_data: Dictionary dengan key 'session_id', 'message', 'trace_id'.

    Returns:
        Dictionary yang sudah tervalidasi.
    """
    session_id = request_data.get("session_id")
    message = request_data.get("message")
    trace_id = request_data.get("trace_id")

    if not session_id:
        raise ValueError("session_id wajib diisi")
    if not message:
        raise ValueError("message wajib diisi")
    if not trace_id:
        raise ValueError("trace_id wajib diisi")

    return {
        "session_id": validate_session_id(session_id),
        "message": validate_message(message),
        "trace_id": validate_trace_id(trace_id)
    }


# ---------------------------------------------------------------------------
# Orchestrator Response (Pengganti OrchestratorResponse BaseModel)
# ---------------------------------------------------------------------------

def build_orchestrator_response(response_text: str) -> dict:
    """
    Membangun response dari Orchestrator ke API Gateway.

    Args:
        response_text: Teks respons yang sudah diformat.

    Returns:
        Dictionary dengan key 'response_text'.
    """
    return {"response_text": response_text}


# ---------------------------------------------------------------------------
# Context Message (Pengganti ContextMessage BaseModel)
# ---------------------------------------------------------------------------

def validate_context_message(msg: dict) -> dict:
    """
    Memvalidasi satu pesan context untuk AI Service.

    Args:
        msg: Dictionary dengan key 'role', 'content', 'timestamp' (opsional).

    Returns:
        Dictionary yang sudah tervalidasi.
    """
    role = msg.get("role")
    content = msg.get("content")

    if role not in ("user", "assistant"):
        raise ValueError(f"role harus 'user' atau 'assistant', bukan '{role}'")
    if not content or not isinstance(content, str):
        raise ValueError("content tidak boleh kosong")

    return {
        "role": role,
        "content": content,
        "timestamp": msg.get("timestamp")
    }


def validate_context_list(context_list: list) -> list[dict]:
    """
    Memvalidasi list context messages.

    Args:
        context_list: List dictionary context.

    Returns:
        List dictionary yang sudah tervalidasi.
    """
    if not isinstance(context_list, list):
        return []
    return [validate_context_message(msg) for msg in context_list]
