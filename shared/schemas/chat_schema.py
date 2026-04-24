"""
Chat Schema - Phase 1
Mendefinisikan struktur data untuk request/response chat.
Digunakan oleh api_gateway, bff_layer, dan orchestrator_service.
"""

from typing import Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """
    Schema untuk request chat dari client.
    
    Attributes:
        message: Isi pesan dari user.
        session_id: ID sesi chat (opsional, auto-generated jika tidak ada).
        attachments: Daftar attachment (tidak digunakan di Phase 1).
    """
    
    message: str = Field(..., min_length=1, max_length=10000)
    session_id: Optional[str] = Field(default=None)
    attachments: list = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Halo, apa kabar?",
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "attachments": []
            }
        }


class ChatResponse(BaseModel):
    """
    Schema untuk response chat ke client.
    
    Attributes:
        session_id: ID sesi chat.
        response: Teks respons dari AI.
        trace_id: ID tracing untuk debugging.
    """
    
    session_id: str
    response: str
    trace_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "response": "Kabar baik! Ada yang bisa saya bantu?",
                "trace_id": "661e8400-e29b-41d4-a716-446655440001"
            }
        }


class OrchestratorRequest(BaseModel):
    """
    Schema untuk request dari API Gateway ke Orchestrator.
    
    Attributes:
        session_id: ID sesi chat.
        message: Pesan yang sudah difilter oleh safety pipeline.
        trace_id: ID tracing.
    """
    
    session_id: str
    message: str
    trace_id: str


class OrchestratorResponse(BaseModel):
    """
    Schema untuk response dari Orchestrator ke API Gateway.
    
    Attributes:
        response_text: Teks respons yang sudah diformat.
    """
    
    response_text: str


class ContextMessage(BaseModel):
    """
    Schema untuk satu pesan context yang dikirim ke AI Service.
    Mirip dengan MessageSchema tapi khusus untuk prompt construction.
    """
    
    role: str  # "user" atau "assistant"
    content: str
    timestamp: Optional[str] = None
