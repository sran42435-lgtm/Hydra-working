"""
Message Schema - Phase 1
Mendefinisikan struktur data pesan chat yang digunakan di seluruh sistem.
Digunakan oleh memory_system, orchestrator, dan ai_service.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field
import uuid


class MessageSchema(BaseModel):
    """
    Schema untuk satu pesan dalam percakapan.
    
    Attributes:
        id: Unique identifier pesan (UUID).
        session_id: ID sesi chat.
        role: "user" atau "assistant".
        content: Isi pesan.
        timestamp: Waktu pesan dibuat (ISO 8601).
        metadata: Data tambahan opsional (token usage, dll.).
    """
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=10000)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    metadata: Optional[dict] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "session_id": "661e8400-e29b-41d4-a716-446655440001",
                "role": "user",
                "content": "Halo, apa kabar?",
                "timestamp": "2026-04-24T10:00:00Z",
                "metadata": {}
            }
        }


class MessageCreateRequest(BaseModel):
    """Schema untuk request pembuatan pesan baru (POST /v1/memory)."""
    
    session_id: str = Field(..., min_length=1)
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=10000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "661e8400-e29b-41d4-a716-446655440001",
                "role": "user",
                "content": "Halo, apa kabar?"
            }
        }


class MessageListResponse(BaseModel):
    """Schema untuk response daftar pesan (GET /v1/memory/short-term)."""
    
    memories: list[MessageSchema] = Field(default_factory=list)
    count: int = Field(default=0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "memories": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "session_id": "661e8400-e29b-41d4-a716-446655440001",
                        "role": "user",
                        "content": "Halo",
                        "timestamp": "2026-04-24T09:59:00Z",
                        "metadata": {}
                    },
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440002",
                        "session_id": "661e8400-e29b-41d4-a716-446655440001",
                        "role": "assistant",
                        "content": "Halo juga!",
                        "timestamp": "2026-04-24T09:59:05Z",
                        "metadata": {}
                    }
                ],
                "count": 2
            }
        }
